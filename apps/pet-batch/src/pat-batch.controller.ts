import { Controller, Get, Logger } from '@nestjs/common';
import { Cron, Timeout } from '@nestjs/schedule';
import { PatBatchService } from './pat-batch.service';
import {
	BATCH_ROLLBACK,
	BATCH_TIME_ZONE,
	BATCH_TOP_AGENTS,
	BATCH_TOP_PETS,
	BATCH_TOP_PRODUCTS,
} from './lib/config';


/****************
Scheduled Batch Processing
*****************/ 
@Controller()
export class PatBatchController {
	private readonly logger = new Logger(PatBatchController.name);

	constructor(private readonly patBatchService: PatBatchService) {}

	@Timeout(1000)
	public batchServerReady(): void {
		this.logger.debug('BATCH SERVER READY!');
	}

	@Cron('00 00 01 * * *', { name: BATCH_ROLLBACK, timeZone: BATCH_TIME_ZONE })
	public async batchRollback(): Promise<void> {
		try {
			this.logger.debug(`${BATCH_ROLLBACK} EXECUTED!`);
			await this.patBatchService.batchRollback();
		} catch (err) {
			this.logger.error(BATCH_ROLLBACK, err.stack);
		}
	}

	@Cron('20 00 01 * * *', { name: BATCH_TOP_PETS, timeZone: BATCH_TIME_ZONE })
	public async batchTopPets(): Promise<void> {
		try {
			this.logger.debug(`${BATCH_TOP_PETS} EXECUTED!`);
			await this.patBatchService.batchTopPets();
		} catch (err) {
			this.logger.error(BATCH_TOP_PETS, err.stack);
		}
	}

	@Cron('40 00 01 * * *', { name: BATCH_TOP_AGENTS, timeZone: BATCH_TIME_ZONE })
	public async batchTopAgents(): Promise<void> {
		try {
			this.logger.debug(`${BATCH_TOP_AGENTS} EXECUTED!`);
			await this.patBatchService.batchTopAgents();
		} catch (err) {
			this.logger.error(BATCH_TOP_AGENTS, err.stack);
		}
	}

	@Cron('50 00 01 * * *', { name: BATCH_TOP_PRODUCTS, timeZone: BATCH_TIME_ZONE })
	public async batchTopProducts(): Promise<void> {
		try {
			this.logger.debug(`${BATCH_TOP_PRODUCTS} EXECUTED!`);
			await this.patBatchService.batchTopProducts();
		} catch (err) {
			this.logger.error(BATCH_TOP_PRODUCTS, err.stack);
		}
	}

	@Get()
	getHello(): string {
		return this.patBatchService.getHello();
	}
}
