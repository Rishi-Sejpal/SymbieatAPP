import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import MenuItem from '../models/MenuItem.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { notifyUser } from '../services/notificationService.js';

/** GET /api/feedback?mine=1 — list (admins see all, students their own unless menuItem filter) */
export const listFeedback = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.menuItem) filter.menuItem = req.query.menuItem;
  if (req.query.mine === '1') {
    filter.user = req.user._id;
  } else if (req.user.role !== 'admin') {
    filter.user = req.user._id;
  }
  const feedback = await Feedback.find(filter)
    .populate('user', 'name role')
    .populate('menuItem', 'name')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ success: true, feedback });
});

/** POST /api/feedback — rate an item or overall experience */
export const createFeedback = asyncHandler(async (req, res) => {
  const { rating, comment, menuItem, order } = req.body;
  const r = Number(rating);
  if (!r || r < 1 || r > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');
  const fb = await Feedback.create({
    user: req.user._id,
    rating: r,
    comment: String(comment || '').slice(0, 500),
    menuItem: menuItem || null,
    order: order || null,
  });

  if (menuItem) {
    const agg = await Feedback.aggregate([
      { $match: { menuItem: new mongoose.Types.ObjectId(String(menuItem)) } },
      { $group: { _id: '$menuItem', avg: { $avg: '$rating' }, n: { $sum: 1 } } },
    ]);
    const a = agg[0];
    if (a) {
      await MenuItem.findByIdAndUpdate(menuItem, {
        rating: Math.round(a.avg * 10) / 10,
        ratingCount: a.n,
      });
    }
  }
  res.status(201).json({ success: true, feedback: fb });
});

/** PATCH /api/feedback/:id/reply — admin public reply */
export const replyFeedback = asyncHandler(async (req, res) => {
  const fb = await Feedback.findById(req.params.id);
  if (!fb) throw new ApiError(404, 'Feedback not found.');
  fb.adminReply = String(req.body.reply || '').slice(0, 500);
  fb.repliedBy = req.user._id;
  await fb.save();
  notifyUser(String(fb.user), {
    title: 'The canteen team replied to your feedback',
    body: fb.adminReply,
    type: 'system',
    link: '/feedback',
  });
  res.json({ success: true, feedback: fb });
});

/** DELETE /api/feedback/:id — admin */
export const deleteFeedback = asyncHandler(async (req, res) => {
  const fb = await Feedback.findByIdAndDelete(req.params.id);
  if (!fb) throw new ApiError(404, 'Feedback not found.');
  res.json({ success: true, message: 'Feedback removed.' });
});
