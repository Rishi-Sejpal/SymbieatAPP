import { Router } from 'express';
import { protect, authorize } from './middleware/auth.js';
import { register, login, getMe, updateProfile } from './controllers/authController.js';
import {
  getMenu,
  getItem,
  createItem,
  updateItem,
  toggleAvailability,
  deleteItem,
} from './controllers/menuController.js';
import {
  getMyOrders,
  getQueue,
  getOrder,
  placeOrder,
  updateStatus,
  assignChef,
  todayStats,
} from './controllers/orderController.js';
import {
  createPayment,
  verifyPayment,
  webhook,
  confirmCash,
} from './controllers/paymentController.js';
import {
  listFeedback,
  createFeedback,
  replyFeedback,
  deleteFeedback,
} from './controllers/feedbackController.js';
import {
  listStock,
  createStock,
  updateStock,
  restock,
  deleteStock,
  lowStock,
} from './controllers/stockController.js';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listChefs,
} from './controllers/userController.js';
import {
  listAttendance,
  myAttendance,
  markAttendance,
} from './controllers/attendanceController.js';
import {
  listNotifications,
  markAllRead,
  markRead,
} from './controllers/notificationController.js';
import { dashboard } from './controllers/analyticsController.js';
import { config } from './config.js';

const router = Router();

// ── Health ──────────────────────────────────────────────────────────
router.get('/health', (_req, res) =>
  res.json({
    success: true,
    service: 'symbieat-api',
    mode: config.isDemo ? 'demo (in-memory db)' : 'atlas',
    time: new Date().toISOString(),
  })
);

// ── Auth ────────────────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);

// ── Menu ────────────────────────────────────────────────────────────
router.get('/menu', getMenu);
router.get('/menu/:id', getItem);
router.post('/menu', protect, authorize('admin'), createItem);
router.put('/menu/:id', protect, authorize('admin'), updateItem);
router.patch('/menu/:id/availability', protect, authorize('admin', 'chef'), toggleAvailability);
router.delete('/menu/:id', protect, authorize('admin'), deleteItem);

// ── Orders ──────────────────────────────────────────────────────────
router.get('/orders/mine', protect, getMyOrders);
router.get('/orders/queue', protect, authorize('chef', 'admin', 'staff'), getQueue);
router.get('/orders/stats/today', protect, authorize('chef', 'admin', 'staff'), todayStats);
router.post('/orders', protect, placeOrder);
router.patch('/orders/:id/status', protect, authorize('chef', 'admin', 'staff'), updateStatus);
router.patch('/orders/:id/assign', protect, authorize('admin'), assignChef);
router.get('/orders/:id', protect, getOrder);

// ── Payments ────────────────────────────────────────────────────────
router.post('/payments/create', protect, createPayment);
router.post('/payments/verify', protect, verifyPayment);
router.post('/payments/webhook', webhook);
router.post('/payments/cash', protect, authorize('admin', 'staff'), confirmCash);

// ── Feedback ────────────────────────────────────────────────────────
router.get('/feedback', protect, listFeedback);
router.post('/feedback', protect, createFeedback);
router.patch('/feedback/:id/reply', protect, authorize('admin'), replyFeedback);
router.delete('/feedback/:id', protect, authorize('admin'), deleteFeedback);

// ── Stock / inventory ───────────────────────────────────────────────
router.get('/stock/low', protect, authorize('admin', 'staff', 'chef'), lowStock);
router.get('/stock', protect, authorize('admin', 'staff'), listStock);
router.post('/stock', protect, authorize('admin', 'staff'), createStock);
router.put('/stock/:id', protect, authorize('admin', 'staff'), updateStock);
router.patch('/stock/:id/restock', protect, authorize('admin', 'staff'), restock);
router.delete('/stock/:id', protect, authorize('admin', 'staff'), deleteStock);

// ── Users ───────────────────────────────────────────────────────────
router.get('/users/chefs', protect, listChefs);
router.get('/users', protect, authorize('admin'), listUsers);
router.post('/users', protect, authorize('admin'), createUser);
router.patch('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// ── Attendance ──────────────────────────────────────────────────────
router.get('/attendance/me', protect, myAttendance);
router.get('/attendance', protect, authorize('admin', 'staff'), listAttendance);
router.post('/attendance', protect, authorize('admin', 'staff'), markAttendance);

// ── Notifications ───────────────────────────────────────────────────
router.get('/notifications', protect, listNotifications);
router.patch('/notifications/read-all', protect, markAllRead);
router.patch('/notifications/:id/read', protect, markRead);

// ── Analytics ───────────────────────────────────────────────────────
router.get('/analytics/dashboard', protect, authorize('admin'), dashboard);

export default router;
