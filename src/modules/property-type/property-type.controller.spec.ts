import { Test, TestingModule } from '@nestjs/testing'
import { PropertyTypeController } from './property-type.controller'

describe('PropertyTypeController', () => {
  let controller: PropertyTypeController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyTypeController],
    }).compile()

    controller = module.get<PropertyTypeController>(PropertyTypeController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
