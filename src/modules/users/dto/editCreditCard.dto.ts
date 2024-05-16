import {
  IsCreditCard,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator'
import { IOwner } from 'common/schemas/Owner.schema'
import { IPlan } from 'common/schemas/Plan.schema'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

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

  @IsOptional()
  @IsObject()
  plan: IPlan

  @IsNotEmpty()
  @IsString()
  zipCode: string

  @IsNotEmpty()
  @IsString()
  streetNumber: string

  @IsOptional()
  @IsObject()
  owner: IOwner

  @IsNotEmpty()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId

  @IsOptional()
  @IsString()
  customerId: string
}
