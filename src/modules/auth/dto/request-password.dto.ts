import { IsNotEmpty, IsString } from 'class-validator'

export class RequestPasswordDto {
  @IsNotEmpty()
  @IsString()
  email: string
}
