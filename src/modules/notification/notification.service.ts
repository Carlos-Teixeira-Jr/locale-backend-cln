import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
  INotification,
  NotificationModelName,
} from 'common/schemas/Notification.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model } from 'mongoose'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { PageQueryFilter } from 'common/utils/query.filter'
import { DeleteNotificationDto } from 'modules/property/dto/deleteNotification.dto'

export interface INotificationsWithPagination {
  docs: INotification[]
  totalPages: number
  page: number
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectorLoggerService(NotificationService.name)
    private readonly logger: LoggerService,
    @InjectModel(NotificationModelName)
    private readonly notificationModel: Model<INotification>,
  ) {}

  async createOne(
    createNotificationDto: CreateNotificationDto,
  ): Promise<INotification> {
    try {
      this.logger.log({}, 'start createOne')

      const createdNotification = await this.notificationModel.create(
        createNotificationDto,
      )

      return createdNotification
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findOne(id: string, isRead: any): Promise<INotification[]> {
    try {
      this.logger.log({ id }, 'start findOne')

      const notification: INotification[] = await this.notificationModel
        .find({ userId: id })
        .lean()

      if (!notification) {
        throw new NotFoundException(
          `A notificação com o id: ${id} não foi encontrada`,
        )
      }

      if (isRead) {
        await this.notificationModel.updateMany(
          { userId: id, isRead: false },
          { $set: { isRead: true } },
        )
      }

      return notification
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async deleteNotification(_id: DeleteNotificationDto) {
    try {
      await this.notificationModel.deleteOne({ _id })
    } catch (error) {
      console.log(error)
    }
  }

  async findAll(
    pageQueryFilter: PageQueryFilter,
  ): Promise<INotificationsWithPagination> {
    try {
      this.logger.log({}, 'start findAll')

      const { page, limit } = pageQueryFilter
      const skip = page * limit
      const docs: INotification[] = await this.notificationModel
        .find()
        .skip(skip)
        .limit(limit)
        .lean()

      const count = await this.notificationModel.estimatedDocumentCount()
      const totalPages = Math.ceil(count / limit)

      return {
        docs,
        page,
        ...(count && { totalPages }),
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
