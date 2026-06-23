import { Menu, IMenuDocument } from '../models/Menu.model';
import { MenuItem, IMenuItemDocument } from '../models/MenuItem.model';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import { parsePagination, buildMeta } from '../utils/pagination';
import { PaginatedResult } from '../types';

export class MenuService {
  // ─── Get menus for restaurant ─────────────────────────────────
  static async getMenus(restaurantId: string) {
    const cacheKey = `menus:${restaurantId}`;
    const cached = await cache.get<IMenuDocument[]>(cacheKey);
    if (cached) return cached;

    const menus = await Menu.find({ restaurant: restaurantId, isActive: true }).sort({ sortOrder: 1 });
    await cache.set(cacheKey, menus, 300);
    return menus;
  }

  // ─── Create menu ──────────────────────────────────────────────
  static async createMenu(restaurantId: string, data: Partial<IMenuDocument>) {
    const menu = await Menu.create({ ...data, restaurant: restaurantId });
    await cache.del(`menus:${restaurantId}`);
    return menu;
  }

  // ─── Update menu ──────────────────────────────────────────────
  static async updateMenu(menuId: string, restaurantId: string, data: Partial<IMenuDocument>) {
    const menu = await Menu.findOneAndUpdate(
      { _id: menuId, restaurant: restaurantId },
      data,
      { new: true, runValidators: true }
    );
    if (!menu) throw new AppError('Menu not found', 404);
    await cache.del(`menus:${restaurantId}`);
    return menu;
  }

  // ─── Delete menu ──────────────────────────────────────────────
  static async deleteMenu(menuId: string, restaurantId: string) {
    const menu = await Menu.findOneAndDelete({ _id: menuId, restaurant: restaurantId });
    if (!menu) throw new AppError('Menu not found', 404);
    await MenuItem.deleteMany({ menu: menuId });
    await cache.del(`menus:${restaurantId}`);
    await cache.delPattern(`menu-items:${restaurantId}:*`);
  }

  // ─── Get items ────────────────────────────────────────────────
  static async getItems(restaurantId: string, query: Record<string, string>): Promise<PaginatedResult<IMenuItemDocument>> {
    const { page, limit, skip, sort } = parsePagination(query);
    const filter: Record<string, unknown> = { restaurant: restaurantId };
    if (query.menu) filter.menu = query.menu;
    if (query.category) filter.category = query.category;
    if (query.available === 'true') filter.isAvailable = true;
    if (query.featured === 'true') filter.isFeatured = true;
    if (query.dietary) filter.dietary = { $in: query.dietary.split(',') };

    const cacheKey = `menu-items:${restaurantId}:${JSON.stringify({ ...filter, page, limit })}`;
    const cached = await cache.get<PaginatedResult<IMenuItemDocument>>(cacheKey);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      MenuItem.find(filter).sort(sort).skip(skip).limit(limit),
      MenuItem.countDocuments(filter),
    ]);

    const result = { data, pagination: buildMeta(total, page, limit) };
    await cache.set(cacheKey, result, 120);
    return result;
  }

  // ─── Search items ─────────────────────────────────────────────
  static async searchItems(restaurantId: string, q: string, limit = 20) {
    return MenuItem.find(
      { restaurant: restaurantId, $text: { $search: q }, isAvailable: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
  }

  // ─── Get single item ──────────────────────────────────────────
  static async getItemById(itemId: string) {
    const item = await MenuItem.findById(itemId).populate('menu', 'name');
    if (!item) throw new AppError('Menu item not found', 404);
    return item;
  }

  // ─── Create item ──────────────────────────────────────────────
  static async createItem(restaurantId: string, data: Partial<IMenuItemDocument>) {
    const item = await MenuItem.create({ ...data, restaurant: restaurantId });
    await cache.delPattern(`menu-items:${restaurantId}:*`);
    return item;
  }

  // ─── Update item ──────────────────────────────────────────────
  static async updateItem(itemId: string, restaurantId: string, data: Partial<IMenuItemDocument>) {
    const item = await MenuItem.findOneAndUpdate(
      { _id: itemId, restaurant: restaurantId },
      data,
      { new: true, runValidators: true }
    );
    if (!item) throw new AppError('Menu item not found', 404);
    await cache.delPattern(`menu-items:${restaurantId}:*`);
    return item;
  }

  // ─── Delete item ──────────────────────────────────────────────
  static async deleteItem(itemId: string, restaurantId: string) {
    const item = await MenuItem.findOneAndDelete({ _id: itemId, restaurant: restaurantId });
    if (!item) throw new AppError('Menu item not found', 404);
    await cache.delPattern(`menu-items:${restaurantId}:*`);
  }

  // ─── Toggle availability ───────────────────────────────────────
  static async toggleAvailability(itemId: string, restaurantId: string) {
    const item = await MenuItem.findOne({ _id: itemId, restaurant: restaurantId });
    if (!item) throw new AppError('Menu item not found', 404);
    item.isAvailable = !item.isAvailable;
    await item.save();
    await cache.delPattern(`menu-items:${restaurantId}:*`);
    return item;
  }
}
