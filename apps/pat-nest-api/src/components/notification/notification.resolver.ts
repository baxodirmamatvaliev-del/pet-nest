import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NotificationService } from './notification.service';

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @Query(() => Notifications)
  public async getMyNotifications(
    @Args('input') input: NotificationsInquiry,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Notifications> {
    console.log('Query: getMyNotifications');
    return await this.notificationService.getMyNotifications(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Notification)
  public async readNotification(
    @Args('notificationId') notificationId: string,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Notification> {
    return await this.notificationService.readNotification(memberId, shapeIntoMongoObjectId(notificationId));
  }
}
