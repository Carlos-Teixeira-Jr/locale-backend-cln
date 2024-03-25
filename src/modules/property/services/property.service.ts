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
import { LocationModelName, ILocation } from 'common/schemas/Location.schema'
import {
  IPropertyType,
  PropertyTypeModelName,
} from 'common/schemas/PropertyType.schema'
import { GetPropertiesByOwnerDto } from '../dto/getPropertiesByOwner.dto'
import { HighlightPropertyDto } from '../dto/highlight-property.dto'
import { PropertyActivationDto } from '../dto/property-activation.dto'
import { EditPropertyDto } from '../dto/edit-property.dto'
import {
  IMessageOwner,
  MessageOwnerModelName,
} from 'common/schemas/Message_owner.schema'
import { IUser, UserModelName } from 'common/schemas/User.schema'
import { IPlan, PlanModelName } from 'common/schemas/Plan.schema'
import { AuthService } from 'modules/auth/auth.service'
import { TagModelName, ITag } from 'common/schemas/Tag.schema'
import { uploadFile } from 'common/utils/uploadImages'
import { PropertyFilter_Service } from './property-filter.service'
import { CreateProperty_Service } from './create-property.service'

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
    private readonly propertyFilter_Service: PropertyFilter_Service,
    private readonly createProperty_Service: CreateProperty_Service,
  ) {}

  async filter(queryFilter: CommonQueryFilter): Promise<IFilterReturn> {
    return await this.propertyFilter_Service.filter(queryFilter)
  }

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

  // async createOne(createPropertyDto: CreatePropertyDto): Promise<any> {
  //   const mongodbUri = `${process.env.DB_HOST}`
  //   const db = await mongoose.createConnection(mongodbUri).asPromise()
  //   const session = await db.startSession()
  //   const opt = { session, new: true }
  //   try {
  //     await session.startTransaction()
  //     this.logger.log({}, 'start createOne')

  //     const { propertyType, address } = createPropertyDto.propertyData

  //     const { plan, isPlanFree, phone, cellPhone, userData, propertyData } =
  //       createPropertyDto

  //     const { wppNumber } = createPropertyDto.propertyData.ownerInfo

  //     let cardName
  //     let cardNumber
  //     let ccv
  //     let expiry
  //     let cpfCnpj

  //     if (!isPlanFree) {
  //       cardName = createPropertyDto.creditCardData.cardName
  //       cardNumber = createPropertyDto.creditCardData.cardNumber
  //       ccv = createPropertyDto.creditCardData.ccv
  //       expiry = createPropertyDto.creditCardData.expiry
  //       cpfCnpj = createPropertyDto.creditCardData.cpfCnpj
  //     }

  //     //Verifica se o id do usuário foi passado na requisição (caso tenha criado o imóvel estando logado);
  //     const userId = userData._id ? userData._id : null
  //     let userAlreadyExists: boolean
  //     let user: IUser | null = null
  //     let owner: IOwner | null = null
  //     let ownerPreviousPlan
  //     // Busca os dados do plano selecionado;
  //     const selectedPlan: IPlan = await this.planModel.findById(plan).lean()

  //     // USER

  //     if (userId) {
  //       user = await this.userModel.findById(userId).lean()

  //       if (!user || !user.isActive) {
  //         throw new NotFoundException(
  //           `O usuário com o id : ${userId} não foi encontrado.`,
  //         )
  //       }

  //       //Indica que este usuário já tem cadastro prévio como 'user' no banco de dados;
  //       userAlreadyExists = true
  //     } else {
  //       //Verifica se apesar do usuário não estar logado ao criar o anúncio o email dele já havia sido usado para cadastrar algum 'user' no banco de dados;
  //       const userEmailExists = await this.userModel.findOne({
  //         email: userData.email,
  //         isActive: true,
  //       })

  //       if (!userEmailExists) {
  //         // Gera uma senha provisória aleatória;
  //         const randomPassword: string = generateRandomString()

  //         const registerUserParams = {
  //           email: userData.email,
  //           password: randomPassword,
  //           passwordConfirmation: randomPassword,
  //         }

  //         const sendPasswordEmailParams: SendAutoGeneratedPasswordDto = {
  //           email: userData.email,
  //           username: userData.username,
  //           password: randomPassword,
  //         }

  //         // Cria o usuário no banco de dados;
  //         const registerUser = await this.authService.register(
  //           registerUserParams,
  //         )

  //         await sendAutoGeneratedPasswordEmail(sendPasswordEmailParams)

  //         // Use o método updateOne para adicionar a propriedade 'cpf' ao usuário
  //         await this.userModel.updateOne(
  //           { _id: registerUser._id },
  //           {
  //             cpf: userData.cpf,
  //             address: userData.address,
  //             username: userData.username,
  //             email: userData.email,
  //           },
  //           opt,
  //         )

  //         // Busca o usuário atualizado
  //         user = await this.userModel.findById(registerUser._id)
  //       } else {
  //         user = userEmailExists
  //       }
  //       userAlreadyExists = false
  //     }

  //     // OWNER

  //     // Verifica se o 'user' já é um 'owner';
  //     const ownerExists: IOwner = await this.ownerModel.findOne({
  //       userId: user._id,
  //       isActive: true,
  //     })

  //     if (!ownerExists) {
  //       const ownerData: IOwnerData = {
  //         name: userData.username,
  //         phone,
  //         cellPhone,
  //         wppNumber,
  //         plan,
  //         picture: userData.profilePicture,
  //         userId: user._id,
  //         email: userData.email,
  //         adCredits: 0,
  //         highlightCredits: 0,
  //       }

  //       if (!isPlanFree) {
  //         ownerData.adCredits = selectedPlan.commonAd
  //         ownerData.highlightCredits = selectedPlan.highlightAd
  //       }

  //       const createdOwner: any = await this.ownerModel.create([ownerData], opt)
  //       owner = createdOwner[0]
  //     } else {
  //       owner = ownerExists
  //       ownerPreviousPlan = ownerExists.plan

  //       // Atualiza o plano caso tenha sido alterado ao cadastrar o imóvel;
  //       const ownerPlan = owner.plan

  //       if (selectedPlan._id !== ownerPlan) {
  //         owner.plan = selectedPlan._id
  //         owner.adCredits = selectedPlan.commonAd
  //         if (selectedPlan.name === 'Locale Plus') {
  //           // Modificar o schema de owner para salvar o highlightCredit;
  //           owner.plan = selectedPlan._id
  //           owner.adCredits = selectedPlan.commonAd
  //           owner.highlightCredits = selectedPlan.highlightAd
  //         }
  //         await owner.save()
  //       }
  //     }

  //     // CUSTOMER
  //     if (!isPlanFree && !owner.paymentData.customerId) {
  //       // Cadastrar customer no payment api;
  //       const response = await axios.post(
  //         `${process.env.PAYMENT_URL}/customer`,
  //         {
  //           name: owner.name,
  //           email: userData.email,
  //           phone: cellPhone,
  //           postalCode: userData.address.zipCode,
  //           description: 'Confirmação de criação de id de cliente',
  //           cpfCnpj,
  //           addressNumber: address.streetNumber,
  //         },
  //         {
  //           headers: {
  //             'Content-Type': 'application/json',
  //             access_token: process.env.ASAAS_API_KEY || '',
  //           },
  //         },
  //       )

  //       if (response.status >= 200 && response.status < 300) {
  //         const customer = response.data

  //         // Atualiza o 'customerId' no 'owner' e salva no banco de dados
  //         owner.paymentData.customerId = customer.id
  //         owner.paymentData.cpfCnpj = cpfCnpj
  //         await owner.save()
  //       } else {
  //         throw new Error(`Falha ao criar o cliente: ${response.statusText}`)
  //       }
  //     }

  //     // PAYMENT

  //     const paymentValue = null

  //     // Validar se tem plano e se há creditos no plano;
  //     if (!isPlanFree) {
  //       if (owner.adCredits < 1) {
  //         throw new BadRequestException(
  //           `O usuário não tem mais créditos para criar um novo anúncio.`,
  //         )
  //       }

  //       //const formattedExpiry = expiry.split('-')
  //       const expiryYear = `20${expiry[2] + expiry[3]}`
  //       const expiryMonth = `${expiry[0] + expiry[1]}`

  //       const currentDate = new Date()
  //       const year = currentDate.getFullYear()
  //       const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  //       const day = currentDate.getDate().toString().padStart(2, '0')
  //       const formattedDate = `${year}-${month}-${day}`

  //       if (!owner.paymentData.creditCardInfo.creditCardToken) {
  //         const response = await axios.post(
  //           `${process.env.PAYMENT_URL}/payment/subscription`,
  //           {
  //             billingType: 'CREDIT_CARD',
  //             cycle: 'MONTHLY',
  //             customer: owner.paymentData.customerId,
  //             value: selectedPlan.price,
  //             nextDueDate: formattedDate,
  //             creditCard: {
  //               holderName: cardName,
  //               number: cardNumber,
  //               expiryMonth,
  //               expiryYear,
  //               ccv,
  //             },
  //             creditCardHolderInfo: {
  //               name: cardName,
  //               email: userData.email,
  //               phone: cellPhone,
  //               cpfCnpj,
  //               postalCode: userData.address.zipCode,
  //               addressNumber: userData.address.streetNumber,
  //             },
  //           },
  //           {
  //             headers: {
  //               'Content-Type': 'application/json',
  //               access_token: process.env.ASAAS_API_KEY || '',
  //             },
  //           },
  //         )

  //         if (response.status >= 200 && response.status < 300) {
  //           // Se a resposta for bem-sucedida, manipule os dados da resposta
  //           const responseData = response.data

  //           // Atribuir os valores da resposta às variáveis
  //           const creditCardInfo = responseData.creditCard
  //           const subscriptionId = responseData.id

  //           // Decrementar o número de créditos disponíveis do usuário
  //           owner.adCredits = owner.adCredits - 1

  //           // Salvar o token do cartão de crédito no banco de dados
  //           owner.paymentData.creditCardInfo = creditCardInfo
  //           owner.paymentData.subscriptionId = subscriptionId

  //           // Salvar as alterações no banco de dados
  //           await owner.save()
  //         } else {
  //           // Se a resposta não for bem-sucedida, lançar um erro
  //           throw new Error(`Falha ao gerar a cobrança: ${response.statusText}`)
  //         }
  //       } else {
  //         //Buscr a assinatura do usuário para verificar a data de cobrança;
  //         const subscriptionId = owner.paymentData.subscriptionId
  //         const response = await axios.get(
  //           `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
  //           {
  //             headers: {
  //               'Content-Type': 'application/json',
  //               access_token: process.env.ASAAS_API_KEY || '',
  //             },
  //           },
  //         )

  //         if (response.status >= 200 && response.status < 300) {
  //           const subscription = response.data
  //           const nextDueDate = subscription.nextDueDate

  //           if (owner.adCredits < 1) {
  //             // Caso em que o usuário não tem mais créditos e selecionou outro plano
  //             if (selectedPlan._id !== owner.plan) {
  //               const subscriptionId = owner.paymentData.subscriptionId
  //               const response = await axios.post(
  //                 //Atualiza o valor do plano;
  //                 `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
  //                 {
  //                   billingType: 'CREDIT_CARD',
  //                   cycle: 'MONTHLY',
  //                   customer: owner.paymentData.customerId,
  //                   value: selectedPlan.price,
  //                   nextDueDate,
  //                   updatePendingPayments: true,
  //                   creditCardToken:
  //                     owner.paymentData.creditCardInfo.creditCardToken,
  //                 },
  //                 {
  //                   headers: {
  //                     'Content-Type': 'application/json',
  //                     access_token: process.env.ASAAS_API_KEY || '',
  //                   },
  //                 },
  //               )

  //               if (response.status <= 200 && response.status > 300) {
  //                 throw new Error(
  //                   `Falha ao atualizar a assinatura: ${response.statusText}`,
  //                 )
  //               }
  //             }
  //             // Chamada pra api de pagamento "subscription" no caso de o usuário já ter seus dados de cartão salvos no banco;
  //             const response = await axios.post(
  //               `${process.env.PAYMENT_URL}/payment/subscription`,
  //               {
  //                 billingType: 'CREDIT_CARD',
  //                 cycle: 'MONTHLY',
  //                 customer: owner.paymentData.customerId,
  //                 value: selectedPlan.price,
  //                 nextDueDate: formattedDate,
  //                 creditCardToken:
  //                   owner.paymentData.creditCardInfo.creditCardToken,
  //               },
  //               {
  //                 headers: {
  //                   'Content-Type': 'application/json',
  //                   access_token: process.env.ASAAS_API_KEY || '',
  //                 },
  //               },
  //             )

  //             if (response.status <= 200 && response.status > 300) {
  //               throw new Error(
  //                 `Falha ao gerar a cobrança: ${response.statusText}`,
  //               )
  //             }
  //           } else if (selectedPlan._id !== ownerPreviousPlan) {
  //             //Atualiza o valor do plano
  //             const response = await axios.post(
  //               `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
  //               {
  //                 billingType: 'CREDIT_CARD',
  //                 cycle: 'MONTHLY',
  //                 customer: owner.paymentData.customerId,
  //                 value: selectedPlan.price,
  //                 nextDueDate: formattedDate,
  //                 updatePendingPayments: true,
  //                 creditCard: {
  //                   holderName: cardName,
  //                   number: cardNumber,
  //                   expiryMonth,
  //                   expiryYear,
  //                   ccv,
  //                 },
  //                 creditCardHolderInfo: {
  //                   name: cardName,
  //                   email: userData.email,
  //                   phone: cellPhone,
  //                   cpfCnpj,
  //                   postalCode: address.zipCode,
  //                   addressNumber: address.streetNumber,
  //                 },
  //               },
  //               {
  //                 headers: {
  //                   'Content-Type': 'application/json',
  //                   access_token: process.env.ASAAS_API_KEY || '',
  //                 },
  //               },
  //             )

  //             if (response.status <= 200 && response.status > 300) {
  //               throw new BadRequestException(
  //                 'Não foi possível atualizar a assinatura.',
  //               )
  //             }
  //           }

  //           // Decrementar o número de créditos disponíveis do usuário;
  //           owner.adCredits = owner.adCredits - 1
  //           await owner.save()
  //         } else {
  //           throw new NotFoundException('Assinatura não encontrada.')
  //         }
  //       }
  //     }

  //     // LOCATION

  //     // lida com o cadastro da cidade
  //     const foundCity = await this.locationModel
  //       .findOne({ name: address.city, category: 'city' })
  //       .lean()

  //     if (!foundCity) {
  //       await this.locationModel.create(
  //         [
  //           {
  //             name: address.city,
  //             category: 'city',
  //           },
  //         ],
  //         opt,
  //       )
  //     }

  //     // lida com o cadastro do estado
  //     const foundUf = await this.locationModel
  //       .findOne({ name: address.uf, category: 'uf' })
  //       .lean()

  //     if (!foundUf) {
  //       await this.locationModel.create(
  //         [{ name: address.uf, category: 'uf' }],
  //         opt,
  //       )
  //     }

  //     // lida com o cadastro da rua
  //     const foundStreetName = await this.locationModel
  //       .findOne({ name: address.streetName, category: 'streetName' })
  //       .lean()

  //     if (!foundStreetName) {
  //       await this.locationModel.create(
  //         [
  //           {
  //             name: address.streetName,
  //             category: 'streetName',
  //           },
  //         ],
  //         opt,
  //       )
  //     }

  //     // Lida com o cadastro do bairro
  //     const foundNeighborhood = await this.locationModel
  //       .findOne({ name: address.neighborhood, category: 'neighborhood' })
  //       .lean()

  //     if (!foundNeighborhood) {
  //       await this.locationModel.create(
  //         [
  //           {
  //             name: address.neighborhood,
  //             category: 'neighborhood',
  //           },
  //         ],
  //         opt,
  //       )
  //     }

  //     // PROPERTY TYPE

  //     // lida com o cadastro do propertyType
  //     const foundPropertyType = await this.propertyTypeModel
  //       .findOne({ name: propertyType })
  //       .lean()

  //     if (!foundPropertyType) {
  //       await this.propertyTypeModel.create([{ name: propertyType }], opt)
  //     }

  //     // PROPERTY

  //     propertyData.owner = owner._id

  //     propertyData.ownerInfo = {
  //       name: owner.name,
  //       phones: [phone, cellPhone],
  //       picture: userData.profilePicture,
  //       email: userData.email,
  //       wppNumber: wppNumber,
  //     }

  //     // TAGS
  //     if (propertyData.tags) {
  //       const tagObjects: any = propertyData.tags?.map(tag => ({
  //         updateOne: {
  //           filter: { name: tag },
  //           update: {
  //             $inc: { amount: 1 },
  //           },
  //           upsert: true,
  //         },
  //       }))

  //       await this.tagModel.bulkWrite(tagObjects)
  //     }

  //     // lida com a criação da property no DB
  //     const createdProperty = await this.propertyModel.create(propertyData)

  //     await session.commitTransaction()

  //     return {
  //       createdProperty,
  //       creditCardBrand: owner.paymentData.creditCardInfo
  //         ? owner.paymentData.creditCardInfo.creditCardBrand
  //         : null,
  //       paymentValue,
  //       userAlreadyExists,
  //       user,
  //     }
  //   } catch (error) {
  //     await session.abortTransaction()
  //     this.logger.error({
  //       error: JSON.stringify(error),
  //       exception: '> exception',
  //     })
  //     throw error
  //   } finally {
  //     session.endSession()
  //   }
  // }

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
