import { Module } from '@nestjs/common'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import { MongooseModule } from '@nestjs/mongoose'
import { CouponModelName, CouponSchema } from 'common/schemas/Coupon.schema'
import { PlanModelName, PlanSchema } from 'common/schemas/Plan.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CouponModelName,
        schema: CouponSchema,
      },
      {
        name: PlanModelName,
        schema: PlanSchema,
      },
    ]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
})
export class CouponModule {}
