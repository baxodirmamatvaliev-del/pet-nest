import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Inquiry, SupportRecipient } from '../../libs/dto/inquiry/inquiry';
import { AnswerInquiryInput, InquiryInput } from '../../libs/dto/inquiry/inquiry.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { InquiryService } from './inquiry.service';

@Resolver(() => Inquiry)
export class InquiryResolver {
  constructor(private readonly inquiryService: InquiryService) {}

  @UseGuards(WithoutGuard)
  @Query(() => [SupportRecipient])
  public async getSupportRecipients(): Promise<SupportRecipient[]> {
    return await this.inquiryService.getSupportRecipients();
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Inquiry)
  public async createInquiry(
    @Args('input') input: InquiryInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Inquiry> {
    return await this.inquiryService.createInquiry(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Inquiry])
  public async getMyInquiries(@AuthMember('_id') memberId: Types.ObjectId): Promise<Inquiry[]> {
    return await this.inquiryService.getMyInquiries(memberId);
  }

  @Roles(MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [Inquiry])
  public async getAssignedInquiries(@AuthMember('_id') memberId: Types.ObjectId): Promise<Inquiry[]> {
    return await this.inquiryService.getAssignedInquiries(memberId);
  }

  @Roles(MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Inquiry)
  public async answerInquiry(
    @Args('input') input: AnswerInquiryInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Inquiry> {
    return await this.inquiryService.answerInquiry(memberId, input);
  }
}
