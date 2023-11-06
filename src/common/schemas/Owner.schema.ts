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
  creditCardInfo: {
    creditCardNumber: string
    creditCardBrand: string
    creditCardToken: string
  }
  isNewCreditCard: boolean
  newCreditCardData: {
    creditCard: {
      holderName: string
      number: string
      expiryMonth: string
      expiryYear: string
      ccv: string
    }
    creditCardHolderInfo: {
      name: string
      email: string
      phone: string
      cpfCnpj: string
      postalCode: string
      addressNumber: string
    }
    isNewPlan: boolean
    newPlan: Schema.Types.ObjectId
  }
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
    creditCardInfo: {
      creditCardNumber: { type: String },
      creditCardBrand: { type: String },
      creditCardToken: { type: String },
    },
    isNewCreditCard: { type: Boolean },
    newCreditCardData: {
      creditCard: {
        holderName: { type: String },
        number: { type: String },
        expiryMonth: { type: String },
        expiryYear: { type: String },
        ccv: { type: String },
      },
      creditCardHolderInfo: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        cpfCnpj: { type: String },
        postalCode: { type: String },
        addressNumber: { type: String },
      },
      isNewPlan: { type: Boolean },
      newPlan: { type: Schema.Types.ObjectId, ref: 'plan' },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
