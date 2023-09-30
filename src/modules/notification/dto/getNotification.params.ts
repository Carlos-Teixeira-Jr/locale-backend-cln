import { IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'

export class GetNotificationParams {
  @IsString()
  @Validate(IDValidator)
  id: string
}
