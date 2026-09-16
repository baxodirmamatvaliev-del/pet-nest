import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { LoginInput, SignupInput } from '../../libs/dto/member/member.input';
import { AuthPayload, Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member & { memberPassword: string }>,
    private readonly authService: AuthService,
  ) {}

  async signup(input: SignupInput): Promise<AuthPayload> {
    try {
      const member = await this.memberModel.create({
        memberNick: input.memberNick,
        memberPhone: input.memberPhone,
        memberPassword: await this.authService.hashPassword(input.memberPassword),
      });
      return { accessToken: await this.authService.createToken(member), member };
    } catch (error) {
      if (error?.code === 11000) throw new ConflictException('Nickname or phone already exists');
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const member = await this.memberModel
      .findOne({ memberNick: input.memberNick, memberStatus: MemberStatus.ACTIVE })
      .select('+memberPassword');
    if (!member || !(await this.authService.comparePasswords(input.memberPassword, member.memberPassword))) {
      throw new UnauthorizedException('Invalid nickname or password');
    }
    return { accessToken: await this.authService.createToken(member), member };
  }
}
