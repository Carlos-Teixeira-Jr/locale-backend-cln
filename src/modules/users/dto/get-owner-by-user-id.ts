import { IsNotEmpty, IsString } from 'class-validator'

export class GetOwnerByUserId {
  @IsString()
  @IsNotEmpty()
  id: string
}
