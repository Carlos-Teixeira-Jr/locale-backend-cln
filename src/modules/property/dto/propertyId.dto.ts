import { IsOptional, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class IdDto {
  @IsOptional()
  @Validate(IDValidator)
  propertyId: Schema.Types.ObjectId

  @IsOptional()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId
}
