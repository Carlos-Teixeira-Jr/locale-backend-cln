import { Document, Schema } from 'mongoose'
import { BaseModel } from './BaseModel'

export const BlogPostModelName = 'BlogPost'

export interface IBlogPost extends BaseModel, Document {
  title: string
  resume: string
  timeToRead: number
  author: string
  tags: string[]
  img: string
  post: {
    subImage: string
    subTitle: string
    text: string
  }[]
}

const PostItemSchema = new Schema({
  subImage: { type: String },
  subTitle: { type: String },
  text: { type: String },
})

export const BlogPostSchema = new Schema(
  {
    title: { type: String },
    resume: { type: String },
    timeToRead: { type: Number },
    author: { type: String },
    tags: { type: [String] },
    img: { type: String },
    post: { type: [PostItemSchema] },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
