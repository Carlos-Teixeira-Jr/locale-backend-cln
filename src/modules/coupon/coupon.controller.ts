import { Controller, Get, LoggerService, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CouponService } from './coupon.service'
import { ICoupon } from 'common/schemas/Coupon.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'

@ApiTags('coupons')
@Controller('coupon')
export class CouponController {
  constructor(
    @InjectorLoggerService(CouponController.name)
    private readonly logger: LoggerService,
    private readonly couponService: CouponService,
  ) {}

  @Get('/:couponCode')
  @ApiOperation({
    summary: 'Find one coupon by his coupon code.',
  })
  async findOneCoupon(
    @Param('couponCode') couponCode: string,
  ): Promise<ICoupon> {
    const coupon = await this.couponService.findOneCoupon(couponCode)

    return coupon
  }

  @Post()
  @ApiOperation({
    summary: 'Create a coupon on database.',
  })
  async createCoupon(): Promise<ICoupon> {
    this.logger.log({}, 'start create coupon > [controller]')
    const createdCoupon = await this.couponService.createCoupon()

    return createdCoupon
  }
}
