import { registerEnumType } from '@nestjs/graphql';

export enum InquiryStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
}

registerEnumType(InquiryStatus, { name: 'InquiryStatus' });
