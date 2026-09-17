import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsString, Length } from 'class-validator';
import { CommentGroup } from '../../enums/comment.enum';

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
