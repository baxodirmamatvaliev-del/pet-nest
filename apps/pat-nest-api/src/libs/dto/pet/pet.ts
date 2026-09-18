import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import type { Types } from 'mongoose';
import { PetGender, PetListingType, PetLocation, PetStatus, PetType } from '../../enums/pet.enum';
import { Member } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Pet {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => PetType)
  petType: PetType;

  @Field(() => PetListingType)
  petListingType: PetListingType;

  @Field(() => PetStatus)
  petStatus: PetStatus;

  @Field(() => PetLocation)
  petLocation: PetLocation;

  @Field()
  petTitle: string;

  @Field()
  petName: string;

  @Field({ nullable: true })
  petBreed?: string;

  @Field(() => PetGender)
  petGender: PetGender;

  @Field(() => Int, { nullable: true })
  petAgeMonths?: number;

  @Field()
  petPrice: number;

  @Field(() => [String])
  petImages: string[];

  @Field({ nullable: true })
  petDesc?: string;

  @Field(() => Int)
  petViews: number;

  @Field(() => Int)
  petLikes: number;

  @Field(() => Int)
  petComments: number;

  @Field(() => Int)
  petRank: number;

  @Field(() => ID)
  memberId: Types.ObjectId;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];

  @Field(() => Member, { nullable: true })
  memberData?: Member;
}
