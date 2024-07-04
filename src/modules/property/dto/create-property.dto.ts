import {
  IsString,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsObject,
  Validate,
  IsBoolean,
  IsCreditCard,
  IsEmail,
} from 'class-validator'
import {
  PropertyAddressDto,
  PropertyMetadataDto,
  PropertyGeolocationDto,
  PropertySizeDto,
  PropertyPricesDto,
  PropertyOwnerInfoDto,
} from './property.dto'
import { Type } from 'class-transformer'
import { MetadataValidator } from 'common/validators/Metadata.validator'
import { Schema } from 'mongoose'
import { IDValidator } from 'common/validators/ID.validator'

export class UserData {
  @IsOptional()
  @Validate(IDValidator)
  _id: Schema.Types.ObjectId

  @IsString()
  profilePicture: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address: PropertyAddressDto

  @IsNotEmpty()
  @IsString()
  cpf: string
}

export class PropertyData {
  @IsNotEmpty()
  @IsString()
  adType: string

  @IsNotEmpty()
  @IsString()
  adSubtype: string

  @IsNotEmpty()
  @IsString()
  propertyType: string

  @IsNotEmpty()
  @IsString()
  propertySubtype: string

  announcementCode: string = generateCode()

  @IsOptional()
  @Type(() => PropertyGeolocationDto)
  geolocation?: PropertyGeolocationDto

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address: PropertyAddressDto

  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyMetadataDto)
  @Validate(MetadataValidator)
  metadata: PropertyMetadataDto[]

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  images: string[]

  @IsObject()
  @ValidateNested()
  @Type(() => PropertySizeDto)
  size: PropertySizeDto

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  condominiumTags: string[]

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyPricesDto)
  prices: PropertyPricesDto[]

  @IsOptional()
  @IsString()
  youtubeLink: string

  @IsNotEmpty()
  @Validate(IDValidator)
  owner: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsObject()
  @Type(() => PropertyOwnerInfoDto)
  ownerInfo: PropertyOwnerInfoDto
}

export class CreditCardData {
  @IsNotEmpty()
  @IsString()
  cardName: string

  @IsNotEmpty()
  @IsCreditCard({ message: 'Número de cartão inválido' })
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

export class CreatePropertyDto {
  @IsNotEmpty()
  @Type(() => PropertyData)
  propertyData: PropertyData

  @IsOptional()
  @Type(() => UserData)
  userData: UserData

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreditCardData)
  creditCardData: CreditCardData

  @IsOptional()
  plan: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsBoolean()
  isPlanFree: boolean

  @IsOptional()
  @IsString()
  phone: string

  @IsOptional()
  @IsString()
  cellPhone: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deactivateProperties: string[]

  // @ValidateIf(o => o.creditsLeft !== null)
  // @IsNotEmpty()
  // @IsNumber()
  // creditsLeft: number | null

  @IsOptional()
  @IsString()
  coupon: string
}

const generateCode = (): string => {
  return Math.floor(Math.random() * 900000000000 + 100000000000)
    .toString()
    .slice(0, 12)
}
