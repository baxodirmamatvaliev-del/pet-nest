import { Schema } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../libs/enums/payment.enum';

const PaymentSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        orderId: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            ref: 'Order',
        },

        paymentMethod: {
            type: String,
            enum: PaymentMethod,
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: PaymentStatus,
            default: PaymentStatus.PENDING,
        },

        paymentAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        confirmedAt: {
            type: Date,
        },

        cancelledAt: {
            type: Date,
        },
    },
    { timestamps: true, collection: 'payments' },
);

export default PaymentSchema;
