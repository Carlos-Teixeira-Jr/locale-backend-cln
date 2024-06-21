import { NotFoundException } from '@nestjs/common'
import { IOwner } from 'common/schemas/Owner.schema'
import { IProperty } from 'common/schemas/Property.schema'
import { Model, Schema } from 'mongoose'

export async function getPropertyById(
  propertyId: any,
  propertyModel: Model<IProperty>,
): Promise<IProperty> {
  let id

  if (typeof propertyId === 'string') id = propertyId
  if (typeof propertyId === 'object') id = propertyId.id

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

  // Custom sorting logic
  ownerProperties.sort((a, b) => {
    // First, handle the 'highlighted' property
    if (a.highlighted && !b.highlighted) return -1
    if (!a.highlighted && b.highlighted) return 1

    // Then, handle the 'isActive' property
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1

    // Finally, handle the 'createdAt' property
    // Ensure createdAt is treated as a Date object
    const dateA = new Date(a.createdAt as any)
    const dateB = new Date(b.createdAt as any)

    return dateB.getTime() - dateA.getTime()
  })

  const count = await propertyModel.countDocuments({
    owner: owner._id,
    isActive: true,
  })
  const totalPages = Math.ceil(count / limit)

  return { ownerProperties, count, totalPages }
}

export async function incrementViews(
  property: IProperty,
  userId: string,
  isEdit: boolean,
  propertyModel: Model<IProperty>,
): Promise<void> {
  if (!isEdit) {
    await propertyModel.updateOne(
      { _id: property._id },
      { $addToSet: { views: userId } },
    )
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
