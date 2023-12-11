import { Body, Controller, Get, Param, Post, Query, Req, UploadedFiles, UseInterceptors } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { GetPropertyParams } from './dto/getProperty.params'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { CreatePropertyDto } from './dto/create-property.dto'
import {
  IFilterReturn,
  IFindByCodeReturn,
  PropertyService,
} from './property.service'
import { GetPropertiesByOwnerDto } from './dto/getPropertiesByOwner.dto'
import { HighlightPropertyDto } from './dto/highlight-property.dto'
import { PropertyActivationDto } from './dto/property-activation.dto'
import { EditPropertyDto } from './dto/edit-property.dto'
import { IProperty } from 'common/schemas/Property.schema'
import { IOwnerPropertiesReturn } from './property.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Express } from 'express';
import { Multer } from 'multer';
import { ImagesFormDataDto } from './dto/imagesFormData.dto'
@Controller('property')
export class PropertyController {
  constructor(
    @InjectorLoggerService(PropertyController.name)
    private readonly logger: LoggerService,
    private readonly propertyService: PropertyService,
  ) {}

  @Get('/filter')
  async filter(
    @Query() queryFilter: CommonQueryFilter,
  ): Promise<IFilterReturn> {
    this.logger.log({}, 'filter')
    return await this.propertyService.filter(queryFilter)
  }

  @Get(':id')
  async findOne(
    @Param() params: GetPropertyParams,
    @Query('isEdit') isEdit: boolean,
  ): Promise<IProperty> {
    this.logger.log({}, 'findOne')
    return await this.propertyService.findOne(params.id, isEdit)
  }

  @Post()
  async createOne(
    @Body() createPropertyDto: CreatePropertyDto,
  ): Promise<IProperty> {
    this.logger.log({}, 'createOne')
    return this.propertyService.createOne(createPropertyDto)
  }

  @Get('/announcementCode/:announcementCode')
  async findByAnnouncementCode(
    @Param('announcementCode') announcementCode: string,
  ): Promise<IFindByCodeReturn> {
    this.logger.log({}, 'findByAnnouncementCode')
    return this.propertyService.findByAnnouncementCode(announcementCode)
  }

  @Post('owner-properties')
  async findByOwner(
    @Body() getPropertiesByOwnerDto: GetPropertiesByOwnerDto,
  ): Promise<IOwnerPropertiesReturn> {
    return this.propertyService.findByOwner(getPropertiesByOwnerDto)
  }

  @Post('property-activation')
  async propertyActivation(
    @Body() propertyActivationDto: PropertyActivationDto,
  ) {
    return this.propertyService.propertyActivation(propertyActivationDto)
  }

  @Post('highlight-property')
  async highlightProperty(@Body() highlightPropertyDto: HighlightPropertyDto) {
    return this.propertyService.highlightProperty(highlightPropertyDto)
  }

  @Post('edit-property')
  async editProperty(@Body() editPropertyDto: EditPropertyDto) {
    return this.propertyService.editProperty(editPropertyDto)
  }

  @Post('uploadDropImageWithRarity')
  // @ApiBearerAuth()
  // @UploadFileAuth()
  @UseInterceptors(FilesInterceptor('images'))
  async uploadDropImageWithRarity(
    //@Body() imagesFormData: ImagesFormDataDto,
    //@Req() request: any,
    @UploadedFiles() files: Record<string, Multer.File[]>, // nome de id tem que ser 'images'
  ) {
    this.logger.info(
      {  },
      'uploadDropImageWithRarity > params',
    )

    return await this.propertyService.uploadDropImageWithRarity(files)
  }
}
