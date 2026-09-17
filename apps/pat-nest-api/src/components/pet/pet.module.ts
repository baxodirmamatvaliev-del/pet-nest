import { Module } from '@nestjs/common';
import { PetResolver } from './pet.resolver';
import { PetService } from './pet.service';
import { MongooseModule } from '@nestjs/mongoose';
import PetSchema from '../../schemas/Pet.model';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Pet', schema: PetSchema }])],
	providers: [PetResolver, PetService],
	exports: [PetService],
})
export class PetModule {}
