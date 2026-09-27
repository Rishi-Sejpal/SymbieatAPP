import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/ApiError.js';

/** GET /api/analytics/dashboard?days=7 — aggregates for the admin dashboard */
export const dashboard = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [revenueTrend, statusCounts, topItems, categoryMix, totals, feedbackPulse, userCounts] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { qty: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.isVeg', qty: { $sum: '$items.quantity' } } },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
          totalOrders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          avgOrder: { $avg: '$totalAmount' },
        },
      },
    ]),
    Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  const menuCount = await MenuItem.countDocuments();

  res.json({
    success: true,
    analytics: {
      days,
      revenueTrend,
      statusCounts,
      topItems,
      categoryMix,
      totals: totals[0] || { totalRevenue: 0, totalOrders: 0, paidOrders: 0, avgOrder: 0 },
      feedback: feedbackPulse[0] || { avg: 0, count: 0 },
      users: userCounts,
      menuCount,
    },
  });
});
