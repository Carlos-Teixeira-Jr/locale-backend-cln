// @typescript-eslint/no-unused-vars
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

  async editUser(body: EditUserDto) {
    const session = await this.startSession()
    try {
      await session.startTransaction()
      this.logger.log({ body }, 'start edit user > [service]')

      // To-do: implementar rollback nesta rota;
      //To-do: implementar caso em que o usuário troca o cartão no momento da atualização;

      const {
        id: userId,
        username: userName,
        email,
        cpf,
        address: userAddress,
      } = body.user

      const paymentUrl = process.env.PAYMENT_URL

      let ownerId
      let phone: string
      let cellPhone
      let wwpNumber
      let plan: ObjectId
      let selectedPlanData
      let owner
      let ownerData
      let paymentData = {
        customerId: '',
        cpfCnpj: '',
        subscriptionId: '',
      }

      let adCredits: number
      let highlightCredits: number

      let response

      let cardName
      let cardNumber
      let expiry
      let ccv
      let cpfCnpj

      let password
      let passwordConfirmattion

      let expiryYear
      let expiryMonth

      let coupon

      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const day = currentDate.getDate().toString().padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`

      const plans = await this.planModel.find().lean()
      const plusPlan = plans.find(plan => plan.name === 'Locale Plus')

      plan = body.owner.plan

      // To-do: fazer com que o owner não seja criado quando não for necessário;
      if (body.owner && body.creditCard !== undefined) {
        ownerId = body.owner._id
        phone = body.owner.phone
        cellPhone = body.owner.cellPhone
        adCredits = body.owner.adCredits
        plan = body.owner.plan
        wwpNumber = body.owner.wwpNumber
      }

      if (body.owner.plan?.toString() !== '' && body.owner.plan !== null) {
        selectedPlanData = plans.find(e => e._id.toString() === plan.toString())
        adCredits = selectedPlanData.commonAd
        highlightCredits = selectedPlanData.highlightAd
      }

      if (body.creditCard !== undefined) {
        cardName = body.creditCard.cardName
        cardNumber = body.creditCard.cardNumber
        expiry = body.creditCard.expiry
        ccv = body.creditCard.ccv
        cpfCnpj = body.creditCard.cpfCnpj

        expiryYear = `20${expiry[2] + expiry[3]}`
        expiryMonth = `${expiry[0] + expiry[1]}`
      }

      const userExists = await this.userModel.findOne({ _id: userId })
      if (body.coupon) coupon = body.coupon

      // Verifica a validade do coupon
      // To-do: usar o modulo de cupons ao invés de usar diretamente o model aqui;
      if (coupon !== undefined) {
        const couponData = await this.couponModel.findOne({ coupon })

        if (!couponData || !couponData.isActive) {
          throw new BadRequestException(`Cupom de desconto inválido.`)
        }

        await this.couponModel.updateOne(
          { _id: couponData._id },
          { $set: { isActive: false } },
          { session },
        )
      }

      if (!userExists || !userExists.isActive) {
        throw new NotFoundException(
          `Usuário com o id: ${userId} não foi encontrado`,
        )
      } else {
        // To-do: verificar se está atualizando a foto do usuário mesmo quando não é alterada;
        await this.userModel.updateOne(
          { _id: userId },
          {
            $set: {
              username: userName,
              email,
              cpf,
              address: userAddress,
              phone: cellPhone,
            },
          },
          { session },
        )
      }

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
                  phone: cellPhone,
                },
              },
              { session },
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
                phone: cellPhone,
              },
            },
            { session },
          )
        }
      }

      // Caso em que o usuário quer mudar o plano;
      if (
        selectedPlanData?._id.toString() !== plan &&
        selectedPlanData !== undefined
      ) {
        ownerId = body.owner._id
        // Caso em que o usuário ainda não é um owner;
        if (!ownerId) {
          // Criar o objeto do owner;
          owner = {
            name: userName,
            phone,
            cellPhone,
            wwpNumber: '',
            picture: '',
            creci: '',
            notifications: [],
            plan: null,
            userId,
            highlightCredits: 0,
            adCredits: 0,
            isActive: true,
          }

          if (coupon) {
            owner.adCredits = plusPlan.commonAd
            owner.highlightCredits = plusPlan.highlightAd
            owner.plan = plusPlan._id
          }

          // Trocou o plano e selecionou o plano grátis semser owner;
          if (!selectedPlanData || selectedPlanData?.name === 'Free') {
            try {
              const createdOwner = await this.ownerModel.create([owner], {
                session,
              })
              owner = createdOwner[0].toObject()
            } catch (error) {
              throw new BadRequestException(
                `Não foi possível criar o anunciante. Error: ${error}`,
              )
            }
          } else {
            // Trocou plano e selecionou plano pago sem ser um owner;

            // Cadastrar o customer para este owner (novo owner);
            try {
              const response = await axios.post(
                `${paymentUrl}/customer`,
                {
                  name: body.user.username,
                  email,
                  phone: cellPhone,
                  postalCode: userAddress.zipCode,
                  description: 'Confirmação de criação de id de cliente',
                  cpfCnpj: cpf,
                  addressNumber: userAddress.streetNumber,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    access_token: process.env.ASAAS_API_KEY || '',
                  },
                },
              )

              if (response.status >= 200 && response.status < 300) {
                const customer = response.data

                // Atualiza o 'customerId' no 'owner' e salva no banco de dados
                paymentData = {
                  customerId: customer.id,
                  cpfCnpj: cpf,
                  subscriptionId: '',
                }

                owner.paymentData = paymentData
              } else {
                throw new Error(
                  `Falha ao criar o cliente: ${response.statusText}`,
                )
              }

              // Criar a assinatura
              try {
                if (!coupon) {
                  const response = await axios.post(
                    `${process.env.PAYMENT_URL}/payment/subscription`,
                    {
                      billingType: 'CREDIT_CARD',
                      cycle: 'MONTHLY',
                      customer: paymentData.customerId,
                      value: selectedPlanData.price,
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
                        phone: cellPhone,
                        cpfCnpj,
                        postalCode: userAddress.zipCode,
                        addressNumber: userAddress.streetNumber,
                      },
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        access_token: process.env.ASAAS_API_KEY || '',
                      },
                    },
                  )

                  const responseData = response.data

                  const creditCardInfo = responseData.creditCard
                  const subscriptionId = responseData.id

                  // Salvar o token do cartão de crédito no banco de dados
                  owner.paymentData.creditCardInfo = creditCardInfo
                  owner.paymentData.subscriptionId = subscriptionId
                  owner.adCredits = adCredits
                  owner.highlightCredits = highlightCredits
                } else {
                  owner.adCredits = plusPlan.commonAd
                  owner.highlightCredits = plusPlan.highlightAd
                  owner.plan = plusPlan
                }

                try {
                  // Cadastra o owner com dados de pagamento;
                  const createdOwner = await this.ownerModel.create([owner], {
                    session,
                  })

                  owner = createdOwner[0]
                } catch (error) {
                  throw new BadRequestException(
                    `Não foi possível cadastrar o anunciante. Erro: ${error}`,
                  )
                }
              } catch (error) {
                throw new Error(
                  `Falha ao gerar a assinatura: ${response.statusText}`,
                )
              }
            } catch (error) {
              throw new BadRequestException(
                `Ococrreu um erro ao gerar o id de cliente no serviço de pagamento. Erro: ${error}`,
              )
            }
          }

          response = {
            success: true,
            owner,
          }

          response = { success: true }

          await session.commitTransaction()

          return response
        } else {
          // Usuário já possui um owner cadastrado;
          const ownerExists = await this.ownerModel.findById(ownerId).lean()

          if (!ownerExists) {
            throw new NotFoundException(
              `Não foi possível encontrr o anunciante com o id: ${ownerId}`,
            )
          }

          owner = ownerExists

          // Esta trocando o plano de um pago para o grátis;
          if (
            selectedPlanData.name === 'Free' &&
            owner.plan.toString() !== selectedPlanData._id.toString()
          ) {
            if (owner.paymentData !== undefined) {
              // Caso em que o owner já possui dados de pagamento salvos;
              try {
                // Cancela a assinatura
                await axios.delete(
                  `${paymentUrl}/payment/subscription/${owner.paymentData.subscriptionId}`,
                )

                // Cancelar o customer;
                await axios.delete(
                  `${paymentUrl}/customer/${owner.paymentData.customerId}`,
                )

                // Deletar os dados de pagamento;
                owner.adCredits = selectedPlanData.commonAd
                owner.highlightCredits = selectedPlanData.highlightAd
                owner.plan = selectedPlanData._id
                // Remover a propriedade paymentData
                const { paymentData, ...newOwner } = owner
                console.log(
                  '🚀 ~ UsersService ~ editUser ~ paymentData:',
                  paymentData,
                )
                owner = newOwner
              } catch (error) {
                throw new BadRequestException(
                  `Não foi possível cancelar a assinatura do owner. Erro: ${error}`,
                )
              }
            }
          } else if (
            owner.plan !== plan &&
            selectedPlanData.name !== 'Free' &&
            owner?.paymentData?.creditCardInfo?.creditCardToken === undefined
          ) {
            // Caso em que o usuário trocou de um plano grátis para um plano pago e não tem o token de pagamento;
            if (body.creditCard === undefined) {
              throw new BadRequestException(
                `Os dados de pagamento do cartão de rédito não foram passados.`,
              )
            }

            // Criar o customer para esse owner
            try {
              const response = await axios.post(
                `${paymentUrl}/customer`,
                {
                  name: owner.name,
                  email,
                  phone: cellPhone,
                  postalCode: userAddress.zipCode,
                  description: 'Confirmação de criação de id de cliente',
                  cpfCnpj,
                  addressNumber: userAddress.streetNumber,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    access_token: process.env.ASAAS_API_KEY || '',
                  },
                },
              )

              const customerData = response.data

              owner = {
                ...owner,
                paymentData: {
                  customerId: customerData.id,
                },
              }

              // Gerar token do cartão de crédito;
              try {
                const response = await axios.post(
                  `${process.env.PAYMENT_URL}/payment/tokenize`,
                  {
                    billingType: 'CREDIT_CARD',
                    cycle: 'MONTHLY',
                    customer: owner.paymentData.customerId,
                    value: selectedPlanData.price,
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
                      email,
                      phone: cellPhone,
                      cpfCnpj,
                      postalCode: userAddress.zipCode,
                      addressNumber: userAddress.streetNumber,
                    },
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      access_token: process.env.ASAAS_API_KEY || '',
                    },
                  },
                )

                const responseData = response.data
                const creditCardInfo = responseData

                // Atualiza os dados de pagamento do usuário com o token;
                owner = {
                  ...owner,
                  paymentData: {
                    ...owner.paymentData,
                    creditCardInfo,
                  },
                }

                // Cria a assinatura;
                try {
                  if (owner.paymentData.creditCardInfo.creditCardToken) {
                    const newSubscription = await axios.post(
                      `${process.env.PAYMENT_URL}/payment/subscription`,
                      {
                        customer: owner.paymentData.customerId,
                        value: selectedPlanData.price,
                        nextDueDate: formattedDate,
                        billingType: 'CREDIT_CARD',
                        cycle: 'MONTHLY',
                        creditCardToken:
                          owner.paymentData.creditCardInfo.creditCardToken,
                      },
                      {
                        headers: {
                          'Content-Type': 'application/json',
                          access_token: process.env.ASAAS_API_KEY || '',
                        },
                      },
                    )

                    const subscriptionData = newSubscription.data
                    const subscriptionId = subscriptionData.id

                    // Atualiza o owner;
                    owner = {
                      ...owner,
                      plan: selectedPlanData._id,
                      adCredits: selectedPlanData.commonAd,
                      highlightCredits: selectedPlanData.highlightAd,
                      paymentData: {
                        ...owner.paymentData,
                        subscriptionId,
                        cpfCnpj,
                      },
                    }
                  } else {
                    // Cria assinatura com dados do cartão;
                  }
                } catch (error) {
                  throw new BadRequestException(
                    `Não foi possível criar uma assinatura junto ao serviço de pagamentos. Erro: ${error}`,
                  )
                }
              } catch (error) {
                throw new Error(
                  'Não foi possível gerar um token dos dados do cartão',
                )
              }
            } catch (error) {
              throw new BadRequestException(
                `Não foi possível criar um cliente junto ao serviço de pagamentos. Erro: ${error}`,
              )
            }
          } else if (owner.plan !== plan && selectedPlanData.name !== 'Free') {
            // Está trocando o plano de um pago para outro pago e tem token;
            // Verificar se foi passado os dados do cartão de crédito;
            const cardNumberToken =
              ownerExists.paymentData.creditCardInfo.creditCardNumber
            const cardLastNumbers = cardNumber.slice(-4)
            if (body.creditCard !== undefined) {
              // Verifica se mudou o cartão de crédito;
              if (cardLastNumbers !== cardNumberToken) {
                // Novo cartão
                const editCreditCardDto: EditCreditCardDto = {
                  cardName,
                  cardNumber,
                  expiry,
                  ccv,
                  cpfCnpj,
                  email,
                  phone,
                  plan: selectedPlanData,
                  zipCode: userAddress.zipCode,
                  streetNumber: userAddress.streetNumber,
                  owner,
                  customerId: ownerExists.paymentData.customerId,
                }
                try {
                  // Atualizar cartão de crédito;
                  const updateCreditCard = await this.editCreditCard(
                    editCreditCardDto,
                  )

                  if (updateCreditCard.success) {
                    const { updatedPaymentData } = updateCreditCard

                    try {
                      await this.ownerModel.findByIdAndUpdate(
                        { _id: ownerExists._id },
                        {
                          $set: {
                            plan,
                            adCredits: selectedPlanData.commonAd,
                            highlightCredits: selectedPlanData.highlightAd,
                            paymentData: updatedPaymentData,
                          },
                        },
                        { session },
                      )

                      // Atualizar a assinatura
                      try {
                        await axios.post(
                          //Atualiza o valor do plano;
                          `${process.env.PAYMENT_URL}/payment/update-subscription/${updatedPaymentData.subscriptionId}`,
                          {
                            headers: {
                              'Content-Type': 'application/json',
                              access_token: process.env.ASAAS_API_KEY || '',
                            },
                          },
                        )
                      } catch (error) {
                        throw new BadRequestException(
                          `Não foi possível atualizar a assinatura do anunciante junto ao serviço de pagamentos. Erro: ${error}`,
                        )
                      }
                    } catch (error) {
                      throw new BadRequestException(
                        `Não foi possível atualizar os dados depagamento do anunciante. Erro: ${error}`,
                      )
                    }
                  }
                } catch (error) {
                  throw new BadRequestException(
                    `Não foi possível atualizar o cartão de crédito do usuário junto ao serviço de pagamentos. Erro: ${error}`,
                  )
                }
              } else {
                // Usuário não mudou o cartão de crédito
                // Atualizar assinatura;
                try {
                  await axios.post(
                    `${process.env.PAYMENT_URL}/payment/update-subscription/${owner.paymentData.subscriptionId}`,
                    {
                      value: selectedPlanData.price,
                      updatePendingPayments: true,
                      description: `Assinatura do plano ${selectedPlanData.name}`,
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        access_token: process.env.ASAAS_API_KEY || '',
                      },
                    },
                  )

                  owner.adCredits = selectedPlanData.commonAd
                  owner.highlightCredits = selectedPlanData.highlightAd
                  owner.plan = selectedPlanData._id
                } catch (error) {
                  throw new BadRequestException(
                    `Não foi possível atualizar a assinatura do anunciante junto ao serviço de pagamentos. Erro: ${error}`,
                  )
                }
              }
            } else {
              // Os dados de cartão não foram alterados pelo usuário;
              // Atualizar assinatura;
              try {
                //Atualiza o valor do plano;
                await axios.post(
                  `${process.env.PAYMENT_URL}/payment/update-subscription/${owner.paymentData.subscriptionId}`,
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      access_token: process.env.ASAAS_API_KEY || '',
                    },
                  },
                )

                owner = {
                  ...owner,
                  adCredits: selectedPlanData.commonAd,
                  highlightCredits: selectedPlanData.highlightAd,
                  plan,
                }
              } catch (error) {
                throw new BadRequestException(
                  `Não foi possível atualizar a assinatura do anunciante junto ao serviço de pagamentos. Erro: ${error}`,
                )
              }
            }
          }
        }
      }

      if (owner?.paymentData !== undefined) {
        try {
          await this.ownerModel.updateOne(
            { _id: owner._id },
            {
              $set: owner,
            },
            { session },
          )
        } catch (error) {
          throw new BadRequestException(
            `Não foi possível atualizar os dados do anunciante. Erro: ${error}`,
          )
        }
      } else if (owner?.paymentData) {
        try {
          await this.ownerModel.updateOne(
            { _id: owner._id },
            {
              $set: owner,
              $unset: { paymentData: 1 },
            },
            { session },
          )
        } catch (error) {
          throw new BadRequestException(
            `Não foi possível atualizar os dados do anunciante. Erro: ${error}`,
          )
        }
      } else if (owner?.paymentData === undefined) {
        try {
          if (ownerId !== undefined && ownerId !== '') {
            ownerData = await this.ownerModel.findById(ownerId).lean()

            if (coupon) {
              owner = {
                ...ownerData,
                adCredits: plusPlan.commonAd,
                highlightCredits: plusPlan.highlightAd,
                plan: plusPlan._id,
              }
            } else {
              owner = ownerData
            }

            // Owner selecionou plano free;
            if (selectedPlanData?.name === 'Free') {
              // Atualiza o owner;
              await this.ownerModel.updateOne(
                { _id: owner._id },
                { $set: owner },
                { session },
              )
            } else {
              try {
                const response = await axios.post(
                  `${paymentUrl}/customer`,
                  {
                    name: owner.name,
                    email,
                    phone: cellPhone,
                    postalCode: userAddress.zipCode,
                    description: 'Confirmação de criação de id de cliente',
                    cpfCnpj,
                    addressNumber: userAddress.streetNumber,
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      access_token: process.env.ASAAS_API_KEY || '',
                    },
                  },
                );

                const customerData = response.data

                owner = {
                  ...owner,
                  paymentData: {
                    customerId: customerData.id,
                    cpfCnpj
                  },
                }

                const subscription = await axios.post(
                  `${process.env.PAYMENT_URL}/payment/tokenize`,
                  {
                    billingType: 'CREDIT_CARD',
                    cycle: 'MONTHLY',
                    customer: owner.paymentData.customerId,
                    value: selectedPlanData.price,
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
                      email,
                      phone: cellPhone,
                      cpfCnpj,
                      postalCode: userAddress.zipCode,
                      addressNumber: userAddress.streetNumber,
                    },
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      access_token: process.env.ASAAS_API_KEY || '',
                    },
                  },
                )

                const responseData = subscription.data
                const creditCardInfo = responseData

                // Atualiza os dados de pagamento do usuário com o token;
                owner = {
                  ...owner,
                  paymentData: {
                    ...owner.paymentData,
                    creditCardInfo,
                  },
                }

                if (owner.paymentData.creditCardInfo.creditCardToken) {
                  const newSubscription = await axios.post(
                    `${process.env.PAYMENT_URL}/payment/subscription`,
                    {
                      customer: owner.paymentData.customerId,
                      value: selectedPlanData.price,
                      nextDueDate: formattedDate,
                      billingType: 'CREDIT_CARD',
                      cycle: 'MONTHLY',
                      creditCardToken:
                        owner.paymentData.creditCardInfo.creditCardToken,
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        access_token: process.env.ASAAS_API_KEY || '',
                      },
                    },
                  )

                  const subscriptionData = newSubscription.data
                  const subscriptionId = subscriptionData.id

                  // Atualiza o owner;
                  owner = {
                    ...owner,
                    plan: selectedPlanData._id,
                    adCredits: selectedPlanData.commonAd,
                    highlightCredits: selectedPlanData.highlightAd,
                    paymentData: {
                      ...owner.paymentData,
                      subscriptionId,
                      cpfCnpj,
                    },
                  }
                } else {
                  // Cria assinatura com dados do cartão;
                  const response = await axios.post(
                    `${process.env.PAYMENT_URL}/payment/subscription`,
                    {
                      billingType: 'CREDIT_CARD',
                      cycle: 'MONTHLY',
                      customer: paymentData.customerId,
                      value: selectedPlanData.price,
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
                        phone: cellPhone,
                        cpfCnpj,
                        postalCode: userAddress.zipCode,
                        addressNumber: userAddress.streetNumber,
                      },
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        access_token: process.env.ASAAS_API_KEY || '',
                      },
                    },
                  )

                  const responseData = response.data

                  const creditCardInfo = responseData.creditCard
                  const subscriptionId = responseData.id

                  // Salvar o token do cartão de crédito no banco de dados
                  owner.paymentData.creditCardInfo = creditCardInfo
                  owner.paymentData.subscriptionId = subscriptionId
                  owner.adCredits = adCredits
                  owner.highlightCredits = highlightCredits
                }
              } catch (error) {
                throw new BadRequestException(`Não foi possível gerar o pagamento do plano. Erro: ${error}`)
              }
            }
          } else {
            if (coupon) {
              owner = {
                ...owner,
                name: userName,
                phone,
                cellPhone,
                wwpNumber,
                picture: '',
                creci: '',
                notification: [],
                userId,
                isActive: true,
                adCredits: plusPlan.commonAd,
                highlightCredits: plusPlan.highlightAd,
                plan: plusPlan._id,
              }
            } else if (!coupon && selectedPlanData) {
              owner = {
                ...owner,
                name: userName,
                phone,
                cellPhone,
                wwpNumber,
                picture: '',
                creci: '',
                notification: [],
                userId,
                isActive: true,
                adCredits: selectedPlanData?.commonAd,
                highlightCredits: selectedPlanData?.highlightAd,
                plan: selectedPlanData?._id,
              }
            } else if (!coupon && !selectedPlanData) {
              owner = {
                ...owner,
                name: userName,
                phone,
                cellPhone,
                wwpNumber,
                picture: '',
                creci: '',
                notification: [],
                userId,
                isActive: true,
                adCredits: 0,
                highlightCredits: 0,
                plan: null,
              }
            }

            ownerData = await this.ownerModel.create([owner], { session })
          }
        } catch (error) {
          throw new NotFoundException(
            `Anunciante não foi encontrado. Erro: ${error}`,
          )
        }
      }

      // Desativar os anúncios do owner quando este troca de plano;
      if (
        owner &&
        selectedPlanData?._id?.toString() !== plan &&
        selectedPlanData?._id !== undefined
      ) {
        try {
          // Buscar os anúncios do owner;
          const ownerProperties = await this.propertyModel
            .find({
              owner: ownerId,
              isActive: true,
            })
            .lean()

          const propertiesToDeactivate = []

          // Inserir os ids dos anuncios ativos do owner no array;
          ownerProperties.forEach(prop => {
            const propertyId = prop._id.toString()
            propertiesToDeactivate.push(propertyId)
          })

          // Desativar os anúncios dentro do array
          await this.propertyModel.updateMany(
            { _id: { $in: propertiesToDeactivate } },
            { $set: { isActive: false } },
            session,
          )
        } catch (error) {
          throw new BadRequestException(
            `Não foi possível desativar os anúncios do anunciante. Erro: ${error}`,
          )
        }
      }

      response = { success: true }

      await session.commitTransaction()

      return response
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

  async editCreditCard(body: EditCreditCardDto): Promise<any> {
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

      let creditCardInfo

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
        try {
          const response = await axios.post(
            `${process.env.PAYMENT_URL}/customer`,
            {
              name: owner.name,
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
          ownerExists.paymentData.customerId = customer.id
          await ownerExists.save()
        } catch (error) {
          throw new Error(`Falha ao criar o cliente. Erro: ${error}`)
        }
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
        try {
          const response = await axios.post(
            `${process.env.PAYMENT_URL}/payment/tokenize`,
            {
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
          ownerExists.isNewCreditCard = true
          ownerExists.newPlan = isNewPlan
          ownerExists.paymentData.creditCardInfo = creditCardInfo
          ownerExists.paymentData.cpfCnpj = cpfCnpj
          await ownerExists.save()
        } catch (error) {
          throw new Error('Não foi possível gerar um token dos dados do cartão')
        }
      } else {
        //Deleta antiga assinatura;
        if (ownerExists?.paymentData?.subscriptionId) {
          const subscriptionId = ownerExists?.paymentData?.subscriptionId
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

      return {
        success: true,
        updatedPaymentData: {
          creditCardInfo,
          // subscriptionId: newSubscriptionData.id,
          customerId: ownerExists.paymentData.customerId,
          cpfCnpj,
        },
      }
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
}
