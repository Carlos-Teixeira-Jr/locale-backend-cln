import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'

export class PropertyMetadataDto {
  @IsString()
  type: string

  @IsNumber()
  amount: number
}

export class PropertyGeolocationDto {
  @IsOptional()
  @IsString()
  type: string

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates?: number[] = undefined
}

export class PropertyIsActiveDto {
  @IsBoolean()
  type: boolean

  @IsBoolean()
  default: boolean
}

export class PropertyOwnerInfoDto {
  @IsString()
  name: string

  @IsString()
  picture: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones: string[]

  @IsOptional()
  @IsString()
  creci?: string

  @IsString()
  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  wwpNumber: string
}

export class PropertySizeDto {
  @IsNumber()
  width: number

  @IsNumber()
  height: number

  @IsNotEmpty()
  @IsDefined()
  @IsNumber()
  totalArea: number

  @IsOptional()
  @IsNumber()
  useableArea: number

  constructor(data?: Partial<PropertySizeDto>) {
    Object.assign(this, data)

    if (this.width && this.height && !this.totalArea) {
      this.totalArea = this.width * this.height
    }
  }
}

export class PropertyPricesDto {
  @IsString()
  type: string

  @IsNumber()
  value: number
}

export class PropertyAddressDto {
  @IsString()
  zipCode: string

  @IsString()
  city: string

  @IsString()
  uf: string

  @IsString()
  streetName: string

  @IsString()
  streetNumber: string

  @IsString()
  complement: string

  @IsString()
  neighborhood: string
}

export class PropertyDto {
  @IsString()
  @Validate(IDValidator)
  id?: string

  @IsString()
  adType: string

  @IsString()
  adSubtype: string

  @IsString()
  propertyType: string

  @IsString()
  propertySubtype: string

  @IsString()
  announcementCode: string

  @ValidateNested()
  address: PropertyAddressDto

  @IsString()
  description: string

  @IsArray()
  @ValidateNested()
  metadata: PropertyMetadataDto[]

  @IsOptional()
  @ValidateNested()
  geolocation: PropertyGeolocationDto

  @IsArray()
  @IsString({ each: true })
  images: string[]

  @ValidateNested()
  isActive: PropertyIsActiveDto

  @ValidateNested()
  ownerInfo: PropertyOwnerInfoDto

  @ValidateNested()
  size: PropertySizeDto

  @IsArray()
  @IsString({ each: true })
  tags: string[]

  @IsArray()
  @IsString({ each: true })
  condominiumTags: string[]

  @IsArray()
  @ValidateNested({ each: true })
  prices: PropertyPricesDto[]

  @IsString()
  youtubeLink: string
}
