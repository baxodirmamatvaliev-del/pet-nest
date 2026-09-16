import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { WithoutGuard } from './guards/without.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('SECRET_TOKEN');
        if (!secret) throw new Error('SECRET_TOKEN must be configured');
        return { secret, signOptions: { expiresIn: '30d' } };
      },
    }),
  ],
  providers: [AuthService, AuthGuard, RolesGuard, WithoutGuard],
  exports: [AuthService, AuthGuard, RolesGuard, WithoutGuard],
})
export class AuthModule {}
