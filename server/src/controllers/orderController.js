import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { emitToKitchen, emitToUser, emitToRoles } from '../realtime.js';
import { notifyUser } from '../services/notificationService.js';

const populateOrder = (q) =>
  q
    .populate('customer', 'name email studentId')
    .populate('assignedChef', 'name')
    .populate('payment', 'status method amount');

function serializeOrder(order) {
  return order.toObject ? order.toObject({ virtuals: true }) : order;
}

/** GET /api/orders/mine — customer order history with live tracking */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await populateOrder(Order.find({ customer: req.user._id }))
    .sort({ createdAt: -1 })
    .limit(50)
    .lean({ virtuals: true });
  res.json({ success: true, orders });
});

/** GET /api/orders/queue — kitchen live queue (staff/chef/admin) */
export const getQueue = asyncHandler(async (req, res) => {
  const filter = { status: { $in: ['placed', 'confirmed', 'preparing'] } };
  if (req.user.role === 'chef' && req.user.assignedCounter) {
    filter.counter = req.user.assignedCounter;
  }
  const orders = await populateOrder(Order.find(filter)).sort({ createdAt: 1 }).lean({ virtuals: true });
  res.json({ success: true, orders });
});

/** GET /api/orders/:id */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await populateOrder(Order.findById(req.params.id)).lean({ virtuals: true });
  if (!order) throw new ApiError(404, 'Order not found.');
  const isOwner = String(order.customer?._id || order.customer) === String(req.user._id);
  const isStaff = ['chef', 'admin', 'staff'].includes(req.user.role);
  if (!isOwner && !isStaff) throw new ApiError(403, 'Not allowed to view this order.');
  res.json({ success: true, order });
});

/** POST /api/orders — place order, generate token, snapshot pricing */
export const placeOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, specialInstructions } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Your cart is empty.');

  const ids = items.map((i) => i.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: ids } });
  if (menuItems.length !== ids.length) {
    throw new ApiError(400, 'One or more menu items no longer exist. Refresh your cart.');
  }

  let total = 0;
  const orderItems = [];
  for (const line of items) {
    const mi = menuItems.find((m) => String(m._id) === String(line.menuItemId));
    if (!mi) throw new ApiError(400, 'A menu item in your cart is invalid.');
    if (!mi.isAvailable) throw new ApiError(409, `${mi.name} has just sold out. Please remove it to continue.`);
    const qty = Math.max(1, Math.min(20, Number(line.quantity) || 1));
    if (mi.dailyStockLimit > 0 && mi.soldToday + qty > mi.dailyStockLimit) {
      throw new ApiError(409, `Only ${Math.max(0, mi.dailyStockLimit - mi.soldToday)} left of ${mi.name} today.`);
    }
    total += mi.price * qty;
    orderItems.push({ menuItem: mi._id, name: mi.name, price: mi.price, quantity: qty, isVeg: mi.isVeg });
  }

  const estimatedMinutes =
    Math.max(...menuItems.map((m) => m.prepMinutes || 10)) + Math.ceil(items.length / 2) * 2;

  const order = await Order.create({
    customer: req.user._id,
    items: orderItems,
    totalAmount: total,
    counter: menuItems[0].counter,
    estimatedMinutes,
    specialInstructions: String(specialInstructions || '').slice(0, 200),
    statusHistory: [{ status: 'placed', by: req.user._id }],
    paymentMethod: paymentMethod || null,
  });

  emitToKitchen('order:new', serializeOrder(order));
  emitToRoles(['admin'], 'order:new', serializeOrder(order));
  notifyUser(String(req.user._id), {
    title: `Order ${order.token} placed`,
    body: `We have received your order of ₹${total}. Track it live.`,
    type: 'order',
    link: `/orders/${order._id}`,
  });

  res.status(201).json({ success: true, order: serializeOrder(order) });
});

/** PATCH /api/orders/:id/status — advance order through the kitchen flow */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');

  const role = req.user.role;
  const allowed =
    role === 'admin' ||
    (role === 'chef' && ['confirmed', 'preparing', 'ready', 'cancelled'].includes(status)) ||
    (role === 'staff' && ['confirmed', 'ready', 'completed'].includes(status));
  if (!allowed) throw new ApiError(403, 'Your role cannot perform this status change.');

  if (status === 'cancelled' && ['ready', 'completed'].includes(order.status)) {
    throw new ApiError(400, 'Order is already being served; it cannot be cancelled.');
  }
  order.status = status;
  order.statusHistory.push({ status, by: req.user._id, note: note || '' });
  if (status === 'completed') order.completedAt = new Date();
  if (status === 'cancelled') order.cancelledReason = note || 'Cancelled by canteen';
  await order.save();

  emitToKitchen('order:status', { orderId: String(order._id), token: order.token, status });
  emitToUser(String(order.customer), 'order:status', { orderId: String(order._id), token: order.token, status });

  const labels = {
    confirmed: 'has been confirmed and queued',
    preparing: 'is being prepared',
    ready: 'is READY for pickup!',
    completed: 'has been completed. Enjoy!',
    cancelled: 'has been cancelled',
  };
  if (labels[status]) {
    notifyUser(String(order.customer), {
      title: `${order.token} ${labels[status]}`,
      body: 'Open SymbiEat to view live status.',
      type: 'order',
      link: `/orders/${order._id}`,
    });
  }

  res.json({ success: true, order: serializeOrder(order) });
});

/** PATCH /api/orders/:id/assign — chef assignment (admin) */
export const assignChef = asyncHandler(async (req, res) => {
  const { chefId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const chef = await User.findById(chefId);
  if (!chef || chef.role !== 'chef') throw new ApiError(400, 'Selected user is not a chef.');
  order.assignedChef = chef._id;
  await order.save();
  notifyUser(String(chefId), {
    title: 'New order assigned',
    body: `${order.token} at the ${order.counter} counter.`,
    type: 'order',
    link: '/kitchen',
  });
  res.json({ success: true, order: serializeOrder(order) });
});

/** GET /api/orders/stats/today — kitchen summary cards */
export const todayStats = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [orders, revenueAgg] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: start } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const pending = await Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'preparing'] } });
  const ready = await Order.countDocuments({ status: 'ready' });
  res.json({
    success: true,
    stats: {
      orders,
      revenue: revenueAgg[0]?.revenue || 0,
      paidOrders: revenueAgg[0]?.count || 0,
      pending,
      ready,
    },
  });
});
