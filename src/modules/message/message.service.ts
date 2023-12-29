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

export interface IMessagesByPropIdOut {
  messages: {
    messagesDocs: IMessageOwner[]
    count: number
    totalPages: number
  }
  property: IProperty
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

      if (!owner || !owner.isActive) {
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
      const limit = 6
      const skip = (page - 1) * limit

      const foundOwner = await this.ownerModel.findById(ownerId)

      if (!foundOwner || !foundOwner.isActive) {
        throw new NotFoundException(`O proprietário não foi encontrado.`)
      }

      const docs: IMessageOwner[] = await this.messageModel
        .find({ ownerId: ownerId })
        .lean()

      const uniquePropertyIds: string[] = []

      docs.forEach(doc => {
        const stringId = String(doc.propertyId)

        if (!uniquePropertyIds.includes(stringId)) {
          uniquePropertyIds.push(stringId)
        }
      })

      // Consultar a coleção 'properties' para encontrar os documentos correspondentes aos propertyId
      const properties = await this.propertyModel
        .find({
          _id: { $in: uniquePropertyIds },
          isActive: true,
        })
        .skip(skip)
        .limit(limit)
        .exec()

      const count = uniquePropertyIds.length
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
  ): Promise<IMessagesByPropIdOut> {
    try {
      this.logger.log(
        { findByPropertyIdDto },
        'start find-messages-by-property-id',
      )

      const { propertyId, page } = findByPropertyIdDto
      const limit = 2
      const skip = (page - 1) * limit

      const property: IProperty = await this.propertyModel.findById(propertyId)

      if (!property || !property.isActive) {
        throw new NotFoundException(
          `Nenhum imóvel encontrado para o id: ${propertyId}.`,
        )
      }

      const messagesDocs = await this.messageModel
        .find({ propertyId: propertyId })
        .skip(skip)
        .limit(limit)

      const count = await this.messageModel.countDocuments({
        propertyId,
      })

      const totalPages = Math.ceil(count / limit)

      const messages = {
        messagesDocs,
        count,
        totalPages,
      }

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
