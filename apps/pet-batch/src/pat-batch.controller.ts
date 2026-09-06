import { Controller, Get } from '@nestjs/common';
import { PatBatchService } from './pat-batch.service';

@Controller()
export class PatBatchController {
  constructor(private readonly patBatchService: PatBatchService) {}

  @Get()
  getHello(): string {
    return this.patBatchService.getHello();
  }
}
