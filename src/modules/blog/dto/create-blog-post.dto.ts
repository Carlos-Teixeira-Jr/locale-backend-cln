import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class IPostProps {
  @IsNotEmpty()
  @IsString()
  subImage: string

  @IsNotEmpty()
  @IsString()
  subTitle: string

  @IsNotEmpty()
  @IsString()
  text: string
}

export class CreateBlogPostDto {
  @IsNotEmpty()
  @IsString()
  title: string

  @IsNotEmpty()
  @IsString()
  resume: string

  @IsNotEmpty()
  @IsNumber()
  timeToRead: number

  @IsNotEmpty()
  @IsString()
  author: string

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  tags: string[]

  @IsNotEmpty()
  @IsString()
  img: string

  @IsNotEmpty()
  @IsArray()
  post: IPostProps[]
}
