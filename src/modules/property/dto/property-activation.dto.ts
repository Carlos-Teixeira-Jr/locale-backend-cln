import { IsBoolean, IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class PropertyActivationDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  propertyId: Schema.Types.ObjectId

  @IsNotEmpty()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean
}
