import {
  IsCreditCard,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import { IOwner } from 'common/schemas/Owner.schema'
import { IPlan } from 'common/schemas/Plan.schema'

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
  ccv: string

  @IsNotEmpty()
  @IsString()
  cpfCnpj: string

  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  phone: string

  @IsNotEmpty()
  @IsObject()
  plan: IPlan

  @IsNotEmpty()
  @IsString()
  zipCode: string

  @IsNotEmpty()
  @IsString()
  streetNumber: string

  @IsNotEmpty()
  @IsObject()
  owner: IOwner

  @IsOptional()
  @IsString()
  customerId: string
}
