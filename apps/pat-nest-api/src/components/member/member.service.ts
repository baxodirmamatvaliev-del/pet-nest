import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { AuthPayload, Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member & { memberPassword: string }>,
    private readonly authService: AuthService,
  ) {}

  public async signup(input: MemberInput): Promise<Member> {
    const hashedPassword = await this.authService.hashPassword(input.memberPassword);

    try {
      const member = await this.memberModel.create({
        memberNick: input.memberNick,
        memberPhone: input.memberPhone,
        memberPassword: hashedPassword,
      });

      member.accessToken = await this.authService.createToken(member);
      return member;
    } catch (err) {
      console.log('Error! Service.model', err.message);
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
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
