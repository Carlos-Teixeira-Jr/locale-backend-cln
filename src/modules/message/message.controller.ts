import { Body, Controller, Delete, Post } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import {
  IMessagesByOwnerOut,
  IMessagesByPropIdOut,
  MessageService,
} from './message.service'
import { IMessageOwner } from 'common/schemas/Message_owner.schema'
import { CreateMessageDto } from './dto/create-message.dto'
import { FindByPropertyIdDto } from './dto/find-by-prperty-id.dto'
import { GetAllByOwnerIdDto } from './dto/get-all-by-owner-id.dto'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Schema } from 'mongoose'

@ApiTags('messages')
@Controller('message')
export class MessageController {
  constructor(
    @InjectorLoggerService(MessageController.name)
    private readonly logger: LoggerService,
    private readonly messageService: MessageService,
  ) {}

  @Post()
  async createOne(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<IMessageOwner> {
    this.logger.log({}, 'createOne')
    return this.messageService.createOne(createMessageDto)
  }

  @ApiOperation({
    summary: 'Return all the messages related to a specific owner.',
  })
  @Post('find-all-by-ownerId')
  async findAllByOwnerId(
    @Body() getAllByOwnerIdDto: GetAllByOwnerIdDto,
  ): Promise<IMessagesByOwnerOut> {
    this.logger.log({}, 'find all by owner id > [controller]')

    return await this.messageService.findAllByOwnerId(getAllByOwnerIdDto)
  }

  @ApiOperation({
    summary: 'Return all the messages related to a specific property.',
  })
  @Post('find-by-propertyId')
  async findByPropertyId(
    @Body() findByPropertyIdDto: FindByPropertyIdDto,
  ): Promise<IMessagesByPropIdOut> {
    this.logger.log(
      { findByPropertyIdDto },
      'start find messages by property id > [controller]',
    )
    return await this.messageService.findByPropertyId(findByPropertyIdDto)
  }

  @ApiOperation({
    summary:
      'Update the isRead property of an array of messages passed in the body of the requisition indicating that the user already seed these messages.',
  })
  @Post('update-messages')
  async updateMessages(
    @Body() updateMessagesDto: IMessageOwner[],
  ): Promise<{ success: boolean }> {
    this.logger.log(
      { updateMessagesDto },
      'start update messages > [cotroller]',
    )

    return await this.messageService.updateMessages(updateMessagesDto)
  }

  @Delete()
  async deleteMessageById(
    @Body() messageId: Schema.Types.ObjectId,
  ): Promise<{ success: boolean }> {
    this.logger.log({ messageId }, 'start delete message by id > [cotroller]')
    return this.messageService.deleteMessageById(messageId)
  }
}
