import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { Message } from '../../libs/enums/common.enum';

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
}
