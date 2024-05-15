import { BadRequestException, Injectable, LoggerService } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CouponModelName, ICoupon } from 'common/schemas/Coupon.schema'
import { generateRandomString } from 'common/utils/generateRandomPassword'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { Model } from 'mongoose'

@Injectable()
export class CouponService {
  constructor(
    @InjectorLoggerService(CouponService.name)
    private readonly logger: LoggerService,
    @InjectModel(CouponModelName)
    private readonly couponModel: Model<ICoupon>,
  ) {}

  async findOneCoupon(couponCode: string): Promise<ICoupon> {
    try {
      this.logger.log({ couponCode }, 'start find one coupon > [service]')

      const coupon = await this.couponModel.findOne({
        coupon: couponCode,
      })

      if (!coupon || !coupon.isActive) {
        throw new BadRequestException('Cupom de desconto inválido.')
      }

      return coupon
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }

  async createCoupon(): Promise<ICoupon> {
    try {
      this.logger.log({}, 'start create coupon > [service]')

      const code = await generateRandomString()

      const coupon = await this.couponModel.create({
        coupon: code,
        discount: 100,
        isActive: true,
      })

      if (!coupon) {
        throw new BadRequestException(
          'Não foi possível criar o cupom de desconto.',
        )
      }

      return coupon
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }
}
