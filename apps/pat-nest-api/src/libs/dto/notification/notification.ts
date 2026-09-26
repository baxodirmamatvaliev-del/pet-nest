import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Notification {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => NotificationType)
  notificationType: NotificationType;

  @Field(() => NotificationStatus)
  notificationStatus: NotificationStatus;

  @Field(() => NotificationGroup)
  notificationGroup: NotificationGroup;

  @Field()
  notificationTitle: string;

  @Field({ nullable: true })
  notificationDesc?: string;

  @Field(() => ID)
  authorId: Types.ObjectId;

  @Field(() => ID)
  receiverId: Types.ObjectId;

  @Field(() => ID, { nullable: true })
  petId?: Types.ObjectId;

  @Field(() => ID, { nullable: true })
  productId?: Types.ObjectId;

  @Field(() => ID, { nullable: true })
  orderId?: Types.ObjectId;

  @Field(() => ID, { nullable: true })
  articleId?: Types.ObjectId;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Notifications {
  @Field(() => [Notification])
  list: Notification[];

  @Field(() => [TotalCounter])
  metaCounter: TotalCounter[];
}
