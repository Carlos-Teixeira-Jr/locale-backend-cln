import { IsCreditCard, IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  value: number

  @IsNotEmpty()
  @IsCreditCard()
  @IsString()
  cardNumber: string

  @IsNotEmpty()
  @IsString()
  cardName: string

  @IsNotEmpty()
  @IsString()
  cardExpiry: string

  @IsNotEmpty()
  @IsString()
  cvc: string
}
