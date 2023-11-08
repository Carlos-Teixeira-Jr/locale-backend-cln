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
import { FindByPropertyIdDto } from './dto/find-by-prperty-id.dto'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
import { GetAllByOwnerIdDto } from './dto/get-all-by-owner-id.dto'

export interface IMessagesWithPagination {
  docs: IMessageOwner[]
  properties: IProperty[]
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

      const { ownerId } = createMessageDto

      const owner = await this.ownerModel.findById(ownerId).lean()

      if (!owner) {
        throw new NotFoundException(
          `O proprietário com o id: ${ownerId} não foi encontrado`,
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

  async findAllByOwnerId(
    getAllByOwnerIdDto: GetAllByOwnerIdDto,
  ): Promise<IMessagesWithPagination> {
    try {
      this.logger.log({}, 'start findAll')

      const { page, ownerId } = getAllByOwnerIdDto
      const limit = 10
      const skip = (page - 1) * 10

      const foundOwner = await this.ownerModel.findById(ownerId)

      if (!foundOwner) {
        throw new NotFoundException(`O proprietário não foi encontrado.`)
      }
      const docs: IMessageOwner[] = await this.messageModel
        .find({ ownerId: ownerId })
        .skip(skip)
        .limit(limit)
        .lean()

      // Coletar todos os propertyId únicos dos documentos em docs
      const uniquePropertyIds = Array.from(
        new Set(docs.map(doc => doc.propertyId)),
      )

      // Consultar a coleção 'properties' para encontrar os documentos correspondentes aos propertyId
      const properties = await this.propertyModel.find({
        _id: { $in: uniquePropertyIds },
      })

      const count = await this.messageModel.countDocuments({ ownerId })
      const totalPages = Math.ceil(count / limit)

      return {
        docs,
        properties,
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
  ): Promise<any> {
    try {
      this.logger.log(
        { findByPropertyIdDto },
        'start find-messages-by-property-id',
      )

      const { propertyId } = findByPropertyIdDto

      const property = await this.propertyModel.findById(propertyId).lean()

      if (!property) {
        throw new NotFoundException(
          `Nenhum imóvel encontrado para o id: ${propertyId}.`,
        )
      }

      const messages = await this.messageModel
        .find({ propertyId: propertyId })
        .lean()

      return {
        messages,
        property,
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
