import { IOwner } from 'common/schemas/Owner.schema'
import { Model } from 'mongoose'

export async function findActiveOwner(
  ownerId: string,
  ownerModel: Model<IOwner>,
): Promise<IOwner | null> {
  const owner = await ownerModel.findById(ownerId)
  return owner && owner.isActive ? owner : null
}
