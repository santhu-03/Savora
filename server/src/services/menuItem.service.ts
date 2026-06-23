import mongoose from 'mongoose';
import { MenuItem, IMenuItemDocument } from '../models/MenuItem';
import { Category } from '../models/Category';
import { Table } from '../models/Table';
import { Restaurant } from '../models/Restaurant';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import { parsePagination, buildMeta } from '../utils/pagination';
import { deleteCloudinaryAsset, getPublicId } from '../config/cloudinary';

// ─── Full menu grouped by category (public) ───────────────────
export async function getMenuByRestaurant(restaurantId: string, query: Record<string, string>) {
  const cacheKey = `menu:${restaurantId}:${JSON.stringify(query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const rid = new mongoose.Types.ObjectId(restaurantId);
  const filter: Record<string, unknown> = { restaurantId: rid, isAvailable: true };

  if (query.category) filter.category = new mongoose.Types.ObjectId(query.category);
  if (query.dietary) filter.dietary = { $in: query.dietary.split(',') };
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) (filter.price as any).$gte = Number(query.minPrice);
    if (query.maxPrice) (filter.price as any).$lte = Number(query.maxPrice);
  }
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { 'ratings.average': -1, 'ratings.count': -1 },
    newest: { createdAt: -1 },
    default: { sortOrder: 1 },
  };
  const sort = sortMap[query.sortBy ?? 'default'] ?? sortMap.default;

  // If not filtering by specific category → group by category
  if (!query.category) {
    const categories = await Category.find({ restaurantId: rid, isActive: true }).sort({ sortOrder: 1 });
    const items = await MenuItem.find(filter).sort(sort).populate('category', 'name slug image');

    const grouped = categories.map(cat => ({
      category: cat,
      items: items.filter(i => i.category?.toString() === cat._id.toString()),
    }));

    // Uncategorised items
    const uncategorised = items.filter(i => !i.category);
    if (uncategorised.length) grouped.push({ category: null as any, items: uncategorised });

    const result = { grouped, total: items.length };
    await cache.set(cacheKey, result, 120);
    return result;
  }

  // Flat list with pagination when filtering
  const { page, limit, skip } = parsePagination(query);
  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort(sort).skip(skip).limit(limit),
    MenuItem.countDocuments(filter),
  ]);
  return { items, pagination: buildMeta(total, page, limit) };
}

// ─── Single item ──────────────────────────────────────────────
export async function getById(id: string): Promise<IMenuItemDocument> {
  const item = await MenuItem.findById(id).populate('category', 'name slug');
  if (!item) throw new AppError('Menu item not found', 404);
  return item;
}

// ─── Featured items ───────────────────────────────────────────
export async function getFeatured(restaurantId: string) {
  const cacheKey = `featured:${restaurantId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const items = await MenuItem.find({ restaurantId, isFeatured: true, isAvailable: true })
    .sort({ 'ratings.average': -1 })
    .limit(20)
    .populate('category', 'name');

  await cache.set(cacheKey, items, 180);
  return items;
}

// ─── Create ───────────────────────────────────────────────────
export async function create(
  restaurantId: string,
  data: Partial<IMenuItemDocument>,
  files: Express.Multer.File[]
): Promise<IMenuItemDocument> {
  const images = files.map((f: any) => f.path as string);
  const item = await MenuItem.create({ ...data, restaurantId, images });
  await cache.delPattern(`menu:${restaurantId}:*`);
  await cache.del(`featured:${restaurantId}`);
  return item;
}

// ─── Update ───────────────────────────────────────────────────
export async function update(
  id: string,
  restaurantId: string,
  data: Partial<IMenuItemDocument>,
  files: Express.Multer.File[]
): Promise<IMenuItemDocument> {
  const existing = await MenuItem.findOne({ _id: id, restaurantId });
  if (!existing) throw new AppError('Menu item not found', 404);

  // Append newly uploaded images
  if (files.length) {
    const newImages = files.map((f: any) => f.path as string);
    data.images = [...(existing.images ?? []), ...newImages];
  }

  Object.assign(existing, data);
  await existing.save();

  await cache.delPattern(`menu:${restaurantId}:*`);
  await cache.del(`featured:${restaurantId}`);
  return existing;
}

// ─── Delete ───────────────────────────────────────────────────
export async function remove(id: string, restaurantId: string): Promise<void> {
  const item = await MenuItem.findOneAndDelete({ _id: id, restaurantId });
  if (!item) throw new AppError('Menu item not found', 404);

  // Delete images from Cloudinary
  await Promise.allSettled(
    (item.images ?? []).map(url => deleteCloudinaryAsset(getPublicId(url)))
  );

  await cache.delPattern(`menu:${restaurantId}:*`);
  await cache.del(`featured:${restaurantId}`);
}

// ─── Toggle availability ──────────────────────────────────────
export async function toggleAvailability(id: string, restaurantId: string): Promise<IMenuItemDocument> {
  const item = await MenuItem.findOne({ _id: id, restaurantId });
  if (!item) throw new AppError('Menu item not found', 404);
  item.isAvailable = !item.isAvailable;
  await item.save();
  await cache.delPattern(`menu:${restaurantId}:*`);
  return item;
}

// ─── QR menu (full public menu + table context) ───────────────
export async function getQrMenu(tableId: string) {
  const table = await Table.findById(tableId);
  if (!table) throw new AppError('Table not found', 404);

  const restaurantId = table.restaurantId.toString();

  const [restaurant, categories, items] = await Promise.all([
    Restaurant.findById(restaurantId).select('name logo coverImage address contact openingHours cuisine rating'),
    Category.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 }),
    MenuItem.find({ restaurantId, isAvailable: true }).sort({ sortOrder: 1 }),
  ]);

  if (!restaurant) throw new AppError('Restaurant not found', 404);

  const menu = categories.map(cat => ({
    category: cat,
    items: items.filter(i => i.category?.toString() === cat._id.toString()),
  }));

  return {
    table: { id: table._id, tableNumber: table.tableNumber, capacity: table.capacity, section: table.section },
    restaurant,
    menu,
  };
}
