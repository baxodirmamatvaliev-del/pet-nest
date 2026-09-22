import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

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

@ObjectType()
export class Following extends Follow {
  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];

  @Field(() => [MeFollowed], { nullable: true })
  meFollowed?: MeFollowed[];

  @Field(() => Member, { nullable: true })
  followingData?: Member;
}

@ObjectType()
export class Follower extends Follow {
  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];

  @Field(() => [MeFollowed], { nullable: true })
  meFollowed?: MeFollowed[];

  @Field(() => Member, { nullable: true })
  followerData?: Member;
}

@ObjectType()
export class Followings {
  @Field(() => [Following])
  list: Following[];

  @Field(() => [TotalCounter])
  metaCounter: TotalCounter[];
}

@ObjectType()
export class Followers {
  @Field(() => [Follower])
  list: Follower[];

  @Field(() => [TotalCounter])
  metaCounter: TotalCounter[];
}
