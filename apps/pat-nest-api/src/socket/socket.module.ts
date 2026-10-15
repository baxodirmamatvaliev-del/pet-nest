import { Module } from '@nestjs/common';
import { AuthModule } from '../components/auth/auth.module';
import { NotificationGateway } from './notification.gateway';
import { SocketGateway } from './socket.gateway';

@Module({
	// Chat va bildirishnoma ulanishlaridagi JWTni tekshirish uchun AuthService olamiz.
	imports: [AuthModule],
	// SocketGateway chatni, NotificationGateway esa shaxsiy bildirishnomalarni boshqaradi.
	providers: [SocketGateway, NotificationGateway],
	// NotificationService bildirishnoma yuborishi uchun shu xizmatni tashqariga beramiz.
	exports: [NotificationGateway],
})
export class SocketModule {}
