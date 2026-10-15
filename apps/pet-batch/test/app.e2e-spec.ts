import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PatBatchModule } from './../src/pat-batch.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { createConnection, Connection } from 'mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_PETS, BATCH_TOP_PRODUCTS } from '../src/lib/config';

// Testlar shaxsiy .env fayliga bog'liq bo'lmasin; ulanish providerini almashtiramiz.
process.env.MONGO_DEV = 'mongodb://127.0.0.1/pet-nest-test-unused';
process.env.SECRET_TOKEN = 'pet-nest-test-secret-only';

describe('PatBatchController (e2e)', () => {
	let app: INestApplication<App>;
	let connection: Connection;

	beforeEach(async () => {
		// Batch modullarini tekshiramiz, haqiqiy bazadagi reytinglarni o'zgartirmaymiz.
		connection = createConnection();
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [PatBatchModule],
		})
			.overrideProvider(getConnectionToken())
			.useValue(connection)
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		for (const job of app.get(SchedulerRegistry).getCronJobs().values()) await job.stop();
	});

	it('/ (GET)', () => {
		return request(app.getHttpServer()).get('/').expect(200).expect('Welcome to PetNest BATCH Server!');
	});

	it('registers all scheduled ranking jobs', () => {
		const jobs = app.get(SchedulerRegistry).getCronJobs();
		expect([...jobs.keys()].sort()).toEqual(
			[BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_PETS, BATCH_TOP_PRODUCTS].sort(),
		);
	});

	afterEach(async () => {
		await app?.close();
		await connection?.close();
	});
});
