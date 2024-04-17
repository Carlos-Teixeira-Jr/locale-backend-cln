import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { MongooseModule } from '@nestjs/mongoose'
import { PaymentModelName, PaymentSchema } from 'common/schemas/Payment.schema'
import { OwnerModelName, OwnerSchema } from 'common/schemas/Owner.schema'
import { PlanModelName, PlanSchema } from 'common/schemas/Plan.schema'

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
      {
        name: PlanModelName,
        schema: PlanSchema,
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
