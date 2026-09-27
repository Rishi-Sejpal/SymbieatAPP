import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '', maxlength: 500 },
    adminReply: { type: String, trim: true, default: '', maxlength: 500 },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

feedbackSchema.index({ menuItem: 1, createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
