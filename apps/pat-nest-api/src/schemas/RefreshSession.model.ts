import { Schema, Types } from 'mongoose';

export interface RefreshSession {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;
  tokenHash: string;
  usedTokenHashes: string[];
  expiresAt: Date;
  revokedAt?: Date;
}

const RefreshSessionSchema = new Schema<RefreshSession>({
  // Sessiya qaysi foydalanuvchiga tegishli.
  memberId:
   { type: Schema.Types.ObjectId, 
    ref: 'Member', required: true, index: true },
  // Hozir amal qilayotgan refresh tokenning hashi.
  tokenHash:
   { type: String, required: true },
  // Eski token qayta yuborilganini aniqlash uchun ishlatilgan hashlar.
  usedTokenHashes:
   { type: [String], default: [] },
  // Login vaqtidan 15 kun. TTL indeksi muddati tugagan yozuvlarni keyinroq tozalaydi.
  expiresAt:
   { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  // Logout yoki eski token qayta ishlatilganda bekor qilish sanasi.
  revokedAt:
   { type: Date },
}, { timestamps: true, collection: 'refreshSessions' });

export default RefreshSessionSchema;
