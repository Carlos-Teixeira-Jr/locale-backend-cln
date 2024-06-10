import {
  BadRequestException,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PropertyModelName, IProperty } from 'common/schemas/Property.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import mongoose, { Model } from 'mongoose'
import {
  CreatePropertyDto,
  CreditCardData,
  UserData,
} from '../dto/create-property.dto'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { IPlan, PlanModelName } from 'common/schemas/Plan.schema'
import { IUser, UserModelName } from 'common/schemas/User.schema'
import { SendAutoGeneratedPasswordDto } from 'common/utils/dto/send-auto-generated-password.dto'
import { sendAutoGeneratedPasswordEmail } from 'common/utils/email/emailHandler'
import { generateRandomString } from 'common/utils/generateRandomPassword'
import { AuthService } from 'modules/auth/auth.service'
import { ILocation, LocationModelName } from 'common/schemas/Location.schema'
import {
  IPropertyType,
  PropertyTypeModelName,
} from 'common/schemas/PropertyType.schema'
import { TagModelName, ITag } from 'common/schemas/Tag.schema'
import axios from 'axios'
import { PropertyActivationDto } from '../dto/property-activation.dto'
import { CouponModelName, ICoupon } from 'common/schemas/Coupon.schema'

interface IOwnerData {
  name: string
  phone: string
  cellPhone: string
  wwpNumber: string
  picture: string
  plan: any
  userId: any
  adCredits?: number
  highlightCredits?: number
  email: string
  isActive: boolean
}

@Injectable()
export class CreateProperty_Service {
  constructor(
    @InjectorLoggerService(CreateProperty_Service.name)
    private readonly logger: LoggerService,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
    @InjectModel(UserModelName)
    private readonly userModel: Model<IUser>,
    @InjectModel(OwnerModelName)
    private readonly ownerModel: Model<IOwner>,
    @InjectModel(PlanModelName)
    private readonly planModel: Model<IPlan>,
    @InjectModel(LocationModelName)
    private readonly locationModel: Model<ILocation>,
    @InjectModel(PropertyTypeModelName)
    private readonly propertyTypeModel: Model<IPropertyType>,
    @InjectModel(TagModelName)
    private readonly tagModel: Model<ITag>,
    @InjectModel(CouponModelName)
    private readonly couponModel: Model<ICoupon>,
    private readonly authService: AuthService,
  ) {}

  async createOne(createPropertyDto: CreatePropertyDto): Promise<any> {
    const session = await this.startSession()
    try {
      await session.startTransaction()
      this.logger.log({}, 'start createOne')

      const {
        userData,
        propertyData,
        creditCardData,
        isPlanFree,
        plan,
        cellPhone,
        phone,
        deactivateProperties,
      } = createPropertyDto

      let coupon
      let updatedOwner

      if (createPropertyDto?.coupon) {
        coupon = createPropertyDto?.coupon
      }

      const { ownerInfo } = propertyData

      const {
        owner,
        userAlreadyExists,
        user,
        selectedPlan,
        ownerPreviousPlan,
      } = await this.getUserAndOwner(
        userData,
        isPlanFree,
        plan,
        session,
        coupon,
      )

      if (!coupon) {
        const { updatedOwner: tempUpdatedOwner } = await this.handleCustomer(
          isPlanFree,
          owner,
          userData,
          cellPhone,
          phone,
          creditCardData,
        )
        updatedOwner = tempUpdatedOwner
      }

      if (
        !isPlanFree ||
        ownerPreviousPlan?._id?.toString() !== selectedPlan?._id?.toString()
      ) {
        if (!coupon) {
          await this.handlePayment(
            isPlanFree,
            selectedPlan,
            updatedOwner,
            userData,
            creditCardData,
            cellPhone,
            ownerPreviousPlan,
            deactivateProperties?.length,
            session,
          )
        }
      } else {
        if (owner && owner.adCredits === 0) {
          throw new BadRequestException(`O anunciante não tem mais créditos.`)
        }

        updatedOwner.paymentData.creditCardInfo = {
          creditCardBrand: '',
          creditCardNumber: '',
          creditCardToken: '',
        }
        updatedOwner.paymentData.subscriptionId = ''

        updatedOwner = {
          ...updatedOwner,
          adCredits: owner.adCredits - 1,
        }

        await this.ownerModel.updateOne(
          { _id: updatedOwner?._id },
          { $set: updatedOwner },
          { session },
        )
      }

      // Deactivates the properties that the user choose in case that he changes his plan to a minor one;
      if (
        deactivateProperties !== undefined &&
        deactivateProperties.length > 0
      ) {
        const deactivatepropertiesBody: PropertyActivationDto = {
          propertyId: deactivateProperties,
          userId: userData._id,
          isActive: false,
          session: session,
        }
        await this.activateDeactivateProperties(deactivatepropertiesBody)
      }

      await this.handleLocationCreation(propertyData.address, session)
      await this.handlePropertyTypeCreation(propertyData.propertyType, session)
      await this.handleTagsCreation(propertyData.tags)

      const createdProperty = await this.createProperty(
        propertyData,
        ownerInfo,
        owner._id,
      )

      await session.commitTransaction()

      return {
        createdProperty,
        creditCardBrand: owner?.paymentData?.creditCardInfo
          ? owner?.paymentData?.creditCardInfo?.creditCardBrand
          : null,
        paymentValue: null,
        userAlreadyExists,
        user,
      }
    } catch (error) {
      await session.abortTransaction()
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      return { message: error.message }
    } finally {
      session.endSession()
    }
  }

