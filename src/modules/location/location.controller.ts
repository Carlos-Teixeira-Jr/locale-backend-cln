import { Controller, Get } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { LocationService } from './location.service'
import { ILocation } from 'common/schemas/Location.schema'

@Controller('Location')
export class LocationController {
  constructor(
    @InjectorLoggerService(LocationController.name)
    private readonly logger: LoggerService,
    private readonly locationService: LocationService,
  ) {}

  @Get()
  async findAll(): Promise<ILocation[]> {
    this.logger.log({}, 'findAll')
    return this.locationService.findAll()
  }
}
