import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsString, Length } from 'class-validator';
import { NoticeCategory } from '../../enums/notice.enum';

@InputType()
export class NoticeInput {
  @Field(() => NoticeCategory)
  @IsEnum(NoticeCategory)
  noticeCategory: NoticeCategory;

  @Field()
  @IsString()
  @Length(3, 100)
  noticeTitle: string;

  @Field()
  @IsString()
  @Length(3, 5000)
  noticeContent: string;
}
