import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreatePlanDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsNumber()
  price: number

  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsNumber()
  commonAd: number

  @IsNotEmpty()
  @IsNumber()
  highlightAd: number

  @IsNotEmpty()
  @IsBoolean()
  smartAd: boolean

  @IsNotEmpty()
  @IsBoolean()
  managementArea: boolean
}
