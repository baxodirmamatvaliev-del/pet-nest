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
    @InjectModel('Member') private readonly memberModel: Model<AuthenticatedMember>,
  ) {}

  hashPassword(memberPassword: string): Promise<string> {
    return bcrypt.hash(memberPassword, 12);
  }

  comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

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
