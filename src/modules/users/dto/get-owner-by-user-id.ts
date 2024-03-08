import { IsNotEmpty, IsString } from 'class-validator'
import { Schema } from 'mongoose'

export class GetOwnerByUserId {
  @IsString()
  @IsNotEmpty()
  userId: Schema.Types.ObjectId
}
