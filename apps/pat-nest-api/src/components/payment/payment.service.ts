import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { OrderItem } from '../../libs/dto/order/order';
import { CreatePaymentInput, ConfirmPaymentInput } from '../../libs/dto/payment/payment.input';
import { Payment } from '../../libs/dto/payment/payment';
import { Product } from '../../libs/dto/product/product';
import { Message } from '../../libs/enums/common.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { PaymentStatus } from '../../libs/enums/payment.enum';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { StoredOrder } from '../../libs/types/order';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel('Payment') private readonly paymentModel: Model<Payment>,
    @InjectModel('Order') private readonly orderModel: Model<StoredOrder>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
  ) {}

  public async createPayment( memberId: Types.ObjectId, input: CreatePaymentInput,): Promise<Payment> {
    const orderId = shapeIntoMongoObjectId(input.orderId);
    const existingPayment = await this.paymentModel.findOne({ orderId, memberId }).exec();
    if (existingPayment)
       return existingPayment;

    const order = await this.orderModel.findOne({
      _id: orderId,
      memberId,
      orderStatus: OrderStatus.PENDING,
    }).exec();
    if (!order) throw new BadRequestException(Message.NO_DATA_FOUND);

    try {
      return await this.paymentModel.create({
        memberId,
        orderId,
        paymentMethod: input.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        paymentAmount: order.totalAmount,
      });
    } catch (err) {
      console.log('Error! PaymentService.createPayment', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getPayment( memberId: Types.ObjectId, paymentId: Types.ObjectId,): Promise<Payment> {
    const payment = await this.paymentModel.findOne({
      _id: paymentId,
      memberId,
    }).exec();

    if (!payment) throw new BadRequestException(Message.NO_DATA_FOUND);
    return payment;
  }

  public async confirmPayment(input: ConfirmPaymentInput): Promise<Payment> {
    const paymentId = shapeIntoMongoObjectId(input.paymentId);
    const session = await this.paymentModel.db.startSession();
    session.startTransaction();

    try {
      const payment = await this.paymentModel.findOne({
        _id: paymentId,
        paymentStatus: PaymentStatus.PENDING,
      }).session(session).exec();
      if (!payment) throw new BadRequestException(Message.NO_DATA_FOUND);

      const order = await this.orderModel.findOne({
        _id: payment.orderId,
        orderStatus: OrderStatus.PENDING,
      }).session(session).exec();
      if (!order) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

      await this.increaseProductSales(order.orderItems, session);

      payment.paymentStatus = PaymentStatus.CONFIRMED;
      payment.confirmedAt = new Date();
      await payment.save({ session });

      order.orderStatus = OrderStatus.PAYMENT_CONFIRMED;
      await order.save({ session });

      await session.commitTransaction();
      return payment;
    } catch (err) {
      if (session.inTransaction()) await session.abortTransaction();
      console.log('Error! PaymentService.confirmPayment', err.message);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(Message.UPDATE_FAILED);
    } finally {
      await session.endSession();
    }
  }

  private async increaseProductSales(
    orderItems: OrderItem[],
    session: ClientSession,
  ): Promise<void> {
    for (const item of orderItems) {
      await this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { productSold: item.quantity } },
        { session },
      ).exec();
    }
  }
}
