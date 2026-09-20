import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartItem } from '../../libs/dto/cart/cart';
import { AddToCartInput, RemoveCartItemInput, UpdateCartItemInput } from '../../libs/dto/cart/cart.input';
import { Product } from '../../libs/dto/product/product';
import { Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { StoredCart } from '../../libs/types/cart';
import { shapeIntoMongoObjectId } from '../../libs/types/config';

@Injectable()
export class CartService {
  constructor(
    @InjectModel('Cart') private readonly cartModel: Model<StoredCart>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
  ) {}

  public async addToCart(memberId: Types.ObjectId, input: AddToCartInput): Promise<Cart> {
    const productId = shapeIntoMongoObjectId(input.productId);
    const product = await this.productModel.findOne({
      _id: productId,
      productStatus: ProductStatus.ACTIVE,
    }).exec();
    if (!product) throw new BadRequestException(Message.NO_DATA_FOUND);

    const variant = product.productVariants.find((item) => item.sku === input.sku);
    if (!variant) throw new BadRequestException(Message.NO_DATA_FOUND);

    let cart = await this.cartModel.findOne({ memberId }).exec();
    if (!cart) {
      cart = new this.cartModel({ memberId, cartItems: [] });
    }

    const cartItem = cart.cartItems.find(
      (item) => item.productId.equals(productId) && item.sku === input.sku,
    );

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
    } catch (err) {
      console.log('Error! CartService.addToCart', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }

    return await this.getMyCart(memberId);
  }

  public async getMyCart(memberId: Types.ObjectId): Promise<Cart> {
    const cart = await this.cartModel.findOne({ memberId }).lean().exec();
    if (!cart?.cartItems.length) {
      return { memberId, cartItems: [], totalQuantity: 0, totalAmount: 0 };
    }

    const products = await this.productModel.find({
      _id: { $in: cart.cartItems.map((item) => item.productId) },
      productStatus: ProductStatus.ACTIVE,
    }).lean().exec();
    const cartItems: CartItem[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of cart.cartItems) {
      const product = products.find(
        (entry) => entry._id.toString() === item.productId.toString(),
      );
      const variant = product?.productVariants.find((entry) => entry.sku === item.sku);
      const available = Boolean(variant && variant.stock >= item.quantity);
      const unitPrice = variant?.price ?? 0;
      const subtotal = available ? unitPrice * item.quantity : 0;

      cartItems.push({
        productId: item.productId,
        sku: item.sku,
        quantity: item.quantity,
        productData: product ?? null,
        unitPrice,
        subtotal,
        available,
      });

      totalQuantity += item.quantity;
      totalAmount += subtotal;
    }

    return { memberId, cartItems, totalQuantity, totalAmount };
  }

  public async updateCartItem(memberId: Types.ObjectId, input: UpdateCartItemInput): Promise<Cart> {
    const productId = shapeIntoMongoObjectId(input.productId);
    const cart = await this.cartModel.findOne({ memberId }).exec();
    if (!cart) throw new BadRequestException(Message.NO_DATA_FOUND);

    const cartItem = cart.cartItems.find(
      (item) => item.productId.equals(productId) && item.sku === input.sku,
    );
    if (!cartItem) throw new BadRequestException(Message.NO_DATA_FOUND);

    const product = await this.productModel.findOne({
      _id: productId,
      productStatus: ProductStatus.ACTIVE,
    }).exec();
    if (!product) throw new BadRequestException(Message.NO_DATA_FOUND);

    const variant = product.productVariants.find((item) => item.sku === input.sku);
    if (!variant) throw new BadRequestException(Message.NO_DATA_FOUND);
    if (input.quantity > variant.stock) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    cartItem.quantity = input.quantity;
    try {
      await cart.save();
    } catch (err) {
      console.log('Error! CartService.updateCartItem', err.message);
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return await this.getMyCart(memberId);
  }

  public async removeCartItem(memberId: Types.ObjectId, input: RemoveCartItemInput): Promise<Cart> {
    const productId = shapeIntoMongoObjectId(input.productId);
    const cart = await this.cartModel.findOne({ memberId }).exec();
    if (!cart) throw new BadRequestException(Message.NO_DATA_FOUND);

    const itemIndex = cart.cartItems.findIndex(
      (item) => item.productId.equals(productId) && item.sku === input.sku,
    );
    if (itemIndex === -1) throw new BadRequestException(Message.NO_DATA_FOUND);

    cart.cartItems.splice(itemIndex, 1);
    try {
      await cart.save();
    } catch (err) {
      console.log('Error! CartService.removeCartItem', err.message);
      throw new BadRequestException(Message.REMOVE_FAILED);
    }

    return await this.getMyCart(memberId);
  }

  public async clearCart(memberId: Types.ObjectId): Promise<Cart> {
    await this.cartModel.updateOne({ memberId }, { $set: { cartItems: [] } }).exec();
    return await this.getMyCart(memberId);
  }
}
