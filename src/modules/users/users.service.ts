import mongoose, { Model, ObjectId, Schema } from 'mongoose'
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
import { EditUserDto } from './dto/edit-user.dto'
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
  ) {}

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
        .select('username email address cpf picture')

      if (!user) {
        throw new NotFoundException(
          `Usuário com o id: ${userId} não foi encontrado`,
        )
      }

      const owner = await this.ownerModel
        .findOne({ userId, isActive: true })
        .select(
          'adCredits plan phone cellPhone customerId paymentData _id name picture',
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

  async editUser(body: EditUserDto) {
    try {
      this.logger.log({ body }, 'start edit user > [service]')

      const {
        id: userId,
        username: userName,
        email,
        cpf,
        address: userAddress,
        profilePicture,
      } = body.user

      //const { password, passwordConfirmattion } = body.password

      let ownerId
      let ownerName: string
      let user
      let phone: string
      let cellPhone
      let adCredits: number
      let plan: ObjectId
      //let profilePicture: string

      if (body.owner) {
        ownerId = body.owner._id
        ownerName = body.owner.ownername
        user = body.owner.userId
        phone = body.owner.phone
        cellPhone = body.owner.cellPhone
        adCredits = body.owner.adCredits
        plan = body.owner.plan
      }

      const userExists = await this.userModel.findOne({ _id: userId })

      if (!userExists || !userExists.isActive) {
        throw new NotFoundException(
          `Usuário com o id: ${userId} não foi encontrado`,
        )
        // esse else não existia antes, só coloquei pra confirmar que o problema era no password
      } else {
        await this.userModel.updateOne(
          { _id: userId },
          {
            $set: {
              username: userName,
              email,
              cpf,
              address: userAddress,
              pricture: profilePicture,
            },
          },
        )
      }

      let password
      let passwordConfirmattion

      //  Lida com a edição da senha caso o usuário tenha trocado;
      if (body.password) {
        password = body.password.password
        passwordConfirmattion = body.password.passwordConfirmattion

        if (body.password !== undefined) {
          if (password !== undefined && password !== passwordConfirmattion) {
            throw new BadRequestException(
              'A confirmação de senha não é igual a senha informada',
            )
          } else {
            const encryptedPassword = await bcrypt.hash(password, 10)
            await this.userModel.updateOne(
              { _id: userId },
              {
                $set: {
                  username: userName,
                  email,
                  cpf,
                  address: userAddress,
                  password: encryptedPassword,
                  picture: profilePicture,
                },
              },
            )
          }
        } else {
          await this.userModel.updateOne(
            { _id: userId },
            {
              $set: {
                username: userName,
                email,
                cpf,
                address: userAddress,
                picture: profilePicture,
              },
            },
          )
        }
      }

      let updatedOwner
      let response

      if (ownerId) {
        const owner = await this.ownerModel.findById(ownerId)

        if (!owner || !owner.isActive) {
          throw new NotFoundException(
            `O usuário com o id: ${userId} não possui nenhum anúncio cadastrado.`,
          )
        }

        // Atualizar plano do owner;
        if (plan !== owner.plan) {
          const selectedPlanData = await this.planModel.findById(plan)
          const { 
            subscriptionId, 
            customerId, 
            creditCardInfo 
          } = owner.paymentData;
          const { creditCardToken } = creditCardInfo;
          let nextDueDate;

          //Buscar a assinatura do usuário para verificar a data de cobrança;
          const subscriptionData = await axios.get(
            `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                access_token: process.env.ASAAS_API_KEY || '',
              },
            },
          )

          if (subscriptionData.status >= 200 && subscriptionData.status < 300) {
            nextDueDate = subscriptionData.data.nextDueDate;
          } else {
            // Cria a data de vencimento para o caso do cliente anteriormente estar usando a conta grátis ou não ter conta;
            const currentDate = new Date()
            const year = currentDate.getFullYear()
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
            const day = currentDate.getDate().toString().padStart(2, '0')
            const formattedDate = `${year}-${month}-${day}`

            nextDueDate = formattedDate;
          }

          if (selectedPlanData.name !== 'Free') {
            const response = await axios.post(
              //Atualiza o valor do plano;
              `${process.env.PAYMENT_URL}/payment/update-subscription/${subscriptionId}`,
              {
                billingType: 'CREDIT_CARD',
                cycle: 'MONTHLY',
                customer: customerId,
                value: selectedPlanData.price,
                nextDueDate,
                updatePendingPayments: true,
                creditCardToken,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  access_token: process.env.ASAAS_API_KEY || '',
                },
              },
            )

            if (response.status <= 200 && response.status > 300) {
              throw new Error(
                `Falha ao atualizar a assinatura: ${response.statusText}`,
              )
            }
          }
        }

        await this.ownerModel.updateOne(
          { _id: ownerId },
          {
            $set: {
              name: ownerName,
              phone,
              cellPhone,
              userId: user,
              adCredits,
              picture: profilePicture,
            },
          },
        )

        updatedOwner = await this.ownerModel.findById(ownerId).lean()

        response = {
          success: true,
          updatedOwner,
        }
      }

      response = { success: true }

      return response
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async editCreditCard(body: EditCreditCardDto): Promise<{ success: boolean }> {
    try {
      this.logger.log({}, 'edit credit card')

      const {
        cardNumber,
        cardName,
        expiry,
        ccv,
        cpfCnpj,
        email,
        phone,
        plan,
        zipCode,
        streetNumber,
        owner,
        customerId,
      } = body

      // Cadastrar os dados do novo cartão de crédito no owner do usuário;
      const ownerExists = await this.ownerModel.findById(owner)

      if (!ownerExists || !ownerExists.isActive) {
        throw new NotFoundException(`Proprietário não econtrado.`)
      }

      // Formatando a data de validade do cartão;
      const expiryMonth = expiry.slice(0, 2)
      const expiryYear = expiry.slice(2)

      // Verificando se o usuário selecionou um novo plano ao mudar os dados do cartão;
      const isNewPlan = ownerExists.plan === plan._id

      if (isNewPlan) {
        ownerExists.newPlan = plan._id
      }

      // Gerar o customerId caso o usuário não tenha feito ainda;
      if (!customerId) {
        const response = await fetch(`${process.env.PAYMENT_URL}/customer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            access_token: process.env.ASSAS_API_KEY || '',
          },
          body: JSON.stringify({
            name: owner.name,
            email: email,
            phone,
            postalCode: zipCode,
            description: 'Confirmação de criação de id de cliente',
            cpfCnpj,
            addressNumber: streetNumber,
          }),
        })

        if (!response.ok) {
          throw new Error(`Falha ao criar o cliente: ${response.statusText}`)
        }

        const customer = await response.json()

        // Atualiza o 'customerId' no 'owner' e salva no banco de dados
        ownerExists.paymentData.customerId = customer.id
        await ownerExists.save()
      }

      // Formatação da data;
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const day = currentDate.getDate().toString().padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`

      //Se o owner já tiver um cartão registrado;
      if (!ownerExists.paymentData.creditCardInfo.creditCardToken) {
        // Gerar token dos dados do cartão;
        const response = await fetch(
          `${process.env.PAYMENT_URL}/payment/tokenize`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASSAS_API_KEY || '',
            },
            body: JSON.stringify({
              billingType: 'CREDIT_CARD',
              cycle: 'MONTHLY',
              customer: customerId
                ? customerId
                : ownerExists.paymentData.customerId,
              value: plan.price,
              nextDueDate: formattedDate,
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
            }),
          },
        )

        if (!response.ok) {
          throw new Error('Não foi possível gerar um token dos dados do cartão')
        }

        const responseData = await response.json()

        const creditCardInfo = responseData

        // Atualiza os dados do usuário;
        ownerExists.isNewCreditCard = true
        ownerExists.newPlan = isNewPlan
        ownerExists.paymentData.creditCardInfo = creditCardInfo
        await ownerExists.save()
      } else {
        //Deleta antiga assinatura;
        const subscriptionId = owner.paymentData.subscriptionId
        const response = await fetch(
          `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASSAS_API_KEY || '',
            },
          },
        )

        if (!response.ok) {
          throw new Error(
            'Não foi possível atualizar o token dos dados do cartão',
          )
        }

        const responseData = await response.json()

        const success = responseData.deleted

        if (!success) {
          throw new Error('Não foi possível remover a assinatura')
        }

        //Cria nova assinatura
        const newSubscription = await fetch(
          `${process.env.PAYMENT_URL}/payment/subscription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASSAS_API_KEY || '',
            },
            body: JSON.stringify({
              customer: customerId
                ? customerId
                : ownerExists.paymentData.customerId,
              value: plan.price,
              nextDueDate: formattedDate,
              billingType: 'CREDIT_CARD',
              cycle: 'MONTHLY',
              creditCard: {
                holderName: cardName,
                number: cardNumber,
                expiryMonth,
                expiryYear,
                ccv,
              },
              creditCardHolderInfo: {
                name: cardName,
                email,
                phone: phone ? phone : ownerExists.cellPhone,
                cpfCnpj,
                postalCode: zipCode,
                addressNumber: streetNumber,
              },
            }),
          },
        )

        if (!response.ok)
          throw new Error('Não foi possível criar a nova assinatura')

        const newSubscriptionData = await newSubscription.json()

        if (newSubscriptionData.statusCode === 400)
          throw new Error('Não foi possível criar a nova assinatura')

        const creditCardInfo = newSubscriptionData.creditCard

        await this.ownerModel.updateOne(
          { _id: ownerExists._id },
          {
            $set: {
              isNewCreditCard: true,
              newPlan: isNewPlan,
              paymentData: {
                creditCardInfo,
                subscriptionId: newSubscriptionData.id,
                customerId: ownerExists.paymentData.customerId,
                cpfCnpj,
              },
            },
          },
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
            await this.tagModel.deleteOne({ name: tag }, opt)
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

        // Charges
        if (foundOwner.paymentData.subscriptionId) {
          const subscriptionId = foundOwner.paymentData.subscriptionId
          const response = await axios.delete(
            `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
          )

          if (response.status >= 200 && response.status < 300) {
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
}
