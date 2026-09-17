import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { PetGender, PetListingType, PetLocation, PetType } from '../../enums/pet.enum';

@InputType()
export class PetInput {
  @Field(() => PetType)
  @IsEnum(PetType)
  petType: PetType;

  @Field(() => PetListingType)
  @IsEnum(PetListingType)
  petListingType: PetListingType;

  @Field(() => PetLocation)
  @IsEnum(PetLocation)
  petLocation: PetLocation;

  @Field()
  @IsString()
  @Length(3, 100)
  petTitle: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  petName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  petBreed?: string;

  @Field(() => PetGender, { nullable: true })
  @IsOptional()
  @IsEnum(PetGender)
  petGender?: PetGender;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  petAgeMonths?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Min(0)
  petPrice?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  petImages?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  petDesc?: string;
}
