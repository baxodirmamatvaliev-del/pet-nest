import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { ObjectId, Types } from 'mongoose';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class LikeInput {
	@IsNotEmpty()
	@Field(() => String)
	memberId: Types.ObjectId; // qaysi member like yaratmoqda

	@IsNotEmpty()
	@Field(() => String)
	likeRefId: Types.ObjectId; // qaysi targetni 

	@IsNotEmpty()
	@Field(() => LikeGroup)
	likeGroup: LikeGroup; // qaysi turdagi like 
}
