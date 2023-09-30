import { IsString, IsArray } from 'class-validator'

export class TagDto {
  @IsArray()
  @IsString({ each: true })
  tags: string[]
}
