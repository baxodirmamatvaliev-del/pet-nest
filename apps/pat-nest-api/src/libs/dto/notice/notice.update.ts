import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { NoticeStatus } from '../../enums/notice.enum';
import { NoticeInput } from './notice.input';

@InputType()
export class NoticeUpdateInput extends PartialType(NoticeInput) {
  @Field(() => ID)
  @IsMongoId()
  _id: string;

  @Field(() => NoticeStatus, { nullable: true })
  @IsOptional()
  @IsEnum(NoticeStatus)
  noticeStatus?: NoticeStatus;
}
