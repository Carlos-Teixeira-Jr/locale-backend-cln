import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  Validate,
  ValidateNested,
} from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class PropertyActivationDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  propertyId: string[]

  @IsNotEmpty()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean

  @IsOptional()
  session: any
}
