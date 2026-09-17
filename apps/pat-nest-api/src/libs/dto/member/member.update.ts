import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, Length } from 'class-validator';

@InputType()
export class MemberUpdateInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  memberFullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memberImage?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memberAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memberDesc?: string;
}
