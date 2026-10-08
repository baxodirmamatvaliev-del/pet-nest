import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { static as serveStatic } from 'express';
import { join } from 'path';
import { corsOriginHandler, validateEnvironment } from './libs/config/environment';
import { MAX_IMAGE_FILE_SIZE, MAX_IMAGE_FILES } from './libs/config/image-upload.config';
import type { Express } from 'express';

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
	app.use(graphqlUploadExpress({ maxFileSize: MAX_IMAGE_FILE_SIZE, maxFiles: MAX_IMAGE_FILES }));
	app.use('/uploads', serveStatic(join(process.cwd(), 'uploads')));

	const expressApp = app.getHttpAdapter().getInstance() as Express;
	if (process.env.NODE_ENV === 'production') expressApp.set('trust proxy', 1);
	expressApp.disable('x-powered-by');
	app.enableShutdownHooks();

	await app.listen(Number(process.env.PORT_API ?? 3002));
}
void bootstrap();
