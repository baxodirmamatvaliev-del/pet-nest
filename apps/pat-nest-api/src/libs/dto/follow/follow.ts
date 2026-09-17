import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';

@ObjectType()
export class MeFollowed {
  @Field(() => ID)
  followingId: Types.ObjectId;

  @Field(() => ID)
  followerId: Types.ObjectId;

  @Field()
  myFollowing: boolean;
}

@ObjectType()
export class Follow {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  followingId: Types.ObjectId;

  @Field(() => ID)
  followerId: Types.ObjectId;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
