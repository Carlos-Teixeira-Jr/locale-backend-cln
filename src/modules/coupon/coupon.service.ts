import { BadRequestException, Injectable, LoggerService, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CouponModelName, ICoupon } from 'common/schemas/Coupon.schema'
import { generateRandomString } from 'common/utils/generateRandomPassword'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { Model } from 'mongoose'
import { CouponDto } from './dto/coupon.dto'
import { IPlan, PlanModelName } from 'common/schemas/Plan.schema'

@Injectable()
export class CouponService {
  constructor(
    @InjectorLoggerService(CouponService.name)
    private readonly logger: LoggerService,
    @InjectModel(CouponModelName)
    private readonly couponModel: Model<ICoupon>,
    @InjectModel(PlanModelName)
    private readonly planModel: Model<IPlan>,
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

  async createCoupon(couponDto: CouponDto): Promise<ICoupon> {
    try {
      this.logger.log({}, 'start create coupon > [service]');

      const {
        plan,
        commonAd,
        highlightAd,
      } = couponDto;

      const code = await generateRandomString()

      const formattedCoupon = `LOCALE-${code}`;

      const planData: IPlan = await this.planModel.findOne({ name: plan }).lean();

      if (!planData) {
        throw new NotFoundException(`Não há nenhum plano com o nome ${plan}.`)
      }

      const createdCoupon = await this.couponModel.create({
        coupon: formattedCoupon,
        plan: planData._id,
        commonAd,
        highlightAd,
        isActive: true,
      })

      if (!createdCoupon) {
        throw new BadRequestException(
          'Não foi possível criar o cupom de desconto.',
        )
      }

      return createdCoupon
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }
}
