// @typescript-eslint/no-unused-vars
import mongoose, { Model, Schema } from 'mongoose'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { IUser, UserModelName } from 'common/schemas/User.schema'
import { GetUserByEmailDto } from './dto/get-user-by-email-dto.sto'
import { GetOwnerByUserId } from './dto/get-owner-by-user-id'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { EditUserDto, OwnerDto, UserDto } from './dto/edit-user.dto'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
import { EditFavouriteDto } from './dto/edit-favourite.dto'
import { GetFavouritesByUserDto } from './dto/favourite-property.dto'
import { EditCreditCardDto } from './dto/editCreditCard.dto'
import * as bcrypt from 'bcrypt'
import { DeleteUserDto } from './dto/delete-user.dto'
import { ITag, TagModelName } from 'common/schemas/Tag.schema'
import { ILocation, LocationModelName } from 'common/schemas/Location.schema'
import axios from 'axios'
import { FindByUsernameDto } from './dto/find-by-username.dto'
import { IPlan, PlanModelName } from 'common/schemas/Plan.schema'
import { CouponModelName, ICoupon } from 'common/schemas/Coupon.schema'

export type FindUserByOwnerOut = {
  owner: IOwner
  user: IUser
}

export type User = {
  userId: number
  username: string
  password: string
}

export type User_Owner = {
  user: IUser
  owner: IOwner
}

export interface IFavPropertiesReturn {
  docs: IProperty[]
  totalPages: number
  count: number
}

export type PartialUserData = {
  _id: Schema.Types.ObjectId
  email: string
  username: string
  picture: string
  address: {
    zipCode: string
    city: string
    uf: string
    streetName: string
    streetNumber: string
    complement: string
    neighborhood: string
  }
}

export type CreditCard = {
  cardNumber: string
  cardName: string
  ccv: string
  expiry: string
  cpfCnpj: string
}

export type CreditCardHolderInfo = {
  name: string
  email: string
  phone: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
}

export type UpdateSubscriptionBody = {
  billingType: string
  cycle: string
  customer: string
  value: number
  nextDueDate: string
  updatePendingPayments: boolean
  creditCardToken?: string
  creditCard?: CreditCard
  creditCardHolderInfo?: CreditCardHolderInfo
}

const paymentUrl = process.env.PAYMENT_URL
@Injectable()
export class UsersService {
  constructor(
    @InjectorLoggerService(UsersService.name)
    private readonly logger: LoggerService,
    @InjectModel(UserModelName)
    private readonly userModel: Model<IUser>,
    @InjectModel(OwnerModelName)
    private readonly ownerModel: Model<IOwner>,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
    @InjectModel(TagModelName)
    private readonly tagModel: Model<ITag>,
    @InjectModel(LocationModelName)
    private readonly locationModel: Model<ILocation>,
    @InjectModel(PlanModelName)
    private readonly planModel: Model<IPlan>,
    @InjectModel(CouponModelName)
    private readonly couponModel: Model<ICoupon>,
  ) {}

  private async startSession() {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    return db.startSession()
  }

