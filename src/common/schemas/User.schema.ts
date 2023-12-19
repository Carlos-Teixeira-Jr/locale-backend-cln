import { Schema } from 'mongoose'

export const UserModelName = 'User'

export const UserSchema = new Schema(
  {
    username: { type: String },
    email: { type: String },
    password: { type: String },
    picture: { type: String },
    address: {
      zipCode: { type: String },
      city: { type: String },
      uf: { type: String },
      streetName: { type: String },
      streetNumber: { type: String },
      complement: { type: String },
      neighborhood: { type: String },
    },
    cpf: { type: String },
    emailVerificationCode: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationExpiry: { type: Date },
    plan: { type: Schema.Types.ObjectId },
    isActive: { type: Boolean, default: true },
    favourited: {
      type: [
        {
          type: String,
          validate: {
            validator: function (array) {
              return array.length <= 100
            },
          },
        },
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export interface IUser extends Document {
  _id: Schema.Types.ObjectId
  username: string
  email: string
  password?: string
  picture: string
  address: {
    zipCode: string
    city: string
    uf: string
    streetName: string
    streetNumber: string
    complement: string
    neighborhood: string
  }
  cpf: string
  emailVerificationCode?: string
  isEmailVerified?: boolean
  emailVerificationExpiry?: Date
  favourited: string[]
  isActive: boolean
}
