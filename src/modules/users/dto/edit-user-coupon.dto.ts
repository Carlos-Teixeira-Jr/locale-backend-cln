import { IsNotEmpty, IsString } from 'class-validator'
import { EditUserDto } from './edit-user.dto'

export class EditUserCouponDto extends EditUserDto {
  @IsNotEmpty()
  @IsString()
  coupon: string
}
