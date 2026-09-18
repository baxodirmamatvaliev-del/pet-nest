import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from '../../libs/dto/product/product';
import { ProductInput } from '../../libs/dto/product/product.input';
import { Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';

@Injectable()
export class ProductService {
  constructor(@InjectModel('Product') private readonly productModel: Model<Product>) {}

  public async createProduct(input: ProductInput): Promise<Product> {
    try {
      return await this.productModel.create(input);
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
}
