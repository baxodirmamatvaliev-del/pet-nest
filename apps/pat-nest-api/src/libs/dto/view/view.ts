import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ViewGroup } from '../../enums/view.enum';

@ObjectType()
export class View {
  @Field(() => ID)
  _id: string;

  @Field(() => ViewGroup)
  viewGroup: ViewGroup;

  @Field(() => ID)
  viewRefId: string;

  @Field(() => ID)
  memberId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
