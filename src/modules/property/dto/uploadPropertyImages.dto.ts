import { IsNotEmpty, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema } from 'mongoose'

export class UploadPropertyImagesDto {
  @IsNotEmpty()
  @Validate(IDValidator)
  propertyId: Schema.Types.ObjectId
}
