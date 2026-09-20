import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PetModule } from './pet/pet.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';

@Module({
    imports:[
        MemberModule,
        PetModule,
        ProductModule,
        CartModule
    ]
})
export class ComponentsModule {}
