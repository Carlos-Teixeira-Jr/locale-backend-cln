import { IMessageOwner } from 'common/schemas/Message_owner.schema'
import { Model, Schema } from 'mongoose'

export async function findOwnerMessages(
  ownerId: Schema.Types.ObjectId,
  messageModel: Model<IMessageOwner>,
): Promise<IMessageOwner[]> {
  return await messageModel.find({ owner_id: ownerId }).lean()
}
