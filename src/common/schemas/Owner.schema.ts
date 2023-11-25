import { Schema, Document } from 'mongoose'
import { BaseModel } from './BaseModel'

export const OwnerModelName = 'Owner'

export interface IOwner extends BaseModel, Document {
  name: string
  phone: string
  cellPhone: string
  creci: string
  notifications: {
    notification_id: Schema.Types.ObjectId
    isRead: boolean
  }[]
  plan: Schema.Types.ObjectId
  userId: Schema.Types.ObjectId
  adCredits: number
  customerId: string
  subscriptionId: string
  creditCardInfo: {
    creditCardNumber: string
    creditCardBrand: string
    creditCardToken: string
  }
  isNewCreditCard: boolean
  newPlan: boolean
}

export const OwnerSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    cellPhone: { type: String },
    creci: { type: String },
    notifications: [
      {
        notification_id: { type: Schema.Types.ObjectId },
        isRead: { type: Boolean, default: false },
      },
    ],
    plan: { type: Schema.Types.ObjectId, ref: 'plan' },
    userId: { type: Schema.Types.ObjectId },
    adCredits: { type: Number },
    customerId: { type: String },
    subscriptionId: { type: String },
    creditCardInfo: {
      creditCardNumber: { type: String },
      creditCardBrand: { type: String },
      creditCardToken: { type: String },
    },
    isNewCreditCard: { type: Boolean },
    newPlan: { type: Boolean },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
