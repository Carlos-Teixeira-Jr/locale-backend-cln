import { Schema, Document } from 'mongoose'
import { BaseModel } from './BaseModel'

export const PlanModelName = 'plan'

export interface IPlan extends BaseModel, Document {
  name: string
  price: number
  description: string
  commonAd: number
  highlightAd: number
  smartAd: boolean
  managementArea: boolean
}

export const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String },
    price: { type: Number },
    description: { type: String },
    commonAd: { type: Number },
    highlightAd: { type: Number },
    smartAd: { type: Boolean },
    managementArea: { type: Boolean },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
