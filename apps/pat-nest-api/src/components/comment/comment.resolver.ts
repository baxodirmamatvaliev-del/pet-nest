import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { AdminCommentsInquiry, CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentUpdateInput } from '../../libs/dto/comment/comment.update';
import { MemberType } from '../../libs/enums/member.enum';
import { toObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CommentService } from './comment.service';

@Resolver(() => Comment)
export class CommentResolver {
	constructor(private readonly commentService: CommentService) {}

	//foydalanuvchi Pet, Member yoki Article uchun izoh yozadi va comment soni bittaga oshadi.
	@UseGuards(AuthGuard)
	@Mutation(() => Comment)
	public async createComment(
		@Args('input') input: CommentInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Comment> {
		return await this.commentService.createComment(memberId, input);
	}

	//foydalanuvchi faqat o‘zining faol izohini tahrirlaydi.
	@UseGuards(AuthGuard)
	@Mutation(() => Comment)
	public async updateComment(
		@Args('input') input: CommentUpdateInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Comment> {
		return await this.commentService.updateComment(memberId, input);
	}

	//— tanlangan Pet, Member yoki Article izohlarini sahifalab, muallif ma’lumoti bilan qaytaradi.
	@UseGuards(OptionalAuthGuard)
	@Query(() => Comments)
	public async getComments(
		@Args('input')
		input: CommentsInquiry,
	): Promise<Comments> {
		return await this.commentService.getComments(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Comments)
	public async getAllCommentsByAdmin(@Args('input') input: AdminCommentsInquiry): Promise<Comments> {
		return await this.commentService.getAllCommentsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Comment)
	public async removeCommentByAdmin(
		@Args('commentId')
		input: string,
	): Promise<Comment> {
		const commentId = toObjectId(input);
		return await this.commentService.removeCommentByAdmin(commentId);
	}
}
