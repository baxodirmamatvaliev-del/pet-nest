import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    const cart = await this.cartModel.findOne({ memberId }).lean().exec();
    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const existingOrder = await this.findExistingOrder(memberId, cart.updatedAt);
    if (existingOrder) return existingOrder;

    const { orderItems, totalAmount } = await this.prepareOrderItems(cart.cartItems);

    try {
      return await this.orderModel.create({
        memberId,
        cartUpdatedAt: cart.updatedAt,
        orderStatus: OrderStatus.PENDING,
        orderItems,
        totalAmount,
        ...input,
      });
    } catch (err) {
      if (err.code === 11000) {
        const repeatedOrder = await this.findExistingOrder(memberId, cart.updatedAt);
        if (repeatedOrder) return repeatedOrder;
      }
      console.log('Error! OrderService.createOrder', err.message);
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
    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, memberId, orderStatus: OrderStatus.PENDING },
      { $set: { orderStatus: OrderStatus.CANCELLED, cancelledAt: new Date() } },
      { returnDocument: 'after' },
    ).exec();
    if (!order) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

    const nextCartDate = new Date(Math.max(Date.now(), order.cartUpdatedAt.getTime() + 1));
    await this.cartModel.updateOne(
      { memberId, updatedAt: order.cartUpdatedAt },
      { $set: { updatedAt: nextCartDate } },
      { timestamps: false },
    ).exec();

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
    const { _id, orderStatus } = input;
    const search = {
      _id: shapeIntoMongoObjectId(_id),
      orderStatus: OrderStatus.PAYMENT_CONFIRMED,
    };
    const changes: { orderStatus: OrderStatus; shippedAt?: Date; deliveredAt?: Date } = {
      orderStatus,
    };

    if (orderStatus === OrderStatus.IN_TRANSIT) {
      changes.shippedAt = new Date();
    } else if (orderStatus === OrderStatus.DELIVERED_TO_CUSTOMER) {
      search.orderStatus = OrderStatus.IN_TRANSIT;
      changes.deliveredAt = new Date();
    } else {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    const order = await this.orderModel.findOneAndUpdate(
      search,
      { $set: changes },
      { returnDocument: 'after' },
    ).exec();

    if (!order) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    return order;
  }

  private async findExistingOrder(memberId: Types.ObjectId, cartUpdatedAt: Date): Promise<Order | null> {
    return await this.orderModel.findOne({ memberId, cartUpdatedAt }).exec();
  }

  private async prepareOrderItems(cartItems: StoredCartItem[]): Promise<{
    orderItems: OrderItem[];
    totalAmount: number;
  }> {
    const productIds = cartItems.map((item) => item.productId);
    const products = await this.productModel.find({
      _id: { $in: productIds },
      productStatus: ProductStatus.ACTIVE,
    }).lean().exec();

    const orderItems: OrderItem[] = [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = products.find(
        (item) => item._id.toString() === cartItem.productId.toString(),
      );
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
}
