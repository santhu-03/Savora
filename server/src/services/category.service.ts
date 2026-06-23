import mongoose from 'mongoose';
import { Category, ICategoryDocument } from '../models/Category';
import { MenuItem } from '../models/MenuItem';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';

// ─── List by restaurant with item counts ─────────────────────
export async function listByRestaurant(restaurantId: string) {
  const cacheKey = `categories:${restaurantId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const categories = await Category.aggregate([
    { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), isActive: true } },
    { $sort: { sortOrder: 1, name: 1 } },
    {
      $lookup: {
        from: 'menuitems',
        let: { catId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$category', '$$catId'] }, { $eq: ['$isAvailable', true] }] } } },
          { $count: 'count' },
        ],
        as: 'itemCountArr',
      },
    },
    {
      $addFields: {
        itemCount: { $ifNull: [{ $arrayElemAt: ['$itemCountArr.count', 0] }, 0] },
      },
    },
    { $project: { itemCountArr: 0 } },
  ]);

  await cache.set(cacheKey, categories, 180);
  return categories;
}

// ─── Create ───────────────────────────────────────────────────
export async function create(
  restaurantId: string,
  data: Partial<ICategoryDocument>
): Promise<ICategoryDocument> {
  const cat = await Category.create({ ...data, restaurantId });
  await cache.del(`categories:${restaurantId}`);
  return cat;
}

// ─── Update ───────────────────────────────────────────────────
export async function update(
  id: string,
  restaurantId: string,
  data: Partial<ICategoryDocument>
): Promise<ICategoryDocument> {
  const cat = await Category.findOneAndUpdate(
    { _id: id, restaurantId },
    data,
    { new: true, runValidators: true }
  );
  if (!cat) throw new AppError('Category not found', 404);
  await cache.del(`categories:${restaurantId}`);
  return cat;
}

// ─── Delete ───────────────────────────────────────────────────
export async function remove(id: string, restaurantId: string): Promise<void> {
  const cat = await Category.findOneAndDelete({ _id: id, restaurantId });
  if (!cat) throw new AppError('Category not found', 404);

  // Move orphaned items to uncategorised (or just leave — your call)
  await MenuItem.updateMany({ category: id }, { $unset: { category: 1 } });

  await cache.del(`categories:${restaurantId}`);
  await cache.delPattern(`menu:${restaurantId}:*`);
}

// ─── Reorder (drag & drop) ────────────────────────────────────
export async function reorder(
  restaurantId: string,
  items: Array<{ id: string; sortOrder: number }>
): Promise<void> {
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      Category.findOneAndUpdate({ _id: id, restaurantId }, { sortOrder })
    )
  );
  await cache.del(`categories:${restaurantId}`);
}
