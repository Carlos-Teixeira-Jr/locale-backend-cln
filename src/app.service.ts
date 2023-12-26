import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { SendEmailToLocaleDto } from 'app-dto/sendEmailToLocale.dto'
import { IProperty, PropertyModelName } from 'common/schemas/Property.schema'
import { ITag, TagModelName } from 'common/schemas/Tag.schema'
import { senEmailToLocale } from 'common/utils/emailHandler'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { TagDto } from 'modules/property/dto/tag.dto'
import { Model } from 'mongoose'

@Injectable()
export class AppService {
  constructor(
    @InjectorLoggerService(AppService.name)
    private readonly logger: LoggerService,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
    @InjectModel(TagModelName)
    private readonly tagModel: Model<ITag>,
  ) {}

  async shortcut(queryFilter: CommonQueryFilter): Promise<any> {
    try {
      this.logger.log({}, 'start shortcut')
      const { page, limit, filter } = queryFilter
      const skip = page * limit
      const filterTags = filter.map(filter => filter.tags).flat()
      let finalFilter: any = {}

      if (
        filterTags.includes('aceita pets') ||
        filterTags.includes('mobiliada') ||
        filterTags.includes('casa grande')
      ) {
        finalFilter = { tags: { $in: filterTags } }
      } else {
        return { error: 'Valor de filter não permitido' }
      }

      const docs: IProperty[] = await this.propertyModel
        .find(finalFilter)
        .skip(skip)
        .limit(limit)
        .lean()

      let count
      let totalPages

      if (queryFilter.need_count) {
        count = await this.propertyModel.estimatedDocumentCount(finalFilter)
        totalPages = Math.ceil(count / limit)
      }

      return {
        docs,
        page,
        ...(count && { totalPages }),
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findAllTags(): Promise<{ name: string; amount: number }[]> {
    try {
      this.logger.log({}, 'start findAllTags')

      const tags = await this.tagModel
        .find()
        .sort({ name: 1 })
        .collation({ locale: 'pt', strength: 2 })
        .select({ _id: 0, name: 1, amount: 1 })
        .lean()

      return tags
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async createTag(tagDto: TagDto): Promise<string[]> {
    try {
      this.logger.log({}, 'start createTag')

      const { tags } = tagDto

      const tagObjects: any = tags.map(tag => ({
        updateOne: {
          filter: { name: tag },
          update: {
            $inc: { amount: 1 },
          },
          upsert: true,
        },
      }))

      await this.tagModel.bulkWrite(tagObjects)

      return tags
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async sendEmailToLocale(sendEmailToLocaleDto: SendEmailToLocaleDto) {
    try {
      this.logger.log({}, 'start send email to locale')

      await senEmailToLocale(sendEmailToLocaleDto)

      return { success: true }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
