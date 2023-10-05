import { Type } from 'class-transformer'
import {
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

export class OwnerDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  id: Schema.Types.ObjectId

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
  email: string

  @IsNotEmpty()
  @IsString()
  cpf: string

  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => PropertyAddressDto)
  address: PropertyAddressDto
}

export class EditUserDto {
  @IsNotEmpty()
  @Type(() => UserDto)
  user: UserDto

  @IsOptional()
  owner: OwnerDto
}
