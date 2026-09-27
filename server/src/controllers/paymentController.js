import crypto from 'node:crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { config } from '../config.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { emitToUser, emitToRoles } from '../realtime.js';
import { notifyUser } from '../services/notificationService.js';

let razorpayClient = null;
async function getRazorpay() {
  if (!config.razorpay.enabled) return null;
  if (!razorpayClient) {
    const { default: Razorpay } = await import('razorpay');
    razorpayClient = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpayClient;
}

/** POST /api/payments/create — initialize payment for an order */
export const createPayment = asyncHandler(async (req, res) => {
  const { orderId, method } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.customer) !== String(req.user._id)) throw new ApiError(403, 'Not your order.');
  if (order.paymentStatus === 'paid') throw new ApiError(409, 'This order is already paid.');

  const amount = Math.round(order.totalAmount * 100); // paise
  const methodFinal = method || order.paymentMethod || 'upi';

  const rp = await getRazorpay();
  if (rp) {
    const rpOrder = await rp.orders.create({
      amount,
      currency: 'INR',
      receipt: order.token,
      notes: { orderId: String(order._id), customer: req.user.email },
    });
    const payment = await Payment.create({
      order: order._id,
      payer: req.user._id,
      amount: order.totalAmount,
      method: methodFinal,
      status: 'pending',
      provider: 'razorpay',
      gatewayOrderId: rpOrder.id,
    });
    order.payment = payment._id;
    order.paymentMethod = methodFinal;
    await order.save();
    return res.status(201).json({
      success: true,
      provider: 'razorpay',
      keyId: config.razorpay.keyId,
      gatewayOrderId: rpOrder.id,
      amount,
      currency: 'INR',
      paymentId: String(payment._id),
    });
  }

  // Simulated flow (demo mode)
  const payment = await Payment.create({
    order: order._id,
    payer: req.user._id,
    amount: order.totalAmount,
    method: methodFinal,
    status: 'pending',
    provider: 'simulated',
  });
  order.payment = payment._id;
  order.paymentMethod = methodFinal;
  await order.save();
  res.status(201).json({
    success: true,
    provider: 'simulated',
    paymentId: String(payment._id),
    amount: order.totalAmount,
  });
});

/** POST /api/payments/verify — simulated confirm OR Razorpay signature verification */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) throw new ApiError(404, 'Payment not found.');
  const order = payment.order;
  if (String(payment.payer) !== String(req.user._id)) throw new ApiError(403, 'Not your payment.');

  if (payment.provider === 'razorpay') {
    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      payment.status = 'failed';
      payment.failureReason = 'Signature verification failed';
      await payment.save();
      throw new ApiError(400, 'Payment verification failed.');
    }
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.gatewaySignature = razorpay_signature;
  } else if (payment.status !== 'paid') {
    // simulated success
    payment.gatewayPaymentId = `sim_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }

  payment.status = 'paid';
  payment.paidAt = new Date();
  await payment.save();

  order.paymentStatus = 'paid';
  order.status = order.status === 'placed' ? 'confirmed' : order.status;
  order.statusHistory.push({ status: order.status, note: 'Payment received' });
  await order.save();

  emitToUser(String(order.customer), 'order:status', {
    orderId: String(order._id),
    token: order.token,
    status: order.status,
  });
  emitToRoles(['admin', 'chef'], 'order:new', order.toObject({ virtuals: true }));
  notifyUser(String(order.customer), {
    title: `Payment received for ${order.token}`,
    body: `₹${order.totalAmount} paid via ${order.paymentMethod?.toUpperCase()}. Your order is confirmed.`,
    type: 'payment',
    link: `/orders/${order._id}`,
  });

  res.json({ success: true, payment, order });
});

/** POST /api/payments/webhook — Razorpay webhook (raw signature check) */
export const webhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', secret).update(req.rawBody || '').digest('hex');
    if (sig !== expected) return res.status(400).json({ success: false, message: 'Bad signature' });
  }
  const event = req.body?.event;
  if (event === 'payment.captured') {
    const entity = req.body.payload?.payment?.entity;
    const payment = await Payment.findOne({ gatewayOrderId: entity?.order_id });
    if (payment && payment.status !== 'paid') {
      payment.status = 'paid';
      payment.gatewayPaymentId = entity?.id || '';
      payment.paidAt = new Date();
      await payment.save();
      const order = await Order.findById(payment.order);
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = order.status === 'placed' ? 'confirmed' : order.status;
        await order.save();
        notifyUser(String(order.customer), {
          title: `Payment received for ${order.token}`,
          body: 'Your order is confirmed.',
          type: 'payment',
          link: `/orders/${order._id}`,
        });
      }
    }
  }
  res.json({ success: true });
});

/** POST /api/payments/cash — pay at counter (staff/admin confirm) */
export const confirmCash = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found.');
  order.paymentStatus = 'paid';
  order.paymentMethod = 'cash';
  order.status = order.status === 'placed' ? 'confirmed' : order.status;
  order.statusHistory.push({ status: order.status, note: 'Cash received at counter' });
  await order.save();
  await Payment.findOneAndUpdate(
    { order: order._id },
    { status: 'paid', method: 'cash', provider: 'cash', paidAt: new Date() },
    { upsert: true }
  );
  notifyUser(String(order.customer), {
    title: `Cash payment recorded for ${order.token}`,
    body: 'Your order is confirmed.',
    type: 'payment',
    link: `/orders/${order._id}`,
  });
  res.json({ success: true, order });
});
