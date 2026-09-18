import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { LikeModule } from '../like/like.module';
import FollowSchema from '../../schemas/Follow.model';
import { ImageUploadService } from './image-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'Follow', schema: FollowSchema },
    ]),
    AuthModule,
    ViewModule,
    LikeModule,
  ],
  providers: [MemberResolver, MemberService, ImageUploadService],
  exports: [MemberService],
})
export class MemberModule {}
