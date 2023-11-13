import { Type } from 'class-transformer'
import {
  IsCreditCard,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { IOwner } from 'common/schemas/Owner.schema'
import { IPlan } from 'common/schemas/Plan.schema'
import { PropertyAddressDto } from 'modules/property/dto/property.dto'

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
  @IsObject()
  plan: IPlan

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address: PropertyAddressDto

  @IsNotEmpty()
  @IsObject()
  owner: IOwner

  @IsOptional()
  @IsString()
  customerId: string
}
