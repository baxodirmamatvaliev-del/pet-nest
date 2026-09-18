import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { OrdinaryInquiry } from '../../libs/dto/pet/pet.input';
import { Pets } from '../../libs/dto/pet/pet';
import { ViewGroup } from '../../libs/enums/view.enum';
import { PetStatus } from '../../libs/enums/pet.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupAuthMemberLiked, lookupPetOwner } from '../../libs/types/config';

@Injectable()
export class ViewService {
  constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

  public async recordView(input: Pick<View, 'memberId' | 'viewRefId' | 'viewGroup'>): Promise<View | null> {
    const viewExist = await this.viewModel.findOne(input).exec();
    if (viewExist) return null;

    try {
      return await this.viewModel.create(input);
    } catch (err) {
      // Bir vaqtda takroriy so‘rov kelsa, ko‘rish ikkinchi marta hisoblanmaydi.
      if (err.code === 11000) return null;
      throw err;
    }
  }

  public async getVisitedPets(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Pets> {
    const result = await this.viewModel.aggregate<Pets>([
      { $match: { memberId, viewGroup: ViewGroup.PET } },
      { $sort: { updatedAt: -1 as const, _id: -1 as const } },
      { $lookup: { from: 'pets', localField: 'viewRefId', foreignField: '_id', as: 'pet' } },
      { $unwind: '$pet' },
      { $match: { 'pet.petStatus': PetStatus.ACTIVE } },
      { $replaceRoot: { newRoot: '$pet' } },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupAuthMemberLiked(memberId, '$_id', LikeGroup.PET),
            lookupPetOwner,
            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0] ?? { list: [], metaCounter: [] };
  }
}
