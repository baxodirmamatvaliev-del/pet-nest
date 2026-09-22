import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CommentGroup } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';
import { availableCommentSorts } from '../../types/config';

@InputType()
export class CommentInput {
  @Field(() => CommentGroup)
  @IsEnum(CommentGroup)
  commentGroup: CommentGroup;

  @Field()
  @IsString()
  @Length(1, 500)
  commentContent: string;

  @Field(() => ID)
  @IsMongoId()
  commentRefId: string;
}

@InputType()
export class CommentSearch {
  @Field(() => ID)
  @IsMongoId()
  commentRefId: string;
}

@InputType()
export class CommentsInquiry {
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
  @IsIn(availableCommentSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => CommentSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => CommentSearch)
  search: CommentSearch;
}
