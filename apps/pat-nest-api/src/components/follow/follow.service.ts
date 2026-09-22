import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow } from '../../libs/dto/follow/follow';
import { Message } from '../../libs/enums/common.enum';
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
