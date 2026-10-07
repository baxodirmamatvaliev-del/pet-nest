import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { MemberType } from '../../enums/member.enum';
import { InquiryStatus } from '../../enums/inquiry.enum';

@ObjectType()
export class SupportRecipient {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  memberNick: string;

  @Field()
  memberImage: string;

  @Field(() => MemberType)
  memberType: MemberType;
}

@ObjectType()
export class Inquiry {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  senderId: Types.ObjectId;

  @Field(() => ID)
  receiverId: Types.ObjectId;

  @Field()
  senderNick: string;

  @Field()
  receiverNick: string;

  @Field()
  inquiryTitle: string;

  @Field()
  inquiryContent: string;

  @Field(() => InquiryStatus)
  inquiryStatus: InquiryStatus;

  @Field({ nullable: true })
  inquiryAnswer?: string;

  @Field({ nullable: true })
  answeredAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
