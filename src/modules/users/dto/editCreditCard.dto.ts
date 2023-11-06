import { Type } from 'class-transformer'
import {
  IsCreditCard,
  IsNotEmpty,
  IsObject,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { PropertyAddressDto } from 'modules/property/dto/property.dto'
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
  cvc: string

  @IsNotEmpty()
  @IsString()
  cpf: string

  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  phone: string

  @IsNotEmpty()
  @Validate(IDValidator)
  plan: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address: PropertyAddressDto

  @IsNotEmpty()
  @Validate(IDValidator)
  owner: Schema.Types.ObjectId
}
