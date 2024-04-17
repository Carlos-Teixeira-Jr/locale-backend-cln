import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { IPayment, PaymentModelName } from 'common/schemas/Payment.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import mongoose, { Date, Model, Schema } from 'mongoose'
import { CreatePaymentDto } from './dto/createpayment.dto'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { ObjectId } from 'mongodb'
import { CreditsDto, IncreaseCreditsDto } from './dto/increase-credits.dto'
import axios, { AxiosResponse } from 'axios'
import { env } from 'process'
import { IPlan, PlanModelName } from 'common/schemas/Plan.schema'

type HandleUpdateSubscription = {
  success: boolean,
  newCreditsPrice: number,
  nextDueDate: Date
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectorLoggerService(PaymentService.name)
    private readonly logger: LoggerService,
    @InjectModel(PaymentModelName)
    private readonly paymentModel: Model<IPayment>,
    @InjectModel(OwnerModelName)
    private readonly ownerModel: Model<IOwner>,
    @InjectModel(PlanModelName)
    private readonly planModel: Model<IPlan>
  ) {}

  private async startSession() {
    const mongodbUri = `${process.env.DB_HOST}`
    const db = await mongoose.createConnection(mongodbUri).asPromise()
    return db.startSession()
  }

  async createOne(
    owner_id: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<IPayment> {
    try {
      this.logger.log({}, 'start createOne')

      const APIResponse = true

      const foundOwner = await this.ownerModel.findById({
        _id: new ObjectId(owner_id),
      })

      if (!foundOwner) {
        throw new NotFoundException(
          `O proprietário com o owner_id: ${owner_id} não foi encontrado`,
        )
      }
      if (!APIResponse) {
        throw new BadRequestException(
          `A API de pagamento não conseguiu processar o pagamento`,
        )
      }

      const paymentData = { ...createPaymentDto, owner_id }

      const createdPayment = await this.paymentModel.create(paymentData)

      return createdPayment
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async increaseCredits(
    increaseCreditsDto: IncreaseCreditsDto,
    ownerId: Schema.Types.ObjectId,
  ): Promise<{ success: boolean }> {
    const session = await this.startSession();
    try {
      await session.startTransaction()
      this.logger.log({}, 'start increaseCredits > [service]')

      const { credits } = increaseCreditsDto
      const commonCredits = []
      const highlightCredits = []
      let paymentData

      credits.forEach(element => {
        if (element.type === 'adCredits') {
          commonCredits.push(element)
        } else if (element.type === 'highlightCredits') {
          highlightCredits.push(element)
        }
      })

      const owner = await this.ownerModel.findById(ownerId)

      if (!owner) {
        throw new Error(
          `O proprietário com o id: ${ownerId} não foi encontrado.`,
        )
      }

      const ownerPlan = await this.planModel.findById(owner.plan);

      if (ownerPlan.name !== 'Locale Plus') {
        throw new Error(
          `O proprietário com o id: ${ownerId} não possui uma conta Locale Plus.`,
        )
      }

      paymentData = owner.paymentData

      // Atualizar a subscription do usuário;
      const { success } = await this.handleUpdateSubscription(
        paymentData,
        commonCredits,
        highlightCredits,
      )

      // Fazer a cobrança da compra de créditos;
      // if (success) {
      //   const { success: charged } = await this.chargeNewCredits(
      //     newCreditsPrice,
      //     nextDueDate,
      //     paymentData
      //   )
      // }

      // Atualiza a quantidade de créditos do usuário
      if (success) {
        const updateCredits = await this.ownerModel.updateOne(
          {
            _id: ownerId,
          },
          {
            adCredits: owner.adCredits + commonCredits[0].amount,
            highlightCredits: owner.highlightCredits + highlightCredits[0].amount,
          },
          { session }
        )

        if (updateCredits.modifiedCount < 0) {
          throw new Error(
            `Não foi possível atualizar os créditos do proprietário.`,
          )
        }
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

  async handleUpdateSubscription(
    paymentData: any,
    commonCredits: CreditsDto[],
    highlighCredits: CreditsDto[],
  ): Promise<HandleUpdateSubscription> {
    try {
      this.logger.log({}, 'start handleUpdateSubscription > [service]')

      const { subscriptionId } = paymentData
      const { customerId } = paymentData
      const { creditCardToken } = paymentData.creditCardInfo

      // Processa o valor total a cobrar imediatamente;
      const commonCreditsPrice = process.env.COMMON_CREDITS_PRICE
      const highlightCreditsPrice = process.env.HIGHLIGHT_CREDITS_PRICE
      const totalCommonCreditsPrice =
        commonCredits[0].amount * Number(commonCreditsPrice)
      const totalHighlightCreditsPrice =
        highlighCredits[0].amount * Number(highlightCreditsPrice)
      const newCreditsPrice =
        totalCommonCreditsPrice + totalHighlightCreditsPrice
      let totalPrice

      let nextDueDate
      // Buscar a assinatura do usuário para pegar a data de cobrança do cartão;
      const ownerSubscription: AxiosResponse = await axios.get(
        `${process.env.PAYMENT_URL}/payment/subscription/${subscriptionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            access_token: process.env.ASAAS_API_KEY || '',
          },
        },
      )

      if (ownerSubscription.status <= 200 && ownerSubscription.status > 300) {
        throw new Error(
          `Falha ao buscar a assinatura: ${ownerSubscription.statusText}`,
        )
      }

      if (ownerSubscription.status >= 200 && ownerSubscription.status < 300) {
        nextDueDate = ownerSubscription.data.nextDueDate
        totalPrice = ownerSubscription.data.value + newCreditsPrice
        const response = await axios.post(
          //Atualiza o valor do plano;
          `${process.env.PAYMENT_URL}/payment/update-subscription/${subscriptionId}`,
          {
            billingType: 'CREDIT_CARD',
            cycle: 'MONTHLY',
            customer: customerId,
            value: totalPrice,
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

      return {
        success: true,
        newCreditsPrice,
        nextDueDate
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  // async chargeNewCredits(
  //   newCreditsPrice: number,
  //   nextDueDate: Date,
  //   paymentData: any
  // ): Promise<{ success: boolean }> {
  //   try {
  //     const { customerId } = paymentData;
  //     const { creditCardToken } = paymentData.creditCardInfo;

  //     const response = await axios.post(
  //       `${process.env.PAYMENT_URL}/payment/subscription`,
  //       {
  //         billingType: 'CREDIT_CARD',
  //         cycle: 'MONTHLY',
  //         customer: customerId,
  //         value: newCreditsPrice,
  //         dueDate: nextDueDate,
  //         creditCardToken
  //       },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           access_token: process.env.ASAAS_API_KEY || '',
  //         },
  //       },
  //     )

  //     return { success: true }
  //   } catch (error) {
  //     this.logger.error({
  //       error: JSON.stringify(error),
  //       exception: '> exception',
  //     })
  //     throw error
  //   }
  // }
}
