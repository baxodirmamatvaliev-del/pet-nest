import { Schema } from 'mongoose';
import { OrderStatus } from '../libs/enums/order.enum';

const OrderItemSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        sku: {
            type: String,
            required: true,
        },

        productName: {
            type: String,
            required: true,
        },

        productImage: {
            type: String,
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false },
);

const OrderSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
            index: true,
        },

        cartUpdatedAt: {
            type: Date,
            required: true,
        },

        orderStatus: {
            type: String,
            enum: OrderStatus,
            default: OrderStatus.PENDING,
        },

        orderItems: {
            type: [OrderItemSchema],
            required: true,
            validate: {
                validator: (items: unknown[]) => items.length > 0,
                message: 'Order must contain at least one item',
            },
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        recipientName: {
            type: String,
            required: true,
            trim: true,
        },

        recipientPhone: {
            type: String,
            required: true,
            trim: true,
        },

        deliveryAddress: {
            type: String,
            required: true,
            trim: true,
        },

        deliveryNote: {
            type: String,
            trim: true,
        },

        cancelledAt: {
            type: Date,
        },

        shippedAt: {
            type: Date,
        },

        deliveredAt: {
            type: Date,
        },
    },
    { timestamps: true, collection: 'orders' },
);

OrderSchema.index({ memberId: 1, createdAt: -1 });
OrderSchema.index({ memberId: 1, cartUpdatedAt: 1 }, { unique: true });

export default OrderSchema;
