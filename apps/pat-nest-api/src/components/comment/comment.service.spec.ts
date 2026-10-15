import { Model, Types } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { Comment } from '../../libs/dto/comment/comment';
import { Product } from '../../libs/dto/product/product';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';
import { PetService } from '../pet/pet.service';
import { CommentService } from './comment.service';

describe('CommentService product reviews', () => {
	const authorId = new Types.ObjectId();
	const ownerId = new Types.ObjectId();
	const productId = new Types.ObjectId();
	const input = {
		commentGroup: CommentGroup.PRODUCT,
		commentRefId: productId.toString(),
		commentRating: 4,
		commentContent: '  Good product  ',
	};

	function createService(productOwnerId: Types.ObjectId, notificationFails = false) {
		const savedComment = { _id: new Types.ObjectId(), memberId: authorId, commentContent: 'Good product' };
		const create = jest.fn(() => Promise.resolve(savedComment));
		const commentModel = { create, aggregate: () => ({ exec: () => Promise.resolve([{ total: 1, rating: 4 }]) }) };
		const updateRating = jest.fn(() => ({ exec: () => Promise.resolve({}) }));
		const productModel = {
			findOne: () => ({ select: () => ({ exec: () => Promise.resolve({ memberId: productOwnerId }) }) }),
			updateOne: updateRating,
		};
		const notify = jest.fn(() =>
			notificationFails ? Promise.reject(new Error('Notification unavailable')) : Promise.resolve(),
		);
		const service = new CommentService(
			commentModel as unknown as Model<Comment>,
			{} as Model<BoardArticle>,
			productModel as unknown as Model<Product>,
			{} as MemberService,
			{} as PetService,
			{ createNotification: notify } as unknown as NotificationService,
		);
		return { service, savedComment, create, updateRating, notify };
	}

	it('rejects reviewing your own product before any write', async () => {
		const { service, create, updateRating, notify } = createService(authorId);

		await expect(service.createComment(authorId, input)).rejects.toThrow('You cannot review your own product.');
		expect(create).not.toHaveBeenCalled();
		expect(updateRating).not.toHaveBeenCalled();
		expect(notify).not.toHaveBeenCalled();
	});

	it('returns the saved review when its notification fails', async () => {
		const { service, savedComment, updateRating } = createService(ownerId, true);
		const log = jest.spyOn(console, 'log').mockImplementation(() => {});
		try {
			await expect(service.createComment(authorId, input)).resolves.toEqual(savedComment);
			expect(updateRating).toHaveBeenCalledWith({ _id: productId }, { $set: { productReviews: 1, productRating: 4 } });
		} finally {
			log.mockRestore();
		}
	});
});
