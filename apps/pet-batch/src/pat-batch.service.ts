import { Injectable } from '@nestjs/common';

@Injectable()
export class PatBatchService {
  getHello(): string {
    return 'salom batch!';
  }
}
