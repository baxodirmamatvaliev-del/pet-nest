import { ClientSession, Model, Types } from 'mongoose';
import { Order } from '../../libs/dto/order/order';
import { CreateOrderInput } from '../../libs/dto/order/order.input';
import { Product } from '../../libs/dto/product/product';
import { StoredCart } from '../../libs/types/cart';
import { StoredOrder } from '../../libs/types/order';
import { NotificationService } from '../notification/notification.service';
import { OrderService } from './order.service';

describe('OrderService duplicate checkout', () => {
	it('returns an existing order for the same cart snapshot without reducing stock again', async () => {
		const memberId = new Types.ObjectId();
		const existingOrder = { _id: new Types.ObjectId(), memberId, totalAmount: 20 };
		const cart = { cartItems: [{ productId: new Types.ObjectId(), sku: 'small', quantity: 2 }], updatedAt: new Date() };
		const create = jest.fn();
		const orderModel = {
			db: {
				transaction: (callback: (session: ClientSession) => Promise<Order>) => callback({} as ClientSession),
			},
			findOne: () => ({ session: () => ({ exec: () => Promise.resolve(existingOrder) }) }),
			create,
		};
		const cartModel = { findOne: () => ({ session: () => ({ lean: () => ({ exec: () => Promise.resolve(cart) }) }) }) };
		const findProducts = jest.fn();
		const updateStock = jest.fn();
		const service = new OrderService(
			orderModel as unknown as Model<StoredOrder>,
			cartModel as unknown as Model<StoredCart>,
			{ find: findProducts, updateOne: updateStock } as unknown as Model<Product>,
			{} as NotificationService,
		);

		await expect(service.createOrder(memberId, {} as CreateOrderInput)).resolves.toEqual(existingOrder);
		expect(create).not.toHaveBeenCalled();
		expect(findProducts).not.toHaveBeenCalled();
		expect(updateStock).not.toHaveBeenCalled();
	});
});
