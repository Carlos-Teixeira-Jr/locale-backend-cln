import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class FindByPropertyIdDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  propertyId: Schema.Types.ObjectId
}
