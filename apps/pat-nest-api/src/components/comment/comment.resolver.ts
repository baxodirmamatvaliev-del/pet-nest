import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentUpdateInput } from '../../libs/dto/comment/comment.update';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
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
    console.log('Mutation: createComment');
    return await this.commentService.createComment(memberId, input);
  }

  //foydalanuvchi faqat o‘zining faol izohini tahrirlaydi. 
  @UseGuards(AuthGuard)
  @Mutation(() => Comment)
  public async updateComment(
    @Args('input') input: CommentUpdateInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Comment> {
    console.log('Mutation: updateComment');
    return await this.commentService.updateComment(memberId, input);
  }

  //— tanlangan Pet, Member yoki Article izohlarini sahifalab, muallif ma’lumoti bilan qaytaradi. 
  @UseGuards(WithoutGuard)
  @Query(() => Comments)
  public async getComments(@Args('input')
   input: CommentsInquiry): Promise<Comments> {
    console.log('Query: getComments');
    return await this.commentService.getComments(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Comment)
  public async removeCommentByAdmin(@Args('commentId') 
  input: string): Promise<Comment> {
    console.log('Mutation: removeCommentByAdmin');
    const commentId = shapeIntoMongoObjectId(input);
    return await this.commentService.removeCommentByAdmin(commentId);
  }
}
