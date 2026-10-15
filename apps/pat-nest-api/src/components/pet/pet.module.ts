import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PetSchema from '../../schemas/Pet.model';
import { AuthModule } from '../auth/auth.module';
import { LikeModule } from '../like/like.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';
import { PetResolver } from './pet.resolver';
import { PetService } from './pet.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Pet', schema: PetSchema }]),
		AuthModule,
		MemberModule,
		ViewModule,
		LikeModule,
	],
	providers: [PetResolver, PetService],
	exports: [PetService],
})
export class PetModule {}
