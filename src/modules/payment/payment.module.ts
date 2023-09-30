import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { MongooseModule } from '@nestjs/mongoose'
import { PaymentModelName, PaymentSchema } from 'common/schemas/Payment.schema'
import { OwnerModelName, OwnerSchema } from 'common/schemas/Owner.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PaymentModelName,
        schema: PaymentSchema,
      },
      {
        name: OwnerModelName,
        schema: OwnerSchema,
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
