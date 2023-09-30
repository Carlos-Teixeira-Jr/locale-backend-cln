import { IsNumber, IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'

export class GetPropertiesByOwnerDto {
  @IsString()
  @Validate(IDValidator)
  ownerId: string

  @IsNumber()
  page: number
}
