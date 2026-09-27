import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const NEXT = {
  placed: { to: 'confirmed', label: 'Confirm order' },
  confirmed: { to: 'preparing', label: 'Start preparing' },
  preparing: { to: 'ready', label: 'Mark ready' },
  ready: { to: 'completed', label: 'Hand over' },
};

export default function Kitchen() {
  const { user } = useAuth();
  const { orderEvents, notifications } = useSocket();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([api.get('/orders/queue'), api.get('/orders/stats/today')])
      .then(([q, s]) => {
        setOrders(q.orders);
        setStats(s.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    if (orderEvents.length || notifications.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderEvents.length, notifications.length]);

  const advance = async (order) => {
    const next = NEXT[order.status];
    if (!next) return;
    await api.patch(`/orders/${order._id}/status`, { status: next.to });
    load();
  };

  const cancel = async (order) => {
    if (!window.confirm(`Cancel ${order.token}? This cannot be undone.`)) return;
    await api.patch(`/orders/${order._id}/status`, { status: 'cancelled', note: 'Cancelled from kitchen' });
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Kitchen Queue</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Live board for {user?.department || 'all counters'} · {user?.name}
          </p>
        </div>
        <button onClick={load} className="btn-ghost">↻ Refresh</button>
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Orders today', stats.orders, '🎫'],
            ['In queue', stats.pending, '⏳'],
            ['Ready to serve', stats.ready, '🛎️'],
            ['Revenue (paid)', `₹${stats.revenue}`, '💰'],
          ].map(([label, value, icon]) => (
            <div key={label} className="card p-5">
              <p className="text-2xl">{icon}</p>
              <p className="mt-2 text-2xl font-extrabold">{value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-5xl">🧑‍🍳</p>
          <p className="mt-4 text-lg font-bold">Queue is clear!</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">New orders appear here instantly.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <div key={o._id} className={`card p-5 ${o.status === 'placed' ? 'ring-2 ring-brand-500/40' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-lg font-extrabold">{o.token}</p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · counter: '}{o.counter}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="mt-4 space-y-1.5 border-t border-dashed border-stone-200 pt-3 text-sm dark:border-zinc-800">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.quantity}× {i.name} {i.isVeg ? '🟢' : '🔴'}</span>
                  </div>
                ))}
              </div>

              {o.specialInstructions && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  📝 {o.specialInstructions}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-zinc-800">
                <div className="text-xs text-stone-400 dark:text-zinc-500">
                  <span className="font-mono text-base font-bold text-stone-700 dark:text-zinc-200">{o.pickupCode}</span>
                  {' · '}
                  {o.customer?.name || 'Walk-in'}
                  {o.assignedChef ? ` · 👨‍🍳 ${o.assignedChef.name}` : ''}
                </div>
                <span className="text-sm font-extrabold text-brand-600">₹{o.totalAmount}</span>
              </div>

              <div className="mt-4 flex gap-2">
                {NEXT[o.status] && (
                  <button onClick={() => advance(o)} className="btn-primary flex-1 !py-2 text-xs">
                    {NEXT[o.status].label}
                  </button>
                )}
                {!['ready'].includes(o.status) && (
                  <button onClick={() => cancel(o)} className="btn-ghost !py-2 text-xs text-brand-600">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
