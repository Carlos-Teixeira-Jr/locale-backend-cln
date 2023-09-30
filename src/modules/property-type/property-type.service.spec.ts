import { Test, TestingModule } from '@nestjs/testing'
import { PropertyTypeService } from './property-type.service'

describe('PropertyTypeService', () => {
  let service: PropertyTypeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyTypeService],
    }).compile()

    service = module.get<PropertyTypeService>(PropertyTypeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
