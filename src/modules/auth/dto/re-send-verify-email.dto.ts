import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class ReSendVerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string
}