  private async startSession() {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    return db.startSession()
  }

  private async getUserAndOwner(
    userData: any,
    isPlanFree: boolean,
    plan: any,
    session: any,
    coupon?: string,
  ): Promise<any> {
    let userAlreadyExists: boolean
    let user: IUser | null = null
    let owner: any = null
    let ownerPreviousPlan
    let ownerData: IOwnerData

    const {
      _id: userId,
      email,
      username,
      address,
      cpf,
      phone,
      cellPhone,
      wwpNumber,
      profilePicture,
    } = userData

    const plans = await this.planModel.find().lean()
    const plusPlan = plans.find(e => e.name === 'Locale Plus')
    const selectedPlan = plans.find(e => e._id.toString() === plan.toString())

    // Verificar se o usuário já está cadastrado
    if (userId) {
      user = await this.userModel.findById(userId).lean()

      if (!user || !user.isActive) {
        throw new NotFoundException(
          `O usuário com o id : ${userId} não foi encontrado.`,
        )
      }

      userAlreadyExists = true
    } else {
      // Verificar se o e-mail do usuário já existe no banco de dados
      const userEmailExists = await this.userModel.findOne({
        email,
        isActive: true,
      })

      if (!userEmailExists) {
        // Gerar uma senha aleatória para um novo usuário
        const randomPassword: string = generateRandomString()

        const registerUserParams = {
          email,
          password: randomPassword,
          passwordConfirmation: randomPassword,
        }

        const sendPasswordEmailParams: SendAutoGeneratedPasswordDto = {
          email,
          username,
          password: randomPassword,
        }

        // Registrar um novo usuário
        const registerUser = await this.authService.register(registerUserParams)
        await sendAutoGeneratedPasswordEmail(sendPasswordEmailParams)

        // Atualizar os dados do usuário no banco de dados
        await this.userModel.updateOne(
          { _id: registerUser._id },
          {
            cpf,
            address,
            username,
            email,
          },
          { session },
        )

        // Buscar o usuário atualizado
        user = await this.userModel.findById(registerUser._id)
      } else {
        user = userEmailExists
      }

      userAlreadyExists = false
    }

    // Verificar se o usuário já é anunciante;
    const ownerExists = await this.ownerModel
      .findOne({
        userId: user._id,
        isActive: true,
      })
      .lean()

    if (!ownerExists) {
      // Criar um novo proprietário
      if (!coupon) {
        ownerData = {
          name: username,
          phone,
          cellPhone,
          wwpNumber,
          plan,
          picture: profilePicture,
          userId: user._id,
          email,
          isActive: true,
          adCredits: selectedPlan?.commonAd,
          highlightCredits: selectedPlan?.highlightAd,
        }
      } else {
        ownerData = {
          name: username,
          phone,
          cellPhone,
          wwpNumber,
          plan: plusPlan._id,
          picture: profilePicture,
          userId: user._id,
          email,
          isActive: true,
          adCredits: plusPlan.commonAd,
          highlightCredits: plusPlan.highlightAd,
        }
      }

      if (!isPlanFree && !coupon) {
        if (!selectedPlan) {
          throw new Error(`Plano com o id: ${plan} não encontrado.`)
        }

        ownerData.adCredits = selectedPlan.commonAd
        ownerData.highlightCredits = selectedPlan.highlightAd
      }

      const createdOwner = await this.ownerModel.create([ownerData], {
        session,
      })
      owner = createdOwner[0].toObject()

      if (coupon) {
        await this.couponModel.updateOne(
          { coupon },
          { $set: { isActive: false } },
          { session },
        )
      }
    } else {
      owner = ownerExists
      owner.plan = selectedPlan._id
      owner.adCredits = selectedPlan.commonAd
      owner.highlightCredits = selectedPlan.highlightAd
      ownerPreviousPlan = ownerExists.plan
    }

    return {
      owner,
      userAlreadyExists,
      user,
      selectedPlan,
      ownerPreviousPlan,
    }
  }

