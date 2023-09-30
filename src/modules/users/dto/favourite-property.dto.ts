import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class GetFavouritesByUserDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  id: Schema.Types.ObjectId
}
