import { Module } from '@nestjs/common'
import { BlogController } from './blog.controller'
import { BlogService } from './blog.service'
import {
  BlogPostModelName,
  BlogPostSchema,
} from 'common/schemas/BlogPost.schema'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BlogPostModelName,
        schema: BlogPostSchema,
      },
    ]),
  ],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
