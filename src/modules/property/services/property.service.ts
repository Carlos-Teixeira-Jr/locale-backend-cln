import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { InjectModel } from '@nestjs/mongoose'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
import mongoose, { Model, Schema } from 'mongoose'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { CreatePropertyDto } from '../dto/create-property.dto'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { GetPropertiesByOwnerDto } from '../dto/getPropertiesByOwner.dto'
import { HighlightPropertyDto } from '../dto/highlight-property.dto'
import { PropertyActivationDto } from '../dto/property-activation.dto'
import { EditPropertyDto } from '../dto/edit-property.dto'
import {
  IMessageOwner,
  MessageOwnerModelName,
} from 'common/schemas/Message_owner.schema'
import { IUser, UserModelName } from 'common/schemas/User.schema'
import { TagModelName, ITag } from 'common/schemas/Tag.schema'
import { uploadFile } from 'common/utils/uploadImages'
import { PropertyFilter_Service } from './property-filter.service'
import { CreateProperty_Service } from './create-property.service'
import {
  getPropertyById,
  validateProperty,
  incrementViews,
} from '../auxiliar/auxiliar-functions.service'

export interface IDocsWithPagination {
  docs: IProperty[]
  totalPages: number
  page: number
  count?: number
}

export interface ICreatePropertyReturn {
  createdProperty: IProperty
  creditCardBrand: string
  paymentValue: string
  userAlreadyExists: boolean
}

export interface IPropertyByAnnouncementCode {
  announcementCode: string
}

export interface IOwnerPropertiesReturn {
  docs: IProperty[]
  messages: IMessageOwner[]
  totalPages: number
  count: number
}

export interface IFilterReturn {
  docs: IProperty[]
  page: number
  totalCount: number
  totalPages: number
}

@Injectable()
export class PropertyService {
  constructor(
    @InjectorLoggerService(PropertyService.name)
    private readonly logger: LoggerService,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
    @InjectModel(OwnerModelName)
    private readonly ownerModel: Model<IOwner>,
    @InjectModel(UserModelName)
    private readonly userModel: Model<IUser>,
    @InjectModel(MessageOwnerModelName)
    private readonly messageModel: Model<IMessageOwner>,
    @InjectModel(TagModelName)
    private readonly tagModel: Model<ITag>,
    private readonly propertyFilter_Service: PropertyFilter_Service,
    private readonly createProperty_Service: CreateProperty_Service,
  ) {}

  async filter(queryFilter: CommonQueryFilter): Promise<IFilterReturn> {
    return await this.propertyFilter_Service.filter(queryFilter)
  }

