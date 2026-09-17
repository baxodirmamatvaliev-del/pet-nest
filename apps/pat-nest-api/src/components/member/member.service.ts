import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { AuthPayload, Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { MemberUpdateInput } from '../../libs/dto/member/member.update';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Follow, MeFollowed } from '../../libs/dto/follow/follow';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member & { memberPassword: string }>,
    private readonly authService: AuthService,
    private readonly viewService: ViewService,
    private readonly likeService: LikeService,
    @InjectModel('Follow') private readonly followModel: Model<Follow>,
  ) {}

  public async signup(input: MemberInput): Promise<Member> {
    const hashedPassword = await this.authService.hashPassword(input.memberPassword);

    try {
      const member = await this.memberModel.create({
        memberNick: input.memberNick,
        memberPhone: input.memberPhone,
        memberPassword: hashedPassword,
      });

      member.accessToken = await this.authService.createToken(member);
      return member;
    } catch (err) {
      console.log('Error! Service.model', err.message);
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
    }
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const member = await this.memberModel
      .findOne({ memberNick: input.memberNick, memberStatus: MemberStatus.ACTIVE })
      .select('+memberPassword');
    if (!member || !(await this.authService.comparePasswords(input.memberPassword, member.memberPassword))) {
      throw new UnauthorizedException('Invalid nickname or password');
    }
    return { accessToken: await this.authService.createToken(member), member };
  }


  public async updateMember(memberId: Types.ObjectId, input: MemberUpdateInput): Promise<Member> {
    const result = await this.memberModel
      .findOneAndUpdate(
        { _id: memberId, memberStatus: MemberStatus.ACTIVE },
        input,
        { new: true, runValidators: true },
      )
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    result.accessToken = await this.authService.createToken(result);
    return result;
  }

  public async getMember(memberId: Types.ObjectId | null, targetId: Types.ObjectId): Promise<Member> {
    const search = {
      _id: targetId,
      memberStatus: { $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK] },
    };

    const targetMember: Member | null = await this.memberModel.findOne(search).lean().exec();
    if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInput = { memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };
      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        const updatedMember = await this.memberModel
          .findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true })
          .exec();
        if (!updatedMember) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        targetMember.memberViews = updatedMember.memberViews;
      }

      const likeInput = { memberId, likeRefId: targetId, likeGroup: LikeGroup.MEMBER };
      targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);
      targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
    }

    return targetMember;
  }

  public async likeTargetMember(memberId: Types.ObjectId, likeRefId: Types.ObjectId): Promise<Member> {
    const target = await this.memberModel
      .findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE })
      .exec();

    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const input = { memberId, likeRefId, likeGroup: LikeGroup.MEMBER };
    const modifier = await this.likeService.toggleLike(input);

    return await this.memberStatsEditor({
      _id: likeRefId,
      targetKey: 'memberLikes',
      modifier,
    });
  }

  public async memberStatsEditor(input: {_id: Types.ObjectId; targetKey: 'memberLikes';modifier: number;}): Promise<Member> {
    const { _id, targetKey, modifier } = input;
    const result = await this.memberModel
      .findOneAndUpdate({ _id }, { $inc: { [targetKey]: modifier } }, { new: true })
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  private async checkSubscription(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<MeFollowed[]> {
    const result = await this.followModel.findOne({ followingId, followerId }).exec();
    return result ? [{ followerId, followingId, myFollowing: true }] : [];
  }
}