  private async handleCustomer(
    isPlanFree: boolean,
    owner: any,
    userData: UserData,
    cellPhone: string,
    phone: string,
    creditCardData: any,
  ) {
    let cpfCnpj: string
    let updatedOwner
    const { address, email } = userData
    const { paymentData, name } = owner

    if (!isPlanFree && !paymentData?.customerId) {
      cpfCnpj = creditCardData?.cpfCnpj
      // Cadastrar customer no payment api;
      const response = await axios.post(
        `${process.env.PAYMENT_URL}/customer`,
        {
          name,
          email,
          phone,
          cellPhone,
          postalCode: address.zipCode,
          description: 'Confirmação de criação de id de cliente',
          cpfCnpj,
          addressNumber: address.streetNumber,
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

        updatedOwner = {
          ...owner,
          paymentData: {
            ...owner.paymentData,
            customerId: customer.id,
            cpfCnpj,
          },
        }

        try {
          await this.ownerModel.updateOne(
            { _id: owner._id },
            { $set: updatedOwner },
          )

          return { updatedOwner }
        } catch (error) {
          throw new Error(
            `Falha ao atualizar o anunciante: ${response.statusText}`,
          )
        }
      } else {
        throw new Error(`Falha ao criar o cliente: ${response.statusText}`)
      }
    }

    updatedOwner = owner

    return { updatedOwner }
  }

  private async handlePayment(
    isPlanFree: boolean,
    selectedPlan: IPlan,
    owner: IOwner,
    userData: UserData,
    creditCardData: CreditCardData,
    cellPhone: string,
    ownerPreviousPlan: string,
    propertiesToDeactivate: number,
    session: any,
  ) {
    let cpfCnpj: string
    let expiry: string
    let cardName: string
    let cardNumber: string
    let ccv: string

    let currentDate
    let year
    let month
    let day
    let formattedDate
    let expiryYear
    let expiryMonth

    let price
    let selectedPlanId

    let updatedOwner = { ...owner }

    const { address, email } = userData
    const { paymentData, adCredits, plan: ownerActualPlan } = owner
    const previousPlanData = await this.planModel.findById(ownerPreviousPlan)

    if (selectedPlan) {
      price = selectedPlan.price
      selectedPlanId = selectedPlan._id
    } else {
      price = previousPlanData?.price
      selectedPlanId = previousPlanData?._id
    }

    let newAdCredits
    let newHighlightCredits

    if (creditCardData !== undefined) {
      cpfCnpj = creditCardData.cpfCnpj
      cardName = creditCardData.cardName
      cardNumber = creditCardData.cardNumber
      expiry = creditCardData.expiry
      ccv = creditCardData.ccv

      currentDate = new Date()
      year = currentDate.getFullYear()
      month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      day = currentDate.getDate().toString().padStart(2, '0')
      formattedDate = `${year}-${month}-${day}`
      expiryYear = `20${expiry[2] + expiry[3]}`
      expiryMonth = `${expiry[0] + expiry[1]}`
    }

    const planIdString = selectedPlanId.toString()
    const ownerActualPlanString = ownerActualPlan.toString()

    // Usuário mudou de plano pago;
    if (!isPlanFree && ownerActualPlanString !== planIdString) {
      if (!paymentData?.creditCardInfo?.creditCardToken) {
        const response = await axios.post(
          `${process.env.PAYMENT_URL}/payment/subscription`,
          {
            billingType: 'CREDIT_CARD',
            cycle: 'MONTHLY',
            customer: paymentData.customerId,
            value: price,
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
              postalCode: address.zipCode,
              addressNumber: address.streetNumber,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASAAS_API_KEY || '',
            },
          },
        )

        if (response.status >= 200 && response.status < 300) {
          // Se a resposta for bem-sucedida, manipule os dados da resposta
          const responseData = response.data

          // Atribuir os valores da resposta às variáveis
          const creditCardInfo = responseData.creditCard
          const subscriptionId = responseData.id

          newAdCredits =
            selectedPlan.price > previousPlanData.price
              ? owner.adCredits + selectedPlan.commonAd
              : owner.adCredits - selectedPlan.commonAd - propertiesToDeactivate

          newHighlightCredits =
            selectedPlan.price > previousPlanData.price
              ? owner.highlightCredits + selectedPlan.highlightAd
              : owner.highlightCredits - selectedPlan.highlightAd

          updatedOwner = {
            ...owner,
            plan: selectedPlan._id,
            adCredits: newAdCredits - 1,
            highlightCredits: newHighlightCredits,
            paymentData: {
              ...owner.paymentData,
              creditCardInfo,
              subscriptionId,
            },
          }

          try {
            await this.ownerModel.updateOne(
              { _id: updatedOwner._id },
              { $set: updatedOwner },
            )
          } catch (error) {
            throw new Error(
              `Falha ao atualizar o anunciante: ${response.statusText}`,
            )
          }
        } else {
          throw new Error(`Falha ao gerar a cobrança: ${response.statusText}`)
        }
      } else {
        //Buscar a assinatura do usuário para verificar a data de cobrança e usar o token;
        const subscriptionId = owner.paymentData.subscriptionId
        const response = await axios.get(
          `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              access_token: process.env.ASAAS_API_KEY || '',
            },
          },
        )

        if (response.status >= 200 && response.status < 300) {
          const subscription = response.data
          const nextDueDate = subscription.nextDueDate

          if (
            adCredits < 1 ||
            (adCredits === 0 && ownerActualPlanString !== planIdString)
          ) {
            // Caso em que o usuário não tem mais créditos e selecionou outro plano
            if (selectedPlanId !== ownerActualPlan) {
              const subscriptionId = paymentData.subscriptionId
              const priceDifference =
                price > previousPlanData.price
                  ? price - previousPlanData.price
                  : price

              const response = await axios.post(
                //Atualiza o valor do plano;
                `${process.env.PAYMENT_URL}/payment/update-subscription/${subscriptionId}`,
                {
                  billingType: 'CREDIT_CARD',
                  cycle: 'MONTHLY',
                  customer: paymentData.customerId,
                  value: priceDifference,
                  nextDueDate,
                  updatePendingPayments: true,
                  creditCardToken: paymentData.creditCardInfo.creditCardToken,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    access_token: process.env.ASAAS_API_KEY || '',
                  },
                  timeout: 100000,
                },
              )

              if (response.status <= 200 && response.status > 300) {
                throw new Error(
                  `Falha ao atualizar a assinatura: ${response.statusText}`,
                )
              }

              const responseData = response.data
              const updatedSubscriptionId = responseData.id
              const newAdcredits = owner.adCredits - 1 + selectedPlan.commonAd
              const newHighlightCredits =
                owner.highlightCredits > 0
                  ? owner.highlightCredits - 1 + selectedPlan.highlightAd
                  : owner.highlightCredits

              //Atualizar os créditos do usuário
              await this.ownerModel.updateOne(
                { _id: owner._id },
                {
                  $set: {
                    adCredits: newAdcredits,
                    highlightCredits: newHighlightCredits,
                    plan: selectedPlan._id,
                    'paymentData.subscriptionId': updatedSubscriptionId,
                  },
                },
                { session },
              )
            } else {
              throw new Error(
                `O usuário não tem mais créditos disponíveis para anunciar.`,
              )
            }
            // Chamada pra api de pagamento "subscription" para pagar a diferença de valor no caso de o usuário já ter seus dados de cartão salvos no banco;

            // To-do: Pra mostrar os dados do cartão na tela tem que usar SSL (HTTPS);

            // To-do: Implementar timeout de 60s para evitar duplicidade e bloqueio do cartão

            // To-do: Verificar a necessidade de passar o remoteIp do usuário na req;
            if (
              selectedPlan.price > previousPlanData.price &&
              previousPlanData.price > 0
            ) {
              const priceDifference =
                price > previousPlanData.price
                  ? price - previousPlanData.price
                  : price
              const response = await axios.post(
                `${process.env.PAYMENT_URL}/payment/subscription`,
                {
                  billingType: 'CREDIT_CARD',
                  cycle: 'MONTHLY',
                  customer: paymentData.customerId,
                  value: priceDifference,
                  dueDate: formattedDate,
                  creditCardToken: paymentData.creditCardInfo.creditCardToken,
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
                  `Falha ao gerar a cobrança: ${response.statusText}`,
                )
              }
            }
          }

          try {
            // Fazer a atualização do plano
            await axios.post(
              `${process.env.PAYMENT_URL}/payment/update-subscription/${subscriptionId}`,
              {
                value: selectedPlan.price,
                updatePendingPayments: true,
                description: `Assinatura do plano ${selectedPlan.name}`,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  access_token: process.env.ASAAS_API_KEY || '',
                },
              },
            )

            newAdCredits =
              selectedPlan.price > previousPlanData.price
                ? owner.adCredits + selectedPlan.commonAd
                : selectedPlan.commonAd

            newHighlightCredits =
              selectedPlan.price > previousPlanData.price
                ? owner.highlightCredits + selectedPlan.highlightAd
                : selectedPlan.highlightAd

            try {
              const result = await this.ownerModel.updateOne(
                { _id: owner._id },
                {
                  adCredits: newAdCredits - 1,
                  highlightCredits: newHighlightCredits,
                  plan: selectedPlan._id,
                },
                { session },
              )

              if (result.modifiedCount < 0) {
                throw new Error(
                  `Não foi possível atualizar os créditos do proprietário.`,
                )
              }
            } catch (error) {
              throw new Error(
                `Não foi possível atualizar os créditos do proprietário.`,
              )
            }
          } catch (error) {}
        } else {
          throw new NotFoundException('Assinatura não encontrada.')
        }
      }
    } else {
      // Usuário selecionou o plano grátis ou o mesmo plano que já tem;
      if (owner.adCredits > 0) {
        // Fazer a assinatura caso ainda não tenha;
        if (!owner?.paymentData?.subscriptionId && !isPlanFree) {
          const response = await axios.post(
            `${process.env.PAYMENT_URL}/payment/subscription`,
            {
              billingType: 'CREDIT_CARD',
              cycle: 'MONTHLY',
              customer: paymentData.customerId,
              value: price,
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
                postalCode: address.zipCode,
                addressNumber: address.streetNumber,
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
                access_token: process.env.ASAAS_API_KEY || '',
              },
            },
          )

          if (response.status >= 200 && response.status < 300) {
            // Se a resposta for bem-sucedida, manipule os dados da resposta
            const responseData = response.data

            // Atribuir os valores da resposta às variáveis
            const creditCardInfo = responseData.creditCard
            const subscriptionId = responseData.id

            // Condicional dos créditos para casos em que já havia um plano anterior ou não;
            if (!previousPlanData) {
              newAdCredits = selectedPlan.commonAd
              newHighlightCredits = selectedPlan.highlightAd
            } else {
              newAdCredits =
                selectedPlan.price > previousPlanData.price
                  ? owner.adCredits + selectedPlan.commonAd
                  : owner.adCredits - selectedPlan.commonAd

              newHighlightCredits =
                selectedPlan.price > previousPlanData.price
                  ? owner.highlightCredits + selectedPlan.highlightAd
                  : owner.highlightCredits - selectedPlan.highlightAd
            }

            updatedOwner = {
              ...owner,
              plan: selectedPlan._id,
              adCredits: newAdCredits - 1,
              highlightCredits: newHighlightCredits,
              paymentData: {
                ...owner.paymentData,
                creditCardInfo,
                subscriptionId,
              },
            }

            // Atualiza o owner;
            await this.ownerModel.updateOne(
              { _id: updatedOwner._id },
              { $set: updatedOwner },
              { session },
            )
          } else {
            updatedOwner = {
              ...owner,
              adCredits: owner.adCredits - 1,
            }

            // Atualiza o owner;
            await this.ownerModel.updateOne(
              { _id: updatedOwner._id },
              { $set: updatedOwner },
              { session },
            )
          }
        } else {
          if (owner.paymentData?.subscriptionId) {
            // Cancelar a assinatura
            const { data } = await axios.delete(
              `${process.env.PAYMENT_URL}/payment/subscription/${owner?.paymentData?.subscriptionId}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  access_token: process.env.ASSAS_API_KEY || '',
                },
              },
            )

            const success = data.deleted

            if (!success) {
              throw new Error('Não foi possível remover a assinatura')
            }

            updatedOwner.paymentData.creditCardInfo = {
              creditCardBrand: '',
              creditCardNumber: '',
              creditCardToken: '',
            }
            updatedOwner.paymentData.subscriptionId = ''

            updatedOwner = {
              ...updatedOwner,
              adCredits: owner.adCredits - 1,
            }

            // Atualiza o owner;
            await this.ownerModel.updateOne(
              { _id: updatedOwner._id },
              { $set: updatedOwner },
              { session },
            )
          }
        }
      } else {
        throw new BadRequestException(
          `Não há mais créditos para fazer anúncios`,
        )
      }
    }
  }

  private async handleLocationCreation(address: any, session: any) {
    await this.createOrUpdateLocation('city', address.city, session)
    await this.createOrUpdateLocation('uf', address.uf, session)
    await this.createOrUpdateLocation('streetName', address.streetName, session)
    await this.createOrUpdateLocation(
      'neighborhood',
      address.neighborhood,
      session,
    )
  }

  private async createOrUpdateLocation(
    category: string,
    name: string,
    session: any,
  ) {
    const foundLocation = await this.locationModel
      .findOne({ name, category })
      .lean()

    if (!foundLocation) {
      // Se a localização não existir, criar uma nova
      await this.locationModel.create([{ name, category }], { session })
    } else {
      // Se a localização já existir, não é necessário fazer nada
      return
    }
  }

  private async handlePropertyTypeCreation(propertyType: any, session: any) {
    const foundPropertyType = await this.propertyTypeModel
      .findOne({ name: propertyType })
      .lean()

    if (!foundPropertyType) {
      // Se o tipo de propriedade não existir, criar um novo
      await this.propertyTypeModel.create([{ name: propertyType }], { session })
    } else {
      // Se o tipo de propriedade já existir, não é necessário fazer nada
      return
    }
  }

  private async handleTagsCreation(tags: any[]) {
    if (tags && tags.length > 0) {
      const tagObjects: any = tags.map(tag => ({
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
  }

  private async createProperty(
    propertyData: any,
    ownerInfo: any,
    ownerId: string,
  ) {
    // Adds the owner id to property doc;
    propertyData.owner = ownerId

    // Adds owner info object to the property doc;
    propertyData.ownerInfo = { ...ownerInfo, picture: '' }

    // Creates the prperty on DB;
    const createdProperty = await this.propertyModel.create(propertyData)

    return createdProperty
  }

  private async activateDeactivateProperties(
    propertyActivationDto: PropertyActivationDto,
  ) {
    try {
      const { isActive, propertyId, userId, session } = propertyActivationDto

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

      // Mudar os não selecionados para inativo?
      if (!isActive) {
        await this.propertyModel.updateMany(
          { _id: { $in: propertyId } },
          { $set: { isActive: isActive } },
          session,
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
            session,
          )

          await this.ownerModel.updateOne(
            { userId: userId },
            { $set: { adCredits: propertyOwner.adCredits - 1 } },
            session,
          )
        }
      }
    } catch (error) {
      throw new Error(`Não foi possível desativar os imóveis do usuário.`)
    }
  }
}
