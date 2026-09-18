import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Product } from '../../libs/dto/product/product';
import { ProductInput } from '../../libs/dto/product/product.input';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ProductService } from './product.service';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  // ADMIN va AGENT mahsulot yaratadi.
  @Roles(MemberType.ADMIN, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Product)
  public async createProduct(@Args('input') input: ProductInput): Promise<Product> {
    console.log('Mutation: createProduct');
    return await this.productService.createProduct(input);
  }

  //faol mahsulotni hamma ko‘ra oladi
  @UseGuards(WithoutGuard)
  @Query(() => Product)
  public async getProduct(@Args('productId') input: string): Promise<Product> {
    console.log('Query: getProduct');
    const productId = shapeIntoMongoObjectId(input);
    return await this.productService.getProduct(productId);
  }
}
