import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDefined, IsInt, IsMongoId, IsObject, IsOptional, Max, Min, ValidateNested } from 'class-validator';

@InputType()
export class FollowInput {
  @Field(() => ID)
  @IsMongoId()
  followingId: string;
}

@InputType()
export class FollowSearch {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsMongoId()
  followingId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsMongoId()
  followerId?: string;
}

@InputType()
export class FollowInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field(() => FollowSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => FollowSearch)
  search: FollowSearch;
}
