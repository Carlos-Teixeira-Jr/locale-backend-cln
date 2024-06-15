import { IsBoolean, IsNotEmpty, IsOptional, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class GetPropertyParams {
  @IsOptional()
  @Validate(IDValidator)
  userId: Schema.Types.ObjectId

  @IsNotEmpty()
  @IsBoolean()
  isEdit: boolean

  @IsNotEmpty()
  @IsBoolean()
  increment: boolean
}
