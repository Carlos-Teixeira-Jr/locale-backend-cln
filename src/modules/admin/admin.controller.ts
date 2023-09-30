import { Controller, Get, Param } from '@nestjs/common'
import { AdminService } from './admin.service'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { GetPropertyParams } from 'modules/property/dto/getProperty.params'

@Controller('admin')
export class AdminController {
  constructor(
    @InjectorLoggerService(AdminController.name)
    private readonly logger: LoggerService,
    private readonly adminService: AdminService,
  ) {}

  @Get('/edit-property/:id')
  async findOne(@Param() params: GetPropertyParams): Promise<any> {
    this.logger.log({}, 'findOne')
    this.logger.info(params.id, 'params')
    return await this.adminService.findOne(params.id)
  }
}
