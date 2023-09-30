import { IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema, Document, ObjectId } from 'mongoose'
import { OwnerModelName } from './Owner.schema'
import { BaseModel } from './BaseModel'

export const PaymentModelName = 'Payment'

export interface IPayment extends BaseModel, Document {
  value: number
  owner_id: ObjectId
}

export class OwnerParams {
  @IsString()
  @Validate(IDValidator)
  owner_id: string
}

export const PaymentSchema = new Schema<IPayment>(
  {
    value: { type: Number },
    owner_id: { type: Schema.Types.ObjectId, ref: OwnerModelName },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
