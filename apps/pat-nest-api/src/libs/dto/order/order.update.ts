import { Field, ID, InputType } from '@nestjs/graphql';
import { IsIn, IsMongoId } from 'class-validator';
import { OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderStatusUpdateInput {
  @Field(() => ID)
  @IsMongoId()
  _id: string;

  @Field(() => OrderStatus)
  @IsIn([OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED_TO_CUSTOMER])
  orderStatus: OrderStatus;
}
