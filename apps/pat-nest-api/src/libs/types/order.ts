import { Order } from '../dto/order/order';

export interface StoredOrder extends Order {
  cartUpdatedAt: Date;
}
