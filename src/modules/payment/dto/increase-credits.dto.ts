import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";

export class CreditsDto {
  @IsString()
  type: string

  @IsNumber()
  amount: number
}

export class IncreaseCreditsDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreditsDto)
  credits: CreditsDto[]
}