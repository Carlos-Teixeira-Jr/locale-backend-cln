import { IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'

export class GetUserDto {
  @IsString()
  @Validate(IDValidator)
  _id: string
}
