import { Field, ID, ObjectType } from '@nestjs/graphql';
import { LikeGroup } from '../../enums/like.enum';

@ObjectType()
export class Like {
  @Field(() => ID)
  _id: string;

  @Field(() => LikeGroup)
  likeGroup: LikeGroup;

  @Field(() => ID)
  likeRefId: string;

  @Field(() => ID)
  memberId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
