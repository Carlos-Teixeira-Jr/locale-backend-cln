import { IsNotEmpty, IsString } from 'class-validator'

export class LocalLoginDto {
  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  password: string
}
