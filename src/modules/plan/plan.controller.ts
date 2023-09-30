import { Body, Controller, Get, Post } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { PlanService } from './plan.service'
import { IPlan } from 'common/schemas/Plan.schema'
import { CreatePlanDto } from './dto/createPlan.dto'

@Controller('plan')
export class PlanController {
  constructor(
    @InjectorLoggerService(PlanController.name)
    private readonly logger: LoggerService,
    private readonly planService: PlanService,
  ) {}

  @Post()
  async createOne(@Body() createPlanDto: CreatePlanDto): Promise<IPlan> {
    this.logger.log({}, 'createOne')

    return this.planService.createOne(createPlanDto)
  }

  @Get()
  async findAll(): Promise<IPlan[]> {
    this.logger.log({}, 'findAll')

    return this.planService.findAll()
  }
}
