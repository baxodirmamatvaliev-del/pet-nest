import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

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
