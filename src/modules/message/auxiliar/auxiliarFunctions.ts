import { IMessageOwner } from 'common/schemas/Message_owner.schema'
import { Model } from 'mongoose'

export async function findOwnerMessages(
  ownerId: string,
  messageModel: Model<IMessageOwner>,
): Promise<IMessageOwner[]> {
  return await messageModel.find({ owner_id: ownerId }).lean()
}
