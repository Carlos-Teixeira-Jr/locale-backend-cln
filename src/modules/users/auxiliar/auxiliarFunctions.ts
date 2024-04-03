import { IOwner } from 'common/schemas/Owner.schema'
import { Model, Schema } from 'mongoose'

export async function findActiveOwner(
  ownerId: Schema.Types.ObjectId,
  ownerModel: Model<IOwner>,
): Promise<IOwner | null> {
  const owner = await ownerModel.findById(ownerId)
  return owner && owner.isActive ? owner : null
}
