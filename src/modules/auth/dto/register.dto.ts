import { IsNotEmpty, IsString } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  password: string

  @IsNotEmpty()
  @IsString()
  passwordConfirmation: string
}
