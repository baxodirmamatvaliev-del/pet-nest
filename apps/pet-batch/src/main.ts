import { NestFactory } from '@nestjs/core';
import { PatBatchModule } from './pat-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(PatBatchModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
