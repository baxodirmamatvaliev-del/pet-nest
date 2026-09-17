import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { ViewGroup } from '../../enums/view.enum';

@ObjectType()
export class View {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ViewGroup)
  viewGroup: ViewGroup;

  @Field(() => ID)
  viewRefId: Types.ObjectId;

  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
