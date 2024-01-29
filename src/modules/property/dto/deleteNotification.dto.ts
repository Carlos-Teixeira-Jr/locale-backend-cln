import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class DeleteNotificationDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  _id: Schema.Types.ObjectId
}
