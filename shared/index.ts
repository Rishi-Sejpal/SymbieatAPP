// ── SymbiEat shared domain types & constants ────────────────────────────

export const ROLES = ['student', 'staff', 'chef', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['upi', 'card', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const COUNTERS = ['main', 'north', 'south', 'beverages'] as const;
export type Counter = (typeof COUNTERS)[number];

export const STOCK_UNITS = ['kg', 'g', 'l', 'ml', 'pcs'] as const;
export type StockUnit = (typeof STOCK_UNITS)[number];

export const CATEGORIES = [
  'Breakfast',
  'Main Course',
  'Snacks',
  'Beverages',
  'Desserts',
  'Combos',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Status flow used by chefs/admins to advance an order.
export const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
  completed: null,
  cancelled: null,
};

export const ATTENDANCE_STATUSES = ['present', 'absent', 'leave', 'half-day'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface CartItemInput {
  menuItemId: string;
  quantity: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string>;
}

/** Events emitted over socket.io */
export type SocketEvent =
  | 'menu:updated'
  | 'order:new'
  | 'order:status'
  | 'order:queue'
  | 'stock:low'
  | 'notification:new';

export interface SocketOrderStatusPayload {
  orderId: string;
  token: string;
  status: OrderStatus;
  customerId: string;
}
