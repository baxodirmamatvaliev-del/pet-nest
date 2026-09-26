import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsObject, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { NotificationStatus } from '../../enums/notification.enum';

@InputType()
export class NotificationSearch {
  @Field(() => NotificationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationStatus)
  notificationStatus?: NotificationStatus;
}

@InputType()
export class NotificationsInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field(() => NotificationSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationSearch)
  search: NotificationSearch;
}
