import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import {
  MessageOwnerModelName,
  MessageOwnerSchema,
} from 'common/schemas/Message_owner.schema'
import { MessageController } from './message.controller'
import { MessageService } from './message.service'
import { OwnerModelName, OwnerSchema } from 'common/schemas/Owner.schema'
import {
  PropertyModelName,
  PropertySchema,
} from 'common/schemas/Property.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MessageOwnerModelName,
        schema: MessageOwnerSchema,
      },
      {
        name: OwnerModelName,
        schema: OwnerSchema,
      },
      {
        name: PropertyModelName,
        schema: PropertySchema,
      },
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
