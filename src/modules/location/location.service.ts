import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LocationModelName, ILocation } from 'common/schemas/Location.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model } from 'mongoose'

@Injectable()
export class LocationService {
  constructor(
    @InjectorLoggerService(LocationService.name)
    private readonly logger: LoggerService,
    @InjectModel(LocationModelName)
    private readonly locationModel: Model<ILocation>,
  ) {}

  async findAll(): Promise<ILocation[]> {
    try {
      this.logger.log({}, 'start findAll')

      const cities = await this.locationModel.find()

      return cities
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
