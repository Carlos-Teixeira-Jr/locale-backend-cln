import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateAdminDto } from './dto/create-admin.dto'
import { UpdateAdminDto } from './dto/update-admin.dto'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { InjectModel } from '@nestjs/mongoose'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
import { Model, Schema } from 'mongoose'
import { GetPropertyParams } from 'modules/property/dto/getProperty.params'
import {
  getPropertyById,
  incrementViews,
} from 'modules/property/auxiliar/auxiliar-functions.service'
import { OwnerModelName, IOwner } from 'common/schemas/Owner.schema'

@Injectable()
export class AdminService {
  constructor(
    @InjectorLoggerService(AdminService.name)
    private readonly logger: LoggerService,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
    @InjectModel(OwnerModelName)
    private readonly ownerModel: Model<IOwner>,
  ) {}

  create(_createAdminDto: CreateAdminDto) {
    return 'This action adds a new admin'
  }

  findAll() {
    return `This action returns all admin`
  }

  async findOne(
    getPropertiesByOwner: GetPropertyParams,
    propertyId: Schema.Types.ObjectId,
  ): Promise<IProperty> {
    console.log('🚀 ~ PropertyService ~ propertyId:', propertyId)
    try {
      this.logger.log({}, 'start findOne Property > [property service]')

      const { userId, isEdit, increment } = getPropertiesByOwner

      let ownerId

      const property: IProperty = await getPropertyById(
        propertyId,
        this.propertyModel,
      )

      if (!property) throw new NotFoundException(`O imóvel não foi encontrado.`)

      const owner = await this.ownerModel.findOne({ userId }).lean()

      if (owner) {
        ownerId = owner._id
      }

      // Verificar se o usuário já acessou este imóvel ou se ele é o owner do imóvel;
      if (increment && !isEdit) {
        if (ownerId && property.owner !== ownerId) {
          await this.propertyModel.updateOne(
            { _id: propertyId },
            { $inc: { views: 1 } }
          )  
        } else {
          await this.propertyModel.updateOne(
            { _id: propertyId },
            { $inc: { views: 1 } }
          )  
        }
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
