import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateAdminDto } from './dto/create-admin.dto'
import { UpdateAdminDto } from './dto/update-admin.dto'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { InjectModel } from '@nestjs/mongoose'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
import { Model } from 'mongoose'

@Injectable()
export class AdminService {
  constructor(
    @InjectorLoggerService(AdminService.name)
    private readonly logger: LoggerService,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
  ) {}

  create(_createAdminDto: CreateAdminDto) {
    return 'This action adds a new admin'
  }

  findAll() {
    return `This action returns all admin`
  }

  async findOne(id: string): Promise<IProperty> {
    try {
      this.logger.log({}, 'start findOne')

      const property: IProperty = await this.propertyModel.findById(id).lean()

      if (!property) {
        throw new NotFoundException(`O id ${id} não foi encontrado`)
      }
      return property
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  update(id: number, _updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`
  }

  remove(id: number) {
    return `This action removes a #${id} admin`
  }
}
