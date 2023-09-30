import { IsNotEmpty, IsString } from 'class-validator'

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string

  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsString()
  type: string
}