  async findOne(id: string, isEdit: boolean): Promise<IProperty> {
    try {
      this.logger.log({}, 'start findOne')

      const property: IProperty = await getPropertyById(id, this.propertyModel)

      validateProperty(property)

      await incrementViews(property, isEdit, this.propertyModel)

      return property
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async createOne(createPropertyDto: CreatePropertyDto): Promise<any> {
    return await this.createProperty_Service.createOne(createPropertyDto)
  }

  async findByAnnouncementCode(
    announcementCode: string,
  ): Promise<IFilterReturn> {
    try {
      this.logger.log({}, 'start findByAnnouncementCode')

      const page = 1
      const totalCount = 1
      const totalPages = 1

      const foundAnnouncementCode: IProperty[] = await this.propertyModel
        .find({ announcementCode: announcementCode, isActive: true })
        .exec()

      if (foundAnnouncementCode.length === 0) {
        throw new NotFoundException(
          `O imóvel com o código de anúncio ${announcementCode} não foi encontrado`,
        )
      }

      return {
        docs: foundAnnouncementCode,
        totalCount,
        totalPages,
        page,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findByOwner(
    getPropertiesByOwnerDto: GetPropertiesByOwnerDto,
  ): Promise<IOwnerPropertiesReturn> {
    try {
      this.logger.log({}, 'start find by owner')

      const { ownerId, page } = getPropertiesByOwnerDto
      const limit = 10
      const skip = (page - 1) * limit

      let ownerProperties: IProperty[]
      let count: number
      let totalPages: number

      // Verifica se o userId recebido é um owner;

      const userIsOwner = await this.ownerModel.findById(ownerId)

      if (!userIsOwner || !userIsOwner.isActive) {
        ownerProperties = []
      } else {
        ownerProperties = await this.propertyModel
          .find({ owner: userIsOwner._id })
          .skip(skip)
          .limit(limit)
          .lean()

        count = await this.propertyModel.countDocuments({
          owner: userIsOwner._id,
          isActive: true,
        })
        totalPages = Math.ceil(count / limit)
      }

      const messages: IMessageOwner[] = await this.messageModel
        .find({ owner_id: ownerId })
        .lean()

      return {
        docs: ownerProperties,
        messages,
        totalPages,
        count,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async propertyActivation(propertyActivationDto: PropertyActivationDto) {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    const session = await db.startSession()
    const opt = { session, new: true }

    try {
      await session.startTransaction()
      this.logger.log({ propertyActivationDto }, 'start property activation')

      const { isActive, propertyId, userId } = propertyActivationDto

      const property = await this.propertyModel
        .find({ _id: propertyId, isActive: false })
        .lean()

      if (!property) {
        throw new NotFoundException(
          `Imóvel com o id: ${propertyId} não encontrado.`,
        )
      }

      const propertyOwner = await this.ownerModel
        .findOne({
          userId: userId,
          isActive: true,
        })
        .lean()

      if (!propertyOwner) {
        throw new NotFoundException(
          `O anunciante com o id ${userId} não foi encontrado.`,
        )
      }

      if (!isActive) {
        await this.propertyModel.updateOne(
          { _id: propertyId },
          { $set: { isActive: isActive } },
          opt,
        )
      } else {
        if (!propertyOwner.adCredits || propertyOwner.adCredits <= 0) {
          throw new BadRequestException(
            `O usuário com o id ${userId} não tem mais créditos para ativar esse anúncio.`,
          )
        } else {
          await this.propertyModel.updateOne(
            { _id: propertyId },
            { $set: { isActive: isActive } },
            opt,
          )

          await this.ownerModel.updateOne(
            { userId: userId },
            { $set: { adCredits: propertyOwner.adCredits - 1 } },
            opt,
          )
        }
      }

      await session.commitTransaction()

      return {
        success: true,
        message: 'Propriedade atualizada com sucesso.',
      }
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    } finally {
      session.endSession()
    }
  }

  async highlightProperty(highlightPropertyDto: HighlightPropertyDto) {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    const session = await db.startSession()
    const opt = { session, new: true }
    try {
      await session.startTransaction()
      this.logger.log({ highlightPropertyDto }, 'start highlight property')

      const { propertyId, userId } = highlightPropertyDto

      const property = await this.propertyModel.findById(propertyId).lean()

      if (!property || !property.isActive) {
        throw new NotFoundException(
          `Imóvel com o id ${propertyId} não encontrado.`,
        )
      }

      const propertyOwner = await this.ownerModel
        .findOne({ userId, isActive: true })
        .lean()

      if (!propertyOwner) {
        throw new NotFoundException(
          `O anunciante com o id ${userId} não foi encontrado.`,
        )
      }

      if (
        !propertyOwner.highlightCredits ||
        propertyOwner.highlightCredits <= 0
      ) {
        throw new BadRequestException(
          `O proprietário ${propertyOwner.name} não possúi mais créditos de destaque para destacar este anúncio!`,
        )
      }

      await this.propertyModel.updateOne(
        { _id: propertyId },
        { $set: { highlighted: true } },
        opt,
      )

      await this.ownerModel.updateOne(
        { userId },
        { $set: { highlightCredits: propertyOwner.highlightCredits - 1 } },
        opt,
      )

      await session.commitTransaction()

      return {
        success: true,
        message: 'Anúncio destacado com sucesso.',
      }
    } catch (error) {
      await session.abortTransaction()
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    } finally {
      session.endSession()
    }
  }

  async editProperty(editPropertyDto: EditPropertyDto) {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    const session = await db.startSession()
    const opt = { session, new: true }
    try {
      await session.startTransaction()
      this.logger.log({}, 'start edit-property')

      const {
        id,
        adType,
        adSubtype,
        propertyType,
        propertySubtype,
        address,
        description,
        metadata,
        images,
        size,
        tags,
        condominiumTags,
        prices,
        youtubeLink,
      } = editPropertyDto

      const property = await this.propertyModel.findOne({
        _id: id,
        isActive: true,
      })

      if (!property) {
        throw new NotFoundException(
          `Nenhum imóvel foi encontrado para o id: ${id}`,
        )
      }

      if (tags) {
        const tagObjects: any = tags?.map(tag => ({
          updateOne: {
            filter: { name: tag },
            update: {
              $inc: { amount: 1 },
            },
            upsert: true,
          },
        }))

        await this.tagModel.bulkWrite(tagObjects)
      }

      const updatedProperty = await this.propertyModel.updateOne(
        { _id: id },
        {
          $set: {
            adType,
            adSubtype,
            propertyType,
            propertySubtype,
            address,
            description,
            metadata,
            images,
            size,
            tags,
            condominiumTags,
            prices,
            youtubeLink,
          },
        },
        opt,
      )

      await session.commitTransaction()

      return updatedProperty
    } catch (error) {
      await session.abortTransaction()
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    } finally {
      session.endSession()
    }
  }

  async uploadPropertyImages(
    files: Array<Express.Multer.File>,
    propertyId: Schema.Types.ObjectId,
  ) {
    try {
      this.logger.log({ propertyId }, 'start upload property images')

      const storedImages = await this.propertyModel.findById(propertyId).lean()

      const { images } = storedImages

      if (images.length + files.length > 50) {
        throw new BadRequestException(
          `A requisição excede o limite de 50 imagens. Imagens salvas anteriormente: ${images.length} - Imagens adicionadas nesta requisição: ${files.length}.`,
        )
      }

      const propertyFound = await this.propertyModel.findById(propertyId)

      if (!propertyFound) {
        throw new NotFoundException(
          `O imóvel com o id "${propertyId}" não foi encontrado.`,
        )
      }
      const uploadedImages = await uploadFile(files, 'images')

      await this.propertyModel.updateOne(
        { _id: propertyId },
        { $push: { images: { $each: uploadedImages } } },
      )

      return { success: true }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async editPropertyImages(files: Array<Express.Multer.File>, body: string) {
    try {
      this.logger.log({ body }, 'start upload property images')

      const parsedData = JSON.parse(body)

      const { propertyId, prevImages } = parsedData

      const propertyFound = await this.propertyModel.findById(propertyId)

      if (!propertyFound) {
        throw new NotFoundException(
          `O imóvel com o id "${propertyId}" não foi encontrado.`,
        )
      }

      const uploadedImages = await uploadFile(files, 'images')

      const combinedArrays = [...prevImages, ...uploadedImages]

      await this.propertyModel.updateOne(
        { _id: propertyId },
        { $set: { images: combinedArrays } },
      )

      return { success: true }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async uploadProfileImage(
    files: Array<Express.Multer.File>,
    userId: Schema.Types.ObjectId,
    type: string,
  ) {
    try {
      this.logger.log({ userId }, 'start upload profile image')

      let isUser = null
      let uploadedImages: string | string[]
      let profilePicture: string | string[]
      let userFound
      let ownerFound

      if (type === 'user') {
        isUser = true
      } else if (type === 'owner') {
        isUser = false
      }

      if (files.length > 0) {
        uploadedImages = await uploadFile(files, 'images')
        profilePicture = uploadedImages[0]
      } else {
        uploadedImages = ''
        profilePicture = uploadedImages
      }

      if (isUser !== null && isUser) {
        userFound = await this.userModel.findById(userId)

        if (!userFound) {
          throw new NotFoundException(
            `O usuário com o id "${userId}" não foi encontrado.`,
          )
        }

        await this.userModel.updateOne(
          { _id: userId },
          { $set: { picture: profilePicture } },
        )
      }

      if (isUser !== null && !isUser) {
        ownerFound = await this.ownerModel.find({ userId })

        if (!ownerFound) {
          throw new NotFoundException(`O proprietário não foi encontrado.`)
        }

        await this.ownerModel.updateOne(
          { _id: userId },
          { $set: { picture: profilePicture } },
        )
      }

      return { success: true }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
