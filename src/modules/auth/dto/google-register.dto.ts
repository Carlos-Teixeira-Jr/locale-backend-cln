import { IsNotEmpty, IsString } from 'class-validator'

export class SocialRegisterDto {
  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsNotEmpty()
  @IsString()
  picture: string
}
