import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
  IMessageOwner,
  MessageOwnerModelName,
} from 'common/schemas/Message_owner.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model } from 'mongoose'
import { CreateMessageDto } from './dto/create-message.dto'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { PageQueryFilter } from 'common/utils/query.filter'
import { ObjectId } from 'mongodb'
import { FindByPropertyIdDto } from './dto/find-by-prperty-id.dto'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'

export interface IMessagesWithPagination {
  docs: IMessageOwner[]
  totalPages: number
  page: number
}

@Injectable()
export class MessageService {
  constructor(
    @InjectorLoggerService(MessageService.name)
    private readonly logger: LoggerService,
    @InjectModel(MessageOwnerModelName)
    private readonly messageModel: Model<IMessageOwner>,
    @InjectModel(OwnerModelName)
    private readonly ownerModel: Model<IOwner>,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
  ) {}

  async createOne(createMessageDto: CreateMessageDto): Promise<IMessageOwner> {
    try {
      this.logger.log({}, 'start createOne')

      const { owner_id } = createMessageDto

      const owner = await this.ownerModel.findById(owner_id).lean()

      if (!owner) {
        throw new NotFoundException(
          `O proprietário com o id: ${owner_id} não foi encontrado`,
        )
      }

      const createdMessage = await this.messageModel.create(createMessageDto)

      return createdMessage
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findAll(
    owner_id: string,
    pageQueryFilter: PageQueryFilter,
  ): Promise<IMessagesWithPagination> {
    try {
      this.logger.log({}, 'start findAll')

      const { page, limit } = pageQueryFilter

      const skip = page * limit

      const foundOwner = await this.ownerModel.findById({
        owner_id: new ObjectId(owner_id),
      })

      if (!foundOwner) {
        throw new NotFoundException(
          `O proprietário com o id: ${owner_id} não foi encontrado.`,
        )
      }
      const docs: IMessageOwner[] = await this.messageModel
        .find({ owner_id: new ObjectId(owner_id) })
        .skip(skip)
        .limit(limit)
        .lean()

      const count = await this.messageModel.estimatedDocumentCount({ owner_id })
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

  async findByPropertyId(
    findByPropertyIdDto: FindByPropertyIdDto,
  ): Promise<IMessageOwner[]> {
    try {
      this.logger.log(
        { findByPropertyIdDto },
        'start find-messages-by-property-id',
      )

      const { id } = findByPropertyIdDto

      const property = await this.propertyModel.findById(id)

      if (!property) {
        throw new NotFoundException(
          `Nenhum imóvel encontrado para o id: ${id}.`,
        )
      }

      const messages = []
      const messagesFound = await this.messageModel.find({ propertyId: id })

      if (!messagesFound) {
        return messages
      }

      messages.push(messagesFound)

      return messages
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
