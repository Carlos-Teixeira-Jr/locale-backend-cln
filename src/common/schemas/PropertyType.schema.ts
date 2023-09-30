import { Schema } from 'mongoose'
import { BaseModel } from './BaseModel'

export const PropertyTypeModelName = 'PropertyType'

export interface IPropertyType extends BaseModel, Document {
  name: string
}

export const PropertyTypeSchema = new Schema<IPropertyType>(
  {
    name: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
