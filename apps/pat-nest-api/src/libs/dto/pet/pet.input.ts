import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { PetGender, PetListingType, PetLocation, PetStatus, PetType } from '../../enums/pet.enum';
import { Direction } from '../../enums/common.enum';
import { availablePetSorts } from '../../types/config';

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

@InputType()
export class PetPriceRange {
  @Field(() => Int)
  @IsInt()
  @Min(0)
  start: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  end: number;
}

@InputType()
export class PetSearch {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @Field(() => [PetType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PetType, { each: true })
  typeList?: PetType[];

  @Field(() => [PetLocation], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PetLocation, { each: true })
  locationList?: PetLocation[];

  @Field(() => [PetListingType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PetListingType, { each: true })
  listingTypeList?: PetListingType[];

  @Field(() => PetPriceRange, { nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PetPriceRange)
  pricesRange?: PetPriceRange;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  text?: string;
}

@InputType()
export class PetsInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(availablePetSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => PetSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PetSearch)
  search: PetSearch;
}

@InputType()
export class OrdinaryInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}

@InputType()
export class MyPetSearch {
  @Field(() => PetStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PetStatus)
  petStatus?: PetStatus;
}

@InputType()
export class MyPetsInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(availablePetSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => MyPetSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => MyPetSearch)
  search: MyPetSearch;
}

@InputType()
export class AdminPetSearch {
  @Field(() => PetStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PetStatus)
  petStatus?: PetStatus;

  @Field(() => [PetType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PetType, { each: true })
  typeList?: PetType[];

  @Field(() => [PetLocation], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PetLocation, { each: true })
  locationList?: PetLocation[];
}

@InputType()
export class AdminPetsInquiry {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(availablePetSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => AdminPetSearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => AdminPetSearch)
  search: AdminPetSearch;
}
