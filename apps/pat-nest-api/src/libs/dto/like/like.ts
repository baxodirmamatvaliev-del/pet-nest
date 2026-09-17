import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { LikeGroup } from '../../enums/like.enum';

@ObjectType()
export class MeLiked {
  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field(() => ID)
  likeRefId: Types.ObjectId;

  @Field()
  myFavorite: boolean;
}

@ObjectType()
export class Like {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => LikeGroup)
  likeGroup: LikeGroup;

  @Field(() => ID)
  likeRefId: Types.ObjectId;

  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
