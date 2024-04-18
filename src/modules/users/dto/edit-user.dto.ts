import { Type } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { PropertyAddressDto } from 'modules/property/dto/property.dto'
import { Schema } from 'mongoose'

export class CreditCard {
  @IsString()
  cardNumber: string

  @IsString()
  cardName: string

  @IsString()
  ccv: string

  @IsString()
  expiry: string

  @IsString()
  cpfCnpj: string
}

export class PaymentData {
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CreditCard)
  creditCard: CreditCard
}

export class OwnerDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  _id: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsString()
  ownername: string

  @IsNotEmpty()
  @Validate(IDValidator)
  userId: string

  @IsOptional()
  @IsString()
  phone: string

  @IsOptional()
  @IsString()
  cellPhone: string

  @IsNumber()
  adCredits: number

  @IsOptional()
  @Validate(IDValidator)
  plan: Schema.Types.ObjectId

  @IsString()
  profilePicture: string

  // @IsOptional()
  // @IsObject()
  // @ValidateNested({ each: true })
  // @Type(() => PaymentData)
  // paymentData: PaymentData
}

export class UserDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  id: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsString()
  username: string

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  cpf: string

  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => PropertyAddressDto)
  address: PropertyAddressDto

  @IsString()
  @IsOptional()
  profilePicture?: string
}

export class EditPasswordDto {
  @IsNotEmpty()
  @IsString()
  password: string

  @IsNotEmpty()
  @IsString()
  passwordConfirmattion: string
}

export class EditUserDto {
  @IsNotEmpty()
  @Type(() => UserDto)
  user: UserDto

  @IsOptional()
  owner: OwnerDto

  @IsOptional()
  @Type(() => EditPasswordDto)
  password: EditPasswordDto

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CreditCard)
  creditCard: CreditCard
}
