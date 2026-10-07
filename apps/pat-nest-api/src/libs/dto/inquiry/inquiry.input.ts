import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsString, Length } from 'class-validator';

@InputType()
export class InquiryInput {
  @Field()
  @IsMongoId()
  receiverId: string;

  @Field()
  @IsString()
  @Length(3, 100)
  inquiryTitle: string;

  @Field()
  @IsString()
  @Length(10, 3000)
  inquiryContent: string;
}

@InputType()
export class AnswerInquiryInput {
  @Field()
  @IsMongoId()
  inquiryId: string;

  @Field()
  @IsString()
  @Length(2, 3000)
  inquiryAnswer: string;
}
