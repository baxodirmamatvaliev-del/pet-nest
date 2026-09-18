import { registerEnumType } from '@nestjs/graphql';

export enum ProductCategory {
  DOG = 'DOG',
  CAT = 'CAT',
}
registerEnumType(ProductCategory, { name: 'ProductCategory' });

export enum ProductType {
  FOOD = 'FOOD',
  TOY = 'TOY',
  BED = 'BED',
  HARNESS = 'HARNESS',
  ACCESSORY = 'ACCESSORY',
  OTHER = 'OTHER',
}
registerEnumType(ProductType, { name: 'ProductType' });

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETE = 'DELETE',
}
registerEnumType(ProductStatus, { name: 'ProductStatus' });
