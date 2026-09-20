import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { OrderStatus } from '../../enums/order.enum';

@InputType()
export class CreateOrderInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deliveryNote?: string;
}

@InputType()
export class MyOrderSearch {
  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;
}

@InputType()
export class MyOrdersInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field(() => MyOrderSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => MyOrderSearch)
  search: MyOrderSearch;
}
