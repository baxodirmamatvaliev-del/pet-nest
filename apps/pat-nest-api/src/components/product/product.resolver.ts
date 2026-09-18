import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Product, Products } from '../../libs/dto/product/product';
import { AdminProductsInquiry, MyProductsInquiry, ProductInput, ProductsInquiry } from '../../libs/dto/product/product.input';
import { ProductUpdateInput } from '../../libs/dto/product/product.update';
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
  @UseGuards(WithoutGuard)
  @Query(() => Products)
  public async getProducts(@Args('input') input: ProductsInquiry): Promise<Products> {
    console.log('Query: getProducts');
    return await this.productService.getProducts(input);
  }

  // AGENT yoki ADMIN o‘zi yaratgan mahsulotlarni, jumladan yashirilganlarini ham ko‘radi.
  @Roles(MemberType.ADMIN, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => Products)
  public async getMyProducts(
    @Args('input') input: MyProductsInquiry,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Products> {
    console.log('Query: getMyProducts');
    return await this.productService.getMyProducts(memberId, input);
  }
 // mahsulot egasi nom, rasm, variantlar va holatni o‘zgartiradi. Boshqa AGENT uning mahsulotini tahrirlay olmaydi.
  @Roles(MemberType.ADMIN, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Product)
  public async updateProduct(
    @Args('input') input: ProductUpdateInput,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Product> {
    console.log('Mutation: updateProduct');
    return await this.productService.updateProduct(memberId, input);
  }
 
  //AGENT yoki ADMIN faqat o‘zi yaratgan mahsulotni olib tashlaydi. Yozuv bazada DELETE holatida saqlanadi va katalogda ko‘rinmaydi.
  @Roles(MemberType.ADMIN, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Product)
  public async removeProduct(
    @Args('productId') input: string,
    @AuthMember('_id') memberId: Types.ObjectId,
  ): Promise<Product> {
    console.log('Mutation: removeProduct');
    const productId = shapeIntoMongoObjectId(input);
    return await this.productService.removeProduct(memberId, productId);
  }
  // (ADMIN NAZORAT) ADMIN barcha holatdagi mahsulotlarni, jumladan o‘chirilganlarini ham, filtr va sahifalash bilan ko‘radi.
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Products)
  public async getAllProductsByAdmin(@Args('input') input: AdminProductsInquiry): Promise<Products> {
    console.log('Query: getAllProductsByAdmin');
    return await this.productService.getAllProductsByAdmin(input);
  }

  // ADMIN istalgan egasining mahsulotini tahrirlay oladi, holatini ACTIVE, HIDDEN yoki DELETEga o‘zgartira oladi.
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Product)
  public async updateProductByAdmin(@Args('input') input: ProductUpdateInput): Promise<Product> {
    console.log('Mutation: updateProductByAdmin');
    return await this.productService.updateProductByAdmin(input);
  }
}
