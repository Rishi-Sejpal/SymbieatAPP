import MenuItem from '../models/MenuItem.js';
import Feedback from '../models/Feedback.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { emitToAll } from '../realtime.js';

/** GET /api/menu?category=&search=&available= — public digital menu board */
export const getMenu = asyncHandler(async (req, res) => {
  const { category, search, available } = req.query;
  const filter = {};
  if (category && category !== 'all') filter.category = category;
  if (available === 'true') filter.isAvailable = true;
  if (search) {
    filter.$text = { $search: String(search) };
  }
  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 }).lean();
  res.json({ success: true, items });
});

/** GET /api/menu/:id — single item with its reviews */
export const getItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).lean();
  if (!item) throw new ApiError(404, 'Menu item not found.');
  const reviews = await Feedback.find({ menuItem: item._id })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ success: true, item, reviews });
});

/** POST /api/menu — admin */
export const createItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(req.body);
  emitToAll('menu:updated', { action: 'created', id: String(item._id) });
  res.status(201).json({ success: true, item });
});

/** PUT /api/menu/:id — admin */
export const updateItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, 'Menu item not found.');
  emitToAll('menu:updated', { action: 'updated', id: String(item._id) });
  res.json({ success: true, item });
});

/** PATCH /api/menu/:id/availability — admin/chef mark sold out / back in stock */
export const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found.');
  item.isAvailable = typeof req.body.isAvailable === 'boolean' ? req.body.isAvailable : !item.isAvailable;
  await item.save();
  emitToAll('menu:updated', { action: 'availability', id: String(item._id), isAvailable: item.isAvailable });
  res.json({ success: true, item });
});

/** DELETE /api/menu/:id — admin */
export const deleteItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found.');
  emitToAll('menu:updated', { action: 'deleted', id: String(item._id) });
  res.json({ success: true, message: 'Menu item removed.' });
});
