import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { IMessagesWithPagination, MessageService } from './message.service'
import { IMessageOwner, OwnerParams } from 'common/schemas/Message_owner.schema'
import { CreateMessageDto } from './dto/create-message.dto'
import { PageQueryFilter } from 'common/utils/query.filter'
import { FindByPropertyIdDto } from './dto/find-by-prperty-id.dto'

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

  @Get('/:owner_id')
  async findAll(
    @Param() params: OwnerParams,
    @Query() pageQueryFilter: PageQueryFilter,
  ): Promise<IMessagesWithPagination> {
    this.logger.log({}, 'findAll')

    const owner_id = params.owner_id

    return await this.messageService.findAll(owner_id, pageQueryFilter)
  }

  @Post('find-by-property')
  async findByPropertyId(@Body() findByPropertyIdDto: FindByPropertyIdDto) {
    return await this.messageService.findByPropertyId(findByPropertyIdDto)
  }
}
