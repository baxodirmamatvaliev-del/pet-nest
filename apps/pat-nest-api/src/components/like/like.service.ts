import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';

@Injectable()
export class LikeService {
  constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

  public async checkLikeExistence(input: Pick<Like, 'memberId' | 'likeRefId' | 'likeGroup'>): Promise<MeLiked[]> {
    const result = await this.likeModel.findOne(input).exec();
    if (!result) return [];

    return [{ memberId: input.memberId, likeRefId: input.likeRefId, myFavorite: true }];
  }
}
