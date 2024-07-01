import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CouponDto {
  @IsOptional()
  @IsNumber()
  commonAd: number

  @IsOptional()
  @IsNumber()
  highlightAd: number

  @IsOptional()
  @IsString()
  plan: string
}
