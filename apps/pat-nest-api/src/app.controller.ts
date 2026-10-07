import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    if (!this.appService.isDatabaseConnected()) {
      throw new ServiceUnavailableException('Database is unavailable');
    }

    return this.appService.getHealth();
  }
}
