import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { OrdinaryInquiry, PetInput, PetsInquiry } from '../../libs/dto/pet/pet.input';
import { Pet, Pets } from '../../libs/dto/pet/pet';
import { PetUpdateInput } from '../../libs/dto/pet/pet.update';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { PetService } from './pet.service';

@Resolver(() => Pet)
export class PetResolver {
  constructor(private readonly petService: PetService) {}

  //hayvonni sotish yoki asrab olish uchun yangi e’lon yaratish
  @Roles(MemberType.USER, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Pet)
  public async createPet(
    @Args('input') input: PetInput,
    @AuthMember('_id') memberId: string | Types.ObjectId,
  ): Promise<Pet> {
    console.log('Mutation: createPet');
    return await this.petService.createPet(shapeIntoMongoObjectId(memberId), input);
  }
  //hayvon e’lonini ko‘rsatadi, ko‘rishni hisoblaydi va like holatini qaytaradi.
  @UseGuards(WithoutGuard)
  @Query(() => Pet)
  public async getPet(
    @Args('petId') input: string,
    @AuthMember('_id') memberId: Types.ObjectId | null,
  ): Promise<Pet> {
    console.log('Query: getPet');
    const petId = shapeIntoMongoObjectId(input);
    return await this.petService.getPet(memberId, petId);
  }

  //updatePetda e’lonni faqat egasi yangilaydi
  @Roles(MemberType.USER, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Pet)
  public async updatePet(
    @Args('input') input: PetUpdateInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Pet> {
    console.log('Mutation: updatePet');
    return await this.petService.updatePet(memberId, input);
  }
 //faol e’lonlarni tur, joy, e’lon turi, narx va matn bo‘yicha qidiradi.
  @UseGuards(WithoutGuard)
  @Query(() => Pets)
  public async getPets(
    @Args('input') input: PetsInquiry,
    @AuthMember('_id') memberId: Types.ObjectId | null,
  ): Promise<Pets> {
    console.log('Query: getPets');
    return await this.petService.getPets(memberId, input);
  }

  //foydalanuvchi yoqtirgan faol Pet e’lonlarini qaytaradi.
  @UseGuards(AuthGuard)
  @Query(() => Pets)
  public async getFavoritePets(
    @Args('input') input: OrdinaryInquiry,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Pets> {
    console.log('Query: getFavoritePets');
    return await this.petService.getFavoritePets(memberId, input);
  }
  //foydalanuvchi ko‘rgan faol Pet e’lonlarini qaytaradi.
  @UseGuards(AuthGuard)
  @Query(() => Pets)
  public async getVisitedPets(
    @Args('input') input: OrdinaryInquiry,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Pets> {
    console.log('Query: getVisitedPets');
    return await this.petService.getVisitedPets(memberId, input);
  }
}
