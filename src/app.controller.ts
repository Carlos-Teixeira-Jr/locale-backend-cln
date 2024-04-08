import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { HealthCheckResponse } from 'common/responses/healthCheck.response'
import { LoggerService } from 'modules/logger/logger.service'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { AppService } from 'app.service'
import { TagDto } from 'modules/property/dto/tag.dto'
import { AuthService } from 'modules/auth/auth.service'
import { SendEmailToLocaleDto } from 'app-dto/sendEmailToLocale.dto'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ITag } from 'common/schemas/Tag.schema'

@ApiTags('app')
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

  @ApiOperation({
    summary: 'Returns all tags.',
  })
  @Get('/tag')
  async findAllTags(): Promise<ITag[]> {
    this.logger.log({}, 'find all tags > [controller]')
    return await this.appService.findAllTags()
  }

  @Post('/tag')
  async createTag(@Body() tagDto: TagDto): Promise<any> {
    this.logger.log({}, 'createTag')
    return await this.appService.createTag(tagDto)
  }

  @ApiOperation({
    summary: 'Send an email to Locale admin mailbox.',
  })
  @Post('/send-email-to-locale')
  async sendEmailToLocale(
    @Body() sendEmailToLocaleDto: SendEmailToLocaleDto,
  ): Promise<{ success: true }> {
    this.logger.log({ sendEmailToLocaleDto }, 'email to locale')
    return await this.appService.sendEmailToLocale(sendEmailToLocaleDto)
  }
}
