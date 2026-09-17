import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';

@ObjectType()
export class BoardArticle {
  @Field(() => ID)
  _id: string;

  @Field(() => BoardArticleCategory)
  articleCategory: BoardArticleCategory;

  @Field(() => BoardArticleStatus)
  articleStatus: BoardArticleStatus;

  @Field()
  articleTitle: string;

  @Field()
  articleContent: string;

  @Field({ nullable: true })
  articleImage?: string;

  @Field(() => Int)
  articleLikes: number;

  @Field(() => Int)
  articleViews: number;

  @Field(() => Int)
  articleComments: number;

  @Field(() => ID)
  memberId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
