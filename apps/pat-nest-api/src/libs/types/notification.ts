import type { Types } from 'mongoose';
import { NotificationGroup, NotificationType } from '../enums/notification.enum';

export interface CreateNotification {
  notificationType: NotificationType;
  notificationGroup: NotificationGroup;
  notificationTitle: string;
  notificationDesc?: string;
  authorId: Types.ObjectId;
  receiverId: Types.ObjectId;
  petId?: Types.ObjectId;
  productId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  articleId?: Types.ObjectId;
}
