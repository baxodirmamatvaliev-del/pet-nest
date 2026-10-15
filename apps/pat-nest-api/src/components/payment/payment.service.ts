import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { OrderItem } from '../../libs/dto/order/order';
import { Payment } from '../../libs/dto/payment/payment';
import { ConfirmPaymentInput, CreatePaymentInput } from '../../libs/dto/payment/payment.input';
import { Product } from '../../libs/dto/product/product';
import { Message } from '../../libs/enums/common.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { PaymentStatus } from '../../libs/enums/payment.enum';
import { toObjectId } from '../../libs/types/config';
import { StoredOrder } from '../../libs/types/order';
import { getErrorMessage } from '../../libs/utils/error.util';
import { OrderService } from '../order/order.service';

@Injectable()
export class PaymentService {
	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<Payment>,
		@InjectModel('Order') private readonly orderModel: Model<StoredOrder>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
		private readonly orderService: OrderService,
	) {}

	public async createPayment(memberId: Types.ObjectId, input: CreatePaymentInput): Promise<Payment> {
		const orderId = toObjectId(input.orderId);
		const existingPayment = await this.paymentModel.findOne({ orderId, memberId }).exec();
		if (existingPayment) return existingPayment;

		const order = await this.orderModel
			.findOne({
				_id: orderId,
				memberId,
				orderStatus: OrderStatus.PENDING,
			})
			.exec();
		if (!order) throw new BadRequestException(Message.NO_DATA_FOUND);

		try {
			return await this.paymentModel.create({
				memberId,
				orderId,
				paymentMethod: input.paymentMethod,
				paymentStatus: PaymentStatus.PENDING,
				paymentAmount: order.totalAmount,
			});
		} catch (err: unknown) {
			console.log('Error! PaymentService.createPayment', getErrorMessage(err));
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getPayment(memberId: Types.ObjectId, paymentId: Types.ObjectId): Promise<Payment> {
		const payment = await this.paymentModel
			.findOne({
				_id: paymentId,
				memberId,
			})
			.exec();

		if (!payment) throw new BadRequestException(Message.NO_DATA_FOUND);
		return payment;
	}

	public async getPaymentByOrderByAdmin(orderId: Types.ObjectId): Promise<Payment | null> {
		return await this.paymentModel.findOne({ orderId }).exec();
	}

	public async cancelPayment(memberId: Types.ObjectId, paymentId: Types.ObjectId): Promise<Payment> {
		try {
			return await this.paymentModel.db.transaction(async (session) => {
				const payment = await this.paymentModel
					.findOne({
						_id: paymentId,
						memberId,
						paymentStatus: PaymentStatus.PENDING,
					})
					.session(session)
					.exec();
				if (!payment) throw new BadRequestException(Message.NO_DATA_FOUND);

				await this.orderService.cancelPendingOrder(memberId, payment.orderId, session);

				payment.paymentStatus = PaymentStatus.CANCELLED;
				payment.cancelledAt = new Date();
				await payment.save({ session });

				return payment;
			});
		} catch (err: unknown) {
			console.log('Error! PaymentService.cancelPayment', getErrorMessage(err));
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async confirmPayment(input: ConfirmPaymentInput): Promise<Payment> {
		const paymentId = toObjectId(input.paymentId);
		const session = await this.paymentModel.db.startSession();
		session.startTransaction();

		try {
			const payment = await this.paymentModel
				.findOne({
					_id: paymentId,
					paymentStatus: PaymentStatus.PENDING,
				})
				.session(session)
				.exec();
			if (!payment) throw new BadRequestException(Message.NO_DATA_FOUND);

			const order = await this.orderModel
				.findOne({
					_id: payment.orderId,
					orderStatus: OrderStatus.PENDING,
				})
				.session(session)
				.exec();
			if (!order) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

			await this.increaseProductSales(order.orderItems, session);

			payment.paymentStatus = PaymentStatus.CONFIRMED;
			payment.confirmedAt = new Date();
			await payment.save({ session });

			order.orderStatus = OrderStatus.PAYMENT_CONFIRMED;
			await order.save({ session });

			await session.commitTransaction();
			return payment;
		} catch (err: unknown) {
			if (session.inTransaction()) await session.abortTransaction();
			console.log('Error! PaymentService.confirmPayment', getErrorMessage(err));
			if (err instanceof BadRequestException) throw err;
			throw new BadRequestException(Message.UPDATE_FAILED);
		} finally {
			await session.endSession();
		}
	}

	//Bu qiymat eng ko‘p sotilgan mahsulotlarni aniqlash va reyting tuzishda ishlatiladi.
	private async increaseProductSales(orderItems: OrderItem[], session: ClientSession): Promise<void> {
		for (const item of orderItems) {
			await this.productModel
				.updateOne({ _id: item.productId }, { $inc: { productSold: item.quantity } }, { session })
				.exec();
		}
	}
}
