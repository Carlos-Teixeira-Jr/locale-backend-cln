import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class SendEmailToLocaleDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  telephone: string

  @IsNotEmpty()
  @IsString()
  message: string
}
