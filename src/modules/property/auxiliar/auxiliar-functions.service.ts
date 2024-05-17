import { NotFoundException } from '@nestjs/common'
import { IOwner } from 'common/schemas/Owner.schema'
import { IProperty } from 'common/schemas/Property.schema'
import { Model, Schema } from 'mongoose'

export async function getPropertyById(
  id: Schema.Types.ObjectId,
  propertyModel: Model<IProperty>,
): Promise<IProperty> {
  const property: IProperty = await propertyModel.findById(id).lean()
  if (!property) {
    throw new NotFoundException(`Property with id ${id} not found`)
  }
  return property
}

export async function getPropertiesData(
  owner: IOwner | null,
  skip: number,
  limit: number,
  propertyModel: Model<IProperty>,
): Promise<{
  ownerProperties: IProperty[]
  count: number
  totalPages: number
}> {
  if (!owner) {
    return { ownerProperties: [], count: 0, totalPages: 0 }
  }

  const ownerProperties = await propertyModel
    .find({ owner: owner._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const count = await propertyModel.countDocuments({
    owner: owner._id,
    isActive: true,
  })
  const totalPages = Math.ceil(count / limit)

  return { ownerProperties, count, totalPages }
}

export async function incrementViews(
  property: IProperty,
  isEdit: boolean,
  propertyModel: Model<IProperty>,
): Promise<void> {
  if (!isEdit) {
    await propertyModel.updateOne({ _id: property._id }, { $inc: { views: 1 } })
  }
}

export async function findActivePropertiesByAnnouncementCode(
  announcementCode: string,
  propertyModel: Model<IProperty>,
): Promise<IProperty[]> {
  return await propertyModel.find({ announcementCode, isActive: true }).exec()
}

export async function updatePropertyImages(
  propertyId: Schema.Types.ObjectId,
  uploadedImages: string[],
  propertyModel: Model<IProperty>,
): Promise<void> {
  await propertyModel.updateOne(
    { _id: propertyId },
    { $push: { images: { $each: uploadedImages } } },
  )
}
