import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import { static as serveStatic } from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalInterceptors(new LoggingInterceptor()); //MDLV
  app.enableCors({origin: true, credentials: true}) // CORS
  app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
  app.use('/uploads', serveStatic(join(process.cwd(), 'uploads')));



  await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
