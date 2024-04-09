import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class GetUserByEmailDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string
}
