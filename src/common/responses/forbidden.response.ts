import { ApiProperty } from '@nestjs/swagger'

export class ForbiddenResponse {
  @ApiProperty({
    example: 403,
  })
  statusCode: number

  @ApiProperty({
    example: 'Forbidden',
  })
  message: string
}
