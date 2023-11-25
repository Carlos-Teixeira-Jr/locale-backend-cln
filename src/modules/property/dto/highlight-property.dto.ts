import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class HighlightPropertyDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  propertyId: { type: Schema.Types.ObjectId }

  @IsNotEmpty()
  @Validate(IDValidator)
  userId: { type: Schema.Types.ObjectId }
}
