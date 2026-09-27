import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['upi', 'card', 'cash'], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: { type: String, enum: ['razorpay', 'simulated', 'cash'], default: 'simulated' },
    gatewayOrderId: { type: String, default: '', index: true },
    gatewayPaymentId: { type: String, default: '' },
    gatewaySignature: { type: String, default: '' },
    failureReason: { type: String, default: '' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
