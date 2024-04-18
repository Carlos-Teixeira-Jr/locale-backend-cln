import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { GetPropertyParams } from './dto/getProperty.params'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { CreatePropertyDto } from './dto/create-property.dto'
import { IFilterReturn, PropertyService } from './services/property.service'
import { GetPropertiesByOwnerDto } from './dto/getPropertiesByOwner.dto'
import { HighlightPropertyDto } from './dto/highlight-property.dto'
import { PropertyActivationDto } from './dto/property-activation.dto'
import { EditPropertyDto } from './dto/edit-property.dto'
import { IProperty } from 'common/schemas/Property.schema'
import { IOwnerPropertiesReturn } from './services/property.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Schema } from 'mongoose'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('property')
@Controller('property')
export class PropertyController {
  constructor(
    @InjectorLoggerService(PropertyController.name)
    private readonly logger: LoggerService,
    private readonly propertyService: PropertyService,
  ) {}

  @Get('/filter')
  @ApiOperation({
    summary:
      'Search properties based on filter params passed on the query and provides pagination data.',
  })
  async filter(
    @Query() queryFilter: CommonQueryFilter,
  ): Promise<IFilterReturn> {
    this.logger.log({}, 'filter')
    return await this.propertyService.filter(queryFilter)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Search a specific property based on the query params.',
  })
  async findOne(
    @Param() params: GetPropertyParams,
    @Query('isEdit') isEdit: boolean,
  ): Promise<IProperty> {
    this.logger.log({}, 'findOne')
    return await this.propertyService.findOne(params.id, isEdit)
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new property and save al relative data on database.',
  })
  async createOne(
    @Body() createPropertyDto: CreatePropertyDto,
  ): Promise<IProperty> {
    this.logger.log({}, 'createOne')

    return this.propertyService.createOne(createPropertyDto)
  }

  @Get('/announcementCode/:announcementCode')
  @ApiOperation({
    summary: 'Search a property based on his announcement code.',
  })
  async findByAnnouncementCode(
    @Param('announcementCode') announcementCode: string,
  ): Promise<IFilterReturn> {
    this.logger.log({}, 'findByAnnouncementCode')
    return this.propertyService.findByAnnouncementCode(announcementCode)
  }

  @Post('owner-properties')
  @ApiOperation({
    summary: 'Search all properties of an owner basedon his ownerId.',
  })
  async findByOwner(
    @Body() getPropertiesByOwnerDto: GetPropertiesByOwnerDto,
  ): Promise<IOwnerPropertiesReturn> {
    this.logger.log({}, 'start findByOwner > [controller]')

    return this.propertyService.findByOwner(getPropertiesByOwnerDto)
  }

  @Post('property-activation')
  @ApiOperation({
    summary: 'Deactivate a property based on his propertyId.',
  })
  async propertyActivation(
    @Body() propertyActivationDto: PropertyActivationDto,
  ) {
    this.logger.log({}, 'start propertyActivation > [controller]')
    return this.propertyService.propertyActivation(propertyActivationDto)
  }

  @Post('highlight-property')
  @ApiOperation({
    summary: 'Highlight a property based on his propertyId.',
  })
  async highlightProperty(@Body() highlightPropertyDto: HighlightPropertyDto) {
    return this.propertyService.highlightProperty(highlightPropertyDto)
  }

  @Post('edit-property')
  @ApiOperation({
    summary: 'Update infos of an specific property.',
  })
  async editProperty(@Body() editPropertyDto: EditPropertyDto) {
    return this.propertyService.editProperty(editPropertyDto)
  }

  @Post('upload-property-images')
  @ApiOperation({
    summary: 'Upload property images based on his propertyId.',
  })
  @UseInterceptors(
    FilesInterceptor('images', 50, {
      limits: {
        fileSize: 800 * 1024 * 1024,
      },
    }),
  )
  async uploadPropertyImages(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('propertyId') propertyId: Schema.Types.ObjectId,
  ) {
    this.logger.info({}, 'uploadPropertyImages > params')

    return await this.propertyService.uploadPropertyImages(files, propertyId)
  }

  @Post('upload-profile-image/:type')
  @ApiOperation({
    summary: 'Upload user profile image based on his userId.',
  })
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      limits: {
        fileSize: 1000 * 1024 * 1024,
      },
    }),
  )
  async uploadProfileImage(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('userId') userId: Schema.Types.ObjectId,
    @Param('type') type: string,
  ) {
    this.logger.info({}, 'uploadProfileImage > params')

    return await this.propertyService.uploadProfileImage(files, userId, type)
  }

  @Post('edit-property-images')
  @ApiOperation({
    summary: 'Update the images of an specific property.',
  })
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      limits: {
        fileSize: 1000 * 1024 * 1024,
      },
    }),
  )
  async editPropertyImages(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('data') body: string,
  ) {
    this.logger.info({}, 'edit property images > body')

    return await this.propertyService.editPropertyImages(files, body)
  }
}
