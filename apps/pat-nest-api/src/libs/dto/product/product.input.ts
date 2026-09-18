import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';
import { ProductCategory, ProductType } from '../../enums/product.enum';

@InputType()
export class ProductVariantInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  size?: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  price: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  stock: number;
}

@InputType()
export class ProductInput {
  @Field(() => ProductCategory)
  @IsEnum(ProductCategory)
  productCategory: ProductCategory;

  @Field(() => ProductType)
  @IsEnum(ProductType)
  productType: ProductType;

  @Field()
  @IsString()
  @Length(3, 100)
  productName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  productDesc?: string;

  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  productImages: string[];

  @Field(() => [ProductVariantInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInput)
  productVariants: ProductVariantInput[];
}
