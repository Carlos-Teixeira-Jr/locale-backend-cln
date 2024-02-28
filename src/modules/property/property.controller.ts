import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
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
import { PropertyIdDto } from './dto/propertyId.dto'
import * as Busboy from 'busboy'
import { createWriteStream } from 'fs'
import path from 'path'
import { uploadFile } from 'common/utils/uploadImages'

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

  @Post('upload-images')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      limits: {
        fileSize: 1000 * 1024 * 1024,
      },
    }),
  )
  async uploadDropImageWithRarity(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('propertyId') propertyId: PropertyIdDto,
  ) {
    this.logger.info({}, 'uploadImages > params')

    return await this.propertyService.uploadImages(files, propertyId)
  }

  // @HttpCode(HttpStatus.CREATED)
  // @uploadFiles('filename')
  // @UseInterceptors(FilesInterceptor('filename'))
  // @Post('upload-file')
  // uploadMyFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
  //   console.log(files)
  // }

  @Post('upload-images')
  async uploadImages(@UploadedFile() file) {
    // const { headers } = req;

    // // Defina a função para notificar o progresso
    // const notifyProgress = (size: number) => {
    //   // Aqui você pode fazer o que desejar com o progresso do upload
    //   console.log(`Tamanho do arquivo atual: ${size} bytes`);
    // };

    // // Crie um manipulador de upload passando a função de notificação de progresso
    // const uploadHandler = createUploadHandler();

    // // Registre os eventos de upload, passando a função de notificação de progresso
    // const onFinish = () => {
    //   // Aqui você pode lidar com o final do upload
    //   res.status(200).send('Upload concluído com sucesso!');
    // };

    // const busboyInstance = uploadHandler.registerEvents(headers, onFinish, notifyProgress);

    // // Exemplo simples sem pipelineAsync:
    // req.pipe(busboyInstance);

    // // Responda à solicitação
    // res.status(200).send('Upload iniciado.');
    const busboy = new Busboy({ headers: file })

    busboy.on('file', function (file, filename) {
      const saveTo = path.join(__dirname, '../', 'uploads', filename)
      file.pipe(createWriteStream(saveTo))
    })

    busboy.on('finish', function () {
      console.log('File upload finished.')
    })

    file.pipe(busboy)
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('file'))
  async upload(@UploadedFiles() file: Array<Express.Multer.File>) {
    console.log(file)

    const images = await uploadFile(file, 'file')

    console.log(images)

    return images
  }
}
