import { Injectable, LoggerService } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PropertyModelName, IProperty } from 'common/schemas/Property.schema'
import { CommonQueryFilter } from 'common/utils/query.filter'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { Model } from 'mongoose'
import { IFilterReturn } from './property.service'
import { cloneDeep } from 'lodash'

@Injectable()
export class PropertyFilter_Service {
  constructor(
    @InjectorLoggerService(PropertyFilter_Service.name)
    private readonly logger: LoggerService,
    @InjectModel(PropertyModelName)
    private readonly propertyModel: Model<IProperty>,
  ) {}

  async filter(queryFilter: CommonQueryFilter): Promise<IFilterReturn> {
    try {
      this.logger.log({}, 'start filter')

      const { page, limit, filter, sort, need_count } = queryFilter
      const originalPage = page + 1
      const highlightsSkip = page * limit

      //Format each query filter param to create a valid mongo query;
      const allFilters = this.getFilter(filter)

      //Format the query for the cases in wich query dont have filter params;
      const filtersOrNot = this.buildFiltersOrNot(allFilters)

      // Remove the geospatial indexes of the query;
      const { highlighFiltersWithoutGeolocation } =
        this.buildHighlightsFilters(allFilters)

      // Returns the total number of highlighted proeprties;
      const countHighlights = await this.getCountHighlights(
        highlighFiltersWithoutGeolocation,
      )

      //Returns the highlighted proeprties docs;
      const highlights = await this.getHighlights(
        highlighFiltersWithoutGeolocation,
        highlightsSkip,
        limit,
        sort,
      )

      //Returns the total number of docs returned based on the query filter params;
      const { countDocs } = await this.getFormattedQueryAndCountDocs(
        filtersOrNot,
      )

      // Returns all the docs and pagination data of non highlightred properties
      const { docs, totalPages, totalCount } = await this.getPropertyDocs(
        filtersOrNot,
        countHighlights,
        countDocs,
        limit,
        highlights,
        page,
        sort,
        need_count,
      )

      return {
        docs,
        page: originalPage,
        totalPages,
        totalCount,
      }
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  getFilter(filter: any) {
    //Adiciona cada tipo de filtragem à query;
    const allFilters = []

    filter.forEach(obj => {
      if (obj.adType) {
        allFilters.push({ adType: obj.adType })
      }
      if (obj.adSubtype) {
        allFilters.push({ adSubtype: obj.adSubtype })
      }
      if (obj.propertyType) {
        allFilters.push({
          propertyType: {
            $in: obj.propertyType,
          },
        })
      }
      if (obj.propertySubtype) {
        allFilters.push({ propertySubtype: obj.propertySubtype })
      }
      if (obj.announcementCode) {
        allFilters.push({ announcementCode: obj.announcementCode })
      }
      if (obj.bedroom) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'bedroom',
              amount: { $gte: obj.bedroom },
            },
          },
        })
      }
      if (obj.bathroom) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'bathroom',
              amount: { $gte: obj.bathroom },
            },
          },
        })
      }
      if (obj.parkingSpaces) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'parkingSpaces',
              amount: { $gte: obj.parkingSpaces },
            },
          },
        })
      }
      if (obj.floors) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'floors',
              amount: { $gte: obj.floors },
            },
          },
        })
      }
      if (obj.suites) {
        allFilters.push({
          metadata: {
            $elemMatch: {
              type: 'suites',
              amount: { $gte: obj.suites },
            },
          },
        })
      }
      if (obj.minPrice) {
        const formattedMinPrice = parseInt(obj.minPrice)
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'mensal',
              value: {
                $gte: formattedMinPrice,
              },
            },
          },
        })
      }
      if (obj.maxPrice) {
        const formattedMaxPrice = parseInt(obj.maxPrice)
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'mensal',
              value: {
                $lte: formattedMaxPrice,
              },
            },
          },
        })
      }
      if (obj.minCondominium) {
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'condominio',
              value: { $gte: parseInt(obj.minCondominium) },
            },
          },
        })
      }
      if (obj.maxCondominium) {
        allFilters.push({
          prices: {
            $elemMatch: {
              type: 'condominio',
              value: { $lte: parseInt(obj.maxCondominium) },
            },
          },
        })
      }
      if (obj.geolocation) {
        allFilters.push({
          geolocation: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [
                  obj.geolocation.longitude,
                  obj.geolocation.latitude,
                ],
              },
            },
          },
        })
      }
      if (obj.tags) {
        allFilters.push({
          tags: {
            $in: [new RegExp(obj.tags, 'i')],
          },
        })
      }
      if (obj.locationFilter && Array.isArray(obj.locationFilter)) {
        const locationFilters = obj.locationFilter
        const orQuery = []
        locationFilters.forEach(filter => {
          const { name, category } = filter
          if (name && category) {
            const query = {
              [`address.${category}`]: { $in: name },
            }
            orQuery.push(query)
          }
        })
        if (orQuery.length > 0) {
          allFilters.push({
            $or: orQuery,
          })
        }
      }
      if (obj.minSize) {
        allFilters.push({
          'size.totalArea': { $gte: obj.minSize },
        })
      }
    })

    allFilters.push({
      highlighted: false,
    })

    allFilters.push({
      isActive: true,
    })

    return allFilters
  }

  private buildFiltersOrNot(allFilters: any[]): any {
    return allFilters.length > 1
      ? { $and: [...allFilters] }
      : { highlighted: false }
  }

  private buildHighlightsFilters(allFilters: any[]): {
    highlighFiltersWithoutGeolocation: any[]
  } {
    const index = allFilters.findIndex(obj => obj.highlighted === false)
    let highlightsFilters
    if (index !== -1) {
      const clonedAllFilters = cloneDeep(allFilters)
      clonedAllFilters[index].highlighted = true
      highlightsFilters = clonedAllFilters
    }
    const highlighFiltersWithoutGeolocation = highlightsFilters
      ? highlightsFilters.filter(obj => !obj.hasOwnProperty('geolocation'))
      : []
    return { highlighFiltersWithoutGeolocation }
  }

  private async getCountHighlights(
    highlighFiltersWithoutGeolocation: any[],
  ): Promise<number> {
    return await this.propertyModel.countDocuments({
      $and: highlighFiltersWithoutGeolocation,
      highlighted: true,
    })
  }

  private async getHighlights(
    highlighFiltersWithoutGeolocation: any[],
    highlightsSkip: number,
    limit: number,
    sort: any[],
  ): Promise<IProperty[]> {
    return await this.propertyModel
      .find({ $and: highlighFiltersWithoutGeolocation })
      .skip(highlightsSkip)
      .sort(sort[0])
      .limit(limit)
      .lean()
  }

  private async getFormattedQueryAndCountDocs(
    filtersOrNot: any,
  ): Promise<{ countDocs: number }> {
    const filtersWithoutGeolocation = filtersOrNot.$and.filter(
      obj => !obj.hasOwnProperty('geolocation'),
    )

    const formattedQuery = filtersWithoutGeolocation.reduce(
      (accumulator, actualState) => {
        Object.assign(accumulator, actualState)
        return accumulator
      },
      {},
    )

    const countDocs = await this.propertyModel.countDocuments(formattedQuery)

    return { countDocs }
  }

  private async getPropertyDocs(
    filtersOrNot: any,
    countHighlights: number,
    countDocs: number,
    limit: number,
    highlights: IProperty[],
    page: number,
    sort: number,
    needCount: boolean,
  ): Promise<{ docs: IProperty[]; totalPages: number; totalCount: number }> {
    const propertySkipAux = (page + 1) * limit - countHighlights
    const propertyLimit = limit - highlights.length
    const propertySkip = propertyLimit === limit ? propertySkipAux - limit : 0

    let docs: IProperty[] = []
    if (propertyLimit > 0) {
      docs = await this.propertyModel
        .find(filtersOrNot)
        .sort(sort[0])
        .skip(propertySkip)
        .limit(propertyLimit)
        .lean()
    }
    docs.unshift(...highlights)

    let totalPages
    if (needCount) {
      totalPages = Math.ceil((countDocs + countHighlights) / limit)
    }
    const totalCount = countDocs + countHighlights
    return { docs, totalPages, totalCount }
  }
}
