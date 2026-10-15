import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { GraphqlThrottlerGuard } from './libs/guards/graphql-throttler.guard';
import { SocketModule } from './socket/socket.module';

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
