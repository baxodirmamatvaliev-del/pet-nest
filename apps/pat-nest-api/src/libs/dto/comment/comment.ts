import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';

@ObjectType()
export class Comment {
  @Field(() => ID)
  _id: string;

  @Field(() => CommentStatus)
  commentStatus: CommentStatus;

  @Field(() => CommentGroup)
  commentGroup: CommentGroup;

  @Field()
  commentContent: string;

  @Field(() => ID)
  commentRefId: string;

  @Field(() => ID)
  memberId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
