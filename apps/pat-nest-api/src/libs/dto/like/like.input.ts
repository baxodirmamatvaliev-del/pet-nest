import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, Max, Min } from 'class-validator';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class LikeInput {
  @Field(() => ID)
  @IsMongoId()
  likeRefId: string;

  @Field(() => LikeGroup)
  @IsEnum(LikeGroup)
  likeGroup: LikeGroup;
}

@InputType()
export class FavoriteInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}
