import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Comment {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => CommentStatus)
  commentStatus: CommentStatus;

  @Field(() => CommentGroup)
  commentGroup: CommentGroup;

  @Field()
  commentContent: string;

  @Field(() => ID)
  commentRefId: Types.ObjectId;

  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Member, { nullable: true })
  memberData?: Member;
}

@ObjectType()
export class Comments {
  @Field(() => [Comment])
  list: Comment[];

  @Field(() => [TotalCounter])
  metaCounter: TotalCounter[];
}
