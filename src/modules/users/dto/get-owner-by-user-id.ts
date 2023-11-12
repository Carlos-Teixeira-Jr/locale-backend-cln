import { IsNotEmpty, IsString } from 'class-validator'

export class GetOwnerByUserId {
  @IsString()
  @IsNotEmpty()
  _id: string
}
