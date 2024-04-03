import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class SocialRegisterDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsNotEmpty()
  @IsString()
  picture: string
}
