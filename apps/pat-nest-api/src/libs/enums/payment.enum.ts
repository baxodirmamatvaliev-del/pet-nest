import { registerEnumType } from '@nestjs/graphql';

export enum PaymentMethod {
  CARD = 'CARD',
  KAKAO_PAY = 'KAKAO_PAY',
}

registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
