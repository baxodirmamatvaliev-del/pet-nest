import { Schema } from 'mongoose';

const CartItemSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        sku: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false },
);

const CartSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
            unique: true,
        },

        cartItems: {
            type: [CartItemSchema],
            default: [],
        },
    },
    { timestamps: true, collection: 'carts' },
);

export default CartSchema;
