import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class HighlightPropertyDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  id: { type: Schema.Types.ObjectId }

  @IsNotEmpty()
  @Validate(IDValidator)
  owner: { type: Schema.Types.ObjectId }
}
