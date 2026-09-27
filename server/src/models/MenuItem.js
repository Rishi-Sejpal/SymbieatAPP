import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '', maxlength: 300 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    category: {
      type: String,
      enum: ['Breakfast', 'Main Course', 'Snacks', 'Beverages', 'Desserts', 'Combos'],
      required: true,
      index: true,
    },
    counter: {
      type: String,
      enum: ['main', 'north', 'south', 'beverages'],
      default: 'main',
      index: true,
    },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true, index: true },
    dailyStockLimit: { type: Number, default: 0, min: 0 },
    soldToday: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: '' },
    prepMinutes: { type: Number, default: 10, min: 1 },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('MenuItem', menuItemSchema);
