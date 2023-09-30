import { Schema, Document } from 'mongoose'
import { BaseModel } from './BaseModel'

export const NotificationModelName = 'Notification'

export interface INotification extends BaseModel, Document {
  title: string
  description: string
  type: string
  isRead: boolean
  userId: string
}

export const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String },
    description: { type: String },
    type: { type: String },
    isRead: { type: Boolean },
    userId: { type: String },
  },
  { versionKey: false, timestamps: true },
)
