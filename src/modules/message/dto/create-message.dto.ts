import { IsNotEmpty, IsString } from 'class-validator'

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  phone: string

  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  message: string

  @IsNotEmpty()
  @IsString()
  ownerId: string

  @IsNotEmpty()
  @IsString()
  propertyId: string
}
