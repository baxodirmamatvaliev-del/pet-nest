import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId } from 'class-validator';
import { ViewGroup } from '../../enums/view.enum';

@InputType()
export class ViewInput {
  @Field(() => ViewGroup)
  @IsEnum(ViewGroup)
  viewGroup: ViewGroup;

  @Field(() => ID)
  @IsMongoId()
  viewRefId: string;
}
