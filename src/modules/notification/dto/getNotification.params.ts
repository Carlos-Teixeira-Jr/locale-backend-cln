import { IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class GetNotificationParams {
  @IsString()
  @Validate(IDValidator)
  id: Schema.Types.ObjectId
}
