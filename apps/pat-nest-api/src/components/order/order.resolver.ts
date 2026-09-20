import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Order, Orders } from '../../libs/dto/order/order';
import { AdminOrdersInquiry, CreateOrderInput, MyOrdersInquiry } from '../../libs/dto/order/order.input';
import { OrderStatusUpdateInput } from '../../libs/dto/order/order.update';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
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

  @UseGuards(AuthGuard)
  @Query(() => Orders)
  public async getMyOrders(
    @Args('input') input: MyOrdersInquiry,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Orders> {
    console.log('Query: getMyOrders');
    return await this.orderService.getMyOrders(memberId, input);
  }
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

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Orders)
  public async getAllOrdersByAdmin(@Args('input') input: AdminOrdersInquiry): Promise<Orders> {
    console.log('Query: getAllOrdersByAdmin');
    return await this.orderService.getAllOrdersByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Order)
  public async updateOrderStatusByAdmin(@Args('input') input: OrderStatusUpdateInput): Promise<Order> {
    console.log('Mutation: updateOrderStatusByAdmin');
    return await this.orderService.updateOrderStatusByAdmin(input);
  }
}
