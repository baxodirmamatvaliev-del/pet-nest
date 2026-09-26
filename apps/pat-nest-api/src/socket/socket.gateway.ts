import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../components/auth/auth.service';
import { Notification } from '../libs/dto/notification/notification';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(private readonly authService: AuthService) {}

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

  public handleDisconnect(client: Socket): void {
    if (client.data.memberId) {
      this.logger.log(`${client.data.memberId} disconnected`);
    }
  }

  public sendNotification(
    receiverId: Types.ObjectId,
    notification: Notification,
  ): void {
    this.server.to(receiverId.toString()).emit('notification', notification);
  }

  private getAccessToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string') return authToken.replace('Bearer ', '');

    const authorization = client.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) return authorization.split(' ')[1];

    return '';
  }
}
