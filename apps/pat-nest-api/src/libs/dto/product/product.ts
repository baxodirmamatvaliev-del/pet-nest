import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { ProductCategory, ProductStatus, ProductType } from '../../enums/product.enum';
import { TotalCounter } from '../member/member';

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

  @Field(() => ID)
  memberId: Types.ObjectId;

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

  @Field(() => Float)
  productRank: number;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Products {
  @Field(() => [Product])
  list: Product[];

  @Field(() => [TotalCounter])
  metaCounter: TotalCounter[];
}
