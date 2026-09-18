import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, Products } from '../../libs/dto/product/product';
import { MyProductsInquiry, ProductInput, ProductsInquiry } from '../../libs/dto/product/product.input';
import { ProductUpdateInput } from '../../libs/dto/product/product.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { shapeIntoMongoObjectId } from '../../libs/types/config';

@Injectable()
export class ProductService {
  constructor(@InjectModel('Product') private readonly productModel: Model<Product>) {}

  public async createProduct(memberId: Types.ObjectId, input: ProductInput): Promise<Product> {
    try {
      return await this.productModel.create({ ...input, memberId });
    } catch (err) {
      console.log('Error! ProductService.createProduct', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getProduct(productId: Types.ObjectId): Promise<Product> {
    const result = await this.productModel.findOne({
      _id: productId,
      productStatus: ProductStatus.ACTIVE,
    }).exec();

    if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result;
  }

  public async getProducts(input: ProductsInquiry): Promise<Products> {
    const match: Record<string, unknown> = { productStatus: ProductStatus.ACTIVE };
    const { categoryList, typeList, text } = input.search;

    if (categoryList?.length) match.productCategory = { $in: categoryList };
    if (typeList?.length) match.productType = { $in: typeList };
    if (text) {
      const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.productName = new RegExp(escaped, 'i');
    }

    const direction = input.direction ?? Direction.DESC;
    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: direction,
      _id: direction,
    };

    const result = await this.productModel.aggregate<Products>([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0];
  }

  public async getMyProducts(memberId: Types.ObjectId, input: MyProductsInquiry): Promise<Products> {
    const match: Record<string, unknown> = { memberId };
    if (input.search.productStatus) match.productStatus = input.search.productStatus;

    const direction = input.direction ?? Direction.DESC;
    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: direction,
      _id: direction,
    };

    const result = await this.productModel.aggregate<Products>([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0];
  }

  public async updateProduct(memberId: Types.ObjectId, input: ProductUpdateInput): Promise<Product> {
    const { _id, ...changes } = input;
    const productId = shapeIntoMongoObjectId(_id);

    try {
      const result = await this.productModel.findOneAndUpdate(
        { _id: productId, memberId },
        { $set: changes },
        { returnDocument: 'after', runValidators: true },
      ).exec();

      if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
      return result;
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.log('Error! ProductService.updateProduct', err.message);
      throw new BadRequestException(Message.UPDATE_FAILED);
    }
  }
}
