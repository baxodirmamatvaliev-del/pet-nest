import { Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import * as url from 'url';
import { Server, WebSocket } from 'ws';
import type { AuthenticatedMember } from '../components/auth/auth.service';
import { AuthService } from '../components/auth/auth.service';
interface MessagePayload {
	//frontend ga malumotlarni yuborish va qabul qlish uchun
	event: string; ///event — xabarning turi.
	text: string;
	memberData?: AuthenticatedMember | null;
}

interface InfoPayload {
	// Bu online clientlar soni ni hisoblab boshqa cilientlarga korsatish!
	event: string;
	totalClients: number;
	memberData?: AuthenticatedMember | null;
	action: string;
}
@SkipThrottle()
@WebSocketGateway({ transports: ['websocket'], secure: false }) // transports: ['websocket'] — WebSocket transportidan foydalanishni bildiradi.
export class SocketGateway implements OnGatewayInit {
	private readonly logger: Logger = new Logger('SocketEventsGateway'); //Bu serverdagi hodisalarni terminalga chiqarish uchun ishlatiladi.
	private connectedClientCount: number = 0; //Bu hozir nechta client ulanganini saqlaydi.
	private readonly clientMembers = new Map<WebSocket, AuthenticatedMember | null>();
	private readonly recentMessages: MessagePayload[] = [];
	private readonly historyLimit = 5;

	constructor(private readonly authService: AuthService) {}

	@WebSocketServer()
	server: Server;
	public afterInit() {
		//afterInit() WebSocket server tayyor bo‘lganda bir marta ishlaydi.
		this.logger.verbose(`WebSocket Server Initialized & total [${this.connectedClientCount}]`);
	}

	private async retrieveAuthMember(req: IncomingMessage): Promise<AuthenticatedMember | null> {
		try {
			const parseUrl = url.parse(req.url ?? '/', true);
			const { token } = parseUrl.query;
			if (typeof token !== 'string') return null;
			return await this.authService.verifyToken(token);
		} catch {
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: IncomingMessage) {
		//Bu metod yangi client ulanganda avtomatik ishlaydi.
		const authMember = await this.retrieveAuthMember(req);
		this.connectedClientCount++;
		this.clientMembers.set(client, authMember);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}] & total [${this.connectedClientCount}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.connectedClientCount,
			memberData: authMember,
			action: 'Joined',
		};

		this.emitMessage(infoMsg); //bu ma’lumot barcha ochiq clientlarga yuboriladi.
		client.send(JSON.stringify({ event: 'getMessages', list: this.recentMessages }));
	}

	public handleDisconnect(client: WebSocket) {
		//Bu metod client serverdan uzilganda avtomatik ishlaydi.
		const authMember = this.clientMembers.get(client);
		this.connectedClientCount--;
		this.clientMembers.delete(client);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}] & total [${this.connectedClientCount}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.connectedClientCount,
			memberData: authMember,
			action: 'left',
		};
		this.broadcastMessage(client, infoMsg);
	}

	@SubscribeMessage('message')
	public handleMessage(client: WebSocket, payload: string): void {
		//Bu metod client yuborgan chat xabarini qabul qiladi.
		const authMember = this.clientMembers.get(client);
		const newMessage: MessagePayload = { event: 'message', text: payload, memberData: authMember };

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`NEW MESSAGE [${clientNick}]: ${payload}`);

		this.recentMessages.push(newMessage);
		this.emitMessage(newMessage);
		if (this.recentMessages.length > this.historyLimit)
			this.recentMessages.splice(0, this.recentMessages.length - this.historyLimit);
	}

	private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
		// broadcastMessage() orqali qolgan clientlarga yangilangan son yuboriladi.
		this.server.clients.forEach((client) => {
			if (client !== sender && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	private emitMessage(message: InfoPayload | MessagePayload) {
		//  ulanishda
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}
}

/**
 MESSAGE TARGET:

 (1): client (only client) - faqat oziga korinishi xabar.
 (2): Broadcast (except client) client dan tashqari bolgan
 (3): Emit (all clients) hammaga
**/
