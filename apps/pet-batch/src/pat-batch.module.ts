import { Module } from '@nestjs/common';
import { PatBatchController } from './pat-batch.controller';
import { PatBatchService } from './pat-batch.service';

@Module({
  imports: [],
  controllers: [PatBatchController],
  providers: [PatBatchService],
})
export class PatBatchModule {}
