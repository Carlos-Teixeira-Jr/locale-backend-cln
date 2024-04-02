import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class GetPropertyParams {
  @IsNotEmpty()
  @Validate(IDValidator)
  id: Schema.Types.ObjectId
}
