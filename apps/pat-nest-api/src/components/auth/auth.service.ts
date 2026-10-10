import { createHash, randomBytes } from 'crypto';
import type { Request, Response, CookieOptions } from 'express';
import { getClientOrigins } from '../../libs/config/environment';
import type { RefreshSession } from '../../schemas/RefreshSession.model';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';

export interface AuthenticatedMember {
  _id: Types.ObjectId;
  memberNick: string;
  memberType: MemberType;
  memberStatus: MemberStatus;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel('RefreshSession') private readonly sessionModel: Model<RefreshSession>,
    @InjectModel('Member') private readonly memberModel: Model<AuthenticatedMember>,
  ) {}

  // Brauzerda refresh token shu nomdagi cookie ichida turadi.
  private readonly cookieName = 'pet_refresh';
  // Cookie va bazadagi sessiya uchun 15 kunni millisekundga aylantiramiz.
  private readonly refreshLifetime = 15 * 24 * 60 * 60 * 1000; // 15 kun

  // Refresh cookie uchun barcha joyda bir xil sozlamalardan foydalanamiz.
  private cookieOptions(): CookieOptions {
    return {
      // Frontend JavaScript kodi tokenni o‘qiy olmaydi.
      httpOnly: true,
      // Productionda cookie faqat HTTPS orqali yuboriladi.
      secure: process.env.NODE_ENV === 'production',
      // Boshqa saytdan yuborilgan odatiy POST so‘roviga cookie qo‘shilmaydi.
      sameSite: 'lax',
      // Cookie faqat /graphql yo‘liga va uning ostidagi yo‘llarga yuboriladi.
      path: '/graphql',
    };
  }

  // Cookie bilan kelgan so‘rov faqat bizning frontenddan bo‘lsin.
  assertTrustedOrigin(req: Request): void {
    const origin = req.get('origin');
    if (!origin || !getClientOrigins().includes(origin)) {
      throw new UnauthorizedException('A trusted Origin header is required');
    }
  }

  // Bazaga tokenning o‘zini emas, SHA-256 hashini saqlash uchun.
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Cookie headerdan pet_refresh qiymatini ajratib olamiz.
  private readRefreshToken(req: Request): string | undefined {
    const raw = req.headers.cookie?.split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${this.cookieName}=`))?.slice(this.cookieName.length + 1);
    // Token shakli: 24 belgili sessiya IDsi + nuqta + 64 belgili tasodifiy qism.
    return raw && /^[a-f0-9]{24}\.[a-f0-9]{64}$/.test(raw) ? raw : undefined;
  }

  // Login/signup: bazaga sessiya, brauzerga cookie yozamiz.
  async startSession(memberId: Types.ObjectId | string, res: Response): Promise<void> {
    // Har login uchun alohida sessiya IDsi va taxmin qilib bo‘lmaydigan token yaratamiz.
    const id = new Types.ObjectId();
    const token = `${id}.${randomBytes(32).toString('hex')}`;
    // Tugash sanasi faqat shu yerda belgilanadi; refreshda uzaytirilmaydi.
    const expiresAt = new Date(Date.now() + this.refreshLifetime);
    // Foydalanuvchi, token hashi va tugash sanasini bazaga yozamiz.
    await this.sessionModel.create({ _id: id, memberId, tokenHash: this.hashToken(token), expiresAt });
    // Tokenning o‘zini brauzerga HttpOnly cookie orqali beramiz.
    res.cookie(this.cookieName, token, { ...this.cookieOptions(), expires: expiresAt });
  }

  // Access token tugaganda refresh cookie yordamida yangi tokenlar beramiz.
  async refresh(req: Request, res: Response): Promise<{ accessToken: string; member: AuthenticatedMember }> {
    this.assertTrustedOrigin(req);
    try {
      // 1. Cookie orqali sessiyani topamiz.
      const token = this.readRefreshToken(req);
      if (!token) throw new UnauthorizedException('Invalid or expired refresh token');
      // Tokenning nuqtagacha bo‘lgan qismi bazadagi sessiya IDsi.
      const id = new Types.ObjectId(token.split('.')[0]);
      const hash = this.hashToken(token);
      // Faqat bekor qilinmagan va 15 kunlik muddati tugamagan sessiyani olamiz.
      const session = await this.sessionModel.findOne({ _id: id, revokedAt: null, expiresAt: { $gt: new Date() } }).lean();
      if (!session) throw new UnauthorizedException('Invalid or expired refresh token');
      // Ishlatilgan eski token qaytsa, sessiyani bekor qilamiz.
      if (session.tokenHash !== hash) {
        if (session.usedTokenHashes.includes(hash)) {
          await this.sessionModel.updateOne({ _id: id }, { $set: { revokedAt: new Date() } });
        }
        throw new UnauthorizedException('Invalid or reused refresh token');
      }
      // 2. Foydalanuvchi hali faol ekanini tekshiramiz.
      const member = await this.memberModel.findOne({ _id: session.memberId, memberStatus: MemberStatus.ACTIVE }).lean();
      if (!member) {
        await this.sessionModel.updateOne({ _id: id }, { $set: { revokedAt: new Date() } });
        throw new UnauthorizedException('Member is unavailable');
      }
      // 3. Eski tokenni faqat bitta so‘rov almashtira oladi.
      // API so‘rovlari uchun yangi 10 daqiqalik access token yaratamiz.
      const accessToken = await this.createToken(member);
      // Shu sessiya uchun yangi tasodifiy refresh token yaratamiz.
      const nextToken = `${id}.${randomBytes(32).toString('hex')}`;
      // Hash hali eski qiymatda bo‘lsagina almashtiramiz: parallel so‘rov uni qayta ishlata olmaydi.
      const result = await this.sessionModel.updateOne(
        { _id: id, tokenHash: hash, revokedAt: null, expiresAt: { $gt: new Date() } },
        // Yangi hashni saqlaymiz, eskisini qayta ishlatishni aniqlash uchun tarixga qo‘shamiz.
        { $set: { tokenHash: this.hashToken(nextToken) }, $push: { usedTokenHashes: hash } },
      );
      // Hech narsa yangilanmasa, token boshqa so‘rovda ishlatilgan yoki sessiya yaroqsiz bo‘lgan.
      if (!result.modifiedCount) {
        await this.sessionModel.updateOne({ _id: id }, { $set: { revokedAt: new Date() } });
        throw new UnauthorizedException('Refresh token was already consumed');
      }
      // 4. Yangi cookie beramiz. Dastlabki tugash sanasi o‘zgarmaydi.
      res.cookie(this.cookieName, nextToken, { ...this.cookieOptions(), expires: session.expiresAt });
      return { accessToken, member };
    } catch (error) {
      // Refresh bajarilmasa, brauzerdagi cookie’ni tozalab, xatoni qaytaramiz.
      res.clearCookie(this.cookieName, this.cookieOptions());
      throw error;
    }
  }

  // Shu brauzerdagi sessiyadan chiqamiz; boshqa qurilmalardagi sessiyalar qoladi.
  async logout(req: Request, res: Response): Promise<boolean> {
    this.assertTrustedOrigin(req);
    const token = this.readRefreshToken(req);
    // Brauzer keyingi so‘rovlarda refresh tokenni yubormasin.
    res.clearCookie(this.cookieName, this.cookieOptions());
    if (token) {
      const hash = this.hashToken(token);
      // Joriy yoki avval ishlatilgan token shu sessiyaga tegishli bo‘lsa, uni bekor qilamiz.
      await this.sessionModel.updateOne(
        { _id: new Types.ObjectId(token.split('.')[0]), $or: [{ tokenHash: hash }, { usedTokenHashes: hash }] },
        { $set: { revokedAt: new Date() } },
      );
    }
    return true;
  }

  hashPassword(memberPassword: string): Promise<string> {
    return bcrypt.hash(memberPassword, 12);
  }

  comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT ichiga foydalanuvchi IDsi yoziladi; 10 daqiqalik muddat AuthModule’dan olinadi.
  createToken(member: { _id: Types.ObjectId | string }): Promise<string> {
    return this.jwtService.signAsync({ sub: member._id.toString() });
  }

  async verifyToken(token: string): Promise<AuthenticatedMember> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      if (!payload.sub || !Types.ObjectId.isValid(payload.sub)) throw new Error('Invalid token subject');
      const member = await this.memberModel.findOne({
        _id: payload.sub,
        memberStatus: MemberStatus.ACTIVE,
      }).lean();
      if (!member) throw new Error('Member is unavailable');
      return member;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
