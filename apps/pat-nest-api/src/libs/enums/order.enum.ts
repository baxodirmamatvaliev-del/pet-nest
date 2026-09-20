import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED_TO_CUSTOMER = 'DELIVERED_TO_CUSTOMER',
  CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });
