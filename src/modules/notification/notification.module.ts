import { Module } from '@nestjs/common'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { MongooseModule } from '@nestjs/mongoose'
import {
  NotificationModelName,
  NotificationSchema,
} from 'common/schemas/Notification.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NotificationModelName,
        schema: NotificationSchema,
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
