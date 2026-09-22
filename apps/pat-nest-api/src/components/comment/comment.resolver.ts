import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { CommentInput } from '../../libs/dto/comment/comment.input';
import { Comment } from '../../libs/dto/comment/comment';
import { CommentUpdateInput } from '../../libs/dto/comment/comment.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
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
}
