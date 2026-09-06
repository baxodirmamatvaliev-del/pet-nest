import { Test, TestingModule } from '@nestjs/testing';
import { PatBatchController } from './pat-batch.controller';
import { PatBatchService } from './pat-batch.service';

describe('PatBatchController', () => {
  let patBatchController: PatBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PatBatchController],
      providers: [PatBatchService],
    }).compile();

    patBatchController = app.get<PatBatchController>(PatBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(patBatchController.getHello()).toBe('Hello World!');
    });
  });
});
