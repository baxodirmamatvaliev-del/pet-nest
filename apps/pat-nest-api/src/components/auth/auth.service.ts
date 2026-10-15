import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import type { CookieOptions, Request, Response } from 'express';
import { Model, Types } from 'mongoose';
import { getClientOrigins } from '../../libs/config/environment';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import type { RefreshSession } from '../../schemas/RefreshSession.model';

export interface AuthenticatedMember {
	_id: Types.ObjectId;
	memberNick: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
}

@Injectable()
export class AuthService {
	private readonly cookieName = 'pet_refresh';
	private readonly refreshLifetime = 15 * 24 * 60 * 60 * 1000;

	constructor(
		private readonly jwtService: JwtService,
		@InjectModel('RefreshSession') private readonly sessionModel: Model<RefreshSession>,
		@InjectModel('Member') private readonly memberModel: Model<AuthenticatedMember>,
	) {}

	// Cookie bilan ishlaydigan so'rov faqat ruxsat etilgan frontenddan kelishi kerak.
	assertTrustedOrigin(request: Request): void {
		const origin = request.get('origin');
		if (!origin || !getClientOrigins().includes(origin)) {
			throw new UnauthorizedException('A trusted Origin header is required');
		}
	}

	// Login/signup: bazada token hashi, brauzerda esa HttpOnly cookie saqlanadi.
	async startSession(memberId: Types.ObjectId | string, response: Response): Promise<void> {
		const sessionId = new Types.ObjectId();
		const token = this.createRefreshToken(sessionId);
		const expiresAt = new Date(Date.now() + this.refreshLifetime);

		await this.sessionModel.create({ _id: sessionId, memberId, tokenHash: this.hashToken(token), expiresAt });
		this.setRefreshCookie(response, token, expiresAt);
	}

	// Oqim: sessiya → faol foydalanuvchi → tokenni almashtirish → yangi cookie.
	async refresh(request: Request, response: Response): Promise<{ accessToken: string; member: AuthenticatedMember }> {
		this.assertTrustedOrigin(request);

		try {
			const token = this.readRefreshToken(request);
			if (!token) throw new UnauthorizedException('Invalid or expired refresh token');

			const tokenHash = this.hashToken(token);
			const session = await this.findRefreshSession(token, tokenHash);
			const member = await this.findSessionMember(session);
			const accessToken = await this.createToken(member);
			const nextToken = await this.rotateRefreshToken(session._id, tokenHash);

			// Refresh dastlabki 15 kunlik muddatni uzaytirmaydi.
			this.setRefreshCookie(response, nextToken, session.expiresAt);
			return { accessToken, member };
		} catch (error) {
			response.clearCookie(this.cookieName, this.cookieOptions());
			throw error;
		}
	}

	// Faqat shu brauzerning sessiyasi bekor qilinadi; boshqa qurilmalar sessiyalari qoladi.
	async logout(request: Request, response: Response): Promise<boolean> {
		this.assertTrustedOrigin(request);
		const token = this.readRefreshToken(request);
		response.clearCookie(this.cookieName, this.cookieOptions());
		if (!token) return true;

		const tokenHash = this.hashToken(token);
		await this.sessionModel.updateOne(
			{ _id: new Types.ObjectId(token.split('.')[0]), $or: [{ tokenHash }, { usedTokenHashes: tokenHash }] },
			{ $set: { revokedAt: new Date() } },
		);
		return true;
	}

	hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 12);
	}

	comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return bcrypt.compare(password, hashedPassword);
	}

	// Access JWT ichiga ID yoziladi; amal qilish muddati AuthModule'da belgilanadi.
	createToken(member: { _id: Types.ObjectId | string }): Promise<string> {
		return this.jwtService.signAsync({ sub: member._id.toString() });
	}

	async verifyToken(token: string): Promise<AuthenticatedMember> {
		try {
			const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
			if (!payload.sub || !Types.ObjectId.isValid(payload.sub)) throw new Error('Invalid token subject');

			const member = await this.memberModel.findOne({ _id: payload.sub, memberStatus: MemberStatus.ACTIVE }).lean();
			if (!member) throw new Error('Member is unavailable');
			return member;
		} catch {
			throw new UnauthorizedException('Invalid or expired token');
		}
	}

	private async findRefreshSession(token: string, tokenHash: string): Promise<RefreshSession> {
		const sessionId = new Types.ObjectId(token.split('.')[0]);
		const session = await this.sessionModel
			.findOne({ _id: sessionId, revokedAt: null, expiresAt: { $gt: new Date() } })
			.lean();
		if (!session) throw new UnauthorizedException('Invalid or expired refresh token');
		if (session.tokenHash === tokenHash) return session;

		// Avval ishlatilgan token qayta kelsa, butun sessiyani bekor qilamiz.
		if (session.usedTokenHashes.includes(tokenHash)) await this.revokeSession(sessionId);
		throw new UnauthorizedException('Invalid or reused refresh token');
	}

	private async findSessionMember(session: RefreshSession): Promise<AuthenticatedMember> {
		const member = await this.memberModel.findOne({ _id: session.memberId, memberStatus: MemberStatus.ACTIVE }).lean();
		if (member) return member;

		await this.revokeSession(session._id);
		throw new UnauthorizedException('Member is unavailable');
	}

	private async rotateRefreshToken(sessionId: Types.ObjectId, tokenHash: string): Promise<string> {
		const nextToken = this.createRefreshToken(sessionId);
		// Eski hash hali saqlangan bo'lsagina almashtiramiz: parallel so'rovlardan faqat biri yutadi.
		const result = await this.sessionModel.updateOne(
			{ _id: sessionId, tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
			{ $set: { tokenHash: this.hashToken(nextToken) }, $push: { usedTokenHashes: tokenHash } },
		);
		if (result.modifiedCount) return nextToken;

		await this.revokeSession(sessionId);
		throw new UnauthorizedException('Refresh token was already consumed');
	}

	private async revokeSession(sessionId: Types.ObjectId): Promise<void> {
		await this.sessionModel.updateOne({ _id: sessionId }, { $set: { revokedAt: new Date() } });
	}

	private createRefreshToken(sessionId: Types.ObjectId): string {
		return `${sessionId.toString()}.${randomBytes(32).toString('hex')}`;
	}

	private hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}

	private readRefreshToken(request: Request): string | undefined {
		const cookie = request.headers.cookie
			?.split(';')
			.map((part) => part.trim())
			.find((part) => part.startsWith(`${this.cookieName}=`));
		const token = cookie?.slice(this.cookieName.length + 1);
		// 24 belgili sessiya IDsi + nuqta + 64 belgili tasodifiy qiymat.
		return token && /^[a-f0-9]{24}\.[a-f0-9]{64}$/.test(token) ? token : undefined;
	}

	private setRefreshCookie(response: Response, token: string, expiresAt: Date): void {
		response.cookie(this.cookieName, token, { ...this.cookieOptions(), expires: expiresAt });
	}

	private cookieOptions(): CookieOptions {
		return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/graphql' };
	}
}
