import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ProductStatus } from '../../enums/product.enum';
import { ProductInput } from './product.input';

@InputType()
export class ProductUpdateInput extends PartialType(ProductInput) {
  @Field(() => ID)
  @IsMongoId()
  _id: string;

  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  productStatus?: ProductStatus;
}
