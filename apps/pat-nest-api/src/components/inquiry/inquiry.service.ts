import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inquiry, SupportRecipient } from '../../libs/dto/inquiry/inquiry';
import { AnswerInquiryInput, InquiryInput } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryStatus } from '../../libs/enums/inquiry.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { Member } from '../../libs/dto/member/member';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class InquiryService {
  constructor(
    @InjectModel('Inquiry') private readonly inquiryModel: Model<Inquiry>,
    @InjectModel('Member') private readonly memberModel: Model<Member>,
    private readonly notificationService: NotificationService,
  ) {}

  public async getSupportRecipients(): Promise<SupportRecipient[]> {
    const members = await this.memberModel.find({
      memberStatus: MemberStatus.ACTIVE,
      memberType: { $in: [MemberType.AGENT, MemberType.ADMIN] },
    }).select('_id memberNick memberImage memberType').sort({ memberType: 1, memberNick: 1 }).lean().exec();

    return members as SupportRecipient[];
  }

  public async createInquiry(senderId: Types.ObjectId, input: InquiryInput): Promise<Inquiry> {
    const receiverId = shapeIntoMongoObjectId(input.receiverId);
    const inquiryTitle = input.inquiryTitle.trim();
    const inquiryContent = input.inquiryContent.trim();
    if (inquiryTitle.length < 3 || inquiryContent.length < 10) {
      throw new BadRequestException('Please provide a subject and a detailed message.');
    }
    if (senderId.equals(receiverId)) throw new BadRequestException('You cannot send an inquiry to yourself.');

    const [sender, receiver] = await Promise.all([
      this.memberModel.findById(senderId).select('memberNick').lean().exec(),
      this.memberModel.findOne({
        _id: receiverId,
        memberStatus: MemberStatus.ACTIVE,
        memberType: { $in: [MemberType.AGENT, MemberType.ADMIN] },
      }).select('memberNick').lean().exec(),
    ]);
    if (!sender || !receiver) throw new BadRequestException('Support recipient is unavailable.');

    const inquiry = await this.inquiryModel.create({
      senderId,
      receiverId,
      senderNick: sender.memberNick,
      receiverNick: receiver.memberNick,
      inquiryTitle,
      inquiryContent,
    });
    try {
      await this.notificationService.createNotification({
        notificationType: NotificationType.INQUIRY,
        notificationGroup: NotificationGroup.SUPPORT,
        notificationTitle: `New support request from ${sender.memberNick}`,
        notificationDesc: inquiryTitle,
        authorId: senderId,
        receiverId,
        inquiryId: inquiry._id,
      });
    } catch (err) {
      console.log('Error! InquiryService.createInquiry notification', err.message);
    }
    return inquiry;
  }

  public async getMyInquiries(memberId: Types.ObjectId): Promise<Inquiry[]> {
    return await this.inquiryModel.find({ senderId: memberId }).sort({ createdAt: -1 }).limit(50).exec();
  }

  public async getAssignedInquiries(memberId: Types.ObjectId): Promise<Inquiry[]> {
    return await this.inquiryModel.find({ receiverId: memberId }).sort({ createdAt: -1 }).limit(50).exec();
  }

  public async answerInquiry(memberId: Types.ObjectId, input: AnswerInquiryInput): Promise<Inquiry> {
    const inquiryId = shapeIntoMongoObjectId(input.inquiryId);
    const inquiryAnswer = input.inquiryAnswer.trim();
    if (inquiryAnswer.length < 2) throw new BadRequestException('Please write a reply.');
    const inquiry = await this.inquiryModel.findOneAndUpdate(
      { _id: inquiryId, receiverId: memberId, inquiryStatus: InquiryStatus.OPEN },
      { $set: { inquiryAnswer, inquiryStatus: InquiryStatus.ANSWERED, answeredAt: new Date() } },
      { returnDocument: 'after', runValidators: true },
    ).exec();
    if (!inquiry) throw new NotFoundException('Open inquiry not found.');
    try {
      await this.notificationService.createNotification({
        notificationType: NotificationType.REPLY,
        notificationGroup: NotificationGroup.SUPPORT,
        notificationTitle: `Reply to your support request`,
        notificationDesc: inquiry.inquiryTitle,
        authorId: memberId,
        receiverId: inquiry.senderId,
        inquiryId: inquiry._id,
      });
    } catch (err) {
      console.log('Error! InquiryService.answerInquiry notification', err.message);
    }
    return inquiry;
  }
}
