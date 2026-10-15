import { Model, Types } from 'mongoose';
import { Product } from '../../libs/dto/product/product';
import { Message } from '../../libs/enums/common.enum';
import { StoredCart } from '../../libs/types/cart';
import { CartService } from './cart.service';

describe('CartService stock and totals', () => {
	const memberId = new Types.ObjectId();
	const productId = new Types.ObjectId();

	it('keeps unavailable items visible but excludes them from the total price', async () => {
		const cart = {
			cartItems: [
				{ productId, sku: 'available', quantity: 2 },
				{ productId, sku: 'sold-out', quantity: 3 },
				{ productId: new Types.ObjectId(), sku: 'deleted', quantity: 1 },
			],
		};
		const product = {
			_id: productId,
			productVariants: [
				{ sku: 'available', stock: 5, price: 10 },
				{ sku: 'sold-out', stock: 1, price: 20 },
			],
		};
		const cartModel = { findOne: jest.fn(() => ({ lean: () => ({ exec: () => Promise.resolve(cart) }) })) };
		const productModel = { find: jest.fn(() => ({ lean: () => ({ exec: () => Promise.resolve([product]) }) })) };
		const service = new CartService(
			cartModel as unknown as Model<StoredCart>,
			productModel as unknown as Model<Product>,
		);

		const result = await service.getMyCart(memberId);

		expect(result.totalQuantity).toBe(6);
		expect(result.totalAmount).toBe(20);
		expect(result.cartItems.map((item) => ({ available: item.available, subtotal: item.subtotal }))).toEqual([
			{ available: true, subtotal: 20 },
			{ available: false, subtotal: 0 },
			{ available: false, subtotal: 0 },
		]);
		expect(result.cartItems[2].productData).toBeNull();
	});

	it('checks the accumulated quantity against stock before saving', async () => {
		const save = jest.fn();
		const cart = { cartItems: [{ productId, sku: 'small', quantity: 4 }], save };
		const product = { productVariants: [{ sku: 'small', stock: 5, price: 10 }] };
		const cartModel = { findOne: jest.fn(() => ({ exec: () => Promise.resolve(cart) })) };
		const productModel = { findOne: jest.fn(() => ({ exec: () => Promise.resolve(product) })) };
		const service = new CartService(
			cartModel as unknown as Model<StoredCart>,
			productModel as unknown as Model<Product>,
		);

		await expect(
			service.addToCart(memberId, { productId: productId.toString(), sku: 'small', quantity: 2 }),
		).rejects.toThrow(Message.NOT_ALLOWED_REQUEST);
		expect(save).not.toHaveBeenCalled();
		expect(cart.cartItems[0].quantity).toBe(4);
	});

	it('returns an empty cart when no cart exists', async () => {
		const cartModel = { findOne: jest.fn(() => ({ lean: () => ({ exec: () => Promise.resolve(null) }) })) };
		const findProducts = jest.fn();
		const service = new CartService(
			cartModel as unknown as Model<StoredCart>,
			{ find: findProducts } as unknown as Model<Product>,
		);

		await expect(service.getMyCart(memberId)).resolves.toEqual({
			memberId,
			cartItems: [],
			totalQuantity: 0,
			totalAmount: 0,
		});
		expect(findProducts).not.toHaveBeenCalled();
	});
});
