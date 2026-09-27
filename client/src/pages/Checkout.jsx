import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const METHODS = [
  { id: 'upi', label: 'UPI', desc: 'GPay · PhonePe · Paytm', icon: '📲', tag: 'Instant' },
  { id: 'card', label: 'Card', desc: 'Credit / debit, all banks', icon: '💳', tag: 'Secure' },
  { id: 'cash', label: 'Cash at counter', desc: 'Pay when you collect', icon: '💵', tag: 'Classic' },
];

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { pushLocalNotification } = useSocket();
  const navigate = useNavigate();
  const [method, setMethod] = useState('upi');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [upiId, setUpiId] = useState('');

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-4xl">🧾</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Nothing to check out</h1>
        <Link to="/menu" className="btn-primary mt-5">Back to menu</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const placed = await api.post('/orders', {
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        paymentMethod: method,
      });
      const order = placed.order;

      if (method === 'cash') {
        clear();
        navigate(`/orders/${order._id}?justPaid=0`, { replace: true });
        return;
      }

      const pay = await api.post('/payments/create', { orderId: order._id, method });
      if (pay.provider === 'razorpay') {
        // Real gateway flow — the checkout.js SDK is loaded on demand.
        await loadRazorpay();
        const rzp = new window.Razorpay({
          key: pay.keyId,
          amount: pay.amount,
          currency: pay.currency,
          name: 'SymbiEat',
          description: `Order ${order.token}`,
          order_id: pay.gatewayOrderId,
          prefill: { name: order.customer?.name, email: order.customer?.email },
          theme: { color: '#DC2626' },
          handler: async (resp) => {
            await api.post('/payments/verify', {
              paymentId: pay.paymentId,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            clear();
            navigate(`/orders/${order._id}`, { replace: true });
          },
        });
        rzp.open();
        setBusy(false);
        return;
      }

      // Simulated gateway (demo mode): confirm server-side then navigate
      await api.post('/payments/verify', { paymentId: pay.paymentId });
      clear();
      pushLocalNotification({
        title: `Payment successful · ${order.token}`,
        body: `₹${order.totalAmount} paid via ${method.toUpperCase()}`,
        type: 'payment',
      });
      navigate(`/orders/${order._id}?justPaid=1`, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Confirm your items and choose how to pay.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Payment methods */}
        <div className="lg:col-span-3">
          <div className="card p-5">
            <h2 className="font-bold">Payment method</h2>
            <div className="mt-4 space-y-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    method === m.id
                      ? 'border-brand-600 bg-brand-50/60 dark:border-brand-600 dark:bg-brand-950/40'
                      : 'border-stone-200 hover:border-brand-300 dark:border-zinc-700 dark:hover:border-brand-800'
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="flex-1">
                    <span className="block font-bold">{m.label}</span>
                    <span className="block text-xs text-stone-500 dark:text-zinc-400">{m.desc}</span>
                  </span>
                  <span className="badge bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">{m.tag}</span>
                </button>
              ))}
            </div>

            {method === 'upi' && (
              <div className="mt-4 animate-fade-up">
                <label className="label" htmlFor="upi">Your UPI ID (optional in demo)</label>
                <input id="upi" className="input" placeholder="name@okhdfcbank" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                <p className="mt-2 text-xs text-stone-400 dark:text-zinc-500">
                  In production this opens your UPI app via Razorpay. In demo mode, payment is confirmed instantly.
                </p>
              </div>
            )}
            {method === 'card' && (
              <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
                <div className="col-span-2">
                  <label className="label" htmlFor="cardnum">Card number</label>
                  <input id="cardnum" className="input" placeholder="4111 1111 1111 1111" inputMode="numeric" />
                </div>
                <div>
                  <label className="label" htmlFor="exp">Expiry</label>
                  <input id="exp" className="input" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="label" htmlFor="cvv">CVV</label>
                  <input id="cvv" className="input" placeholder="•••" type="password" />
                </div>
                <p className="col-span-2 text-xs text-stone-400 dark:text-zinc-500">
                  Card details are never stored by SymbiEat — production payments are processed by Razorpay.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300">
                {error}
              </div>
            )}

            <button onClick={submit} disabled={busy} className="btn-primary mt-5 w-full py-3 text-base">
              {busy ? 'Processing…' : `Pay ₹${total} securely`}
            </button>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-5">
            <h2 className="font-bold">Order summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <div key={i.menuItemId} className="flex justify-between gap-3">
                  <span className="text-stone-600 dark:text-zinc-300">{i.name} <span className="text-stone-400">×{i.quantity}</span></span>
                  <span className="font-semibold">₹{i.price * i.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-dashed border-stone-200 pt-3 dark:border-zinc-800">
              <div className="flex justify-between text-sm text-stone-500 dark:text-zinc-400">
                <span>Subtotal</span><span>₹{total}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-stone-500 dark:text-zinc-400">
                <span>Taxes & packaging</span><span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-stone-200 pt-3 dark:border-zinc-800">
                <span className="font-bold">To pay</span>
                <span className="text-2xl font-extrabold text-brand-600">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}
