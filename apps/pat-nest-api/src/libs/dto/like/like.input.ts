import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId } from 'class-validator';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class LikeInput {
  @Field(() => LikeGroup)
  @IsEnum(LikeGroup)
  likeGroup: LikeGroup;

  @Field(() => ID)
  @IsMongoId()
  likeRefId: string;
}
