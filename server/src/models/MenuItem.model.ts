import mongoose, { Document, Schema, Model } from 'mongoose';
import { IMenuItem, DietaryTag, Allergen, SpiceLevel } from '../types';

export interface IMenuItemDocument extends Omit<IMenuItem, '_id'>, Document {}
type IMenuItemModel = Model<IMenuItemDocument>;

const DIETARY_TAGS: DietaryTag[] = ['vegetarian','vegan','gluten-free','dairy-free','nut-free','halal','kosher','organic','keto','low-carb'];
const ALLERGENS: Allergen[] = ['gluten','dairy','eggs','nuts','peanuts','shellfish','fish','soy','sesame'];
const SPICE_LEVELS: SpiceLevel[] = ['none','mild','medium','hot','extra-hot'];

const modifierOptionSchema = new Schema(
  {
    name: { type: String, required: true },
    priceAdjustment: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const modifierSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['addition','removal','substitution','size'], required: true },
  options: [modifierOptionSchema],
  required: { type: Boolean, default: false },
  minSelections: { type: Number, default: 0 },
  maxSelections: { type: Number, default: 1 },
});

const menuItemSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    menu: { type: Schema.Types.ObjectId, ref: 'Menu', required: true, index: true },
    categoryId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 160 },
    images: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    currency: { type: String, default: 'INR' },
    dietaryTags: { type: [String], enum: DIETARY_TAGS, default: [] },
    allergens: { type: [String], enum: ALLERGENS, default: [] },
    spiceLevel: { type: String, enum: SPICE_LEVELS, default: 'none' },
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    stockCount: { type: Number },
    trackStock: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 15, min: 1 },
    calories: { type: Number },
    nutritionInfo: {
      protein: Number,
      carbohydrates: Number,
      fat: Number,
      fiber: Number,
      sodium: Number,
    },
    modifiers: [modifierSchema],
    tags: [{ type: String }],
    totalOrders: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ restaurant: 1, isFeatured: 1 });
menuItemSchema.index({ slug: 1, restaurant: 1 }, { unique: true });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Auto-slug
menuItemSchema.pre('validate', function (next) {
  if (this.isNew && this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  next();
});

export const MenuItem = mongoose.model<IMenuItemDocument, IMenuItemModel>('MenuItem', menuItemSchema);
