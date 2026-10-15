import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SocketModule } from './socket/socket.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { GraphqlThrottlerGuard } from './libs/guards/graphql-throttler.guard';
import type { Request, Response } from 'express';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			uploads: false,
			autoSchemaFile: true,
			context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
		}),
		ThrottlerModule.forRoot([
			{
				ttl: 60_000,
				limit: 120,
				blockDuration: 60_000,
			},
		]),
		ComponentsModule,
		DatabaseModule,
		// Live chat va mavjud bildirishnoma xizmatlarini API bilan birga ishga tushiramiz.
		SocketModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		AppResolver,
		{
			provide: APP_GUARD,
			useClass: GraphqlThrottlerGuard,
		},
	],
})
export class AppModule {}
