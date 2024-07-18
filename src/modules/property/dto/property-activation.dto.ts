import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  Validate,
} from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class PropertyActivationDto {
  @IsNotEmpty()
  @IsArray()
  propertyId: string[]

  @IsNotEmpty()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean

  @IsOptional()
  session: any

  @IsOptional()
  updatedOwner: any
}
