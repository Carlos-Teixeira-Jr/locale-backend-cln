import { IsNotEmpty, IsString } from 'class-validator'

export class ICreditCard {
  @IsNotEmpty()
  @IsString()
  cardName: string

  @IsNotEmpty()
  @IsString()
  cardNumber: string

  @IsNotEmpty()
  @IsString()
  expiry: string

  @IsNotEmpty()
  @IsString()
  ccv: string

  @IsNotEmpty()
  @IsString()
  cpfCnpj: string
}
