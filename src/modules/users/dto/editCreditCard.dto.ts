import { IsCreditCard, IsNotEmpty, IsString } from 'class-validator'

export class EditCreditCardDto {
  @IsNotEmpty()
  @IsString()
  cardName: string

  @IsNotEmpty()
  @IsCreditCard()
  cardNumber: string

  @IsNotEmpty()
  @IsString()
  expiry: string

  @IsNotEmpty()
  @IsString()
  cvc: string
}
