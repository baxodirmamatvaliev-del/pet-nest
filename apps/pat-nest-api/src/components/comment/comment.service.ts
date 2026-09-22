import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentUpdateInput } from '../../libs/dto/comment/comment.update';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/types/config';
import { MemberService } from '../member/member.service';
import { PetService } from '../pet/pet.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    @InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
    private readonly memberService: MemberService,
    private readonly petService: PetService,
  ) {}

  public async createComment(memberId: Types.ObjectId, input: CommentInput): Promise<Comment> {
    const commentRefId = shapeIntoMongoObjectId(input.commentRefId);
    let result: Comment;

    try {
      result = await this.commentModel.create({ ...input, commentRefId, memberId });
    } catch (err) {
      console.log('Error! CommentService.createComment', err.message);
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

    return result[0];
  }

  public async removeCommentByAdmin(commentId: Types.ObjectId): Promise<Comment> {
    const result = await this.commentModel.findByIdAndDelete(commentId).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }
}
