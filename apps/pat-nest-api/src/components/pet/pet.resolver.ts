import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { FavoriteInquiry } from '../../libs/dto/like/like.input';
import { Pet, Pets } from '../../libs/dto/pet/pet';
import { AdminPetsInquiry, MyPetsInquiry, OrdinaryInquiry, PetInput, PetsInquiry } from '../../libs/dto/pet/pet.input';
import { PetUpdateInput } from '../../libs/dto/pet/pet.update';
import { MemberType } from '../../libs/enums/member.enum';
import { toObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
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
		return await this.petService.createPet(toObjectId(memberId), input);
	}
	//hayvon e’lonini ko‘rsatadi, ko‘rishni hisoblaydi va like holatini qaytaradi.
	@UseGuards(OptionalAuthGuard)
	@Query(() => Pet)
	public async getPet(@Args('petId') input: string, @AuthMember('_id') memberId: Types.ObjectId | null): Promise<Pet> {
		const petId = toObjectId(input);
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
		return await this.petService.updatePet(memberId, input);
	}
	//faol e’lonlarni tur, joy, e’lon turi, narx va matn bo‘yicha qidiradi.
	@UseGuards(OptionalAuthGuard)
	@Query(() => Pets)
	public async getPets(
		@Args('input') input: PetsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId | null,
	): Promise<Pets> {
		return await this.petService.getPets(memberId, input);
	}

	//foydalanuvchi yoqtirgan faol Pet e’lonlarini qaytaradi.
	@UseGuards(AuthGuard)
	@Query(() => Pets)
	public async getFavoritePets(
		@Args('input') input: FavoriteInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Pets> {
		return await this.petService.getFavoritePets(memberId, input);
	}
	//foydalanuvchi ko‘rgan faol Pet e’lonlarini qaytaradi.
	@UseGuards(AuthGuard)
	@Query(() => Pets)
	public async getVisitedPets(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Pets> {
		return await this.petService.getVisitedPets(memberId, input);
	}
	//foydalanuvchining o‘z e’lonlarini status bo‘yicha filtrlab, sahifalab qaytaradi.
	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Pets)
	public async getMyPets(
		@Args('input') input: MyPetsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Pets> {
		return await this.petService.getMyPets(memberId, input);
	}
	//ol e’longa like qo‘yadi yoki mavjud like’ni olib tashlaydi va petLikesni yangilaydi.
	@UseGuards(AuthGuard)
	@Mutation(() => Pet)
	public async likeTargetPet(@Args('petId') input: string, @AuthMember('_id') memberId: Types.ObjectId): Promise<Pet> {
		const petId = toObjectId(input);
		return await this.petService.likeTargetPet(memberId, petId);
	}

	/** ADMIN **/

	//barcha statusdagi e’lonlarni filtr va sahifalash bilan ko‘rsatadi.
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Pets)
	public async getAllPetsByAdmin(@Args('input') input: AdminPetsInquiry): Promise<Pets> {
		return await this.petService.getAllPetsByAdmin(input);
	}

	//admin faol yoki band e’lonni yangilaydi; yakunlansa egasining memberPets soni kamayadi.
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Pet)
	public async updatePetByAdmin(@Args('input') input: PetUpdateInput): Promise<Pet> {
		return await this.petService.updatePetByAdmin(input);
	}

	// Stratus DELETE bolgan elon larni remove qiladi
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Pet)
	public async removePetByAdmin(@Args('petId') input: string): Promise<Pet> {
		const petId = toObjectId(input);
		return await this.petService.removePetByAdmin(petId);
	}
}
