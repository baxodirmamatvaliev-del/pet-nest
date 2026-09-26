import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Order, OrderItem, Orders } from '../../libs/dto/order/order';
import { AdminOrdersInquiry, CreateOrderInput, MyOrdersInquiry } from '../../libs/dto/order/order.input';
import { OrderStatusUpdateInput } from '../../libs/dto/order/order.update';
import { Product } from '../../libs/dto/product/product';
import { Message } from '../../libs/enums/common.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { StoredCart, StoredCartItem } from '../../libs/types/cart';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { StoredOrder } from '../../libs/types/order';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<StoredOrder>,
    @InjectModel('Cart') private readonly cartModel: Model<StoredCart>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
  ) {}

  public async createOrder(memberId: Types.ObjectId, input: CreateOrderInput): Promise<Order> {
    try {
      return await this.orderModel.db.transaction(async (session) => {
        const cart = await this.cartModel.findOne({ memberId }).session(session).lean().exec();
        if (!cart?.cartItems.length) throw new BadRequestException(Message.NO_DATA_FOUND);

        const existingOrder = await this.orderModel.findOne({
          memberId,
          cartUpdatedAt: cart.updatedAt,
        }).session(session).exec();
        if (existingOrder) return existingOrder;

        const { orderItems, totalAmount } = await this.prepareOrderItems(cart.cartItems, session);
        await this.reduceProductStock(orderItems, session);

        const [order] = await this.orderModel.create([{
          memberId,
          cartUpdatedAt: cart.updatedAt,
          orderStatus: OrderStatus.PENDING,
          orderItems,
          totalAmount,
          ...input,
        }], { session });

        return order;
      });
    } catch (err) {
      console.log('Error! OrderService.createOrder', err.message);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getMyOrders(memberId: Types.ObjectId, input: MyOrdersInquiry): Promise<Orders> {
    const match: Record<string, unknown> = { memberId };
    if (input.search.orderStatus) match.orderStatus = input.search.orderStatus;

    const result = await this.orderModel.aggregate<Orders>([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0];
  }

  public async getOrder(memberId: Types.ObjectId, orderId: Types.ObjectId): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, memberId }).exec();
    if (!order) throw new NotFoundException(Message.NO_DATA_FOUND);
    return order;
  }

  public async cancelOrder(memberId: Types.ObjectId, orderId: Types.ObjectId): Promise<Order> {
    try {
      return await this.orderModel.db.transaction((session) =>
        this.cancelPendingOrder(memberId, orderId, session),
      );
    } catch (err) {
      console.log('Error! OrderService.cancelOrder', err.message);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(Message.UPDATE_FAILED);
    }
  }

  public async cancelPendingOrder(
    memberId: Types.ObjectId,
    orderId: Types.ObjectId,
    session: ClientSession,
  ): Promise<Order> {
    const order = await this.orderModel.findOne({
      _id: orderId,
      memberId,
      orderStatus: OrderStatus.PENDING,
    }).session(session).exec();
    if (!order) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

    await this.restoreProductStock(order.orderItems, session);

    order.orderStatus = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await order.save({ session });

    await this.refreshCartAfterCancellation(memberId, order.cartUpdatedAt, session);

    return order;
  }

  public async getAllOrdersByAdmin(input: AdminOrdersInquiry): Promise<Orders> {
    const { memberId, orderStatus } = input.search;
    const match: Record<string, unknown> = {};
    if (orderStatus) match.orderStatus = orderStatus;
    if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);

    const result = await this.orderModel.aggregate<Orders>([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0];
  }

  public async updateOrderStatusByAdmin(input: OrderStatusUpdateInput): Promise<Order> {
    const orderId = shapeIntoMongoObjectId(input._id);
    let order: Order | null = null;

    if (input.orderStatus === OrderStatus.IN_TRANSIT) {
      order = await this.orderModel.findOneAndUpdate(
        { _id: orderId, orderStatus: OrderStatus.PAYMENT_CONFIRMED },
        { $set: { orderStatus: OrderStatus.IN_TRANSIT, shippedAt: new Date() } },
        { returnDocument: 'after' },
      ).exec();
    } else if (input.orderStatus === OrderStatus.DELIVERED_TO_CUSTOMER) {
      order = await this.orderModel.findOneAndUpdate(
        { _id: orderId, orderStatus: OrderStatus.IN_TRANSIT },
        { $set: { orderStatus: OrderStatus.DELIVERED_TO_CUSTOMER, deliveredAt: new Date() } },
        { returnDocument: 'after' },
      ).exec();
    } else {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    if (!order) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    return order;
  }

  private async prepareOrderItems( cartItems: StoredCartItem[],session: ClientSession,): Promise<{ orderItems: OrderItem[]; totalAmount: number }> {
    const products = await this.productModel.find({
      _id: { $in: cartItems.map((item) => 
        item.productId) },
      productStatus: ProductStatus.ACTIVE,
    }).session(session).lean().exec();

    const orderItems: OrderItem[] = [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = products.find((item) => item._id.equals(cartItem.productId));
      if (!product) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

      const variant = product.productVariants.find((item) => item.sku === cartItem.sku);
      if (!variant || variant.stock < cartItem.quantity) {
        throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
      }

      const subtotal = variant.price * cartItem.quantity;
      orderItems.push({
        productId: cartItem.productId,
        sku: cartItem.sku,
        productName: product.productName,
        productImage: product.productImages[0],
        quantity: cartItem.quantity,
        unitPrice: variant.price,
        subtotal,
      });
      totalAmount += subtotal;
    }

    return { orderItems, totalAmount };
  }

  private async refreshCartAfterCancellation(
    memberId: Types.ObjectId,
    cartUpdatedAt: Date,
    session: ClientSession,
  ): Promise<void> {
    const updatedAt = new Date(Math.max(Date.now(), cartUpdatedAt.getTime() + 1));

    await this.cartModel.updateOne(
      { memberId, updatedAt: cartUpdatedAt },
      { $set: { updatedAt } },
      { timestamps: false, session },
    ).exec();
  }

  private async reduceProductStock(
    orderItems: OrderItem[],
    session: ClientSession,
  ): Promise<void> {
    for (const item of orderItems) {
      const result = await this.productModel.updateOne(
        {
          _id: item.productId,
          productStatus: ProductStatus.ACTIVE,
          productVariants: {
            $elemMatch: {
              sku: item.sku,
              stock: { $gte: item.quantity },
            },
          },
        },
        { $inc: { 'productVariants.$.stock': -item.quantity } },
        { session },
      ).exec();

      if (result.modifiedCount !== 1) {
        throw new BadRequestException(Message.INSUFFICIENT_STOCK);
      }
    }
  }

  //order bekor qilinganda mahsulot miqdorini stokga qaytaradi.
  private async restoreProductStock( orderItems: OrderItem[],session: ClientSession,): Promise<void> {
    for (const item of orderItems) {
      const result = await this.productModel.updateOne(
        {
          _id: item.productId,
          'productVariants.sku': item.sku,
        },
        { $inc: { 'productVariants.$.stock': item.quantity } },
        { session },
      ).exec();

      if (result.modifiedCount !== 1) {
        throw new BadRequestException(Message.UPDATE_FAILED);
      }
    }
  }
}
