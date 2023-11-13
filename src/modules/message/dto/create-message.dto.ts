import { IsNotEmpty, IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  phone: string

  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  message: string

  @IsNotEmpty()
  @Validate(IDValidator)
  ownerId: Schema.Types.ObjectId

  @IsNotEmpty()
  @Validate(IDValidator)
  propertyId: Schema.Types.ObjectId
}
