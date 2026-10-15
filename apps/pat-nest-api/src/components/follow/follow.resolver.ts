import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Follow, Followers, Followings } from '../../libs/dto/follow/follow';
import { FollowInput, FollowInquiry } from '../../libs/dto/follow/follow.input';
import { toObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { FollowService } from './follow.service';

@Resolver(() => Follow)
export class FollowResolver {
	constructor(private readonly followService: FollowService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Follow)
	public async subscribe(
		@Args('input') input: FollowInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Follow> {
		const followingId = toObjectId(input.followingId);
		return await this.followService.subscribe(memberId, followingId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Follow)
	public async unsubscribe(
		@Args('input') input: FollowInput,
		@AuthMember('_id') memberId: Types.ObjectId,
	): Promise<Follow> {
		const followingId = toObjectId(input.followingId);
		return await this.followService.unsubscribe(memberId, followingId);
	}

	//— masalan, Ali kimlarni kuzatayotganini ko‘rsatadi.
	@UseGuards(OptionalAuthGuard)
	@Query(() => Followings)
	public async getMemberFollowings(
		@Args('input') input: FollowInquiry,
		@AuthMember('_id') memberId: Types.ObjectId | null,
	): Promise<Followings> {
		return await this.followService.getMemberFollowings(memberId, input);
	}

	//— masalan, Valini kimlar kuzatayotganini ko‘rsatadi.
	@UseGuards(OptionalAuthGuard)
	@Query(() => Followers)
	public async getMemberFollowers(
		@Args('input') input: FollowInquiry,
		@AuthMember('_id') memberId: Types.ObjectId | null,
	): Promise<Followers> {
		return await this.followService.getMemberFollowers(memberId, input);
	}
}
