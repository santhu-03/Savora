import mongoose, { Document, Schema } from 'mongoose';

export type DietaryType = 'veg' | 'vegan' | 'gluten-free' | 'non-veg';

export interface INutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface IMenuItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discountPrice?: number;
  category: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  images: string[];
  tags: string[];
  allergens: string[];
  dietary: DietaryType[];
  ingredients: string[];
  nutritionInfo: INutritionInfo;
  isAvailable: boolean;
  isFeatured: boolean;
  prepTime: number;
  sortOrder: number;
  ratings: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenuItemDocument extends Omit<IMenuItem, '_id'>, Document {}

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    images: [{ type: String }],
    tags: [{ type: String }],
    allergens: [{ type: String }],
    dietary: [{ type: String, enum: ['veg', 'vegan', 'gluten-free', 'non-veg'] as DietaryType[] }],
    ingredients: [{ type: String }],
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    prepTime: { type: Number, default: 15, min: 0 },
    sortOrder: { type: Number, default: 0 },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, category: 1, sortOrder: 1 });
menuItemSchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
menuItemSchema.index({ restaurantId: 1, isFeatured: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

menuItemSchema.pre('validate', function (next) {
  if ((this.isNew || this.isModified('name')) && !this.slug) {
    this.slug = (this.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

export const MenuItem = mongoose.model<IMenuItemDocument>('MenuItem', menuItemSchema);
