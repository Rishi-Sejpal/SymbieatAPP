import StockItem from '../models/StockItem.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { emitToRoles } from '../realtime.js';
import { notifyMany } from '../services/notificationService.js';

async function adminIds() {
  const User = (await import('../models/User.js')).default;
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  return admins.map((a) => String(a._id));
}

async function lowStockAlert(item) {
  if (item.quantity > item.threshold) return;
  emitToRoles(['admin', 'staff'], 'stock:low', { id: String(item._id), name: item.name, quantity: item.quantity, unit: item.unit });
  notifyMany(await adminIds(), {
    title: `Low stock: ${item.name}`,
    body: `Only ${item.quantity} ${item.unit} left (threshold ${item.threshold}).`,
    type: 'stock',
    link: '/admin/stock',
  });
}

/** GET /api/stock — inventory list with low-stock flag */
export const listStock = asyncHandler(async (req, res) => {
  const items = await StockItem.find().sort({ name: 1 }).lean({ virtuals: true });
  res.json({ success: true, items });
});

/** POST /api/stock — create inventory item (admin/staff) */
export const createStock = asyncHandler(async (req, res) => {
  const item = await StockItem.create(req.body);
  await lowStockAlert(item);
  res.status(201).json({ success: true, item });
});

/** PUT /api/stock/:id — update stock details */
export const updateStock = asyncHandler(async (req, res) => {
  const item = await StockItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'Stock item not found.');
  await lowStockAlert(item);
  res.json({ success: true, item });
});

/** PATCH /api/stock/:id/restock — add quantity */
export const restock = asyncHandler(async (req, res) => {
  const { quantity, note } = req.body;
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new ApiError(400, 'Restock quantity must be positive.');
  const item = await StockItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Stock item not found.');
  item.quantity += qty;
  item.lastRestockedAt = new Date();
  await item.save();
  res.json({ success: true, item, note: note || '' });
});

/** DELETE /api/stock/:id */
export const deleteStock = asyncHandler(async (req, res) => {
  const item = await StockItem.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Stock item not found.');
  res.json({ success: true, message: 'Stock item removed.' });
});

/** GET /api/stock/low — items at/below threshold */
export const lowStock = asyncHandler(async (_req, res) => {
  const items = await StockItem.find().lean({ virtuals: true });
  res.json({ success: true, items: items.filter((i) => i.quantity <= i.threshold) });
});
