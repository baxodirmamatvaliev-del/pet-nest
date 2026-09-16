import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PetModule } from './pet/pet.module';

@Module({
    imports:[
        MemberModule,
        PetModule
    ]
})
export class ComponentsModule {}
