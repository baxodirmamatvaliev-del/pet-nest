import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PetModule } from './pet/pet.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { PaymentModule } from './payment/payment.module';

@Module({
    imports:[
        MemberModule,
        PetModule,
        ProductModule,
        CartModule,
        OrderModule,
        CommentModule,
        FollowModule,
        PaymentModule
    ]
})
export class ComponentsModule {}
