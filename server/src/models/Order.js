import mongoose from 'mongoose';
import './Counter.js'; // registers the Counter model used by the token hook

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    isVeg: { type: Boolean, default: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    token: { type: String, unique: true, index: true },
    orderNumber: { type: Number, default: 0 },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must contain at least one item'],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'placed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: { type: String, enum: ['upi', 'card', 'cash', null], default: null },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    counter: { type: String, enum: ['main', 'north', 'south', 'beverages'], default: 'main' },
    assignedChef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    estimatedMinutes: { type: Number, default: 10 },
    specialInstructions: { type: String, trim: true, default: '', maxlength: 200 },
    statusHistory: [statusHistorySchema],
    completedAt: { type: Date, default: null },
    cancelledReason: { type: String, default: '' },
    pickupCode: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

/** Human-friendly token like "SIE-000123" generated before save. */
orderSchema.pre('validate', async function markToken(next) {
  if (this.isNew && !this.token) {
    try {
      const CounterModel = mongoose.model('Counter');
      const doc = await CounterModel.findOneAndUpdate(
        { _id: 'orderNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.orderNumber = doc.seq;
      this.token = `SIE-${String(doc.seq).padStart(6, '0')}`;
      this.pickupCode = String(1000 + (doc.seq % 9000));
    } catch (err) {
      next(err);
      return;
    }
  }
  next();
});

export default mongoose.model('Order', orderSchema);
