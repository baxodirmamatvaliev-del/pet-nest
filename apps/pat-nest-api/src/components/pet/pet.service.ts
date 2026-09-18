import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MemberService } from '../member/member.service';
import { Pet } from '../../libs/dto/pet/pet';
import { PetInput } from '../../libs/dto/pet/pet.input';
import { Message } from '../../libs/enums/common.enum';
import { PetStatus } from '../../libs/enums/pet.enum';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeGroup } from '../../libs/enums/like.enum';

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
}
