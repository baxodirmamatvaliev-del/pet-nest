import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CartSchema from '../../schemas/Cart.model';
import ProductSchema from '../../schemas/Product.model';
import { AuthModule } from '../auth/auth.module';
import { CartResolver } from './cart.resolver';
import { CartService } from './cart.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Cart', schema: CartSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
    AuthModule,
  ],
  providers: [CartResolver, CartService],
  exports: [CartService],
})
export class CartModule {}
