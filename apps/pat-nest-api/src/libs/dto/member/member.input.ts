import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import { Direction } from '../../enums/common.enum';
import { availableAgentsSorts, availableMemberSorts } from '../../types/config';

@InputType()
export class MemberInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  memberNick: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  memberPhone: string;

  @Field()
  @IsString()
  @MinLength(8)
  memberPassword: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  memberNick: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  memberPassword: string;
}

@InputType()
export class MIsearch {
  @Field(() => MemberStatus, { nullable: true })
  @IsOptional()
  @IsEnum(MemberStatus)
  memberStatus?: MemberStatus;

  @Field(() => MemberType, { nullable: true })
  @IsOptional()
  @IsEnum(MemberType)
  memberType?: MemberType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  text?: string;
}

@InputType()
export class MembersInquiry {
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
  @IsIn(availableMemberSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => MIsearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => MIsearch)
  search: MIsearch;
}

@InputType()
export class AIsearch {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  text?: string;
}

@InputType()
export class AgentsInquiry {
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
  @IsIn(availableAgentsSorts)
  sort?: string;

  @Field(() => Direction, { nullable: true })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @Field(() => AIsearch)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => AIsearch)
  search: AIsearch;
}
