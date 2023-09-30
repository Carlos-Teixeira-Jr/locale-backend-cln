import { Body, Controller, Param, Post } from '@nestjs/common'
import { LoggerService } from 'modules/logger/logger.service'
import { PaymentService } from './payment.service'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { IPayment, OwnerParams } from 'common/schemas/Payment.schema'
import { CreatePaymentDto } from './dto/createpayment.dto'

@Controller('payment')
export class PaymentController {
  constructor(
    @InjectorLoggerService(PaymentController.name)
    private readonly logger: LoggerService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post('/:owner_id')
  async createOne(
    @Param() params: OwnerParams,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<IPayment> {
    this.logger.log({}, 'createOne')

    const owner_id = params.owner_id

    return this.paymentService.createOne(owner_id, createPaymentDto)
  }
}
