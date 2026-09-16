import { Module } from '@nestjs/common';
import { PetResolver } from './pet.resolver';
import { PetService } from './pet.service';

@Module({
  imports:[],
  providers: [PetResolver, PetService],
  exports: [PetService]
})
export class PetModule {}
