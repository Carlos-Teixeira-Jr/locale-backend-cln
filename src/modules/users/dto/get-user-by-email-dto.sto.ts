import { IsNotEmpty, IsString } from 'class-validator'

export class GetUserByEmailDto {
  @IsString()
  @IsNotEmpty()
  email: string
}
