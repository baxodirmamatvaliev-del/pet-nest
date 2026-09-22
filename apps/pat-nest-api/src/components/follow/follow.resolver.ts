import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { FollowInput } from '../../libs/dto/follow/follow.input';
import { Follow } from '../../libs/dto/follow/follow';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
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
    console.log('Mutation: subscribe');
    const followingId = shapeIntoMongoObjectId(input.followingId);
    return await this.followService.subscribe(memberId, followingId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Follow)
  public async unsubscribe(
    @Args('input') input: FollowInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Follow> {
    console.log('Mutation: unsubscribe');
    const followingId = shapeIntoMongoObjectId(input.followingId);
    return await this.followService.unsubscribe(memberId, followingId);
  }
}
