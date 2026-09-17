import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsMongoId } from 'class-validator';
import { BoardArticleInput } from './board-article.input';

@InputType()
export class BoardArticleUpdateInput extends PartialType(BoardArticleInput) {
  @Field(() => ID)
  @IsMongoId()
  _id: string;
}
