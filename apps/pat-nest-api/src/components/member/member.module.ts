import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';
import { MongooseModule } from '@nestjs/mongoose'
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
  AuthModule,
  MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema,}])
  ],
  providers: [MemberResolver, MemberService],
  exports: [MemberService]
})
export class MemberModule {}
