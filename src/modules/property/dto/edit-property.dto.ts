import { Type } from 'class-transformer'
import {
  IsArray,
  IsOptional,
  IsObject,
  IsString,
  Validate,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator'
import {
  PropertyAddressDto,
  PropertyMetadataDto,
  PropertyPricesDto,
  PropertySizeDto,
} from './property.dto'
import { MetadataValidator } from 'common/validators/Metadata.validator'
import { Schema } from 'mongoose'
import { IDValidator } from 'common/validators/ID.validator'

export class EditPropertyDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  id: Schema.Types.ObjectId

  @IsOptional()
  @IsString()
  adType: string

  @IsOptional()
  @IsString()
  adSubtype: string

  @IsOptional()
  @IsString()
  propertyType: string

  @IsOptional()
  @IsString()
  propertySubtype: string

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address: PropertyAddressDto

  @IsOptional()
  @IsString()
  description: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyMetadataDto)
  @Validate(MetadataValidator)
  metadata: PropertyMetadataDto[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[]

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyPricesDto)
  prices: PropertyPricesDto[]

  @IsOptional()
  @IsString()
  youtubeLink: string
}
