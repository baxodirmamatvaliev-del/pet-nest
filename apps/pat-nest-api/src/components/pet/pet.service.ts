import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MemberService } from '../member/member.service';
import { Pet, Pets } from '../../libs/dto/pet/pet';
import { MyPetsInquiry, OrdinaryInquiry, PetInput, PetsInquiry } from '../../libs/dto/pet/pet.input';
import { PetUpdateInput } from '../../libs/dto/pet/pet.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { PetListingType, PetStatus } from '../../libs/enums/pet.enum';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupAuthMemberLiked, lookupPetOwner, shapeIntoMongoObjectId } from '../../libs/types/config';

@Injectable()
export class PetService {
  constructor(
    @InjectModel('Pet') private readonly petModel: Model<Pet>,
    private readonly memberService: MemberService,
    private readonly viewService: ViewService,
    private readonly likeService: LikeService,
  ) {}

  public async createPet(memberId: Types.ObjectId, input: PetInput): Promise<Pet> {
    try {
      const result = await this.petModel.create({ ...input, memberId });
      await this.memberService.memberStatsEditor({
        _id: memberId,
        targetKey: 'memberPets',
        modifier: 1,
      });
      return result;
    } catch (err) {
      console.log('Error! PetService.createPet', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getPet(memberId: Types.ObjectId | null, petId: Types.ObjectId): Promise<Pet> {
    const search = { _id: petId, petStatus: PetStatus.ACTIVE };
    const targetPet: Pet | null = await this.petModel.findOne(search).lean().exec();
    if (!targetPet) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInput = { memberId, viewRefId: petId, viewGroup: ViewGroup.PET };
      const newView = await this.viewService.recordView(viewInput);
      if (newView) {
        const updatedPet = await this.petModel
          .findOneAndUpdate(search, { $inc: { petViews: 1 } }, { returnDocument: 'after' })
          .exec();
        if (!updatedPet) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        targetPet.petViews = updatedPet.petViews;
      }

      const likeInput = { memberId, likeRefId: petId, likeGroup: LikeGroup.PET };
      targetPet.meLiked = await this.likeService.checkLikeExistence(likeInput);
    }

    targetPet.memberData = await this.memberService.getMember(null, targetPet.memberId);
    return targetPet;
  }

  public async updatePet(memberId: Types.ObjectId, input: PetUpdateInput): Promise<Pet> {
    const { _id, ...changes } = input;
    const petId = shapeIntoMongoObjectId(_id);
    const current = await this.petModel.findOne({
      _id: petId,
      memberId,
      petStatus: { $in: [PetStatus.ACTIVE, PetStatus.RESERVED] },
    }).exec();
    if (!current) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    const listingType = changes.petListingType ?? current.petListingType;
    const price = changes.petPrice ?? current.petPrice;
    if (listingType === PetListingType.SALE && price <= 0) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }
    if (changes.petStatus === PetStatus.SOLD && listingType !== PetListingType.SALE) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }
    if (changes.petStatus === PetStatus.ADOPTED && listingType !== PetListingType.ADOPTION) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    const finished = changes.petStatus === PetStatus.SOLD || changes.petStatus === PetStatus.ADOPTED;
    if (finished) Object.assign(changes, { completedAt: new Date() });
    if (changes.petStatus === PetStatus.DELETE) Object.assign(changes, { deletedAt: new Date() });

    const result = await this.petModel.findOneAndUpdate(
      { _id: petId, memberId, petStatus: current.petStatus },
      changes,
      { returnDocument: 'after', runValidators: true },
    ).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (finished || changes.petStatus === PetStatus.DELETE) {
      await this.memberService.memberStatsEditor({
        _id: memberId,
        targetKey: 'memberPets',
        modifier: -1,
      });
    }
    return result;
  }

  public async getPets(memberId: Types.ObjectId | null, input: PetsInquiry): Promise<Pets> {
    const match: Record<string, unknown> = { petStatus: PetStatus.ACTIVE };
    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
      _id: input.direction ?? Direction.DESC,
    };
    const { search } = input;

    if (search.memberId) match.memberId = shapeIntoMongoObjectId(search.memberId);
    if (search.typeList?.length) match.petType = { $in: search.typeList };
    if (search.locationList?.length) match.petLocation = { $in: search.locationList };
    if (search.listingTypeList?.length) match.petListingType = { $in: search.listingTypeList };
    if (search.pricesRange) {
      const { start, end } = search.pricesRange;
      if (start > end) throw new BadRequestException(Message.BAD_REQUEST);
      match.petPrice = { $gte: start, $lte: end };
    }
    if (search.text) {
      const text = search.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.$or = [
        { petTitle: new RegExp(text, 'i') },
        { petName: new RegExp(text, 'i') },
        { petBreed: new RegExp(text, 'i') },
      ];
    }

    const result = await this.petModel.aggregate<Pets>([
      { $match: match },
      { $sort: sort },
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

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  public async getFavoritePets(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Pets> {
    return await this.likeService.getFavoritePets(memberId, input);
  }

  public async getVisitedPets(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Pets> {
    return await this.viewService.getVisitedPets(memberId, input);
  }

  public async getMyPets(memberId: Types.ObjectId, input: MyPetsInquiry): Promise<Pets> {
    const { petStatus } = input.search;
    if (petStatus === PetStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

    const match = {
      memberId,
      petStatus: petStatus ?? { $ne: PetStatus.DELETE },
    };
    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
      _id: input.direction ?? Direction.DESC,
    };

    const result = await this.petModel.aggregate<Pets>([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupPetOwner,
            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  public async likeTargetPet(memberId: Types.ObjectId, petId: Types.ObjectId): Promise<Pet> {
    const target = await this.petModel.findOne({ _id: petId, petStatus: PetStatus.ACTIVE }).exec();
    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const input = { memberId, likeRefId: petId, likeGroup: LikeGroup.PET };
    const modifier = await this.likeService.toggleLike(input);
    return await this.petStatsEditor({ _id: petId, targetKey: 'petLikes', modifier });
  }

  public async petStatsEditor(input: { _id: Types.ObjectId; targetKey: 'petLikes'; modifier: number }): Promise<Pet> {
    const { _id, targetKey, modifier } = input;
    const result = await this.petModel.findOneAndUpdate(
      { _id, petStatus: PetStatus.ACTIVE },
      { $inc: { [targetKey]: modifier } },
      { returnDocument: 'after' },
    ).exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }
}
