import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'completed'];
const STEP_META = {
  placed: ['Order placed', '🧾'],
  confirmed: ['Confirmed', '✅'],
  preparing: ['Being prepared', '👨‍🍳'],
  ready: ['Ready for pickup', '🛎️'],
  completed: ['Collected', '🎉'],
};

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const justPaid = params.get('justPaid') === '1';
  const { user } = useAuth();
  const { orderEvents } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [fbDone, setFbDone] = useState(false);
  const [fbMsg, setFbMsg] = useState('');

  const load = useCallback(() => {
    api.get(`/orders/${id}`).then((d) => {
      setOrder(d.order);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);
  useEffect(() => {
    const evt = orderEvents.find((e) => e.orderId === id);
    if (evt) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderEvents.length]);

  if (loading) return <div className="mx-auto max-w-2xl"><div className="skeleton h-96" /></div>;
  if (!order) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-4xl">🤔</p>
        <p className="mt-3 font-bold">Order not found</p>
        <Link to="/orders" className="btn-primary mt-5">Back to orders</Link>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(order.status);
  const cancelled = order.status === 'cancelled';
  const canReview = ['completed', 'ready'].includes(order.status);

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!rating) return;
    try {
      await api.post('/feedback', { rating, comment, order: order._id });
      setFbDone(true);
    } catch (err) {
      setFbMsg(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {justPaid && (
        <div className="mb-5 animate-scale-in rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-3xl">🎉</p>
          <p className="mt-1 font-extrabold text-emerald-700 dark:text-emerald-300">Payment successful — order confirmed!</p>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-600 px-6 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Token</p>
            <p className="font-display text-3xl font-bold">{order.token}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Pickup code</p>
            <p className="font-mono text-2xl font-bold tracking-[0.3em]">{order.pickupCode}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={order.status} />
            <span className="text-sm text-stone-500 dark:text-zinc-400">
              {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>

          {cancelled ? (
            <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              This order was cancelled. {order.cancelledReason && <span className="font-semibold">Reason: {order.cancelledReason}</span>}
            </div>
          ) : (
            <ol className="mt-8 space-y-0">
              {STEPS.map((s, i) => {
                const done = i <= stepIndex;
                const current = i === stepIndex;
                return (
                  <li key={s} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < STEPS.length - 1 && (
                      <span className={`absolute left-[19px] top-10 h-full w-0.5 ${i < stepIndex ? 'bg-brand-600' : 'bg-stone-200 dark:bg-zinc-800'}`} />
                    )}
                    <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition-all duration-500 ${
                      done ? 'bg-brand-600 text-white shadow-md' : 'bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-600'
                    } ${current ? 'animate-pulse-soft ring-4 ring-brand-200 dark:ring-brand-900' : ''}`}>
                      {STEP_META[s][1]}
                    </span>
                    <div className="pt-1.5">
                      <p className={`font-bold ${done ? '' : 'text-stone-400 dark:text-zinc-600'}`}>{STEP_META[s][0]}</p>
                      {current && <p className="text-xs text-stone-500 dark:text-zinc-400">Happening now — we’ll ping you on every update.</p>}
                      {s === 'ready' && current && <p className="mt-0.5 text-xs font-bold text-emerald-600">Show pickup code {order.pickupCode} at the counter.</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-6 rounded-2xl border border-stone-100 p-4 dark:border-zinc-800">
            <div className="space-y-2">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{i.name} <span className="text-stone-400">×{i.quantity}</span></span>
                  <span className="font-bold">₹{i.price * i.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-stone-200 pt-3 dark:border-zinc-800">
              <span className="text-sm text-stone-500 dark:text-zinc-400">
                Paid via {order.paymentMethod?.toUpperCase() || '—'} · {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus}
              </span>
              <span className="text-xl font-extrabold text-brand-600">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {canReview && (
        <div className="card mt-5 p-6">
          <h2 className="font-bold">How was it?</h2>
          {fbDone ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Thanks for the feedback — it keeps our chefs inspired! 🌟
            </p>
          ) : (
            <form onSubmit={submitFeedback} className="mt-4">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className={`text-3xl transition-transform hover:scale-110 ${n <= rating ? 'grayscale-0' : 'grayscale opacity-40'}`} aria-label={`${n} star`}>
                    ⭐
                  </button>
                ))}
              </div>
              <textarea className="input mt-3" rows={2} placeholder="Tell the canteen team what you think…" value={comment} onChange={(e) => setComment(e.target.value)} />
              {fbMsg && <p className="mt-2 text-sm text-brand-600">{fbMsg}</p>}
              <button className="btn-primary mt-3" disabled={!rating}>Submit feedback</button>
            </form>
          )}
        </div>
      )}

      <Link to="/orders" className="mt-6 inline-block text-sm font-semibold text-stone-400 hover:text-brand-600 dark:text-zinc-500">← All orders</Link>
    </div>
  );
}
