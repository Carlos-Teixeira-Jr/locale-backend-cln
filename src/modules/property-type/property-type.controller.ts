import { Controller, Get } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { PropertyTypeService } from './property-type.service'
import { IPropertyType } from 'common/schemas/PropertyType.schema'

@Controller('property-type')
export class PropertyTypeController {
  constructor(
    @InjectorLoggerService(PropertyTypeController.name)
    private readonly logger: LoggerService,
    private readonly propertyTypeService: PropertyTypeService,
  ) {}

  @Get()
  async findAll(): Promise<IPropertyType[]> {
    this.logger.log({}, 'findAll')
    return this.propertyTypeService.findAll()
  }
}
