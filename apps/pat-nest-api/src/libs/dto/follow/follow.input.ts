import { Field, ID, InputType } from '@nestjs/graphql';
import { IsMongoId } from 'class-validator';

@InputType()
export class FollowInput {
  @Field(() => ID)
  @IsMongoId()
  followingId: string;
}
