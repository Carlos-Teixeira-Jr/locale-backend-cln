import { Module } from '@nestjs/common'
import { PropertyTypeController } from './property-type.controller'
import { PropertyTypeService } from './property-type.service'
import { MongooseModule } from '@nestjs/mongoose'
import {
  PropertyTypeModelName,
  PropertyTypeSchema,
} from 'common/schemas/PropertyType.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PropertyTypeModelName,
        schema: PropertyTypeSchema,
      },
    ]),
  ],
  controllers: [PropertyTypeController],
  providers: [PropertyTypeService],
  exports: [PropertyTypeService],
})
export class PropertyTypeModule {}
