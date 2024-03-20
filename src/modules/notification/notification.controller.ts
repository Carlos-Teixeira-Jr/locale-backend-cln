import {
  Body,
  Query,
  Controller,
  Get,
  Param,
  Post,
  Delete,
} from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import {
  INotificationsWithPagination,
  NotificationService,
} from './notification.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { INotification } from 'common/schemas/Notification.schema'
import { LoggerService } from 'modules/logger/logger.service'
import { PageQueryFilter } from 'common/utils/query.filter'
import { DeleteNotificationDto } from 'modules/property/dto/deleteNotification.dto'
import { Schema } from 'mongoose'

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

  @Get(':id')
  async findNotByUserId(
    @Param('id') params: Schema.Types.ObjectId,
  ): Promise<INotification[]> {
    this.logger.log({}, 'findOne')
    return this.notificationService.findNotByUserId(params)
  }

  @Get()
  async findAll(
    @Query() pageQueryFilter: PageQueryFilter,
  ): Promise<INotificationsWithPagination> {
    this.logger.log({}, 'findAll')
    return await this.notificationService.findAll(pageQueryFilter)
  }

  @Post('update-notifications')
  async updateNotifications(@Body() notifications: INotification[]) {
    this.logger.log({}, 'findAll')
    return await this.notificationService.updateNotifications(notifications)
  }

  @Delete()
  async DeleteNotificationDto(
    @Body() deleteNotificationDto: DeleteNotificationDto,
  ) {
    return this.notificationService.deleteNotification(deleteNotificationDto)
  }
}
