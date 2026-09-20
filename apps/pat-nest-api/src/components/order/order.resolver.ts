import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Order, Orders } from '../../libs/dto/order/order';
import { CreateOrderInput, MyOrdersInquiry } from '../../libs/dto/order/order.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { OrderService } from './order.service';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  public async createOrder(
    @Args('input') input: CreateOrderInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Order> {
    console.log('Mutation: createOrder');
    return await this.orderService.createOrder(memberId, input);
  }

  //xaridor oz mahsulotlarini kora olishi uchun 
  @UseGuards(AuthGuard)
  @Query(() => Orders)
  public async getMyOrders(
    @Args('input') input: MyOrdersInquiry,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Orders> {
    console.log('Query: getMyOrders');
    return await this.orderService.getMyOrders(memberId, input);
  }
// faqat buyurtma egasiga tafsilotni ko‘rsatadi;
  @UseGuards(AuthGuard)
  @Query(() => Order)
  public async getOrder(
    @Args('orderId') input: string,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Order> {
    console.log('Query: getOrder');
    const orderId = shapeIntoMongoObjectId(input);
    return await this.orderService.getOrder(memberId, orderId);
  }


  //egasiga faqat PENDING buyurtmani bekor qilishga ruxsat beradi.
  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  public async cancelOrder(
    @Args('orderId') input: string,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Order> {
    console.log('Mutation: cancelOrder');
    const orderId = shapeIntoMongoObjectId(input);
    return await this.orderService.cancelOrder(memberId, orderId);
  }
}
