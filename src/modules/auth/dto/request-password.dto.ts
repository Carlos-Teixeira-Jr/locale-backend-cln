import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class RequestPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string
}
