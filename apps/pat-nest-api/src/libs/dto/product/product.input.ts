import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDefined, IsEnum, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { ProductCategory, ProductStatus, ProductType } from '../../enums/product.enum';
import { Direction } from '../../enums/common.enum';

const availableProductSorts = ['createdAt', 'productName', 'productRating', 'productSold', 'productRank'];

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

@InputType()
export class ProductSearch {
  @Field(() => [ProductCategory], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ProductCategory, { each: true })
  categoryList?: ProductCategory[];

  @Field(() => [ProductType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ProductType, { each: true })
  typeList?: ProductType[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  text?: string;
}

@InputType()
export class ProductsInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(availableProductSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => ProductSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductSearch)
  search: ProductSearch;
}

@InputType()
export class MyProductSearch {
  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  productStatus?: ProductStatus;
}

@InputType()
export class MyProductsInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(availableProductSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => MyProductSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => MyProductSearch)
  search: MyProductSearch;
}

@InputType()
export class AdminProductSearch extends ProductSearch {
  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  productStatus?: ProductStatus;
}

@InputType()
export class AdminProductsInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(availableProductSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => AdminProductSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => AdminProductSearch)
  search: AdminProductSearch;
}
