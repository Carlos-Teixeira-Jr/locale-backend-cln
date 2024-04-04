import { IsNumber, IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class GetPropertiesByOwnerDto {
  @IsString()
  @Validate(IDValidator)
  ownerId: Schema.Types.ObjectId

  @IsNumber()
  page: number
}
