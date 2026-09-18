import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { Message } from '../../libs/enums/common.enum';
import { OrdinaryInquiry } from '../../libs/dto/pet/pet.input';
import { Pets } from '../../libs/dto/pet/pet';
import { LikeGroup } from '../../libs/enums/like.enum';
import { PetStatus } from '../../libs/enums/pet.enum';
import { lookupAuthMemberLiked, lookupPetOwner } from '../../libs/types/config';

@Injectable()
export class LikeService {
  constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

  public async toggleLike(input: Pick<Like, 'memberId' | 'likeRefId' | 'likeGroup'>): Promise<number> {
    const exist = await this.likeModel.findOne(input).exec();

    if (exist) {
      const removed = await this.likeModel.findOneAndDelete(input).exec();
      return removed ? -1 : 0;
    }

    try {
      await this.likeModel.create(input);
      return 1;
    } catch (err) {
      console.log('Error! LikeService.toggleLike', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async checkLikeExistence(input: Pick<Like, 'memberId' | 'likeRefId' | 'likeGroup'>): Promise<MeLiked[]> {
    const result = await this.likeModel.findOne(input).exec();
    if (!result) return [];

    return [{ memberId: input.memberId, likeRefId: input.likeRefId, myFavorite: true }];
  }

  public async getFavoritePets(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Pets> {
    const result = await this.likeModel.aggregate<Pets>([
      { $match: { memberId, likeGroup: LikeGroup.PET } },
      { $sort: { updatedAt: -1 as const, _id: -1 as const } },
      { $lookup: { from: 'pets', localField: 'likeRefId', foreignField: '_id', as: 'pet' } },
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
