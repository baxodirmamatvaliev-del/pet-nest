import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsMongoId, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field(() => ID)
  @IsMongoId()
  productId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class UpdateCartItemInput {
  @Field(() => ID)
  @IsMongoId()
  productId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class RemoveCartItemInput {
  @Field(() => ID)
  @IsMongoId()
  productId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  sku: string;
}
