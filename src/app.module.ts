import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { LoggerModule } from 'modules/logger/logger.module'
import { AppController } from './app.controller'
import { LoggerService } from 'modules/logger/logger.service'
import { ErrorsInterceptor } from 'common/interceptors/errors.interceptor'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from 'modules/users/users.module'
import { AdminModule } from './modules/admin/admin.module'
import { PropertyModule } from './modules/property/property.module'
import { AppService } from 'app.service'
import {
  PropertyModelName,
  PropertySchema,
} from 'common/schemas/Property.schema'
import { TagModelName, TagSchema } from 'common/schemas/Tag.schema'
import { MessageModule } from './modules/message/message.module'
import { NotificationsModule } from './modules/notification/notification.module'
import { PaymentModule } from './modules/payment/payment.module'
import { PaymentController } from 'modules/payment/payment.controller'
import { PlanModelName, PlanSchema } from 'common/schemas/Plan.schema'
import { PlanModule } from 'modules/plan/plan.module'
import { PlanController } from 'modules/plan/plan.controller'
import { LocationModule } from './modules/location/location.module'
import { PropertyTypeModule } from './modules/property-type/property-type.module'
import { AuthService } from 'modules/auth/auth.service'
import { JwtService } from '@nestjs/jwt'
import { UserModelName, UserSchema } from 'common/schemas/User.schema'
import { CouponModule } from './modules/coupon/coupon.module'
import { BlogModule } from './modules/blog/blog.module'

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.DB_HOST}`, {
      dbName: process.env.DB_NAME,
      autoIndex: false,
      autoCreate: false,
    }),
    MongooseModule.forFeature([
      {
        name: PropertyModelName,
        schema: PropertySchema,
      },
      {
        name: TagModelName,
        schema: TagSchema,
      },
      {
        name: PlanModelName,
        schema: PlanSchema,
      },
      {
        name: UserModelName,
        schema: UserSchema,
      },
    ]),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot(),
    UsersModule,
    AuthModule,
    AdminModule,
    PropertyModule,
    MessageModule,
    NotificationsModule,
    PaymentModule,
    PlanModule,
    LocationModule,
    PropertyTypeModule,
    CouponModule,
    BlogModule,
  ],
  controllers: [AppController, PaymentController, PlanController],
  providers: [
    LoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorsInterceptor,
    },
    AppService,
    AuthService,
    JwtService,
  ],
  exports: [AppService],
})
export class AppModule {}
