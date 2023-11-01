import { Model } from 'mongoose'
import { Injectable, NotFoundException } from '@nestjs/common'
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
  docs: any[]
  totalPages: number
  count: number
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
  ) {}

  async findOne(_id: string) {
    try {
      this.logger.log({ _id }, 'findOne')

      const user = await this.userModel.findById(_id)

      if (!user) {
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

  async findOneByUsername(username: string): Promise<IUser> {
    try {
      this.logger.log({ username }, 'findOneByUsername')

      const user = await this.userModel.findOne({ username: username })

      if (!user) {
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

      if (!user) {
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

      const { id } = body

      const user = await this.userModel
        .findOne({ _id: id })
        .select('username email address cpf')

      if (!user) {
        throw new NotFoundException(
          `Usuário com o id: ${id} não foi encontrado`,
        )
      }

      const owner = await this.ownerModel
        .findOne({ userId: id })
        .select('adCredits plan phone cellPhone customerId creditCardInfo _id')

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

  async editUser(body: EditUserDto) {
    try {
      this.logger.log({ body }, 'start edit user / owner')

      const {
        id: userId,
        username: userName,
        email,
        cpf,
        address: userAddress,
      } = body.user

      let ownerId
      let ownerName: string
      let user
      let phone: string
      let cellPhone
      let adCredits: number

      if (body.owner) {
        ownerId = body.owner.id
        ownerName = body.owner.ownername
        user = body.owner.userId
        phone = body.owner.phone
        cellPhone = body.owner.cellPhone
        adCredits = body.owner.adCredits
      }

      const userExists = await this.userModel.findOne({ _id: userId })

      if (!userExists) {
        throw new NotFoundException(
          `Usuário com o id: ${userId} não foi encontrado`,
        )
      }

      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: {
            username: userName,
            email,
            cpf,
            address: userAddress,
          },
        },
      )

      if (ownerId) {
        const owner = await this.ownerModel.findById(ownerId)

        if (!owner) {
          throw new NotFoundException(
            `O usuário com o id: ${userId} não possui nenhum anúncio cadastrado.`,
          )
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
            },
          },
        )
      }

      const updatedOwner = await this.ownerModel.findById(ownerId).lean()

      return {
        success: true,
        updatedOwner,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async editCreditCard(body: any) {
    console.log(
      '🚀 ~ file: users.service.ts:237 ~ UsersService ~ editCreditCard ~ body:',
      body,
    )
    try {
      this.logger.log({}, 'edit credit card')

      const {
        cardNumber,
        cardName,
        expiry,
        cvc,
        cpf,
        email,
        phone,
        customer,
        plan,
        address,
        owner,
      } = body

      // Atualizar o cartão de crédito usando a api da Asaas;
      const response = await fetch(
        `http://localhost:3002/payment/charges/${cpf}`,
      )

      if (!response.ok) {
        throw new Error(`Erro na requisição à API: ${response.status}`)
      }

      const subscriptions = await response.json()

      let mostRecentCharge = null
      let mostRecentDate = new Date(0)

      for (const charge of subscriptions) {
        const chargeDate = new Date(charge.dateCreated)
        if (chargeDate > mostRecentDate) {
          mostRecentCharge = charge
          mostRecentDate = chargeDate
        }
      }

      if (!mostRecentCharge) {
        throw new Error('Nenhuma cobrança encontrada.')
      }

      console.log('Cobrança mais recente:', mostRecentCharge)

      const chargeId = mostRecentCharge.id

      if (chargeId) {
        const formattedExpiry = expiry.split('-')
        const expiryYear = formattedExpiry[0]
        const expiryMonth = formattedExpiry[1]

        const currentDate = new Date()
        const year = currentDate.getFullYear()
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
        const day = currentDate.getDate().toString().padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`

        const response = await fetch(
          `http://localhost:3002/payment/subscription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASSAS_API_KEY || '',
            },
            body: JSON.stringify({
              billingType: 'CREDIT_CARD',
              cycle: 'MONTHLY',
              customer,
              value: plan.price,
              nextDueDate: formattedDate,
              creditCard: {
                holderName: cardName,
                number: cardNumber,
                expiryMonth,
                expiryYear,
                ccv: cvc,
              },
              creditCardHolderInfo: {
                name: cardName,
                email,
                phone,
                cpfCnpj: cpf,
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

        const ownerData: IOwner = await this.ownerModel
          .findById(owner._id)
          .lean()

        if (!ownerData) {
          throw new Error(`Proprietário não encontrado: ${response.statusText}`)
        }

        ownerData.creditCardInfo = responseData.creditCardInfo

        await ownerData.save()
      }

      const deleteChargeResponse = await fetch(
        `http://localhost:3002/payment/subscription/${chargeId}`,
      )

      if (!deleteChargeResponse.ok) {
        throw new Error('Não foi possível deletar a cobrança anterior.')
      }

      return { success: 'success' }
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
      const skip = (page - 1) * 10
      const limit = 10

      const user = await this.userModel.findById(id)

      if (!user) {
        throw new NotFoundException('Usuário não encontrado')
      }

      const favouritedProperties = user.favourited

      const favouritePropertiesDocs = await this.propertyModel
        .find({
          _id: { $in: favouritedProperties },
        })
        .skip(skip)
        .limit(limit)
        .lean()

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

      if (!user) {
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
}
