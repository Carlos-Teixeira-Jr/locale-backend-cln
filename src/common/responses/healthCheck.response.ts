import { ApiProperty } from '@nestjs/swagger'

export class HealthCheckResponse {
  @ApiProperty({
    example: 'OK',
  })
  message: string

  @ApiProperty({
    example: 10.2312,
  })
  uptime: number

  @ApiProperty({
    example: new Date(),
  })
  timestamp: Date
}