  async findOne(_id: Schema.Types.ObjectId): Promise<PartialUserData> {
    try {
      this.logger.log({ _id }, 'start find user by id > [service]')

      const user = await this.userModel.findById(_id)

      if (!user || !user.isActive) {
        throw new NotFoundException(`Usuário com o id: ${_id} não encontrado.`)
      }

      return {
        _id: user._id,
        email: user.email,
        username: user.username,
        picture: user.picture,
        address: user.address,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findOneByUsername(username: FindByUsernameDto): Promise<IUser> {
    try {
      this.logger.log({ username }, 'start find user by username > [service]')

      const user = await this.userModel.findOne({ username: username })

      if (!user || !user.isActive) {
        throw new NotFoundException(`Usuário não foi encontrado`)
      }

      return user
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findOneByEmail(body: GetUserByEmailDto): Promise<IUser> {
    try {
      this.logger.log({ body }, 'findOneByEmail')

      const { email } = body

      const user = await this.userModel.findOne({ email: email })

      if (!user || !user.isActive) {
        throw new NotFoundException(
          `Usuário com o email: ${email} não foi encontrado`,
        )
      }

      return user
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findOwnerByUserId(body: GetOwnerByUserId): Promise<User_Owner> {
    try {
      this.logger.log({ body }, 'find owner by user id')

      const { userId } = body

      const user = await this.userModel
        .findOne({ _id: userId, isActive: true })
        .select('username email address cpf picture phone')

      if (!user) {
        throw new NotFoundException(
          `Usuário com o id: ${userId} não foi encontrado`,
        )
      }

      const owner = await this.ownerModel
        .findOne({ userId, isActive: true })
        .select(
          'adCredits highlightCredits plan phone cellPhone customerId paymentData _id name picture',
        )

      return {
        user,
        owner,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findUserByOwner(
    ownerId: Schema.Types.ObjectId,
  ): Promise<FindUserByOwnerOut> {
    try {
      this.logger.log({}, 'find user by owner')

      const owner = await this.ownerModel.findById(ownerId)

      if (!owner)
        throw new NotFoundException(
          `O proprietário com o id ${ownerId} não foi encontrado.`,
        )

      const { userId } = owner

      const user = await this.userModel.find({
        _id: userId,
        isActive: true,
      })

      const ownerData = {
        owner,
        user: user[0],
      }

      return ownerData
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async editCreditCard(body: EditCreditCardDto): Promise<any> {
    const session = await this.startSession()
    try {
      this.logger.log({}, 'edit credit card')

      session.startTransaction()

      const {
        cardNumber,
        cardName,
        expiry,
        ccv,
        cpfCnpj,
        email,
        phone,
        zipCode,
        streetNumber,
        owner,
        customerId,
        userId,
      } = body

      let creditCardInfo
      let isNewPlan
      let plan
      let ownerData
      let ownerExists

      // Cadastrar os dados do novo cartão de crédito no owner do usuário;
      ownerExists = await this.ownerModel.findById(owner).lean()

      if (!ownerExists || !ownerExists.isActive) {
        ownerData = {
          name: '',
          phone: '',
          cellPhone: phone,
          wwpNumber: '',
          creci: '',
          notifications: [],
          plan: null,
          userId,
          highlightCredits: 0,
          adCredits: 0,
          isActive: true,
          newPlan: true,
          paymentData: {
            cpfCnpj,
          },
        }
      } else {
        ownerData = ownerExists
      }

      // Formatando a data de validade do cartão;
      const expiryMonth = expiry.slice(0, 2)
      const expiryYear = expiry.slice(2)

      // Verificando se o usuário selecionou um novo plano ao mudar os dados do cartão;
      if (body.plan !== undefined) {
        plan = body.plan
        const planData = await this.planModel.findById(plan)
        isNewPlan = ownerData.plan === plan._id
        ownerData.newPlan = plan._id
        plan = planData
      } else {
        isNewPlan = false
        plan = ownerData?.plan !== undefined ? ownerData?.plan : null
      }

      // Gerar o customerId caso o usuário não tenha feito ainda;
      if (!customerId) {
        const response = await axios.post(
          `${process.env.PAYMENT_URL}/customer`,
          {
            name: ownerData?.name ? ownerData.name : cardName,
            email: email,
            phone,
            postalCode: zipCode,
            description: 'Confirmação de criação de id de cliente',
            cpfCnpj,
            addressNumber: streetNumber,
          },
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASSAS_API_KEY || '',
            },
          },
        )

        const customer = response.data

        // Atualiza o 'customerId' no 'owner' e salva no banco de dados
        if (ownerExists) {
          ownerData.paymentData.customerId = customer.id

          ownerExists = ownerData
          await ownerExists.save()
        } else {
          ownerData = {
            ...ownerData,
            paymentData: {
              ...ownerData.paymentData,
              customerId: customer.id,
            },
          }
        }
      }

      //Se o owner já tiver um cartão registrado;
      if (!ownerData?.paymentData?.creditCardInfo?.creditCardToken) {
        // Gerar token dos dados do cartão;
        try {
          const response = await axios.post(
            `${process.env.PAYMENT_URL}/payment/tokenize`,
            {
              customer: customerId
                ? customerId
                : ownerData.paymentData.customerId,
              creditCard: {
                holderName: cardName,
                number: cardNumber,
                expiryMonth,
                expiryYear,
                ccv,
              },
              creditCardHolderInfo: {
                name: cardName,
                email: email,
                phone,
                cpfCnpj,
                postalCode: zipCode,
                addressNumber: streetNumber,
              },
            },
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                access_token: process.env.ASSAS_API_KEY || '',
              },
            },
          )

          const responseData = response.data

          const creditCardInfo = responseData

          // Atualiza os dados do usuário;
          ownerData.isNewCreditCard = true
          ownerData.newPlan = isNewPlan
          ownerData.paymentData.creditCardInfo = creditCardInfo
          ownerData.paymentData.cpfCnpj = cpfCnpj

          if (!ownerExists) {
            await this.ownerModel.create([ownerData], { session })
          } else {
            ownerExists = ownerData
            await ownerExists.save()
          }
        } catch (error) {
          throw new Error('Não foi possível gerar um token dos dados do cartão')
        }
      } else {
        //Deleta antiga assinatura;
        if (ownerData?.paymentData?.subscriptionId) {
          const subscriptionId = ownerData?.paymentData?.subscriptionId
          try {
            const response = await axios.delete(
              `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  access_token: process.env.ASSAS_API_KEY || '',
                },
              },
            )

            const responseData = response.data

            const success = responseData.deleted

            if (!success) {
              throw new Error('Não foi possível remover a assinatura')
            }
          } catch (error) {
            throw new Error(
              'Não foi possível atualizar o token dos dados do cartão',
            )
          }
        }
      }

      await session.commitTransaction()

      return {
        success: true,
        updatedPaymentData: {
          creditCardInfo,
          // subscriptionId: newSubscriptionData.id,
          customerId: ownerData.paymentData.customerId,
          cpfCnpj,
        },
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

  async getFavouritesByUser(
    body: GetFavouritesByUserDto,
  ): Promise<IFavPropertiesReturn> {
    try {
      this.logger.log({ body }, 'favourite property')

      const { id, page } = body
      const limit = 6
      const skip = (page - 1) * limit

      const user = await this.userModel.findById(id).lean()

      if (!user || !user.isActive) {
        throw new NotFoundException('Usuário não encontrado')
      }

      const favouritedProperties = user.favourited

      const favouritePropertiesDocs = await this.propertyModel
        .find({
          _id: { $in: favouritedProperties },
          isActive: true,
        })
        .skip(skip)
        .limit(limit)
        .exec()

      let count
      let totalPages

      if (favouritePropertiesDocs.length > 0) {
        count = await this.propertyModel.countDocuments({
          _id: { $in: favouritedProperties },
        })
        totalPages = Math.ceil(count / limit)
      }

      return {
        docs: favouritePropertiesDocs,
        count,
        totalPages,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async editFavourite(body: EditFavouriteDto): Promise<string[]> {
    try {
      this.logger.log({ body }, 'edit favourited properties')

      const { userId, propertyId } = body

      const user = await this.userModel.findById(userId)

      if (!user || !user.isActive) {
        throw new NotFoundException('Usuário não encontrado')
      }

      const favouritedProperties = user.favourited

      const propertyIndex = favouritedProperties.indexOf(propertyId.toString())

      if (propertyIndex === -1) {
        // Property not in the favourites, add it
        favouritedProperties.push(propertyId.toString())
      } else {
        // Property already in favourites, remove it
        favouritedProperties.splice(propertyIndex, 1)
      }

      user.favourited = favouritedProperties
      await user.save()

      return user.favourited
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async deleteUser(
    deleteUserDto: DeleteUserDto,
  ): Promise<{ success: boolean }> {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    const session = await db.startSession()
    const opt = { session, new: true }
    try {
      await session.startTransaction()
      this.logger.log({}, 'delete user')

      const { userId } = deleteUserDto

      // user
      const foundUser: IUser = await this.userModel.findById(userId).lean()

      if (!foundUser || !foundUser.isActive) {
        throw new NotFoundException(
          `O usuário com o id: ${userId} não foi encontrado!`,
        )
      }

      // Cadastra no DB a data e hora em que o usuário desativou sua conta;
      const deactivatedEmail = `${new Date().toLocaleString()} - ${
        foundUser.email
      }`

      await this.userModel.updateOne(
        { _id: userId },
        {
          isActive: false,
          email: deactivatedEmail,
        },
        opt,
      )

      // owner
      const foundOwner: IOwner = await this.ownerModel
        .findOne({ userId, isActive: true })
        .lean()

      if (foundOwner) {
        // Inativa o owner
        await this.ownerModel.updateOne(
          { _id: foundOwner._id },
          { isActive: false },
          opt,
        )

        // Inativa os imóveis do owner
        await this.propertyModel.updateMany(
          { owner: foundOwner._id },
          { isActive: false },
          opt,
        )

        // Obtém as tags associadas às propriedades do owner
        const properties: IProperty[] = await this.propertyModel
          .find({ owner: foundOwner._id, isActive: true })
          .lean()
        const propertyTags: string[] = properties.flatMap(
          property => property.tags,
        )

        // Atualiza as tags decrementando a quantidade
        for (const tag of propertyTags) {
          const updatedTag = await this.tagModel.findOneAndUpdate(
            { name: tag },
            { $inc: { amount: -1 } },
            opt,
          )

          // Verifica se o amount é menor ou igual a 0 após a atualização
          if (updatedTag && updatedTag.amount <= 0) {
            // Exclui a tag se o amount for menor ou igual a 0
            const teste = await this.tagModel.deleteOne({ name: tag }, opt)
            console.log('🚀 ~ UsersService ~ teste:', teste)
          }
        }

        // Location

        const propertyAddresses: Array<{ category: string; name: string }> =
          properties.flatMap(property =>
            Object.entries(property.address).map(([category, name]) => ({
              category,
              name,
            })),
          )

        for (const { category, name } of propertyAddresses) {
          const propertyCountWithLocation =
            await this.propertyModel.countDocuments({
              [`address.${category}`]: name,
              isActive: true,
              owner: { $ne: foundOwner._id },
            })

          // Se não houver mais propriedades usando esta localização, exclua-a
          if (propertyCountWithLocation === 0) {
            await this.locationModel.deleteOne({ category, name })
          }
        }

        // Assinatura
        const plans = await this.planModel.find()
        const freePlan = plans.find(plan => plan.name === 'Free')
        if (
          foundOwner?.plan?.toString() !== freePlan._id.toString() &&
          foundOwner?.plan !== null &&
          foundOwner?.paymentData?.subscriptionId !== undefined
        ) {
          const subscriptionId = foundOwner?.paymentData?.subscriptionId
          const response = await axios.delete(
            `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
          )

          if (response.status >= 200 && response.status < 300) {
            // Deletar o customer;
            try {
              await axios.delete(
                `${paymentUrl}/customer/${foundOwner.paymentData.customerId}`,
              )
            } catch (error) {
              throw new BadRequestException(
                `Não foi possível deletar o cliente junto ao serviço de pagamentos. Erro: ${error}`,
              )
            }

            // Remover a propriedade na memória
            delete foundOwner.paymentData.subscriptionId

            // Persistir a alteração no banco de dados
            await this.ownerModel.updateOne(
              { _id: foundOwner._id },
              { $unset: { subscriptionId: 1 } },
              opt,
            )
          } else {
            throw new BadRequestException(
              `Não foi possível cancelar a assinatura deste usuário`,
            )
          }
        }
      }

      await session.commitTransaction()

      return { success: true }
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

  async editUser(body: EditUserDto) {
    const session = await this.startSession()
    try {
      await session.startTransaction()
      this.logger.log({ body }, 'start edit user > [service]')

      const { id: userId } = body.user

      let updatedUser
      let encryptedPassword
      let planData
      let plans
      let plusPlan

      if (body.owner?.plan) {
        plans = await this.planModel.find().lean()

        planData = plans.find(
          e => e._id.toString() === body.owner.plan.toString(),
        )

        plusPlan = plans.find(e => e.name === 'Locale Plus')
      }

      // USER
      const userExists = await this.userModel.findOne({ _id: userId }).lean()

      if (!userExists || !userExists.isActive) {
        throw new NotFoundException(
          `Usuário com o id: ${userId} não foi encontrado`,
        )
      }

      const user = userExists

      updatedUser = await this.handleEditUser(user, body)

      // PASSWORD
      if (body.password) {
        encryptedPassword = await this.handleEditPassword(body.password)
        updatedUser = {
          ...updatedUser,
          password: encryptedPassword,
        }
      }

      // OWNER
      const updatedOwner = await this.handleOwner(
        body.owner,
        updatedUser.username,
        body.user.id,
        planData,
      )

      const newOwner = updatedOwner

      const coupon = body?.coupon

      // PAYMENT DATA
      if (!coupon) {
        // Selecionou um plano;
        if (planData && planData.price > 0) {
          if (!newOwner?.paymentData?.subscriptionId) {
            if (!newOwner?.paymentData?.customerId) {
              const newPaymentData = await this.handleCustomer(
                body.user,
                updatedUser,
              )

              newOwner.paymentData = {
                ...newOwner.paymentData,
                ...newPaymentData,
              }
            }

            const newSubscription = await this.handleSubscription(
              newOwner,
              updatedUser,
              planData.price,
              body.creditCard,
            )

            newOwner.paymentData = {
              ...newOwner.paymentData,
              subscriptionId: newSubscription.subscriptionId,
              creditCardInfo: newSubscription.creditCardInfo,
            }
          } else {
            await this.handleSubscription(
              newOwner,
              updatedUser,
              planData.price,
              body.creditCard,
            )
          }
        } else {
          if (newOwner?.paymentData?.subscriptionId) {
            await axios.delete(
              `${process.env.PAYMENT_URL}/payment/subscription/${newOwner?.paymentData?.subscriptionId}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  access_token: process.env.ASSAS_API_KEY || '',
                },
              },
            )

            newOwner.paymentData = {}
          }
        }
      } else {
        const newPaymentData = await this.handleCoupon(
          coupon,
          newOwner?.paymentData,
        )

        newOwner.adCredits = plusPlan.commonAd
        newOwner.highlightCredits = plusPlan.highlightAd
        newOwner.plan = plusPlan._id
        newOwner.paymentData = newPaymentData
      }

      // CRUD USER
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: updatedUser },
        { session },
      )

      if (!body.owner?._id) {
        await this.ownerModel.create([newOwner], { session })
      } else {
        await this.ownerModel.updateOne(
          { _id: newOwner._id },
          { $set: newOwner },
          { session },
        )
      }

      await session.commitTransaction()
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

  async handleCoupon(coupon: string, paymentData: any) {
    try {
      const { subscriptionId } = paymentData
      let newPaymentData

      const couponData = await this.couponModel.findOne({ coupon }).lean()

      if (!couponData || !couponData.isActive) {
        throw new BadRequestException(`Cupom de desconto inválido.`)
      }

      await this.couponModel.updateOne(
        { _id: couponData._id },
        { $set: { isActive: false } },
      )

      if (!subscriptionId) {
        newPaymentData = {}
      } else {
        await axios.delete(
          `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASSAS_API_KEY || '',
            },
          },
        )

        newPaymentData = {}
      }

      return newPaymentData
    } catch (error) {
      throw new Error(`${error}`)
    }
  }

  async handleEditUser(user: any, body: EditUserDto) {
    try {
      const { username: userName, email, cpf, address: userAddress } = body.user
      const { cellPhone } = body.owner
      const updatedUser = { ...user }

      updatedUser.username = userName
      updatedUser.email = email
      updatedUser.cpf = cpf
      updatedUser.address = userAddress
      updatedUser.phone = cellPhone

      return updatedUser
    } catch (error) {
      throw new Error(`${error}`)
    }
  }

  async handleEditPassword(passwordData: any) {
    try {
      const { password, passwordConfirmattion } = passwordData

      if (password && password !== passwordConfirmattion) {
        throw new BadRequestException(
          'A confirmação de senha não é igual a senha informada',
        )
      }

      const encryptedPassword = await bcrypt.hash(password, 10)

      return encryptedPassword
    } catch (error) {
      throw new Error(`${error}`)
    }
  }

  async handleOwner(
    owner: OwnerDto,
    userName: string,
    userId: any,
    planData: IPlan,
  ) {
    try {
      const { _id, phone, cellPhone } = owner
      let ownerExists

      if (_id) {
        ownerExists = await this.ownerModel.findById(_id).lean()

        ownerExists.adCredits = planData?.commonAd ?? ownerExists?.adCredits
        ownerExists.highlightCredits =
          planData?.highlightAd ?? ownerExists?.highlightCredits
        ownerExists.plan = planData?._id ?? ownerExists?.plan
      } else {
        ownerExists = {
          name: userName,
          phone,
          cellPhone,
          wwpNumber: '',
          picture: '',
          creci: '',
          notifications: [],
          plan: planData?._id ?? null,
          userId,
          highlightCredits: planData?.highlightAd ?? 0,
          adCredits: planData?.commonAd ?? 0,
          isActive: true,
        }
      }

      return ownerExists
    } catch (error) {
      throw new Error(`${error}`)
    }
  }

  async handleCustomer(user: UserDto, updatedUser: any) {
    try {
      const { username, email, address, cpf } = user

      const { data } = await axios.post(
        `${paymentUrl}/customer`,
        {
          name: username,
          email,
          phone: updatedUser.phone,
          postalCode: address.zipCode,
          description: 'Confirmação de criação de id de cliente',
          cpfCnpj: cpf,
          addressNumber: address.streetNumber,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            access_token: process.env.ASAAS_API_KEY || '',
          },
        },
      )

      const paymentData = {
        customerId: data.id,
        cpfCnpj: cpf,
        subscriptionId: '',
      }

      return paymentData
    } catch (error) {
      throw new Error(`${error}`)
    }
  }

  async handleSubscription(
    owner: any,
    user: any,
    price: number,
    creditCard: any,
  ) {
    try {
      const { paymentData, cellPhone } = owner
      const { cardNumber, cardName, expiry, ccv, cpfCnpj } = creditCard
      const { email, address } = user
      let subscriptionId
      let body
      let creditCardInfo

      const formattedDate = await this.getFormattedDate()
      const expiryYear = `20${expiry[2] + expiry[3]}`
      const expiryMonth = `${expiry[0] + expiry[1]}`

      if (!paymentData?.subscriptionId) {
        if (!paymentData?.creditCardInfo?.creditCardToken) {
          body = {
            customer: owner.paymentData.customerId,
            value: price,
            nextDueDate: formattedDate,
            billingType: 'CREDIT_CARD',
            cycle: 'MONTHLY',
            creditCard: {
              holderName: cardName,
              number: cardNumber,
              expiryMonth,
              expiryYear,
              ccv: ccv,
            },
            creditCardHolderInfo: {
              name: cardName,
              email,
              phone: cellPhone,
              cpfCnpj,
              postalCode: address.zipCode,
              addressNumber: address.streetNumber,
            },
          }
        } else {
          body = {
            customer: paymentData.customerId,
            value: price,
            nextDueDate: formattedDate,
            billingType: 'CREDIT_CARD',
            cycle: 'MONTHLY',
            creditCardToken: paymentData.creditCardInfo.creditCardToken,
          }
        }

        const { data } = await axios.post(
          `${process.env.PAYMENT_URL}/payment/subscription`,
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASAAS_API_KEY || '',
            },
            timeout: 100000,
          },
        )

        subscriptionId = data.id
        creditCardInfo = data.creditCard
      } else {
        // Atualizar;
        subscriptionId = owner.paymentData.subscriptionId
        body = { value: 50 }
        await axios.post(
          //Atualiza o valor do plano;
          `${process.env.PAYMENT_URL}/payment/update-subscription/${subscriptionId}`,
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASAAS_API_KEY || '',
            },
            timeout: 100000,
          },
        )

        creditCardInfo = paymentData?.creditCardInfo
      }

      return { subscriptionId, creditCardInfo }
    } catch (error) {
      throw new Error(`${error}`)
    }
  }

  async getFormattedDate() {
    try {
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const day = currentDate.getDate().toString().padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`

      return formattedDate
    } catch (error) {
      throw new Error(`${error}`)
    }
  }
}
