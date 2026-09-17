import { Field, ID, ObjectType } from '@nestjs/graphql';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

@ObjectType()
export class Notification {
  @Field(() => ID)
  _id: string;

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
  authorId: string;

  @Field(() => ID)
  receiverId: string;

  @Field(() => ID, { nullable: true })
  petId?: string;

  @Field(() => ID, { nullable: true })
  articleId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
