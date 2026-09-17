import { Types } from 'mongoose';

export const shapeIntoMongoObjectId = (target: string | Types.ObjectId): Types.ObjectId => {
  return typeof target === 'string' ? new Types.ObjectId(target) : target;
};
