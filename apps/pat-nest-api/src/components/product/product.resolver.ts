import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { FavoriteInquiry } from '../../libs/dto/like/like.input';
import { OrdinaryInquiry } from '../../libs/dto/pet/pet.input';
import { Product, Products } from '../../libs/dto/product/product';
import {
	AdminProductsInquiry,
	MyProductsInquiry,
	ProductInput,
	ProductsInquiry,
} from '../../libs/dto/product/product.input';
import { ProductUpdateInput } from '../../libs/dto/product/product.update';
import { MemberType } from '../../libs/enums/member.enum';
import { toObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { ProductService } from './product.service';

@Resolver(() => Product)
export class ProductResolver {
	constructor(private readonly productService: ProductService) {}

	@Roles(MemberType.ADMIN, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async createProduct(
		@Args('input') input: ProductInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Product> {
		return await this.productService.createProduct(memberId, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Product)
	public async getProduct(
		@Args('productId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId | null,
	): Promise<Product> {
		const productId = toObjectId(input);
		return await this.productService.getProduct(memberId, productId);
	}
	@UseGuards(OptionalAuthGuard)
	@Query(() => Products)
	public async getProducts(
		@Args('input') input: ProductsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId | null,
	): Promise<Products> {
		return await this.productService.getProducts(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Products)
	public async getFavoriteProducts(
		@Args('input') input: FavoriteInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Products> {
		return await this.productService.getFavoriteProducts(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Products)
	public async getVisitedProducts(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Products> {
		return await this.productService.getVisitedProducts(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Product)
	public async likeTargetProduct(
		@Args('productId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Product> {
		return await this.productService.likeTargetProduct(memberId, toObjectId(input));
	}

	// AGENT yoki ADMIN o‘zi yaratgan mahsulotlarni, jumladan yashirilganlarini ham ko‘radi.
	@Roles(MemberType.ADMIN, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Products)
	public async getMyProducts(
		@Args('input') input: MyProductsInquiry,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Products> {
		return await this.productService.getMyProducts(memberId, input);
	}
	// mahsulot egasi nom, rasm, variantlar va holatni o‘zgartiradi. Boshqa AGENT uning mahsulotini tahrirlay olmaydi.
	@Roles(MemberType.ADMIN, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async updateProduct(
		@Args('input') input: ProductUpdateInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Product> {
		return await this.productService.updateProduct(memberId, input);
	}

	//AGENT yoki ADMIN faqat o‘zi yaratgan mahsulotni olib tashlaydi. Yozuv bazada DELETE holatida saqlanadi va katalogda ko‘rinmaydi.
	@Roles(MemberType.ADMIN, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async removeProduct(
		@Args('productId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Product> {
		const productId = toObjectId(input);
		return await this.productService.removeProduct(memberId, productId);
	}
	// (ADMIN NAZORAT) ADMIN barcha holatdagi mahsulotlarni, jumladan o‘chirilganlarini ham, filtr va sahifalash bilan ko‘radi.
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Products)
	public async getAllProductsByAdmin(@Args('input') input: AdminProductsInquiry): Promise<Products> {
		return await this.productService.getAllProductsByAdmin(input);
	}

	// ADMIN istalgan egasining mahsulotini tahrirlay oladi, holatini ACTIVE, HIDDEN yoki DELETEga o‘zgartira oladi.
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async updateProductByAdmin(@Args('input') input: ProductUpdateInput): Promise<Product> {
		return await this.productService.updateProductByAdmin(input);
	}
}
