import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Cart } from '../../libs/dto/cart/cart';
import { AddToCartInput } from '../../libs/dto/cart/cart.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CartService } from './cart.service';

@Resolver(() => Cart)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  //mahsulot variantini savatga qo‘shadi, mavjud bo‘lsa sonini oshiradi va stokni tekshiradi.
  @UseGuards(AuthGuard)
  @Mutation(() => Cart)
  public async addToCart(
    @Args('input') input: AddToCartInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Cart> {
    console.log('Mutation: addToCart');
    return await this.cartService.addToCart(memberId, input);
  }

  //foydalanuvchining savatini joriy narxlar bilan qaytaradi.
  @UseGuards(AuthGuard)
  @Query(() => Cart)
  public async getMyCart(@AuthMember('_id') memberId: Types.ObjectId): Promise<Cart> {
    console.log('Query: getMyCart');
    return await this.cartService.getMyCart(memberId);
  }
}
