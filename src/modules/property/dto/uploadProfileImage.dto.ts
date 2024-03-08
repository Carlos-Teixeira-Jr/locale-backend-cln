import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class UploadProfileImageDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId
}
