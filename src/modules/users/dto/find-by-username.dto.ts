import { IsNotEmpty, IsString } from 'class-validator'

export class FindByUsernameDto {
  @IsNotEmpty()
  @IsString()
  username: string
}
