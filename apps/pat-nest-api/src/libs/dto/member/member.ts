import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked } from '../like/like';
import { MeFollowed } from '../follow/follow';

@ObjectType()
export class Member {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  memberNick: string;

  @Field()
  memberPhone: string;

  @Field(() => MemberType)
  memberType: MemberType;

  @Field(() => MemberStatus)
  memberStatus: MemberStatus;

  @Field(() => MemberAuthType)
  memberAuthType: MemberAuthType;

  @Field({ nullable: true })
  memberFullName?: string;

  @Field()
  memberImage: string;

  @Field({ nullable: true })
  memberAddress?: string;

  @Field({ nullable: true })
  memberDesc?: string;

  @Field(() => Int)
  memberPets: number;

  @Field(() => Int)
  memberArticles: number;

  @Field(() => Int)
  memberFollowers: number;

  @Field(() => Int)
  memberFollowings: number;

  @Field(() => Int)
  memberPoints: number;

  @Field(() => Int)
  memberLikes: number;

  @Field(() => Int)
  memberViews: number;

  @Field(() => Int)
  memberComments: number;

  @Field(() => Int)
  memberRank: number;

  @Field(() => Int)
  memberWarnings: number;

  @Field(() => Int)
  memberBlocks: number;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  accessToken?: string;

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];

  @Field(() => [MeFollowed], { nullable: true })
  meFollowed?: MeFollowed[];
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => Member)
  member: Member;
}
