import { Schema, Document } from 'mongoose'
import { BaseModel } from './BaseModel'

export const PropertyModelName = 'properties'

export interface IProperty extends BaseModel, Document {
  adType: string
  adSubtype: string
  propertyType: string
  propertySubtype: string
  announcementCode: string
  address: {
    zipCode: string
    city: string
    state: string
    streetName: string
    streetNumber: string
    complement: string
    neighborhood: string
  }
  description: string
  metadata: [
    {
      type: string
      amount: number
    },
  ]
  geolocation?: {
    _id: false
    type: { type: string }
    coordinates: [number]
    required: false
  }
  images: string[]
  isActive: {
    type: boolean
    default: boolean
  }
  owner: Schema.Types.ObjectId
  ownerInfo: {
    name: string
    phones: string[]
    creci: string
  }
  size: {
    width: number
    height: number
    area: number
  }
  tags: string[]
  condominiumTags: string[]
  prices: [
    {
      type: string
      value: number
    },
  ]
  youtubeLink: string
  highlighted: boolean
  views: number
}

export const PropertySchema = new Schema<IProperty>(
  {
    adType: String,
    adSubtype: String,
    propertyType: String,
    propertySubtype: String,
    announcementCode: String,
    address: {
      _id: false,
      zipCode: String,
      city: String,
      state: String,
      streetName: String,
      streetNumber: String,
      complement: String,
      neighborhood: String,
    },
    description: String,
    metadata: [
      {
        type: { type: String },
        amount: { type: Number },
      },
    ],
    geolocation: {
      _id: false,
      type: { type: String },
      coordinates: { type: [Number], required: false },
    },
    images: [{ type: String }],
    isActive: { _id: false, type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId },
    ownerInfo: {
      _id: false,
      name: {
        type: String,
      },
      phones: [{ type: String }],
      creci: {
        type: String,
      },
    },
    size: {
      _id: false,
      width: { type: Number },
      height: { type: Number },
      area: { type: Number },
    },
    tags: [{ type: String, amount: Number }],
    condominiumTags: [String],
    prices: [
      {
        _id: false,
        type: { type: String },
        value: { type: Number },
      },
    ],
    youtubeLink: String,
    highlighted: Boolean,
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)
