import { IsNotEmpty, IsString } from 'class-validator'

export class ReSendVerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  email: string
}
