import { Module } from '@nestjs/common'
import { LocationController } from './location.controller'
import { LocationService } from './location.service'
import { MongooseModule } from '@nestjs/mongoose'
import {
  LocationModelName,
  LocationSchema,
} from 'common/schemas/Location.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: LocationModelName,
        schema: LocationSchema,
      },
    ]),
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
