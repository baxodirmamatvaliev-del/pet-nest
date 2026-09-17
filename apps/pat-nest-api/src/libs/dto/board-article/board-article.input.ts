import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { BoardArticleCategory } from '../../enums/board-article.enum';

@InputType()
export class BoardArticleInput {
  @Field(() => BoardArticleCategory)
  @IsEnum(BoardArticleCategory)
  articleCategory: BoardArticleCategory;

  @Field()
  @IsString()
  @Length(3, 100)
  articleTitle: string;

  @Field()
  @IsString()
  @Length(3, 5000)
  articleContent: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  articleImage?: string;
}
