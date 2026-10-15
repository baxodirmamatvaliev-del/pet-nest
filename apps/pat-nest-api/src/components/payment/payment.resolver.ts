import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { ConfirmPaymentInput, CreatePaymentInput } from '../../libs/dto/payment/payment.input';
import { Payment } from '../../libs/dto/payment/payment';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaymentService } from './payment.service';

@Resolver(() => Payment)
export class PaymentResolver {
	constructor(private readonly paymentService: PaymentService) {}

	//Foydalanuvchi o‘zining PENDING orderi uchun payment yaratadi.
	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	public async createPayment(
		@Args('input') input: CreatePaymentInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Payment> {
		return await this.paymentService.createPayment(memberId, input);
	}

	//Foydalanuvchi payment ID orqali o‘z to‘lov ma’lumotini ko‘radi:
	@UseGuards(AuthGuard)
	@Query(() => Payment)
	public async getPayment(
		@Args('paymentId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Payment> {
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.getPayment(memberId, paymentId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Payment, { nullable: true })
	public async getPaymentByOrderByAdmin(@Args('orderId') input: string): Promise<Payment | null> {
		const orderId = shapeIntoMongoObjectId(input);
		return await this.paymentService.getPaymentByOrderByAdmin(orderId);
	}

	//Foydalanuvchi o‘zining PENDING paymentini bekor qiladi.
	@UseGuards(AuthGuard)
	@Mutation(() => Payment)
	public async cancelPayment(
		@Args('paymentId') input: string,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Payment> {
		const paymentId = shapeIntoMongoObjectId(input);
		return await this.paymentService.cancelPayment(memberId, paymentId);
	}

	// ADMIN to‘lov muvaffaqiyatli bo‘lganini tasdiqlaydi.
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Payment)
	public async confirmPayment(@Args('input') input: ConfirmPaymentInput): Promise<Payment> {
		return await this.paymentService.confirmPayment(input);
	}
}
