import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId } from 'class-validator';
import { PaymentMethod } from '../../enums/payment.enum';

@InputType()
export class CreatePaymentInput {
  @Field(() => ID)
  @IsMongoId()
  orderId: string;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

@InputType()
export class ConfirmPaymentInput {
  @Field(() => ID)
  @IsMongoId()
  paymentId: string;
}
