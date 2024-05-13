import { Schema } from 'mongoose'
import { BaseModel } from './BaseModel'

export const CouponModelName = 'Coupon'

export interface ICoupon extends BaseModel, Document {
  coupon: string
  discount: number
  isActive: boolean
}

export const CouponSchema = new Schema<ICoupon>(
  {
    coupon: { type: String },
    discount: { type: Number },
    isActive: { type: Boolean },
  },
  { versionKey: false, timestamps: true },
)
