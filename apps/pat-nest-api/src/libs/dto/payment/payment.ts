import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../enums/payment.enum';

@ObjectType()
export class Payment {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field(() => ID)
  orderId: Types.ObjectId;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field(() => Int)
  paymentAmount: number;

  @Field({ nullable: true })
  confirmedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
