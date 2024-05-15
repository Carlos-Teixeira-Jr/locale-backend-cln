import { Module } from '@nestjs/common'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import { MongooseModule } from '@nestjs/mongoose'
import { CouponModelName, CouponSchema } from 'common/schemas/Coupon.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CouponModelName,
        schema: CouponSchema,
      },
    ]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
})
export class CouponModule {}
