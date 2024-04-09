import { IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class GetUserDto {
  @IsString()
  @Validate(IDValidator)
  _id: Schema.Types.ObjectId
}
