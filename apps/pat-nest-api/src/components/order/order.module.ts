import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CartSchema from '../../schemas/Cart.model';
import OrderSchema from '../../schemas/Order.model';
import ProductSchema from '../../schemas/Product.model';
import { AuthModule } from '../auth/auth.module';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Cart', schema: CartSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
    AuthModule,
  ],
  providers: [OrderResolver, OrderService],
  exports: [OrderService],
})
export class OrderModule {}
