import { Schema } from 'mongoose';
import { InquiryStatus } from '../libs/enums/inquiry.enum';

const InquirySchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  senderNick: { type: String, required: true },
  receiverNick: { type: String, required: true },
  inquiryTitle: { type: String, required: true },
  inquiryContent: { type: String, required: true },
  inquiryStatus: { type: String, enum: InquiryStatus, default: InquiryStatus.OPEN },
  inquiryAnswer: { type: String },
  answeredAt: { type: Date },
}, { timestamps: true, collection: 'inquiries' });

InquirySchema.index({ senderId: 1, createdAt: -1 });
InquirySchema.index({ receiverId: 1, createdAt: -1 });

export default InquirySchema;
