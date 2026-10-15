import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import { WebSocket } from 'ws';
import { AuthService } from '../components/auth/auth.service';
import type { AuthenticatedMember } from '../components/auth/auth.service';
import { SkipThrottle } from '@nestjs/throttler';
import type { IncomingMessage } from 'http';
import * as url from 'url';
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
	private logger: Logger = new Logger('SocketEventsGateway'); //Bu serverdagi hodisalarni terminalga chiqarish uchun ishlatiladi.
	private summaryClient: number = 0; //Bu hozir nechta client ulanganini saqlaydi.
	private clientAuthMap = new Map<WebSocket, AuthenticatedMember | null>();
	private messagesList: MessagePayload[] = [];

	constructor(private authServer: AuthService) {}

	@WebSocketServer()
	server: Server;
	public afterInit() {
		//afterInit() WebSocket server tayyor bo‘lganda bir marta ishlaydi.
		this.logger.verbose(`WebSocket Server Initialized & total [${this.summaryClient}]`);
	}

	private async retrievAuth(req: IncomingMessage): Promise<AuthenticatedMember | null> {
		try {
			const parseUrl = url.parse(req.url ?? '/', true);
			const { token } = parseUrl.query;
			if (typeof token !== 'string') return null;
			return await this.authServer.verifyToken(token);
		} catch {
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: IncomingMessage) {
		//Bu metod yangi client ulanganda avtomatik ishlaydi.
		const authMember = await this.retrievAuth(req);
		this.summaryClient++;
		this.clientAuthMap.set(client, authMember);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}] & total [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: authMember,
			action: 'Joined',
		};

		this.emitMessage(infoMsg); //bu ma’lumot barcha ochiq clientlarga yuboriladi.
		client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList }));
	}

	public handleDisconnect(client: WebSocket) {
		//Bu metod client serverdan uzilganda avtomatik ishlaydi.
		const authMember = this.clientAuthMap.get(client);
		this.summaryClient--;
		this.clientAuthMap.delete(client);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}] & total [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: authMember,
			action: 'left',
		};
		this.broadcastMessage(client, infoMsg);
	}

	@SubscribeMessage('message')
	public handleMessage(client: WebSocket, payload: string): void {
		//Bu metod client yuborgan chat xabarini qabul qiladi.
		const authMember = this.clientAuthMap.get(client);
		const newMessage: MessagePayload = { event: 'message', text: payload, memberData: authMember };

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`NEW MESSAGE [${clientNick}]: ${payload}`);

		this.messagesList.push(newMessage);
		this.emitMessage(newMessage);
		if (this.messagesList.length > 5) this.messagesList.splice(0, this.messagesList.length - 5);
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
