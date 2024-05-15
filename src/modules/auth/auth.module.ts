import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from 'modules/users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { jwtConstants } from './constants'
import { PassportModule } from '@nestjs/passport'
import { LocalStrategy } from './strategies/local.strategy'
import { JwtStrategy } from './strategies/jtw.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { UsersService } from 'modules/users/users.service'
import { MongooseModule } from '@nestjs/mongoose'
import { UserModelName, UserSchema } from 'common/schemas/User.schema'
import { NetworkModelName, NetworkSchema } from 'common/schemas/Network.schema'
import { OwnerModelName, OwnerSchema } from 'common/schemas/Owner.schema'
import {
  PropertyModelName,
  PropertySchema,
} from 'common/schemas/Property.schema'
import { TagModelName, TagSchema } from 'common/schemas/Tag.schema'
import {
  LocationModelName,
  LocationSchema,
} from 'common/schemas/Location.schema'
import { PlanModelName, PlanSchema } from 'common/schemas/Plan.schema'
import { CouponModelName, CouponSchema } from 'common/schemas/Coupon.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserModelName,
        schema: UserSchema,
      },
      {
        name: NetworkModelName,
        schema: NetworkSchema,
      },
      {
        name: OwnerModelName,
        schema: OwnerSchema,
      },
      {
        name: PropertyModelName,
        schema: PropertySchema,
      },
      {
        name: TagModelName,
        schema: TagSchema,
      },
      {
        name: LocationModelName,
        schema: LocationSchema,
      },
      {
        name: PlanModelName,
        schema: PlanSchema,
      },
      {
        name: CouponModelName,
        schema: CouponSchema,
      },
    ]),
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    UsersService,
  ],
})
export class AuthModule {}
