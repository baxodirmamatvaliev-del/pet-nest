import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, Followers, Followings } from '../../libs/dto/follow/follow';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import {
  lookupAuthMemberFollowed,
  lookupAuthMemberLiked,
  lookupFollowerData,
  lookupFollowingData,
  shapeIntoMongoObjectId,
} from '../../libs/types/config';
import { MemberService } from '../member/member.service';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel('Follow') private readonly followModel: Model<Follow>,
    private readonly memberService: MemberService,
  ) {}

  public async subscribe(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<Follow> {
    if (followerId.equals(followingId)) {
      throw new BadRequestException(Message.SELF_SUBSCRIPTION_DENIED);
    }

    await this.memberService.getMember(null, followingId);
    const result = await this.registerSubscription(followerId, followingId);

    await this.memberService.memberStatsEditor({ _id: followerId, targetKey: 'memberFollowings', modifier: 1, });
    await this.memberService.memberStatsEditor({ _id: followingId, targetKey: 'memberFollowers',modifier: 1, });

    return result;
  }

  public async unsubscribe(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<Follow> {
    await this.memberService.getMember(null, followingId);

    const result = await this.followModel.findOneAndDelete({ followerId, followingId }).exec();
    if (!result) throw new InternalServerErrorException(Message.NOT_SUBSCRIBED);

    await this.memberService.memberStatsEditor({
      _id: followerId,
      targetKey: 'memberFollowings',
      modifier: -1,
    });
    await this.memberService.memberStatsEditor({
      _id: followingId,
      targetKey: 'memberFollowers',
      modifier: -1,
    });

    return result;
  }

  public async getMemberFollowings( memberId: Types.ObjectId | null, input: FollowInquiry,): Promise<Followings> {
    const { page, limit, search } = input;
    if (!search.followerId) throw new BadRequestException(Message.BAD_REQUEST);

    const followerId = shapeIntoMongoObjectId(search.followerId);
    const result = await this.followModel.aggregate<Followings>([
      { $match: { followerId } },
      { $sort: { createdAt: Direction.DESC, _id: Direction.DESC } },
      {
        $facet: {
          list: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            lookupAuthMemberLiked(memberId, '$followingId', LikeGroup.MEMBER),
            lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followingId' }),
            lookupFollowingData,
            { $unwind: { path: '$followingData', preserveNullAndEmptyArrays: true } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0];
  }

  public async getMemberFollowers(
    memberId: Types.ObjectId | null,
    input: FollowInquiry,
  ): Promise<Followers> {
    const { page, limit, search } = input;
    if (!search.followingId) throw new BadRequestException(Message.BAD_REQUEST);

    const followingId = shapeIntoMongoObjectId(search.followingId);
    const result = await this.followModel.aggregate<Followers>([
      { $match: { followingId } },
      { $sort: { createdAt: Direction.DESC, _id: Direction.DESC } },
      {
        $facet: {
          list: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            lookupAuthMemberLiked(memberId, '$followerId', LikeGroup.MEMBER),
            lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followerId' }),
            lookupFollowerData,
            { $unwind: { path: '$followerData', preserveNullAndEmptyArrays: true } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0];
  }

  private async registerSubscription(
    followerId: Types.ObjectId,
    followingId: Types.ObjectId,
  ): Promise<Follow> {
    try {
      return await this.followModel.create({ followerId, followingId });
    } catch (err) {
      console.log('Error! FollowService.registerSubscription', err.message);
      if (err.code === 11000) throw new BadRequestException(Message.ALREADY_SUBSCRIBED);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }
}
