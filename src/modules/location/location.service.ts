import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LocationModelName, ILocation } from 'common/schemas/Location.schema'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
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
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
  ) {}

  async findAll(): Promise<ILocation[]> {
    try {
      this.logger.log({}, 'start findAll > [location service]');

      let activeCities = []

      const cities = (await this.locationModel.find().lean()) as ILocation[]

      // Verificar se realmente existem imóveis com o location encontrado;
      for (let i = 0; i < cities.length; i++) {
        const category = cities[i].category
        const name = cities[i].name
        const query = { [`address.${category}`]: name, isActive: true }
        const propLocation = await this.propertyModel.findOne(query)

        if (propLocation) {
          activeCities.push(cities[i])
        }
      }

      return activeCities
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
