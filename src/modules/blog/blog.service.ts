import { Injectable, LoggerService } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { Model } from 'mongoose'
import { CreateBlogPostDto } from './dto/create-blog-post.dto'
import { BlogPostModelName, IBlogPost } from 'common/schemas/BlogPost.schema'
import { identity } from 'rxjs'

@Injectable()
export class BlogService {
  constructor(
    @InjectorLoggerService(BlogService.name)
    private readonly logger: LoggerService,
    @InjectModel(BlogPostModelName)
    private readonly blogPostModel: Model<IBlogPost>,
  ) {}

  async createOne(createBlogPost: CreateBlogPostDto) {
    try {
      this.logger.log({ createBlogPost }, 'createOne > [BlogPostService]')

      const createdPost = await this.blogPostModel.create(createBlogPost)

      if (!createdPost) {
        throw new Error(`Houve um erro ao criar a postagem de blog.`)
      }

      return createdPost
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async getAll() {
    try {
      this.logger.log({}, 'getAll > [BlogPostService]')

      const posts = await this.blogPostModel.find()

      return posts
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }

  async findById(id: string) {
    try {
      this.logger.log({ identity }, 'findById > [BlogPostService]')

      const post = await this.blogPostModel.findById(id).lean()

      return post
    } catch (error) {
      this.logger.error({
        error: JSON.stringify(error),
        exception: '> exception',
      })
      throw error
    }
  }
}
