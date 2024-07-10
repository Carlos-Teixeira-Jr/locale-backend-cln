import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import { IOwner } from 'common/schemas/Owner.schema'
import { IPlan } from 'common/schemas/Plan.schema'
import { IUser } from 'common/schemas/User.schema'
import { ICreditCard } from './creditCard.dto'
import { ClientSession } from 'mongoose'

export class PlanTransitionDto {
  @IsNotEmpty()
  @IsObject()
  owner: IOwner

  @IsNotEmpty()
  user: IUser

  @IsNotEmpty()
  prevPlan: IPlan

  @IsNotEmpty()
  newPlan: IPlan

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  propertiesToDeactivate: string[]

  @IsNotEmpty()
  creditCard: ICreditCard

  @IsNotEmpty()
  @IsBoolean()
  isCreate: boolean

  @IsNotEmpty()
  @IsArray()
  ownerActiveProperties: any[]

  @IsOptional()
  session: ClientSession
}
