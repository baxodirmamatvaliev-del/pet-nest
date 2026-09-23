import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { AuthPayload, Member, Members } from '../../libs/dto/member/member';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberUpdateByAdminInput, MemberUpdateInput } from '../../libs/dto/member/member.update';
import { lookupAuthMemberLiked, shapeIntoMongoObjectId } from '../../libs/types/config';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Follow, MeFollowed } from '../../libs/dto/follow/follow';
import { FavoriteInquiry } from '../../libs/dto/like/like.input';

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

  public async getFavoriteMembers(memberId: Types.ObjectId, input: FavoriteInquiry): Promise<Members> {
    return await this.likeService.getFavoriteMembers(memberId, input);
  }

  public async memberStatsEditor(input: {
    _id: Types.ObjectId;
    targetKey:
      | 'memberLikes'
      | 'memberPets'
      | 'memberComments'
      | 'memberFollowers'
      | 'memberFollowings';
    modifier: number;
  }): Promise<Member> {
    const { _id, targetKey, modifier } = input;
    const result = await this.memberModel
      .findOneAndUpdate({ _id }, { $inc: { [targetKey]: modifier } }, { new: true })
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  public async getAgents(memberId: Types.ObjectId | null, input: AgentsInquiry): Promise<Members> {
    const match: { memberType: MemberType; memberStatus: MemberStatus; memberNick?: RegExp } = {
      memberType: MemberType.AGENT,
      memberStatus: MemberStatus.ACTIVE,
    };
    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
      _id: input.direction ?? Direction.DESC,
    };

    if (input.search.text) {
      const text = input.search.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.memberNick = new RegExp(text, 'i');
    }

    const result = await this.memberModel.aggregate<Members>([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupAuthMemberLiked(memberId, '$_id', LikeGroup.MEMBER),
            { $project: { memberPassword: 0 } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
    const { memberStatus, memberType, text } = input.search;
    const match: { memberStatus?: MemberStatus; memberType?: MemberType; memberNick?: RegExp } = {};
    const sort: Record<string, 1 | -1> = { // Eng yangi a’zolar birinchi. & (1) desak, eng kam like olgan birinchi chiqadi:Sami → Ali → Vali & (2) desak, eng ko‘p like olgan birinchi chiqadi:Vali → Ali → Sami
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
      _id: input.direction ?? Direction.DESC,
    };

    if (memberStatus) match.memberStatus = memberStatus;
    if (memberType) match.memberType = memberType;
    if (text) match.memberNick = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const result = await this.memberModel.aggregate<Members>([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            { $project: { memberPassword: 0 } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  public async updateMemberByAdmin(input: MemberUpdateByAdminInput): Promise<Member> {
    const { _id, ...changes } = input;
    const memberId = shapeIntoMongoObjectId(_id);

    if (changes.memberPassword !== undefined) {
      changes.memberPassword = await this.authService.hashPassword(changes.memberPassword);
    }

    try {
      const result = await this.memberModel
        .findOneAndUpdate({ _id: memberId }, changes, { new: true, runValidators: true })
        .exec();

      if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
      return result;
    } catch (err) {
      console.log('Error! MemberService.updateMemberByAdmin', err.message);
      if (err.code === 11000) throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
      throw err;
    }
  }

  private async checkSubscription(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<MeFollowed[]> {
    const result = await this.followModel.findOne({ followingId, followerId }).exec();
    return result ? [{ followerId, followingId, myFollowing: true }] : [];
  }
}
