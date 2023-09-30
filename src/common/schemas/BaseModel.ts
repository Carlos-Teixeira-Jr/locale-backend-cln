import { Date } from 'mongoose'
import { ObjectId } from 'mongoose'

export class BaseModel {
  baseId: ObjectId
  createdAt: Date
  updatedAt: Date
}
