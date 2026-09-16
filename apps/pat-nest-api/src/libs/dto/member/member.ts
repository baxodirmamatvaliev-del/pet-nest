import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MemberStatus, MemberType } from '../../enums/member.enum';

@ObjectType()
export class Member {
  @Field(() => ID)
  _id: string;

  @Field()
  memberNick: string;

  @Field()
  memberPhone: string;

  @Field(() => MemberType)
  memberType: MemberType;

  @Field(() => MemberStatus)
  memberStatus: MemberStatus;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => Member)
  member: Member;
}
