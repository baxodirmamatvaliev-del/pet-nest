import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Product, Products } from '../../libs/dto/product/product';
import { ProductInput, ProductsInquiry } from '../../libs/dto/product/product.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Types } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ProductService } from './product.service';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Roles(MemberType.ADMIN, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Product)
  public async createProduct(
    @Args('input') input: ProductInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Product> {
    console.log('Mutation: createProduct');
    return await this.productService.createProduct(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Product)
  public async getProduct(@Args('productId') input: string): Promise<Product> {
    console.log('Query: getProduct');
    const productId = shapeIntoMongoObjectId(input);
    return await this.productService.getProduct(productId);
  }
 //do‘kondagi faol mahsulotlar ro‘yxatini chiqaradi 
  @UseGuards(WithoutGuard)
  @Query(() => Products)
  public async getProducts(@Args('input') input: ProductsInquiry): Promise<Products> {
    console.log('Query: getProducts');
    return await this.productService.getProducts(input);
  }
}
