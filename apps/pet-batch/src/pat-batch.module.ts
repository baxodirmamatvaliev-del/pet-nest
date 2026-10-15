import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import MemberSchema from '../../pat-nest-api/src/schemas/Member.model';
import PetSchema from '../../pat-nest-api/src/schemas/Pet.model';
import ProductSchema from '../../pat-nest-api/src/schemas/Product.model';
import { DatabaseModule } from './database/database.module';
import { PatBatchController } from './pat-batch.controller';
import { PatBatchService } from './pat-batch.service';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Pet', schema: PetSchema },
			{ name: 'Product', schema: ProductSchema },
		]),
	],
	controllers: [PatBatchController],
	providers: [PatBatchService],
})
export class PatBatchModule {}
