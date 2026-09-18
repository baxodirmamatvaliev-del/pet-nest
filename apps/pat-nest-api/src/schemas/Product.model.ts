import { Schema } from 'mongoose';
import { ProductCategory, ProductStatus, ProductType } from '../libs/enums/product.enum';

const ProductVariantSchema = new Schema(
    {
        sku: {
            type: String,
            required: true,
            trim: true,
        },

        color: {
            type: String,
            trim: true,
        },

        size: {
            type: String,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false },
);

const ProductSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
            index: true,
        },

        productCategory: {
            type: String,
            enum: ProductCategory,
            required: true,
        },

        productType: {
            type: String,
            enum: ProductType,
            required: true,
        },

        productStatus: {
            type: String,
            enum: ProductStatus,
            default: ProductStatus.ACTIVE,
        },

        productName: {
            type: String,
            required: true,
            trim: true,
        },

        productDesc: {
            type: String,
        },

        productImages: {
            type: [String],
            required: true,
            validate: {
                validator: (images: string[]) => images.length > 0,
                message: 'At least one product image is required',
            },
        },

        productVariants: {
            type: [ProductVariantSchema],
            required: true,
            validate: {
                validator: (variants: { sku: string }[]) => {
                    const skus = variants.map((variant) => variant.sku);
                    return skus.length > 0 && new Set(skus).size === skus.length;
                },
                message: 'Product variants need unique SKUs',
            },
        },

        productRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        productReviews: {
            type: Number,
            default: 0,
            min: 0,
        },

        productSold: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true, collection: 'products' },
);

ProductSchema.index({ productStatus: 1, productCategory: 1, productType: 1, createdAt: -1 });

export default ProductSchema;
