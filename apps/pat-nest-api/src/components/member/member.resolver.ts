import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import { AuthPayload, Member, Members } from '../../libs/dto/member/member';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { MemberUpdateByAdminInput, MemberUpdateInput } from '../../libs/dto/member/member.update';
import { Types } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { ImageUploadService } from './image-upload.service';
import type { FileUpload } from './image-upload.service';
import { FavoriteInquiry } from '../../libs/dto/like/like.input';
import { Throttle } from '@nestjs/throttler';

@Resolver(() => Member)
export class MemberResolver {
	constructor(
		private readonly memberService: MemberService,
		private readonly imageUploadService: ImageUploadService,
		private readonly authService: AuthService,
	) {}

	@Throttle({ default: { limit: 10, ttl: 60_000 } })
	@Mutation(() => Member)
	public async signup(
		@Args('input') input: MemberInput,
		@Context() context: { req: Request; res: Response },
	): Promise<Member> {
		// Cookie berishdan oldin so‘rov ruxsat etilgan frontenddan kelganini tekshiramiz.
		this.authService.assertTrustedOrigin(context.req);
		const member = await this.memberService.signup(input);
		// Login/signup muvaffaqiyatli: 15 kunlik sessiya yaratib, refresh cookie beramiz.
		await this.authService.startSession(member._id, context.res);
		return member;
	}

	@Throttle({ default: { limit: 10, ttl: 60_000 } })
	@Mutation(() => AuthPayload)
	public async login(
		@Args('input') input: LoginInput,
		@Context() context: { req: Request; res: Response },
	): Promise<AuthPayload> {
		// Cookie berishdan oldin so‘rov ruxsat etilgan frontenddan kelganini tekshiramiz.
		this.authService.assertTrustedOrigin(context.req);
		const payload = await this.memberService.login(input);
		// Login/signup muvaffaqiyatli: 15 kunlik sessiya yaratib, refresh cookie beramiz.
		await this.authService.startSession(payload.member._id, context.res);
		return payload;
	}

	@Throttle({ default: { limit: 30, ttl: 60_000 } })
	@Mutation(() => AuthPayload)
	public async refreshToken(@Context() context: { req: Request; res: Response }): Promise<AuthPayload> {
		// Access token talab qilinmaydi; refresh cookie tekshirilib, yangi tokenlar beriladi.
		return (await this.authService.refresh(context.req, context.res)) as AuthPayload;
	}

	@Mutation(() => Boolean)
	public async logout(@Context() context: { req: Request; res: Response }): Promise<boolean> {
		// Cookie’ni tozalab, unga tegishli bazadagi sessiyani bekor qilamiz.
		return await this.authService.logout(context.req, context.res);
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public checkAuth(@AuthMember('memberNick') memberNick: string): string {
		return `hi ${memberNick}`;
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public checkAuthRoles(@AuthMember() member: Member): string {
		return `hi ${member.memberNick}, you are ${member.memberType}`;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@Args('input') input: MemberUpdateInput,
		@AuthMember('_id') memberId: string | Types.ObjectId,
	): Promise<Member> {
		const targetId = shapeIntoMongoObjectId(memberId);
		return await this.memberService.updateMember(targetId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId | null,
	): Promise<Member> {
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Member> {
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}

	@UseGuards(AuthGuard)
	@Query(() => Members)
	public async getFavoriteMembers(
		@Args('input') input: FavoriteInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Members> {
		return await this.memberService.getFavoriteMembers(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getAgents(
		@Args('input') input: AgentsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId | null,
	): Promise<Members> {
		return await this.memberService.getAgents(memberId, input);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(
		@Args('input')
		input: MembersInquiry,
	): Promise<Members> {
		return await this.memberService.getAllMembersByAdmin(input);
	}

	// Authorization: ADMIN
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateMemberByAdmin(@Args('input') input: MemberUpdateByAdminInput): Promise<Member> {
		return await this.memberService.updateMemberByAdmin(input);
	}

	/** IMAGE UPLOADER **/
	@Throttle({ default: { limit: 10, ttl: 60_000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => String)
	public async imageUploader(
		// Emit Object metadata so ValidationPipe does not try to construct a Promise.
		@Args('file', { type: () => GraphQLUpload }) file: Promise<FileUpload> | FileUpload,
		@Args('target') target: string,
	): Promise<string> {
		return await this.imageUploadService.imageUploader(await file, target);
	}

	@Throttle({ default: { limit: 10, ttl: 60_000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] }) files: Promise<FileUpload>[],
		@Args('target') target: string,
	): Promise<string[]> {
		return await this.imageUploadService.imagesUploader(files, target);
	}
}
