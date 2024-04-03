import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LocalLoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  password: string
}
