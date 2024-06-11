import { Module } from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminController } from './admin.controller'
import { MongooseModule } from '@nestjs/mongoose'
import {
  PropertyModelName,
  PropertySchema,
} from 'common/schemas/Property.schema'
import { OwnerModelName, OwnerSchema } from 'common/schemas/Owner.schema'

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
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
