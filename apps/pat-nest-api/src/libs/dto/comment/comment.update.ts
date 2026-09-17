import { Field, ID, InputType } from '@nestjs/graphql';
import { IsMongoId, IsString, Length } from 'class-validator';

@InputType()
export class CommentUpdateInput {
  @Field(() => ID)
  @IsMongoId()
  _id: string;

  @Field()
  @IsString()
  @Length(1, 500)
  commentContent: string;
}
