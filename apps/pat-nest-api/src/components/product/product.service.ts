import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Product, Products } from '../../libs/dto/product/product';
import { AdminProductsInquiry, MyProductsInquiry, ProductInput, ProductSearch, ProductsInquiry } from '../../libs/dto/product/product.input';
import { FavoriteInquiry } from '../../libs/dto/like/like.input';
import { OrdinaryInquiry } from '../../libs/dto/pet/pet.input';
import { ProductUpdateInput } from '../../libs/dto/product/product.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupAuthMemberLiked, shapeIntoMongoObjectId } from '../../libs/types/config';
import { LikeService } from '../like/like.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private readonly likeService: LikeService,
    private readonly viewService: ViewService,
  ) {}

  public async createProduct(memberId: Types.ObjectId, input: ProductInput): Promise<Product> {
    try {
      return await this.productModel.create({ ...input, memberId });
    } catch (err) {
      console.log('Error! ProductService.createProduct', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getProduct(memberId: Types.ObjectId | null, productId: Types.ObjectId): Promise<Product> {
    const search = {
      _id: productId,
      productStatus: ProductStatus.ACTIVE,
    };
    const result = await this.productModel.findOne(search).lean().exec();

    if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    if (memberId) {
      const newView = await this.viewService.recordView({ memberId, viewRefId: productId, viewGroup: ViewGroup.PRODUCT });
      if (newView) {
        const updatedProduct = await this.productModel.findOneAndUpdate(
          search,
          { $inc: { productViews: 1 } },
          { returnDocument: 'after' },
        ).exec();
        if (!updatedProduct) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        result.productViews = updatedProduct.productViews;
      }
      result.meLiked = await this.likeService.checkLikeExistence({ memberId, likeRefId: productId, likeGroup: LikeGroup.PRODUCT });
    }
    return result;
  }

  public async getProducts(memberId: Types.ObjectId | null, input: ProductsInquiry): Promise<Products> {
    const match: Record<string, unknown> = { productStatus: ProductStatus.ACTIVE };
    const { categoryList, typeList, text, memberId: targetMemberId } = input.search;

    if (targetMemberId) match.memberId = shapeIntoMongoObjectId(targetMemberId);
    this.applyProductFilters(match, { categoryList, typeList, text });

    return this.findProducts(match, input, [lookupAuthMemberLiked(memberId, '$_id', LikeGroup.PRODUCT)]);
  }

  public async getFavoriteProducts(memberId: Types.ObjectId, input: FavoriteInquiry): Promise<Products> {
    return await this.likeService.getFavoriteProducts(memberId, input);
  }

  public async getVisitedProducts(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Products> {
    return await this.viewService.getVisitedProducts(memberId, input);
  }

  public async likeTargetProduct(memberId: Types.ObjectId, productId: Types.ObjectId): Promise<Product> {
    const target = await this.productModel.findOne({ _id: productId, productStatus: ProductStatus.ACTIVE }).exec();
    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const modifier = await this.likeService.toggleLike({ memberId, likeRefId: productId, likeGroup: LikeGroup.PRODUCT });
    const result = await this.productModel.findOneAndUpdate(
      { _id: productId, productStatus: ProductStatus.ACTIVE },
      { $inc: { productLikes: modifier } },
      { returnDocument: 'after' },
    ).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  public async getMyProducts(memberId: Types.ObjectId, input: MyProductsInquiry): Promise<Products> {
    if (input.search.productStatus === ProductStatus.DELETE) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    const match: Record<string, unknown> = {
      memberId,
      productStatus: { $ne: ProductStatus.DELETE },
    };
    if (input.search.productStatus) match.productStatus = input.search.productStatus;

    return this.findProducts(match, input);
  }

  public async updateProduct(memberId: Types.ObjectId, input: ProductUpdateInput): Promise<Product> {
    const { _id, ...changes } = input;
    const productId = shapeIntoMongoObjectId(_id);
    if (changes.productStatus === ProductStatus.DELETE) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    try {
      const result = await this.productModel.findOneAndUpdate(
        { _id: productId, memberId, productStatus: { $ne: ProductStatus.DELETE } },
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

  public async removeProduct(memberId: Types.ObjectId, productId: Types.ObjectId): Promise<Product> {
    const result = await this.productModel.findOneAndUpdate(
      { _id: productId, memberId, productStatus: { $ne: ProductStatus.DELETE } },
      { $set: { productStatus: ProductStatus.DELETE, deletedAt: new Date() } },
      { returnDocument: 'after' },
    ).exec();

    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }

  public async getAllProductsByAdmin(input: AdminProductsInquiry): Promise<Products> {
    const match: Record<string, unknown> = {};
    const { productStatus, categoryList, typeList, text } = input.search;

    if (productStatus) match.productStatus = productStatus;
    this.applyProductFilters(match, { categoryList, typeList, text });

    return this.findProducts(match, input);
  }

  public async updateProductByAdmin(input: ProductUpdateInput): Promise<Product> {
    const { _id, ...changes } = input;
    const productId = shapeIntoMongoObjectId(_id);
    const update: Record<string, unknown> = { $set: changes };

    if (changes.productStatus === ProductStatus.DELETE) {
      update.$set = { ...changes, deletedAt: new Date() };
    } else if (changes.productStatus === ProductStatus.ACTIVE || changes.productStatus === ProductStatus.HIDDEN) {
      update.$unset = { deletedAt: 1 };
    }

    try {
      const result = await this.productModel.findByIdAndUpdate(
        productId,
        update,
        { returnDocument: 'after', runValidators: true },
      ).exec();

      if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
      return result;
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.log('Error! ProductService.updateProductByAdmin', err.message);
      throw new BadRequestException(Message.UPDATE_FAILED);
    }
  }

  private applyProductFilters(match: Record<string, unknown>, search: ProductSearch): void {
    const { categoryList, typeList, text } = search;
    if (categoryList?.length) match.productCategory = { $in: categoryList };
    if (typeList?.length) match.productType = { $in: typeList };
    if (text) {
      const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.productName = new RegExp(escaped, 'i');
    }
  }

  private async findProducts(
    match: Record<string, unknown>,
    input: ProductsInquiry | MyProductsInquiry | AdminProductsInquiry,
    listStages: PipelineStage.FacetPipelineStage[] = [],
  ): Promise<Products> {
    const direction = input.direction ?? Direction.DESC;
    const result = await this.productModel.aggregate<Products>([
      { $match: match },
      { $sort: { [input.sort ?? 'createdAt']: direction, _id: direction } },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            ...listStages,
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();

    return result[0];
  }
}
