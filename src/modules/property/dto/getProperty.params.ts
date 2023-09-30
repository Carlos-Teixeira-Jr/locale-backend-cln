import { IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'

export class GetPropertyParams {
  @IsString()
  @Validate(IDValidator)
  id: string
}
