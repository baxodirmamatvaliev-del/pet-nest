import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, createConnection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Upload oqimini unit testlar tekshiradi; bu yerda ESM scalar o'rniga GraphQL turi beriladi.
jest.mock('graphql-upload/GraphQLUpload.mjs', () => {
	const { GraphQLScalarType } = jest.requireActual<typeof import('graphql')>('graphql');
	return { __esModule: true, default: new GraphQLScalarType({ name: 'Upload', serialize: (value) => value }) };
});

// Testlar shaxsiy .env fayliga bog'liq bo'lmasin; ulanish providerini almashtiramiz.
process.env.MONGO_DEV = 'mongodb://127.0.0.1/pet-nest-test-unused';
process.env.SECRET_TOKEN = 'pet-nest-test-secret-only';

describe('AppController (e2e)', () => {
	let app: INestApplication<App>;
	let connection: Connection;

	beforeEach(async () => {
		// Barcha modullar yuklanadi, lekin haqiqiy bazaga ulanmaymiz va ma'lumot yozmaymiz.
		connection = createConnection();
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(getConnectionToken())
			.useValue(connection)
			.compile();

		app = moduleFixture.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	it('/ (GET)', () => {
		return request(app.getHttpServer()).get('/').expect(200).expect('salom');
	});

	it('/health (GET) returns 503 while the database is disconnected', () => {
		return request(app.getHttpServer()).get('/health').expect(503);
	});

	it('/graphql executes the root query', () => {
		return request(app.getHttpServer())
			.post('/graphql')
			.send({ query: '{ sayHello }' })
			.expect(200)
			.expect(({ body }) => expect(body).toEqual({ data: { sayHello: 'GraphQL API Server' } }));
	});

	it('/graphql rejects a protected query without an access token', () => {
		return request(app.getHttpServer())
			.post('/graphql')
			.send({ query: '{ checkAuth }' })
			.expect(200)
			.expect(({ body }) => {
				expect((body as { errors: unknown[] }).errors).toHaveLength(1);
				expect((body as { data: unknown }).data).toBeNull();
			});
	});

	afterEach(async () => {
		await app?.close();
		await connection?.close();
	});
});
