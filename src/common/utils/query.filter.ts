import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsBoolean, IsOptional } from 'class-validator'

export class PageQueryFilter {
  @ApiProperty({
    description: 'Number of items to be returned',
    default: 25,
    required: false,
  })
  @Transform(element =>
    element &&
    element.value &&
    Number(element.value) >= 0 &&
    Number(element.value) <= 25
      ? Number(element.value)
      : 25,
  )
  @IsOptional()
  limit?: number = 25

  @ApiProperty({
    description: 'Page number to be returned',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Transform(element =>
    element && element.value && Number(element.value) > 0
      ? Number(element.value) - 1
      : 0,
  )
  page?: number = 0
}

export class NeedCountQueryFilter extends PageQueryFilter {
  @ApiProperty({ required: false })
  @Transform(({ value }) => Boolean(value))
  @IsOptional()
  @IsBoolean()
  need_count?: boolean
}

export class CommonQueryFilter extends NeedCountQueryFilter {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform((element: any) => JSON.parse(element.value))
  @IsArray()
  show?: any

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform((element: any) => JSON.parse(element.value))
  filter?: any = []

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform((element: any) => JSON.parse(element.value))
  sort?: any = []
}
