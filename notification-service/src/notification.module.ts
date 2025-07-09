import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { EmailService } from './services/email.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [NotificationController],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationModule {}
