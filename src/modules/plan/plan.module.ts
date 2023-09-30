import { Module } from '@nestjs/common'
import { PlanController } from './plan.controller'
import { PlanService } from './plan.service'
import { MongooseModule } from '@nestjs/mongoose'
import { PlanModelName, PlanSchema } from 'common/schemas/Plan.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PlanModelName,
        schema: PlanSchema,
      },
    ]),
  ],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
