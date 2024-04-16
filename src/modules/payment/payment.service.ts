import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { IPayment, PaymentModelName } from 'common/schemas/Payment.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model, Schema } from 'mongoose'
import { CreatePaymentDto } from './dto/createpayment.dto'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { ObjectId } from 'mongodb'
import { IncreaseCreditsDto } from './dto/increase-credits.dto'

@Injectable()
export class PaymentService {
  constructor(
    @InjectorLoggerService(PaymentService.name)
    private readonly logger: LoggerService,
    @InjectModel(PaymentModelName)
    private readonly paymentModel: Model<IPayment>,
    @InjectModel(OwnerModelName)
    private readonly ownerModel: Model<IOwner>,
  ) {}

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
    try {
      this.logger.log({}, 'start increaseCredits > [service]')

      const { credits } = increaseCreditsDto

      const commonCredits = []
      const highlightCredits = []

      credits.forEach(element => {
        if (element.type === 'adCredits') {
          commonCredits.push(element)
        } else if (element.type === 'highlightCredits') {
          highlightCredits.push(element)
        }
      })

      const owner = await this.ownerModel.findById(ownerId)

      if (!owner)
        throw new Error(
          `O proprietário com o id: ${ownerId} não foi encontrado.`,
        )

        // Atualiza a quantidade de créditos do usuário
      await this.ownerModel.updateOne(
        {
          _id: ownerId,
        },
        {
          adCredits: owner.adCredits + commonCredits[0].amount,
          highlightCredits: owner.highlightCredits + highlightCredits[0].amount,
        },
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
}
