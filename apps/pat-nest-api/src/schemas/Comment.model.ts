import { Schema } from 'mongoose';
import { CommentGroup, CommentStatus } from '../libs/enums/comment.enum';

const CommentSchema = new Schema(
    {
        commentStatus: {
            type: String,
            enum: CommentStatus,
            default: CommentStatus.ACTIVE,
        },

        commentGroup: {
            type: String,
            enum: CommentGroup,
            required: true,
        },

        commentContent: {
            type: String,
            required: true,
        },

        commentRating: {
            type: Number,
            min: 1,
            max: 5,
        },

        commentRefId: {
            type: Schema.Types.ObjectId,
            required: true,
        },

        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true, collection: 'comments' },
);

CommentSchema.index(
    { commentGroup: 1, commentRefId: 1, memberId: 1 },
    { unique: true, partialFilterExpression: { commentGroup: CommentGroup.PRODUCT } },
);

export default CommentSchema;
