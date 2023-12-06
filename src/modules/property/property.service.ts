import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { InjectModel } from '@nestjs/mongoose'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
import mongoose, { Model } from 'mongoose'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { CreatePropertyDto } from './dto/create-property.dto'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { LocationModelName, ILocation } from 'common/schemas/Location.schema'
import {
  IPropertyType,
  PropertyTypeModelName,
} from 'common/schemas/PropertyType.schema'
import { GetPropertiesByOwnerDto } from './dto/getPropertiesByOwner.dto'
import { HighlightPropertyDto } from './dto/highlight-property.dto'
import { PropertyActivationDto } from './dto/property-activation.dto'
import { EditPropertyDto } from './dto/edit-property.dto'
import {
  IMessageOwner,
  MessageOwnerModelName,
} from 'common/schemas/Message_owner.schema'
import { IUser, UserModelName } from 'common/schemas/User.schema'
import { IPlan, PlanModelName } from 'common/schemas/Plan.schema'
import { generateRandomString } from 'common/utils/generateRandomPassword'
import { sendAutoGeneratedPasswordEmail } from 'common/utils/emailHandler'
import { AuthService } from 'modules/auth/auth.service'
import { SendAutoGeneratedPasswordDto } from 'common/utils/dto/send-auto-generated-password.dto'
import { TagModelName, ITag } from 'common/schemas/Tag.schema'

export interface IDocsWithPagination {
  docs: IProperty[]
  totalPages: number
  page: number
  count?: number
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

export interface IFindByCodeReturn {
  docs: IProperty[]
}

interface IOwnerData {
  name: string
  phone: string
  cellPhone: string
  plan: any
  userId: any
  adCredits?: number
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
    @InjectModel(PlanModelName)
    private readonly planModel: Model<IPlan>,
    @InjectModel(LocationModelName)
    private readonly locationModel: Model<ILocation>,
    @InjectModel(PropertyTypeModelName)
    private readonly propertyTypeModel: Model<IPropertyType>,
    @InjectModel(MessageOwnerModelName)
    private readonly messageModel: Model<IMessageOwner>,
    @InjectModel(TagModelName)
    private readonly tagModel: Model<ITag>,
    private readonly authService: AuthService,
  ) {}

