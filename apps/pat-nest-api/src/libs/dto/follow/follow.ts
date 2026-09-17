import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Follow {
  @Field(() => ID)
  _id: string;

  @Field(() => ID)
  followingId: string;

  @Field(() => ID)
  followerId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
