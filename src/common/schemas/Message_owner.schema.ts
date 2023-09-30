import { IsString, Validate } from 'class-validator'
import { IDValidator } from 'common/validators/ID.validator'
import { Schema, Document } from 'mongoose'
import { BaseModel } from './BaseModel'

export const MessageOwnerModelName = 'Message_Owner'

export interface IMessageOwner extends BaseModel, Document {
  name: string
  phone: string
  email: string
  message: string
  owner_id: Schema.Types.ObjectId
  propertyId: Schema.Types.ObjectId
}

export class OwnerParams {
  @IsString()
  @Validate(IDValidator)
  owner_id: string
}

export const MessageOwnerSchema = new Schema<IMessageOwner>(
  {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    message: { type: String },
    owner_id: { type: Schema.Types.ObjectId },
    propertyId: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)
