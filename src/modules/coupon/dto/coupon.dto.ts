import { IsNotEmpty, IsNumber, IsOptional, IsString, Validate } from "class-validator";
import { IDValidator } from "common/validators/ID.validator";
import { Schema } from "mongoose";

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