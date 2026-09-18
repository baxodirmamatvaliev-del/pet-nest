import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, Length, MinLength, ValidateIf } from 'class-validator';
import { MemberStatus, MemberType } from '../../enums/member.enum';

@InputType()
export class MemberUpdateInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  memberFullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memberImage?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memberAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  memberDesc?: string;
}

@InputType()
export class MemberUpdateByAdminInput extends MemberUpdateInput {
  @Field(() => ID)
  @IsMongoId()
  _id: string;

  @Field(() => MemberType, { nullable: true })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(MemberType)
  memberType?: MemberType;

  @Field(() => MemberStatus, { nullable: true })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(MemberStatus)
  memberStatus?: MemberStatus;

  @Field({ nullable: true })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  memberNick?: string;

  @Field({ nullable: true })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  memberPhone?: string;

  @Field({ nullable: true })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(8)
  memberPassword?: string;
}
