import { Schema, Document, ObjectId } from 'mongoose'

export const NetworkModelName = 'Network'

export const NetworkSchema = new Schema({
  name: { type: String },
  code: { type: String },
  label: { type: String },
  link: { type: String },
  icon: { type: String },
  rpc_link: { type: String },
})

export interface INetwork extends Document {
  _id: ObjectId
  name: string
  code: string
  label: string
  link: string
  icon: string
  rpc_link: string
}
