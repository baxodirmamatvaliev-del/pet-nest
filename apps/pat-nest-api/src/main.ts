import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import { static as serveStatic } from 'express';
import { join } from 'path';
import { corsOriginHandler, validateEnvironment } from './libs/config/environment';

async function bootstrap() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor()); //MDLV
  app.enableCors({
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Apollo-Require-Preflight'],
  });
  app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
  app.use('/uploads', serveStatic(join(process.cwd(), 'uploads')));
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();

  await app.listen(Number(process.env.PORT_API ?? 3002));
}
bootstrap();
