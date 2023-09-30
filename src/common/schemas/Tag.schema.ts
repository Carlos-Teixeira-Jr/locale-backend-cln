import { Schema } from 'mongoose'
import { BaseModel } from './BaseModel'

export const TagModelName = 'tag'

export interface ITag extends BaseModel, Document {
  name: string
  amount: number
}

export const TagSchema = new Schema<ITag>(
  {
    name: { type: String, unique: true, trim: true },

    amount: { type: Number, default: 1 },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