  async findOne(id: string, isEdit: boolean): Promise<IProperty> {
    try {
      this.logger.log({}, 'start findOne')

      const property: IProperty = await this.propertyModel.findById(id).lean()

      if (!property || !property.isActive) {
        throw new NotFoundException(`O id: ${id} não foi encontrado`)
      }

      // Incrementa o número de visualizações do imóvel quando não for página de edição de imóvel;
      if (!isEdit) {
        await this.propertyModel.updateOne(
          { _id: property._id },
          { $inc: { views: 1 } },
        )
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

  async filter(queryFilter: CommonQueryFilter): Promise<IFilterReturn> {
    try {
      this.logger.log({}, 'start filter')

      const { page, limit, filter, sort } = queryFilter
      const originalPage = page + 1
      const highlightsSkip = page * limit

      const allFilters = this.getFilter(filter)

      // Querys $and não aceitam arrays vazios, essa verificação muda o tipo de query caso o array allFilters esteja vazio;
      const filtersOrNot =
        allFilters.length > 1
          ? { $and: [...allFilters] }
          : { highlighted: false }

      let highlightsFilters
      const index = allFilters.findIndex(obj => obj.highlighted === false)
      if (index !== -1) {
        //Deep cloning foi necessário pois o spread fazia com que o allFilters original também fosse alterado;
        const clonedAllFilters = JSON.parse(JSON.stringify(allFilters))
        clonedAllFilters[index].highlighted = true
        highlightsFilters = clonedAllFilters
      }

      const countHighlights = await this.propertyModel.countDocuments({
        $and: highlightsFilters,
        highlighted: true,
      })

      // Busca os destaques considerando a ordenação
      const highlights: IProperty[] = await this.propertyModel
        .find({ $and: highlightsFilters })
        .skip(highlightsSkip)
        .sort(sort[0])
        .limit(limit)
        .lean()

      const countDocs = await this.propertyModel.countDocuments(filtersOrNot)

      const propertySkipAux = (page + 1) * limit - countHighlights
      const propertyLimit = limit - highlights.length
      const propertySkip = propertyLimit === limit ? propertySkipAux - limit : 0

      // Busca os anúncios comuns segundo a filtragem estabelecida;
      let docs: IProperty[] = []

      if (propertyLimit > 0) {
        docs = await this.propertyModel
          .find(filtersOrNot)
          .sort(sort[0])
          .skip(propertySkip)
          .limit(propertyLimit)
          .lean()
      }

      // insere os anúncios em destaque no array de anúncios comuns;
      docs.unshift(...highlights)

      let totalPages

      // Faz a contagem de páginas e total de páginas da busca para lidar com a paginação;
      if (queryFilter.need_count) {
        totalPages = Math.ceil((countDocs + countHighlights) / limit)
      }

      const totalCount = countDocs + countHighlights

      return {
        docs,
        page: originalPage,
        totalPages,
        totalCount,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async createOne(createPropertyDto: CreatePropertyDto): Promise<any> {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    const session = await db.startSession()
    const opt = { session, new: true }
    try {
      await session.startTransaction()
      this.logger.log({}, 'start createOne')

      const { propertyType, address } = createPropertyDto.propertyData

      const { plan, isPlanFree, phone, cellPhone, userData, propertyData } =
        createPropertyDto

      let cardName
      let cardNumber
      let ccv
      let expiry

      if (!isPlanFree) {
        cardName = createPropertyDto.creditCardData.cardName
        cardNumber = createPropertyDto.creditCardData.cardNumber
        ccv = createPropertyDto.creditCardData.ccv
        expiry = createPropertyDto.creditCardData.expiry
      }

      //Verifica se o id do usuário foi passado na requisição (caso tenha criado o imóvel estando logado);
      const userId = userData._id ? userData._id : null
      let userAlreadyExists: boolean
      let user: IUser | null = null
      let owner: IOwner | null = null
      // Busca os dados do plano selecionado;
      const selectedPlan: IPlan = await this.planModel.findById(plan).lean()

      // USER

      if (userId) {
        user = await this.userModel.findById(userId).lean()

        if (!user || !user.isActive) {
          throw new NotFoundException(
            `O usuário com o id : ${userId} não foi encontrado.`,
          )
        }

        //Indica que este usuário já tem cadastro prévio como 'user' no banco de dados;
        userAlreadyExists = true
      } else {
        //Verifica se apesar do usuário não estar logado ao criar o anúncio o email dele já havia sido usado para cadastrar algum 'user' no banco de dados;
        const userEmailExists = await this.userModel.findOne({
          email: userData.email,
          isActive: true,
        })

        if (!userEmailExists) {
          // Gera uma senha provisória aleatória;
          const randomPassword: string = generateRandomString()

          const registerUserParams = {
            email: userData.email,
            password: randomPassword,
            passwordConfirmation: randomPassword,
          }

          const sendPasswordEmailParams: SendAutoGeneratedPasswordDto = {
            email: userData.email,
            username: userData.username,
            password: randomPassword,
          }

          // Cria o usuário no banco de dados;
          const registerUser = await this.authService.register(
            registerUserParams,
          )

          await sendAutoGeneratedPasswordEmail(sendPasswordEmailParams)

          // Use o método updateOne para adicionar a propriedade 'cpf' ao usuário
          await this.userModel.updateOne(
            { _id: registerUser._id },
            {
              cpf: userData.cpf,
              address: userData.address,
              username: userData.username,
            },
            opt,
          )

          // Busca o usuário atualizado
          user = await this.userModel.findById(registerUser._id)
        } else {
          user = userEmailExists
        }
        userAlreadyExists = false
      }

      // OWNER

      // Verifica se o 'user' já é um 'owner';
      const ownerExists: IOwner = await this.ownerModel.findOne({
        userId: user._id,
        isActive: true,
      })

      if (!ownerExists) {
        const ownerData: IOwnerData = {
          name: userData.username,
          phone,
          cellPhone,
          plan,
          userId: user._id,
        }

        if (!isPlanFree) {
          ownerData.adCredits = selectedPlan.commonAd
        }

        const createdOwner: any = await this.ownerModel.create([ownerData], opt)
        owner = createdOwner[0]._doc
      } else {
        owner = ownerExists

        // Atualiza o plano caso tenha sido alterado ao cadastrar o imóvel;
        const ownerPlan = owner.plan

        if (selectedPlan._id !== ownerPlan) {
          owner.plan = selectedPlan._id
          owner.adCredits = selectedPlan.commonAd
          if (selectedPlan.name === 'Locale Plus') {
            // Modificar o schema de owner para salvar o highlightCredit;
            owner.plan = selectedPlan._id
            owner.adCredits = selectedPlan.commonAd
            owner.highlightAd = selectedPlan.highlightAd
          }
          await owner.save()
        }
      }

      // CUSTOMER
      if (!isPlanFree && !owner.customerId) {
        // Cadastrar customer no payment api;
        const response = await fetch(`${process.env.PAYMENT_URL}/customer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            access_token: process.env.ASSAS_API_KEY || '',
          },
          body: JSON.stringify({
            name: owner.name,
            email: userData.email,
            phone,
            postalCode: userData.address.zipCode,
            description: 'Confirmação de criação de id de cliente',
            cpfCnpj: userData.cpf,
            addressNumber: address.streetNumber,
          }),
        })

        if (!response.ok) {
          throw new Error(`Falha ao criar o cliente: ${response.statusText}`)
        }

        const customer = await response.json()

        // Atualiza o 'customerId' no 'owner' e salva no banco de dados
        owner.customerId = customer.id
        await owner.save()
      }

      // PAYMENT

      const paymentValue = null
      let creditCardInfo
      let subscriptionId

      // Validar se tem plano e se há creditos no plano;
      if (!isPlanFree) {
        if (owner.adCredits < 1) {
          throw new BadRequestException(
            `O usuário não tem mais créditos para criar um novo anúncio.`,
          )
        }

        const formattedExpiry = expiry.split('-')
        const expiryYear = formattedExpiry[0]
        const expiryMonth = formattedExpiry[1]

        const currentDate = new Date()
        const year = currentDate.getFullYear()
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
        const day = currentDate.getDate().toString().padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`

        if (!owner.creditCardInfo.creditCardToken) {
          // Chamada pra api de pagamento "subscription";
          const response = await fetch(
            `${process.env.PAYMENT_URL}/payment/subscription`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                access_token: process.env.ASSAS_API_KEY || '',
              },
              body: JSON.stringify({
                billingType: 'CREDIT_CARD',
                cycle: 'MONTHLY',
                customer: owner.customerId,
                value: selectedPlan.price,
                nextDueDate: formattedDate,
                creditCard: {
                  holderName: cardName,
                  number: cardNumber,
                  expiryMonth,
                  expiryYear,
                  ccv: ccv,
                },
                creditCardHolderInfo: {
                  name: cardName,
                  email: userData.email,
                  phone,
                  cpfCnpj: userData.cpf,
                  postalCode: address.zipCode,
                  addressNumber: address.streetNumber,
                },
              }),
            },
          )

          if (!response.ok) {
            throw new Error(`Falha ao gerar a cobrança: ${response.statusText}`)
          }

          const responseData = await response.json()

          creditCardInfo = responseData.creditCard
          subscriptionId = responseData.id

          // Decrementar o número de créditos disponíveis do usuário;
          owner.adCredits = owner.adCredits - 1
          // Salvar o token do cartão de crédito no banco de dados;
          owner.creditCardInfo = creditCardInfo
          owner.subscriptionId = subscriptionId
          await owner.save()
        } else {
          if (owner.adCredits < 1) {
            // Caso em que o usuário não tem mais créditos e selecionou outro plano
            if (selectedPlan._id !== owner.plan) {
              const subscriptionId = owner.subscriptionId
              const response = await fetch(
                `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    access_token: process.env.ASSAS_API_KEY || '',
                  },
                  body: JSON.stringify({
                    billingType: 'CREDIT_CARD',
                    cycle: 'MONTHLY',
                    customer: owner.customerId,
                    value: selectedPlan.price,
                    nextDueDate: formattedDate,
                    creditCardToken: owner.creditCardInfo.creditCardToken,
                  }),
                },
              )

              if (!response.ok) {
                throw new Error(
                  `Falha ao atualizar a assinatura: ${response.statusText}`,
                )
              }
            }
            // Chamada pra api de pagamento "subscription" no caso de o usuário já ter seus dados de cartão salvos no banco;
            const response = await fetch(
              `${process.env.PAYMENT_URL}/payment/subscription`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  access_token: process.env.ASSAS_API_KEY || '',
                },
                body: JSON.stringify({
                  billingType: 'CREDIT_CARD',
                  cycle: 'MONTHLY',
                  customer: owner.customerId,
                  value: selectedPlan.price,
                  nextDueDate: formattedDate,
                  creditCardToken: owner.creditCardInfo.creditCardToken,
                }),
              },
            )

            if (!response.ok) {
              throw new Error(
                `Falha ao gerar a cobrança: ${response.statusText}`,
              )
            }
          }

          // Decrementar o número de créditos disponíveis do usuário;
          owner.adCredits = owner.adCredits - 1
          await owner.save()
        }
      }

      // LOCATION

      // lida com o cadastro da cidade
      const foundCity = await this.locationModel
        .findOne({ name: address.city, category: 'city' })
        .lean()

      if (!foundCity) {
        await this.locationModel.create(
          [
            {
              name: address.city,
              category: 'city',
            },
          ],
          opt,
        )
      }

      // lida com o cadastro do estado
      const foundUf = await this.locationModel
        .findOne({ name: address.uf, category: 'uf' })
        .lean()

      if (!foundUf) {
        await this.locationModel.create(
          [{ name: address.uf, category: 'uf' }],
          opt,
        )
      }

      // lida com o cadastro da rua
      const foundStreetName = await this.locationModel
        .findOne({ name: address.streetName, category: 'streetName' })
        .lean()

      if (!foundStreetName) {
        await this.locationModel.create(
          [
            {
              name: address.streetName,
              category: 'streetName',
            },
          ],
          opt,
        )
      }

      // Lida com o cadastro do bairro
      const foundNeighborhood = await this.locationModel
        .findOne({ name: address.neighborhood, category: 'neighborhood' })
        .lean()

      if (!foundNeighborhood) {
        await this.locationModel.create(
          [
            {
              name: address.neighborhood,
              category: 'neighborhood',
            },
          ],
          opt,
        )
      }

      // PROPERTY TYPE

      // lida com o cadastro do propertyType
      const foundPropertyType = await this.propertyTypeModel
        .findOne({ name: propertyType })
        .lean()

      if (!foundPropertyType) {
        await this.propertyTypeModel.create([{ name: propertyType }], opt)
      }

      // PROPERTY

      propertyData.owner = owner._id

      propertyData.ownerInfo = {
        name: owner.name,
        phones: [phone, cellPhone],
      }

      // TAGS
      if (propertyData.tags) {
        const tagObjects: any = propertyData.tags?.map(tag => ({
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

      // lida com a criação da property no DB
      const createdProperty = await this.propertyModel.create(propertyData)

      await session.commitTransaction()

      return {
        createdProperty,
        creditCardBrand: owner.creditCardInfo
          ? owner.creditCardInfo.creditCardBrand
          : null,
        paymentValue,
        userAlreadyExists,
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

  async findByAnnouncementCode(
    announcementCode: string,
  ): Promise<IFindByCodeReturn> {
    try {
      this.logger.log({}, 'start findByAnnouncementCode')

      const foundAnnouncementCode: IProperty[] = await this.propertyModel
        .find({ announcementCode: announcementCode, isActive: true })
        .exec()

      if (foundAnnouncementCode.length === 0) {
        throw new NotFoundException(
          `O imóvel com o código de anúncio ${announcementCode} não foi encontrado`,
        )
      }

      return { docs: foundAnnouncementCode }
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
      const skip = (page - 1) * 10
      const limit = 10

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

      if (!propertyOwner.highlightAd || propertyOwner.highlightAd <= 0) {
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
        { _id: userId },
        { $set: { adCredits: propertyOwner.adCredits - 1 } },
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

  getFilter(filter: any) {
    //Adiciona cada tipo de filtragem à query;
    const allFilters = []

    filter.forEach(obj => {
      if (obj.adType) {
        allFilters.push({ adType: obj.adType })
      }
      if (obj.adSubtype) {
        allFilters.push({ adSubtype: obj.adSubtype })
      }
      if (obj.propertyType) {
        allFilters.push({
          propertyType: {
            $in: obj.propertyType,
          },
        })
      }
      if (obj.propertySubtype) {
        allFilters.push({ propertySubtype: obj.propertySubtype })
      }
      if (obj.announcementCode) {
        allFilters.push({ announcementCode: obj.announcementCode })
      }
      if (obj.bedroom) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'bedroom',
              amount: { $gte: obj.bedroom },
            },
          },
        })
      }
      if (obj.bathroom) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'bathroom',
              amount: { $gte: obj.bathroom },
            },
          },
        })
      }
      if (obj.parkingSpaces) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'parkingSpaces',
              amount: { $gte: obj.parkingSpaces },
            },
          },
        })
      }
      if (obj.floors) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'floors',
              amount: { $gte: obj.floors },
            },
          },
        })
      }
      if (obj.suites) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'suites',
              amount: { $gte: obj.suites },
            },
          },
        })
      }
      if (obj.minPrice) {
        const formattedMinPrice = parseInt(obj.minPrice)
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'mensal',
              value: {
                $gte: formattedMinPrice,
              },
            },
          },
        })
      }
      if (obj.maxPrice) {
        const formattedMaxPrice = parseInt(obj.maxPrice)
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'mensal',
              value: {
                $lte: formattedMaxPrice,
              },
            },
          },
        })
      }
      if (obj.minCondominium) {
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'condominio',
              value: { $gte: parseInt(obj.minCondominium) },
            },
          },
        })
      }
      if (obj.maxCondominium) {
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'condominio',
              value: { $lte: parseInt(obj.maxCondominium) },
            },
          },
        })
      }
      if (obj.geolocation) {
        allFilters.push({
          geolocation: {
            $geoWithin: {
              $centerSphere: [
                [obj.geolocation.longitude, obj.geolocation.latitude],
                100 / 3963.2,
              ],
            },
          },
        })
      }
      if (obj.tags) {
        allFilters.push({
          tags: {
            $in: obj.tags,
          },
        })
      }
      if (obj.locationFilter && Array.isArray(obj.locationFilter)) {
        const locationFilters = obj.locationFilter
        const orQuery = []
        locationFilters.forEach(filter => {
          const { name, category } = filter
          if (name && category) {
            const query = {
              [`address.${category}`]: { $in: name },
            }
            orQuery.push(query)
          }
        })
        if (orQuery.length > 0) {
          allFilters.push({
            $or: orQuery,
          })
        }
      }
      if (obj.minSize) {
        allFilters.push({
          'size.area': { $gte: obj.minSize },
        })
      }
    })

    allFilters.push({
      highlighted: false,
    })

    allFilters.push({
      isActive: true,
    })

    return allFilters
  }
}
