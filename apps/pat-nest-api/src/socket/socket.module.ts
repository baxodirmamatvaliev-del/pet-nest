import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { NotificationGateway } from './notification.gateway';
import { AuthModule } from '../components/auth/auth.module';

@Module({
	// Chat va bildirishnoma ulanishlaridagi JWTni tekshirish uchun AuthService olamiz.
	imports: [AuthModule],
	// SocketGateway chatni, NotificationGateway esa shaxsiy bildirishnomalarni boshqaradi.
	providers: [SocketGateway, NotificationGateway],
	// NotificationService bildirishnoma yuborishi uchun shu xizmatni tashqariga beramiz.
	exports: [NotificationGateway],
})
export class SocketModule {}
