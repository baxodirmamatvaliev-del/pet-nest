import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { InquiryModule } from './inquiry/inquiry.module';
import { MemberModule } from './member/member.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { PetModule } from './pet/pet.module';
import { ProductModule } from './product/product.module';

@Module({
	imports: [
		MemberModule,
		PetModule,
		ProductModule,
		CartModule,
		OrderModule,
		CommentModule,
		FollowModule,
		PaymentModule,
		NotificationModule,
		InquiryModule,
	],
})
export class ComponentsModule {}
