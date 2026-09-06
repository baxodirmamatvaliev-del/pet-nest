import { Module } from '@nestjs/common';
import { PatBatchController } from './pat-batch.controller';
import { PatBatchService } from './pat-batch.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  controllers: [PatBatchController],
  providers: [PatBatchService],
})
export class PatBatchModule {}
