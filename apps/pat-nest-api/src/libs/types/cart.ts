import type { Types } from 'mongoose';

export interface StoredCartItem {
  productId: Types.ObjectId;
  sku: string;
  quantity: number;
}

export interface StoredCart {
  memberId: Types.ObjectId;
  cartItems: StoredCartItem[];
}
