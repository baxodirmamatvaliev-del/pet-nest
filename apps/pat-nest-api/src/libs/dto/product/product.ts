import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { ProductCategory, ProductStatus, ProductType } from '../../enums/product.enum';

@ObjectType()
export class ProductVariant {
  @Field()
  sku: string;

  @Field({ nullable: true })
  color?: string;

  @Field({ nullable: true })
  size?: string;

  @Field(() => Int)
  price: number;

  @Field(() => Int)
  stock: number;
}

@ObjectType()
export class Product {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ProductCategory)
  productCategory: ProductCategory;

  @Field(() => ProductType)
  productType: ProductType;

  @Field(() => ProductStatus)
  productStatus: ProductStatus;

  @Field()
  productName: string;

  @Field({ nullable: true })
  productDesc?: string;

  @Field(() => [String])
  productImages: string[];

  @Field(() => [ProductVariant])
  productVariants: ProductVariant[];

  @Field(() => Float)
  productRating: number;

  @Field(() => Int)
  productReviews: number;

  @Field(() => Int)
  productSold: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
