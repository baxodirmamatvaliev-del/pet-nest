import type { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Server as HttpServer, IncomingMessage } from 'http';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import type { Duplex } from 'stream';
import { AuthService } from '../components/auth/auth.service';
import { corsOriginHandler } from '../libs/config/environment';
import { Notification } from '../libs/dto/notification/notification';

type NotificationEvents = { notification: (notification: Notification) => void };
type NotificationData = { memberId?: string };
type NotificationSocket = Socket<Record<string, never>, NotificationEvents, Record<string, never>, NotificationData>;
type UpgradeListener = (request: IncomingMessage, socket: Duplex, head: Buffer) => void;

// Chat WsAdapterga o'tgani uchun avvalgi Socket.IO bildirishnomalarini alohida boshqaramiz.
@Injectable()
export class NotificationGateway implements OnApplicationBootstrap, OnApplicationShutdown {
	private server: Server<Record<string, never>, NotificationEvents, Record<string, never>, NotificationData>;

	private readonly logger = new Logger(NotificationGateway.name);

	constructor(
		private readonly authService: AuthService,
		private readonly adapterHost: HttpAdapterHost,
	) {}

	// API tayyor bo'lgach, bildirishnoma serverini shu HTTP portiga ulaymiz.
	onApplicationBootstrap(): void {
		const httpServer = this.adapterHost.httpAdapter.getHttpServer() as HttpServer;
		// WsAdapter begona yo'llarni yopadi; /socket.io/ so'rovlarini unga bermaymiz.
		// Shunda chat va bildirishnomalar bitta portda birga ishlaydi.
		for (const listener of httpServer.listeners('upgrade') as UpgradeListener[]) {
			httpServer.off('upgrade', listener);
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
		await this.server.close();
	}

	// JWTni tekshirib, clientni faqat o'z bildirishnomalari keladigan xonaga qo'shamiz.
	// Token yaroqsiz bo'lsa, bildirishnoma ulanishini uzamiz.
	public async handleConnection(client: NotificationSocket): Promise<void> {
		try {
			const token = this.getAccessToken(client);
			const member = await this.authService.verifyToken(token);

			const memberId = member._id.toString();
			client.data.memberId = memberId;
			await client.join(memberId);
			this.logger.log(`${member.memberNick} connected`);
		} catch {
			client.disconnect();
		}
	}

	// Foydalanuvchi bildirishnoma ulanishidan chiqqanini server logiga yozamiz.
	public handleDisconnect(client: NotificationSocket): void {
		if (client.data.memberId) {
			this.logger.log(`${client.data.memberId} disconnected`);
		}
	}

	// Bildirishnomani faqat receiverId egasining ulangan qurilmalariga yuboramiz.
	public sendNotification(receiverId: Types.ObjectId, notification: Notification): void {
		this.server.to(receiverId.toString()).emit('notification', notification);
	}

	// JWTni Socket.IO auth.token yoki Authorization: Bearer sarlavhasidan olamiz.
	private getAccessToken(client: NotificationSocket): string {
		const authToken: unknown = client.handshake.auth?.token;
		if (typeof authToken === 'string') return authToken.replace('Bearer ', '');

		const authorization = client.handshake.headers.authorization;
		if (authorization?.startsWith('Bearer ')) return authorization.split(' ')[1];

		return '';
	}
}
