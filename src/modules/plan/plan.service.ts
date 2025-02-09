import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { IPlan, PlanModelName } from 'common/schemas/Plan.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model } from 'mongoose'
import { CreatePlanDto } from './dto/createPlan.dto'

export interface IFormattedDate {
  formattedDate: string
  expiryYear: string
  expiryMonth: string
}

@Injectable()
export class PlanService {
  constructor(
    @InjectorLoggerService(PlanService.name)
    private readonly logger: LoggerService,
    @InjectModel(PlanModelName)
    private readonly planModel: Model<IPlan>,
  ) {}

  async createOne(createPlanDto: CreatePlanDto): Promise<IPlan> {
    try {
      this.logger.log({}, 'start createOne')

      const createdPlan = await this.planModel.create(createPlanDto)

      return createdPlan
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findAll(): Promise<IPlan[]> {
    try {
      this.logger.log({}, 'start findAll')

      const plansFound = await this.planModel.find()

      return plansFound
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
