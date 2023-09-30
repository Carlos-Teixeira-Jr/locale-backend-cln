import { Document, Schema } from 'mongoose'
import { BaseModel } from './BaseModel'

export const LocationModelName = 'Location'

export interface ILocation extends BaseModel, Document {
  name: string
  category: string
}

export const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String },
    category: { type: String },
  },
  { versionKey: false, timestamps: true },
)
