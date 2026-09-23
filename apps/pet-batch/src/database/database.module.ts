import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				const key = process.env.NODE_ENV === 'production' ? 'MONGO_PROD' : 'MONGO_DEV';
				const uri = config.get<string>(key);

				if (!uri) {
					throw new Error(`${key} must be configured before starting the batch server`);
				}

				return { uri };
			},
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {}
