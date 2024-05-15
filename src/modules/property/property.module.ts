import { Module } from '@nestjs/common'
import { PropertyController } from './property.controller'
import { MongooseModule } from '@nestjs/mongoose'
import {
  PropertyModelName,
  PropertySchema,
} from 'common/schemas/Property.schema'
import { PropertyService } from './services/property.service'
import { OwnerModelName, OwnerSchema } from 'common/schemas/Owner.schema'
import {
  LocationModelName,
  LocationSchema,
} from 'common/schemas/Location.schema'
import {
  PropertyTypeModelName,
  PropertyTypeSchema,
} from 'common/schemas/PropertyType.schema'
import {
  MessageOwnerModelName,
  MessageOwnerSchema,
} from 'common/schemas/Message_owner.schema'
import { MessageService } from 'modules/message/message.service'
import { UserModelName, UserSchema } from 'common/schemas/User.schema'
import { PlanModelName, PlanSchema } from 'common/schemas/Plan.schema'
import { AuthService } from 'modules/auth/auth.service'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from 'modules/users/users.service'
import { TagModelName, TagSchema } from 'common/schemas/Tag.schema'
import { PropertyFilter_Service } from './services/property-filter.service'
import { CreateProperty_Service } from './services/create-property.service'
import { CouponModelName, CouponSchema } from 'common/schemas/Coupon.schema'

const services = [
  PropertyService,
  PropertyFilter_Service,
  CreateProperty_Service,
]

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PropertyModelName,
        schema: PropertySchema,
      },
      {
        name: OwnerModelName,
        schema: OwnerSchema,
      },
      {
        name: LocationModelName,
        schema: LocationSchema,
      },
      {
        name: PropertyTypeModelName,
        schema: PropertyTypeSchema,
      },
      {
        name: MessageOwnerModelName,
        schema: MessageOwnerSchema,
      },
      {
        name: UserModelName,
        schema: UserSchema,
      },
      {
        name: PlanModelName,
        schema: PlanSchema,
      },
      {
        name: TagModelName,
        schema: TagSchema,
      },
      {
        name: CouponModelName,
        schema: CouponSchema,
      },
    ]),
  ],
  controllers: [PropertyController],
  providers: [
    ...services,
    MessageService,
    AuthService,
    JwtService,
    UsersService,
  ],
  exports: [PropertyService, CreateProperty_Service],
})
export class PropertyModule {}
