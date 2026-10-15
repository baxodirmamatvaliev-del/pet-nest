import { Types } from 'mongoose';
import { LikeGroup } from '../enums/like.enum';

export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];
export const availableAgentsSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availablePetSorts = ['createdAt', 'updatedAt', 'petPrice', 'petLikes', 'petViews', 'petRank'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];

export const toObjectId = (target: string | Types.ObjectId): Types.ObjectId => {
	return typeof target === 'string' ? new Types.ObjectId(target) : target;
};

// Ro'yxatdagi obyektga joriy foydalanuvchi like bosganini meLiked orqali qo'shamiz.
export const lookupAuthMemberLiked = (
	memberId: Types.ObjectId | null,
	targetRefId: string = '$_id',
	likeGroup?: LikeGroup,
) => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$likeRefId', '$$localLikeRefId'] },
								{ $eq: ['$memberId', '$$localMemberId'] },
								...(likeGroup ? [{ $eq: ['$likeGroup', likeGroup] }] : []),
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

// Egaga oid ma'lumotlarni ulaymiz; parol aggregation natijasiga kirmaydi.
export const lookupPetOwner = {
	$lookup: {
		from: 'members',
		let: { ownerId: '$memberId' },
		pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$ownerId'] } } }, { $project: { memberPassword: 0 } }],
		as: 'memberData',
	},
};

export const lookupMember = lookupPetOwner;

interface LookupAuthMemberFollowed {
	followerId: Types.ObjectId | null;
	followingId: string;
}

// Joriy foydalanuvchi ushbu a'zoga obuna bo'lganini meFollowed orqali qo'shamiz.
export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFollowing: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$followerId', '$$localFollowerId'] }, { $eq: ['$followingId', '$$localFollowingId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFollowing',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		let: { memberId: '$followingId' },
		pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$memberId'] } } }, { $project: { memberPassword: 0 } }],
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		let: { memberId: '$followerId' },
		pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$memberId'] } } }, { $project: { memberPassword: 0 } }],
		as: 'followerData',
	},
};
