import { Schema } from 'mongoose'
import { BaseModel } from './BaseModel'

export const CouponModelName = 'Coupon'

export interface ICoupon extends BaseModel, Document {
  coupon: string
  plan: Schema.Types.ObjectId
  commonAd: number
  highlightAd: number
  isActive: boolean
}

export const CouponSchema = new Schema<ICoupon>(
  {
    coupon: { type: String },
    plan: { type: Schema.Types.ObjectId },
    commonAd: { type: Number },
    highlightAd: { type: Number },
    isActive: { type: Boolean },
  },
  { versionKey: false, timestamps: true },
)
