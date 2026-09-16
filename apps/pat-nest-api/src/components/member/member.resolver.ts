import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import { AuthPayload, Member } from '../../libs/dto/member/member';
import { LoginInput, SignupInput } from '../../libs/dto/member/member.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';

@Resolver(() => Member)
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => AuthPayload)
  signup(@Args('input') input: SignupInput): Promise<AuthPayload> {
    return this.memberService.signup(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.memberService.login(input);
  }

  @Query(() => Member)
  @UseGuards(AuthGuard)
  checkAuth(@AuthMember() member: Member): Member {
    return member;
  }

  @Query(() => Member)
  @Roles(MemberType.USER, MemberType.AGENT)
  @UseGuards(RolesGuard)
  checkAuthRoles(@AuthMember() member: Member): Member {
    return member;
  }
}
