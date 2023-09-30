import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
  IPropertyType,
  PropertyTypeModelName,
} from 'common/schemas/PropertyType.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model } from 'mongoose'

@Injectable()
export class PropertyTypeService {
  constructor(
    @InjectorLoggerService(PropertyTypeService.name)
    private readonly logger: LoggerService,
    @InjectModel(PropertyTypeModelName)
    private readonly propertyTypeModel: Model<IPropertyType>,
  ) {}

  async findAll(): Promise<IPropertyType[]> {
    try {
      this.logger.log({}, 'start findAll')

      const propertyTypes = await this.propertyTypeModel
        .find()
        .collation({ locale: 'pt', strength: 2 })
        .sort({ name: 1 })

      return propertyTypes
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
