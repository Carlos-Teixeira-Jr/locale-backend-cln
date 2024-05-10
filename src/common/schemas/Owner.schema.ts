import { Schema, Document } from 'mongoose'
import { BaseModel } from './BaseModel'

export const OwnerModelName = 'Owner'

export interface IOwner extends BaseModel, Document {
  name: string
  phone: string
  cellPhone: string
  wwpNumber: string
  picture?: string
  creci: string
  notifications: {
    notification_id: Schema.Types.ObjectId
    isRead: boolean
  }[]
  plan: Schema.Types.ObjectId
  userId: Schema.Types.ObjectId
  highlightCredits: number
  adCredits: number
  paymentData?: {
    customerId: string
    subscriptionId: string
    cpfCnpj: string
    creditCardInfo?: {
      creditCardNumber: string
      creditCardBrand: string
      creditCardToken: string
    }
  }
  isNewCreditCard?: boolean
  newPlan: boolean
  isActive: boolean
}

export const OwnerSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    cellPhone: { type: String },
    wppNumber: { type: String },
    picture: { type: String },
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
    highlightCredits: { type: Number },
    paymentData: {
      customerId: { type: String },
      subscriptionId: { type: String },
      cpfCnpj: { type: String },
      creditCardInfo: {
        creditCardNumber: { type: String },
        creditCardBrand: { type: String },
        creditCardToken: { type: String },
      },
    },
    isNewCreditCard: { type: Boolean },
    newPlan: { type: Boolean },
    isActive: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
