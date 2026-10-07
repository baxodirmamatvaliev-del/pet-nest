import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface HealthStatus {
  status: 'ok';
  database: 'connected';
  timestamp: string;
}

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHello(): string {
    return 'salom';
  }

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  isDatabaseConnected(): boolean {
    return this.connection.readyState === 1;
  }
}
