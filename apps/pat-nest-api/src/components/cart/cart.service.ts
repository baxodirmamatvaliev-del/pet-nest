import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartItem } from '../../libs/dto/cart/cart';
import { AddToCartInput, RemoveCartItemInput, UpdateCartItemInput } from '../../libs/dto/cart/cart.input';
import { Product } from '../../libs/dto/product/product';
import { Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { StoredCart, StoredCartItem } from '../../libs/types/cart';
import { toObjectId } from '../../libs/types/config';
import { getErrorMessage } from '../../libs/utils/error.util';

@Injectable()
export class CartService {
	constructor(
		@InjectModel('Cart') private readonly cartModel: Model<StoredCart>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
	) {}

	public async addToCart(memberId: Types.ObjectId, input: AddToCartInput): Promise<Cart> {
		const productId = toObjectId(input.productId);
		const variant = await this.findAvailableVariant(productId, input.sku);

		let cart = await this.cartModel.findOne({ memberId }).exec();
		if (!cart) {
			cart = new this.cartModel({ memberId, cartItems: [] });
		}

		const cartItem = cart.cartItems.find((item) => item.productId.equals(productId) && item.sku === input.sku);

		let quantity = input.quantity;
		if (cartItem) quantity += cartItem.quantity;
		if (quantity > variant.stock) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		if (cartItem) {
			cartItem.quantity = quantity;
		} else {
			cart.cartItems.push({ productId, sku: input.sku, quantity });
		}

		try {
			await cart.save();
		} catch (err: unknown) {
			console.log('Error! CartService.addToCart', getErrorMessage(err));
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		return await this.getMyCart(memberId);
	}

	public async getMyCart(memberId: Types.ObjectId): Promise<Cart> {
		const cart = await this.cartModel.findOne({ memberId }).lean().exec();
		if (!cart?.cartItems.length) {
			return { memberId, cartItems: [], totalQuantity: 0, totalAmount: 0 };
		}

		const products = await this.productModel
			.find({
				_id: { $in: cart.cartItems.map((item) => item.productId) },
				productStatus: ProductStatus.ACTIVE,
			})
			.lean()
			.exec();
		const cartItems = cart.cartItems.map((item) => {
			const product = products.find((entry) => entry._id.toString() === item.productId.toString());
			return this.buildCartItem(item, product);
		});
		const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
		const totalAmount = cartItems.reduce((total, item) => total + item.subtotal, 0);

		return { memberId, cartItems, totalQuantity, totalAmount };
	}

	public async updateCartItem(memberId: Types.ObjectId, input: UpdateCartItemInput): Promise<Cart> {
		const productId = toObjectId(input.productId);
		const cart = await this.cartModel.findOne({ memberId }).exec();
		if (!cart) throw new BadRequestException(Message.NO_DATA_FOUND);

		const cartItem = cart.cartItems.find((item) => item.productId.equals(productId) && item.sku === input.sku);
		if (!cartItem) throw new BadRequestException(Message.NO_DATA_FOUND);

		const variant = await this.findAvailableVariant(productId, input.sku);
		if (input.quantity > variant.stock) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		cartItem.quantity = input.quantity;
		try {
			await cart.save();
		} catch (err: unknown) {
			console.log('Error! CartService.updateCartItem', getErrorMessage(err));
			throw new BadRequestException(Message.UPDATE_FAILED);
		}

		return await this.getMyCart(memberId);
	}

	public async removeCartItem(memberId: Types.ObjectId, input: RemoveCartItemInput): Promise<Cart> {
		const productId = toObjectId(input.productId);
		const cart = await this.cartModel.findOne({ memberId }).exec();
		if (!cart) throw new BadRequestException(Message.NO_DATA_FOUND);

		const itemIndex = cart.cartItems.findIndex((item) => item.productId.equals(productId) && item.sku === input.sku);
		if (itemIndex === -1) throw new BadRequestException(Message.NO_DATA_FOUND);

		cart.cartItems.splice(itemIndex, 1);
		try {
			await cart.save();
		} catch (err: unknown) {
			console.log('Error! CartService.removeCartItem', getErrorMessage(err));
			throw new BadRequestException(Message.REMOVE_FAILED);
		}

		return await this.getMyCart(memberId);
	}

	public async clearCart(memberId: Types.ObjectId): Promise<Cart> {
		await this.cartModel.updateOne({ memberId }, { $set: { cartItems: [] } }).exec();
		return await this.getMyCart(memberId);
	}

	private async findAvailableVariant(
		productId: Types.ObjectId,
		sku: string,
	): Promise<Product['productVariants'][number]> {
		const product = await this.productModel.findOne({ _id: productId, productStatus: ProductStatus.ACTIVE }).exec();
		if (!product) throw new BadRequestException(Message.NO_DATA_FOUND);

		const variant = product.productVariants.find((item) => item.sku === sku);
		if (!variant) throw new BadRequestException(Message.NO_DATA_FOUND);
		return variant;
	}

	// Sotuvda yo'q yoki stok yetmagan mahsulot savatda ko'rinadi, ammo jami narxga qo'shilmaydi.
	private buildCartItem(item: StoredCartItem, product: Product | undefined): CartItem {
		const variant = product?.productVariants.find((entry) => entry.sku === item.sku);
		const available = Boolean(variant && variant.stock >= item.quantity);
		const unitPrice = variant?.price ?? 0;

		return {
			productId: item.productId,
			sku: item.sku,
			quantity: item.quantity,
			productData: product ?? null,
			unitPrice,
			subtotal: available ? unitPrice * item.quantity : 0,
			available,
		};
	}
}
