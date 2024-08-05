import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { BlogService } from './blog.service'
import { ApiTags } from '@nestjs/swagger'
import { CreateBlogPostDto } from './dto/create-blog-post.dto'

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(
    @InjectorLoggerService(BlogController.name)
    private readonly logger: LoggerService,
    private readonly blogService: BlogService,
  ) {}

  @Post()
  async createOne(@Body() createBlogPostDto: CreateBlogPostDto): Promise<any> {
    this.logger.log({}, 'createOne')
    return this.blogService.createOne(createBlogPostDto)
  }

  @Get()
  async getAll(): Promise<any> {
    this.logger.log({}, 'getAll')
    return this.blogService.getAll()
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<any> {
    this.logger.log({}, 'findById')
    return this.blogService.findById(id)
  }
}
