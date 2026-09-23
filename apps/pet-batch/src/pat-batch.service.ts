import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../pat-nest-api/src/libs/dto/member/member';
import { Pet } from '../../pat-nest-api/src/libs/dto/pet/pet';
import { Product } from '../../pat-nest-api/src/libs/dto/product/product';
import { MemberStatus, MemberType } from '../../pat-nest-api/src/libs/enums/member.enum';
import { PetStatus } from '../../pat-nest-api/src/libs/enums/pet.enum';
import { ProductStatus } from '../../pat-nest-api/src/libs/enums/product.enum';

@Injectable()
export class PatBatchService {
	constructor(
		@InjectModel('Pet') private readonly petModel: Model<Pet>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.petModel.updateMany({ petStatus: PetStatus.ACTIVE }, { petRank: 0 }).exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					memberType: MemberType.AGENT,
				},
				{ memberRank: 0 },
			)
			.exec();

		await this.productModel.updateMany({ productStatus: ProductStatus.ACTIVE }, { productRank: 0 }).exec();
	}

	public async batchTopPets(): Promise<void> {
		const pets = await this.petModel
			.find({
				petStatus: PetStatus.ACTIVE,
				petRank: 0,
			})
			.exec();

		const updates = pets.map(async (pet) => {
			const rank =
       pet.petLikes * 3 + 
       pet.petComments * 2 + 
       pet.petViews;
			return await this.petModel.findByIdAndUpdate(pet._id, { petRank: rank });
		});

		await Promise.all(updates);
	}

	public async batchTopAgents(): Promise<void> {
		const agents = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const updates = agents.map(async (agent) => {
			const rank =
				agent.memberPets * 5 +
				agent.memberFollowers * 4 +
				agent.memberLikes * 2 +
				agent.memberComments +
				agent.memberViews;

			return await this.memberModel.findByIdAndUpdate(agent._id, { memberRank: rank });
		});

		await Promise.all(updates);
	}

	public async batchTopProducts(): Promise<void> {
		const products = await this.productModel
			.find({
				productStatus: ProductStatus.ACTIVE,
				productRank: 0,
			})
			.exec();

		const updates = products.map(async (product) => {
			const rank = product.productSold * 5 + product.productRating * 3 + product.productReviews * 2;

			return await this.productModel.findByIdAndUpdate(product._id, { productRank: rank });
		});

		await Promise.all(updates);
	}

	public getHello(): string {
		return 'Welcome to PetNest BATCH Server!';
	}
}
