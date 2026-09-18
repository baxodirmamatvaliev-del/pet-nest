import { Types } from 'mongoose';
import { T } from './common';
import { LikeGroup } from '../enums/like.enum';

export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];
export const availableAgentsSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availablePetSorts = ['createdAt', 'updatedAt', 'petPrice', 'petLikes', 'petViews', 'petRank'];

export const shapeIntoMongoObjectId = (target: string | Types.ObjectId): Types.ObjectId => {
  return typeof target === 'string' ? new Types.ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (
  memberId: Types.ObjectId | null,
  targetRefId: string = '$_id',
  likeGroup?: LikeGroup,
) => {
	return {
		$lookup: { //MongoDB’da boshqa collection bilan bog‘lanish boshlanadi
			from: 'likes', //Ma’lumot likes collection ichidan qidiriladi.
			let: {
				localLikeRefId: targetRefId, //qaysi obyekt tekshirilmoqda
				localMemberId: memberId, //qaysi foydalanuvchi tekshirilmoqda
				localMyFavorite: true, //like topilsa qaytariladigan true qiymati
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$likeRefId', '$$localLikeRefId'] },//Bu like yozuvini ikki shart bilan qidiradi
									{ $eq: ['$memberId', '$$localMemberId'] }, //kkalasi ham mos kelsa, demak shu foydalanuvchi shu obyektga like bosgan.
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
						myFavorite: '$$localMyFavorite',//Frontendga foydalanuvchi shu obyektga like bosganini ko‘rsatadigan ma’lumot beradi:
					},//Shu orqali yurakcha qizil yoki faol holatda ko‘rsatiladi
				},
			],
			as: 'meLiked',
		},
	};
};

export const lookupPetOwner = {
  $lookup: {
    from: 'members',
    let: { ownerId: '$memberId' },
    pipeline: [
      { $match: { $expr: { $eq: ['$_id', '$$ownerId'] } } },
      { $project: { memberPassword: 0 } },
    ],
    as: 'memberData',
  },
};

interface lookupAuthMemberFollowed {
	followerId: T;
	followingId: string
}


export const lookupAuthMemberFollowed = (input: lookupAuthMemberFollowed ) => {
	const {followerId, followingId} =input
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
							$and: [
								{ $eq: ['$followerId', '$$localFollowerId'] },
								{ $eq: ['$followingId', '$$localFollowingId'] },
							],
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
