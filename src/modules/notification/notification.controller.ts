import { Body, Query, Controller, Get, Param, Post } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import {
  INotificationsWithPagination,
  NotificationService,
} from './notification.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { INotification } from 'common/schemas/Notification.schema'
import { LoggerService } from 'modules/logger/logger.service'
import { PageQueryFilter } from 'common/utils/query.filter'

@Controller('notification')
export class NotificationController {
  constructor(
    @InjectorLoggerService(NotificationController.name)
    private readonly logger: LoggerService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  async createOne(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<INotification> {
    this.logger.log({}, 'createOne')
    return this.notificationService.createOne(createNotificationDto)
  }

  @Get('/user/:id')
  async findOne(@Param('id') params: any): Promise<INotification[]> {
    this.logger.log({}, 'findOne')
    return this.notificationService.findOne(params)
  }

  @Get()
  async findAll(
    @Query() pageQueryFilter: PageQueryFilter,
  ): Promise<INotificationsWithPagination> {
    this.logger.log({}, 'findAll')
    return await this.notificationService.findAll(pageQueryFilter)
  }
}
