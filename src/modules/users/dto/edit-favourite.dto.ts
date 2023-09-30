import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class EditFavouriteDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId

  @IsNotEmpty()
  @Validate(IDValidator)
  propertyId: Schema.Types.ObjectId
}
