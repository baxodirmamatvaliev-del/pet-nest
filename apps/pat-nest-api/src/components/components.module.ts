import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PetModule } from './pet/pet.module';
import { ProductModule } from './product/product.module';

@Module({
    imports:[
        MemberModule,
        PetModule,
        ProductModule
    ]
})
export class ComponentsModule {}
