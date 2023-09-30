import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { HealthCheckResponse } from 'common/responses/healthCheck.response'
import { LoggerService } from 'modules/logger/logger.service'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { AppService } from 'app.service'
import { TagDto } from 'modules/property/dto/tag.dto'
import { AuthService } from 'modules/auth/auth.service'

@Controller()
export class AppController {
  constructor(
    @InjectorLoggerService(AppController.name)
    private readonly logger: LoggerService,
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  healthCheck(): HealthCheckResponse {
    this.logger.log({}, 'healthCheck')
    return {
      message: 'OK',
      uptime: process.uptime(),
      timestamp: new Date(),
    }
  }

  @Get('/shortcut/')
  async shortcut(@Query() queryFilter: CommonQueryFilter): Promise<any> {
    this.logger.log({}, 'homepageShortcut')
    return await this.appService.shortcut(queryFilter)
  }

  @Get('/tag')
  async findAllTags(): Promise<{ name: string; amount: number }[]> {
    this.logger.log({}, 'findAllTags')
    return await this.appService.findAllTags()
  }

  @Post('/tag')
  async createTag(@Body() tagDto: TagDto): Promise<any> {
    this.logger.log({}, 'createTag')
    return await this.appService.createTag(tagDto)
  }
}
