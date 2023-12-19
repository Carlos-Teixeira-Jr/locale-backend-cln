import { IsNotEmpty, IsString } from 'class-validator'

export class SendEmailToLocaleDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  telephone: string

  @IsNotEmpty()
  @IsString()
  message: string
}
