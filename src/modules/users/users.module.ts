import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import {
  NetworkModelName,
  NetworkSchema,
} from '../../common/schemas/Network.schema'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { UserModelName, UserSchema } from 'common/schemas/User.schema'
import { OwnerModelName, OwnerSchema } from 'common/schemas/Owner.schema'
import {
  PropertyModelName,
  PropertySchema,
} from 'common/schemas/Property.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NetworkModelName,
        schema: NetworkSchema,
      },
      {
        name: UserModelName,
        schema: UserSchema,
      },
      {
        name: OwnerModelName,
        schema: OwnerSchema,
      },
      {
        name: PropertyModelName,
        schema: PropertySchema,
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
