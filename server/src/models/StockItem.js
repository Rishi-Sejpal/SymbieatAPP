import mongoose from 'mongoose';

const stockItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100, unique: true },
    category: { type: String, trim: true, default: 'General' },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    threshold: { type: Number, required: true, min: 0, default: 10 },
    unit: { type: String, enum: ['kg', 'g', 'l', 'ml', 'pcs'], default: 'kg' },
    costPerUnit: { type: Number, default: 0, min: 0 },
    supplier: { type: String, trim: true, default: '' },
    lastRestockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

stockItemSchema.virtual('isLow').get(function isLow() {
  return this.quantity <= this.threshold;
});

stockItemSchema.set('toJSON', { virtuals: true });
stockItemSchema.set('toObject', { virtuals: true });

export default mongoose.model('StockItem', stockItemSchema);
