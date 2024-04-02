import { NotFoundException } from '@nestjs/common'
import { IProperty } from 'common/schemas/Property.schema'
import { Model } from 'mongoose'

export async function getPropertyById(
  id: string,
  propertyModel: Model<IProperty>,
): Promise<IProperty> {
  const property: IProperty = await propertyModel.findById(id).lean()
  if (!property) {
    throw new NotFoundException(`Property with id ${id} not found`)
  }
  return property
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
