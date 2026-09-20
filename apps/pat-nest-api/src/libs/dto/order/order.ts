import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  productId: Types.ObjectId;

  @Field()
  sku: string;

  @Field()
  productName: string;

  @Field()
  productImage: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int)
  unitPrice: number;

  @Field(() => Int)
  subtotal: number;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field(() => OrderStatus)
  orderStatus: OrderStatus;

  @Field(() => [OrderItem])
  orderItems: OrderItem[];

  @Field(() => Int)
  totalAmount: number;

  @Field()
  recipientName: string;

  @Field()
  recipientPhone: string;

  @Field()
  deliveryAddress: string;

  @Field({ nullable: true })
  deliveryNote?: string;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field({ nullable: true })
  shippedAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Orders {
  @Field(() => [Order])
  list: Order[];

  @Field(() => [TotalCounter])
  metaCounter: TotalCounter[];
}
