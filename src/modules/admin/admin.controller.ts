import { Body, Controller, Get, Param } from '@nestjs/common'
import { AdminService } from './admin.service'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { GetPropertyParams } from 'modules/property/dto/getProperty.params'
import { Schema } from 'mongoose'

@Controller('admin')
export class AdminController {
  constructor(
    @InjectorLoggerService(AdminController.name)
    private readonly logger: LoggerService,
    private readonly adminService: AdminService,
  ) {}

  @Get('/edit-property/:id')
  async findOne(
    @Param() propertyId: Schema.Types.ObjectId,
    @Body() getPropertyParams: GetPropertyParams
  ): Promise<any> {
    this.logger.log({propertyId}, 'findOne property > [controller]')
    return await this.adminService.findOne(getPropertyParams, propertyId)
  }
}
