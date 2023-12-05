import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class DeleteUserDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId
}
