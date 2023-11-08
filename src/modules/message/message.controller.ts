import { Body, Controller, Post } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { IMessagesWithPagination, MessageService } from './message.service'
import { IMessageOwner } from 'common/schemas/Message_owner.schema'
import { CreateMessageDto } from './dto/create-message.dto'
import { FindByPropertyIdDto } from './dto/find-by-prperty-id.dto'
import { GetAllByOwnerIdDto } from './dto/get-all-by-owner-id.dto'

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

  @Post('find-all-by-ownerId')
  async findAllByOwnerId(
    @Body() getAllByOwnerIdDto: GetAllByOwnerIdDto,
  ): Promise<IMessagesWithPagination> {
    this.logger.log({}, 'findAll')

    return await this.messageService.findAllByOwnerId(getAllByOwnerIdDto)
  }

  @Post('find-by-propertyId')
  async findByPropertyId(@Body() findByPropertyIdDto: FindByPropertyIdDto) {
    return await this.messageService.findByPropertyId(findByPropertyIdDto)
  }
}
