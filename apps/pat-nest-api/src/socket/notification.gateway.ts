import { Injectable, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Server as HttpServer } from 'http';
import type { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../components/auth/auth.service';
import { Notification } from '../libs/dto/notification/notification';
import { corsOriginHandler } from '../libs/config/environment';

// Chat WsAdapterga o'tgani uchun avvalgi Socket.IO bildirishnomalarini alohida boshqaramiz.
@Injectable()
export class NotificationGateway implements OnApplicationBootstrap, OnApplicationShutdown {
  private server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  // API tayyor bo'lgach, bildirishnoma serverini shu HTTP portiga ulaymiz.
  onApplicationBootstrap(): void {
    const httpServer: HttpServer = this.adapterHost.httpAdapter.getHttpServer();
    // WsAdapter begona yo'llarni yopadi; /socket.io/ so'rovlarini unga bermaymiz.
    // Shunda chat va bildirishnomalar bitta portda birga ishlaydi.
    for (const listener of httpServer.listeners('upgrade')) {
      httpServer.off('upgrade', listener as any);
      httpServer.on('upgrade', (request, socket, head) => {
        if (new URL(request.url ?? '/', 'http://localhost').pathname.startsWith('/socket.io/')) return;
        listener.call(httpServer, request, socket, head);
      });
    }
    // Socket.IO uchun loyihada belgilangan frontend manzillariga ruxsat beramiz.
    this.server = new Server(httpServer, {
      cors: { origin: corsOriginHandler, credentials: true },
    });
    // Har yangi ulanishda foydalanuvchini tekshiramiz va uzilishini kuzatamiz.
    this.server.on('connection', (client) => {
      client.on('disconnect', () => this.handleDisconnect(client));
      void this.handleConnection(client);
    });
  }

  // API to'xtaganda bildirishnoma serveri va uning ulanishlarini yopamiz.
  async onApplicationShutdown(): Promise<void> {
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  // JWTni tekshirib, clientni faqat o'z bildirishnomalari keladigan xonaga qo'shamiz.
  // Token yaroqsiz bo'lsa, bildirishnoma ulanishini uzamiz.
  public async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.getAccessToken(client);
      const member = await this.authService.verifyToken(token);

      client.data.memberId = member._id.toString();
      await client.join(client.data.memberId);
      this.logger.log(`${member.memberNick} connected`);
    } catch {
      client.disconnect();
    }
  }

  // Foydalanuvchi bildirishnoma ulanishidan chiqqanini server logiga yozamiz.
  public handleDisconnect(client: Socket): void {
    if (client.data.memberId) {
      this.logger.log(`${client.data.memberId} disconnected`);
    }
  }

  // Bildirishnomani faqat receiverId egasining ulangan qurilmalariga yuboramiz.
  public sendNotification(
    receiverId: Types.ObjectId,
    notification: Notification,
  ): void {
    this.server.to(receiverId.toString()).emit('notification', notification);
  }

  // JWTni Socket.IO auth.token yoki Authorization: Bearer sarlavhasidan olamiz.
  private getAccessToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string') return authToken.replace('Bearer ', '');

    const authorization = client.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) return authorization.split(' ')[1];

    return '';
  }
}
