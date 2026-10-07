import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { Product } from '../../libs/dto/product/product';
import { AdminCommentsInquiry, CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentUpdateInput } from '../../libs/dto/comment/comment.update';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/types/config';
import { MemberService } from '../member/member.service';
import { PetService } from '../pet/pet.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    @InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private readonly memberService: MemberService,
    private readonly petService: PetService,
    private readonly notificationService: NotificationService,
  ) {}

  public async createComment(memberId: Types.ObjectId, input: CommentInput): Promise<Comment> {
    const commentRefId = shapeIntoMongoObjectId(input.commentRefId);
    let result: Comment;
    let productOwnerId: Types.ObjectId | null = null;

    if (input.commentGroup === CommentGroup.PRODUCT) {
      const product = await this.productModel.findOne({ _id: commentRefId, productStatus: ProductStatus.ACTIVE }).select('memberId').exec();
      if (!product) throw new BadRequestException('Product is unavailable.');
      if (product.memberId.equals(memberId)) throw new BadRequestException('You cannot review your own product.');
      if (!input.commentRating) throw new BadRequestException('Choose a rating from 1 to 5.');
      if (!input.commentContent.trim()) throw new BadRequestException('Write a review.');
      productOwnerId = product.memberId;
    } else if (input.commentRating) {
      throw new BadRequestException('Ratings are only available for products.');
    }

    try {
      result = await this.commentModel.create({ ...input, commentContent: input.commentContent.trim(), commentRefId, memberId });
    } catch (err) {
      console.log('Error! CommentService.createComment', err.message);
      if (err.code === 11000 && input.commentGroup === CommentGroup.PRODUCT) {
        throw new BadRequestException('You have already reviewed this product.');
      }
      throw new BadRequestException(Message.CREATE_FAILED);
    }

    switch (input.commentGroup) {
      case CommentGroup.PET:
        await this.petService.petStatsEditor({
          _id: commentRefId,
          targetKey: 'petComments',
          modifier: 1,
        });
        break;
      case CommentGroup.MEMBER:
        await this.memberService.memberStatsEditor({
          _id: commentRefId,
          targetKey: 'memberComments',
          modifier: 1,
        });
        break;
      case CommentGroup.ARTICLE:
        const article = await this.boardArticleModel.findOneAndUpdate(
          { _id: commentRefId, articleStatus: BoardArticleStatus.ACTIVE },
          { $inc: { articleComments: 1 } },
          { returnDocument: 'after' },
        ).exec();
        if (!article) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        break;
      case CommentGroup.PRODUCT:
        await this.refreshProductRating(commentRefId);
        if (productOwnerId) {
          try {
            await this.notificationService.createNotification({
              notificationType: NotificationType.COMMENT,
              notificationGroup: NotificationGroup.PRODUCT,
              notificationTitle: 'Your product received a new review',
              notificationDesc: `${input.commentRating} out of 5 stars`,
              authorId: memberId,
              receiverId: productOwnerId,
              productId: commentRefId,
            });
          } catch (err) {
            console.log('Error! CommentService.createComment notification', err.message);
          }
        }
        break;
    }

    return result;
  }

  public async updateComment(memberId: Types.ObjectId, input: CommentUpdateInput): Promise<Comment> {
    const commentId = shapeIntoMongoObjectId(input._id);
    const result = await this.commentModel.findOneAndUpdate(
      { _id: commentId, memberId, commentStatus: CommentStatus.ACTIVE },
      { $set: { commentContent: input.commentContent } },
      { returnDocument: 'after', runValidators: true },
    ).exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  public async getComments(input: CommentsInquiry): Promise<Comments> {
    const commentRefId = shapeIntoMongoObjectId(input.search.commentRefId);
    const match = { commentRefId, commentStatus: CommentStatus.ACTIVE };
    const direction = input.direction ?? Direction.DESC;
    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: direction,
      _id: direction,
    };

    const result = await this.commentModel
    .aggregate<Comments>([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            //meLiked 
            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0] ?? { list: [], metaCounter: [] };
  }

  public async getAllCommentsByAdmin(input: AdminCommentsInquiry): Promise<Comments> {
    const { commentGroup, text } = input.search;
    const match: Record<string, unknown> = { commentStatus: CommentStatus.ACTIVE };
    const direction = input.direction ?? Direction.DESC;
    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: direction,
      _id: direction,
    };

    if (commentGroup) match.commentGroup = commentGroup;
    if (text) {
      const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.commentContent = new RegExp(escaped, 'i');
    }

    const result = await this.commentModel.aggregate<Comments>([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0] ?? { list: [], metaCounter: [] };
  }

  public async removeCommentByAdmin(commentId: Types.ObjectId): Promise<Comment> {
    const result = await this.commentModel.findByIdAndDelete(commentId).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    if (result.commentGroup === CommentGroup.PRODUCT) await this.refreshProductRating(result.commentRefId);
    return result;
  }

  private async refreshProductRating(productId: Types.ObjectId): Promise<void> {
    const [stats] = await this.commentModel.aggregate<{ total: number; rating: number }>([
      { $match: { commentRefId: productId, commentGroup: CommentGroup.PRODUCT, commentStatus: CommentStatus.ACTIVE } },
      { $group: { _id: null, total: { $sum: 1 }, rating: { $avg: '$commentRating' } } },
    ]).exec();
    await this.productModel.updateOne(
      { _id: productId },
      { $set: { productReviews: stats?.total ?? 0, productRating: stats?.rating ?? 0 } },
    ).exec();
  }
}
