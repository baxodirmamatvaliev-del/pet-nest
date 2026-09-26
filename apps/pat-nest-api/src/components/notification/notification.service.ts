import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { Message } from '../../libs/enums/common.enum';
import { CreateNotification } from '../../libs/types/notification';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification') private readonly notificationModel: Model<Notification>,
    private readonly socketGateway: SocketGateway,
  ) {}

  public async createNotification(input: CreateNotification): Promise<Notification> {
    try {
      const notification = await this.notificationModel.create(input);
      this.socketGateway.sendNotification(input.receiverId, notification);
      return notification;
    } catch (err) {
      console.log('Error! NotificationService.createNotification', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getMyNotifications( memberId: Types.ObjectId,input: NotificationsInquiry,): Promise<Notifications> {
    const match: Record<string, unknown> = { receiverId: memberId };
    if (input.search.notificationStatus) {
      match.notificationStatus = input.search.notificationStatus;
    }

    const result = await this.notificationModel
    .aggregate<Notifications>([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0] ?? { list: [], metaCounter: [] };
  }
}
