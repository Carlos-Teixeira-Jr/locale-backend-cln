import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { IPayment, PaymentModelName } from 'common/schemas/Payment.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model } from 'mongoose'
import { CreatePaymentDto } from './dto/createpayment.dto'
import { IOwner, OwnerModelName } from 'common/schemas/Owner.schema'
import { ObjectId } from 'mongodb'

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
}
