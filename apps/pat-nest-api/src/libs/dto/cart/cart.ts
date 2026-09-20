import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { Product } from '../product/product';

@ObjectType()
export class CartItem {
  @Field(() => ID)
  productId: Types.ObjectId;

  @Field()
  sku: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Product, { nullable: true })
  productData?: Product | null;

  @Field(() => Int)
  unitPrice: number;

  @Field(() => Int)
  subtotal: number;

  @Field()
  available: boolean;
}

@ObjectType()
export class Cart {
  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field(() => [CartItem])
  cartItems: CartItem[];

  @Field(() => Int)
  totalQuantity: number;

  @Field(() => Int)
  totalAmount: number;
}
