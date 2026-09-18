import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import { AuthPayload, Member, Members } from '../../libs/dto/member/member';
import { LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { MemberUpdateByAdminInput, MemberUpdateInput } from '../../libs/dto/member/member.update';
import { Types } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { GraphQLUpload } from 'graphql-upload';
import { FileUpload, ImageUploadService } from './image-upload.service';

@Resolver(() => Member)
export class MemberResolver {
  constructor(
    private readonly memberService: MemberService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  @Mutation(() => Member)
  public async signup(@Args('input') input: MemberInput): Promise<Member> {
    console.log('Mutation: signup');
    return await this.memberService.signup(input);
  }

  @Mutation(() => AuthPayload)
  public async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    console.log('Mutation: login');
    return await this.memberService.login(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
    console.log('Query: checkAuth');
    console.log('memberNick:', memberNick);
    return `hi ${memberNick}`;
  }

  @Roles(MemberType.USER, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async checkAuthRoles(@AuthMember() member: Member): Promise<string> {
    console.log('Query: checkAuthRoles');
    return `hi ${member.memberNick}, you are ${member.memberType}`;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async updateMember(
    @Args('input') input: MemberUpdateInput,
    @AuthMember('_id') memberId: string | Types.ObjectId,
  ): Promise<Member> {
    console.log('Mutation: updateMember');
    const targetId = shapeIntoMongoObjectId(memberId);
    return await this.memberService.updateMember(targetId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Member)
  public async getMember(
    @Args('memberId') input: string,
    @AuthMember('_id') memberId: Types.ObjectId | null,
  ): Promise<Member> {
    console.log('Query: getMember');
    const targetId = shapeIntoMongoObjectId(input);
    return await this.memberService.getMember(memberId, targetId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async likeTargetMember(
    @Args('memberId') input: string,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Member> {
    console.log('Mutation: likeTargetMember');
    const likeRefId = shapeIntoMongoObjectId(input);
    return await this.memberService.likeTargetMember(memberId, likeRefId);
  }
/** ADMIN **/  
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Members)
  public async getAllMembersByAdmin(@Args('input') 
  input: MembersInquiry): Promise<Members> {
    console.log('Query: getAllMembersByAdmin');
    return await this.memberService.getAllMembersByAdmin(input);
  }

  // Authorization: ADMIN
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Member)
  public async updateMemberByAdmin
  (@Args('input') input: MemberUpdateByAdminInput): Promise<Member> {
    console.log('Mutation: updateMemberByAdmin');
    return await this.memberService.updateMemberByAdmin(input);
  }

  /** IMAGE UPLOADER **/
  @UseGuards(AuthGuard)
  @Mutation(() => String)
  public async imageUploader(
    @Args('file', { type: () => GraphQLUpload }) file: Promise<FileUpload>,
    @Args('target') target: string,
  ): Promise<string> {
    console.log('Mutation: imageUploader');
    return await this.imageUploadService.imageUploader(await file, target);
  }
}
