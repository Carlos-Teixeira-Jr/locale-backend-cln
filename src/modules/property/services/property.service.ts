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
  incrementViews,
  findActivePropertiesByAnnouncementCode,
  getPropertiesData,
  updatePropertyImages,
} from '../auxiliar/auxiliar-functions.service'
import { findActiveOwner } from 'modules/users/auxiliar/auxiliarFunctions'
import { findOwnerMessages } from 'modules/message/auxiliar/auxiliarFunctions'
import { GetPropertyParams } from '../dto/getProperty.params'

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

  async findOne(
    getPropertiesByOwner: GetPropertyParams,
    propertyId: Schema.Types.ObjectId,
  ): Promise<IProperty> {
    console.log('🚀 ~ PropertyService ~ propertyId:', propertyId)
    try {
      this.logger.log({}, 'start findOne Property > [property service]')

      const { userId, isEdit } = getPropertiesByOwner

      let ownerId

      const userIdString = userId.toString()

      const property: IProperty = await getPropertyById(
        propertyId,
        this.propertyModel,
      )

      if (!property) throw new NotFoundException(`O imóvel não foi encontrado.`)

      const owner = await this.ownerModel.findOne({ userId }).lean()

      if (owner) {
        ownerId = owner._id
      }

      // Verificar se o usuário já acessou este imóvel ou se ele é o owner do imóvel;
      if (
        property.owner !== ownerId &&
        !property.views.some(e => e === userIdString)
      ) {
        await incrementViews(property, userIdString, isEdit, this.propertyModel)
      }

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
      this.logger.log(
        {},
        `start findByAnnouncementCode > [code]: ${announcementCode}`,
      )

      const foundAnnouncementCode =
        await findActivePropertiesByAnnouncementCode(
          announcementCode,
          this.propertyModel,
        )

      if (foundAnnouncementCode.length === 0) {
        throw new NotFoundException(
          `O imóvel com o código de anúncio ${announcementCode} não foi encontrado`,
        )
      }

      return {
        docs: foundAnnouncementCode,
        totalCount: 1,
        totalPages: 1,
        page: 1,
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

      const userIsOwner = await findActiveOwner(ownerId, this.ownerModel)

      const { ownerProperties, count, totalPages } = await getPropertiesData(
        userIsOwner,
        skip,
        limit,
        this.propertyModel,
      )

      const messages = await findOwnerMessages(ownerId, this.messageModel)

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
      this.logger.log(
        { propertyActivationDto },
        'start property activation > [service]',
      )

      const { isActive, propertyId, userId } = propertyActivationDto

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

      // Verifica se algum dos ids passados não é válido;
      if (propertyId.length > 0) {
        propertyId.forEach(async id => {
          const property = await this.propertyModel
            .find({ _id: id, isActive: false })
            .lean()

          if (!property) {
            throw new NotFoundException(
              `Imóvel com o id: ${propertyId} não encontrado.`,
            )
          }
        })
      }

      if (!isActive) {
        await this.propertyModel.updateMany(
          { _id: { $in: propertyId } },
          { $set: { isActive: isActive } },
          opt,
        )
      } else {
        if (!propertyOwner.adCredits || propertyOwner.adCredits <= 0) {
          throw new BadRequestException(
            `O usuário com o id ${userId} não tem mais créditos para ativar esse anúncio.`,
          )
        } else {
          await this.propertyModel.updateMany(
            { _id: { $in: propertyId } },
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

      if (!property) {
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
          `O proprietário ${propertyOwner.name} não possui mais créditos de destaque para destacar este anúncio!`,
        )
      }

      await this.propertyModel.updateOne(
        { _id: propertyId },
        { $set: { highlighted: !property?.highlighted } },
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

      const storedImages = await getPropertyById(propertyId, this.propertyModel)

      const { images } = storedImages

      if (images.length + files.length > 50) {
        throw new BadRequestException(
          `A requisição excede o limite de 50 imagens. Imagens salvas anteriormente: ${images.length} - Imagens adicionadas nesta requisição: ${files.length}.`,
        )
      }

      const uploadedImages = await uploadFile(files, 'images')

      await updatePropertyImages(propertyId, uploadedImages, this.propertyModel)

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
    propertyId: Schema.Types.ObjectId,
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

      console.log('🚀 ~ PropertyService ~ propertyId:', typeof propertyId)

      if (typeof propertyId !== 'object') {
        await this.propertyModel.updateOne(
          { _id: propertyId },
          {
            $set: {
              'ownerInfo.picture': profilePicture,
            },
          },
          { upsert: true },
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

  async filterByOwner(
    queryFilter: CommonQueryFilter,
    ownerId: Schema.Types.ObjectId,
  ): Promise<IFilterReturn> {
    try {
      this.logger.log({ ownerId }, 'start filterByOwner > [property service]')

      const { page, limit, filter, sort, need_count } = queryFilter
      const originalPage = page + 1
      const highlightsSkip = page * limit

      const location = filter[0]?.locationFilter || ''
      const normalizedLocation = this.normalizeText(location)

      const addressQuery = {
        $or: [
          { 'address.zipCode': { $regex: normalizedLocation, $options: 'i' } },
          { 'address.city': { $regex: normalizedLocation, $options: 'i' } },
          { 'address.uf': { $regex: normalizedLocation, $options: 'i' } },
          {
            'address.streetName': { $regex: normalizedLocation, $options: 'i' },
          },
          {
            'address.streetNumber': {
              $regex: normalizedLocation,
              $options: 'i',
            },
          },
          {
            'address.complement': { $regex: normalizedLocation, $options: 'i' },
          },
          {
            'address.neighborhood': {
              $regex: normalizedLocation,
              $options: 'i',
            },
          },
        ],
      }

      const docs = await this.propertyModel
        .find({ $and: [addressQuery, { owner: ownerId }] })
        .skip(highlightsSkip)
        .limit(limit)
        .sort(sort)

      let totalCount = 0
      let totalPages;
      if (need_count) {
        totalCount = await this.propertyModel.countDocuments({
          $and: [addressQuery, { owner: ownerId }],
        })
        totalPages = Math.ceil(totalCount / limit)
      }

      return {
        docs,
        totalCount,
        page: originalPage,
        totalPages
      };
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  // Função de normalização de texto para remover acentos e transformar em minúsculas
  normalizeText(text: string): string {
    return text
      .normalize('NFD') // Normaliza o texto para decompor caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove os sinais diacríticos (acentos)
      .toLowerCase() // Transforma o texto em minúsculas
  }
}
