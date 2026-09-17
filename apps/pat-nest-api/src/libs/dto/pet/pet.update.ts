import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PetStatus } from '../../enums/pet.enum';
import { PetInput } from './pet.input';

@InputType()
export class PetUpdateInput extends PartialType(PetInput) {
  @Field(() => ID)
  @IsMongoId()
  _id: string;

  @Field(() => PetStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PetStatus)
  petStatus?: PetStatus;
}
