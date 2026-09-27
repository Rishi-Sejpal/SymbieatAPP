import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const TABS = [
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['all', 'All'],
];

export default function Orders() {
  const { orderEvents } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  const load = () => api.get('/orders/mine').then((d) => { setOrders(d.orders); setLoading(false); }).catch(() => setLoading(false));
  useEffect(load, []);
  useEffect(() => {
    if (orderEvents.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderEvents.length]);

  const filtered = useMemo(() => {
    if (tab === 'all') return orders;
    if (tab === 'completed') return orders.filter((o) => ['completed', 'cancelled'].includes(o.status));
    return orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  }, [orders, tab]);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-bold">My Orders</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Every token, tracked from kitchen to counter.</p>

      <div className="mt-6 flex gap-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === id ? 'bg-brand-600 text-white shadow-sm' : 'border border-stone-200 text-stone-600 hover:border-brand-300 dark:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card mx-auto mt-6 max-w-md p-10 text-center">
          <p className="text-4xl">🎫</p>
          <p className="mt-3 font-bold">No {tab === 'active' ? 'active' : tab} orders yet</p>
          <Link to="/menu" className="btn-primary mt-5">Order something tasty</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 font-mono text-sm font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                    {o.pickupCode}
                  </span>
                  <div>
                    <p className="font-bold">{o.token}</p>
                    <p className="text-xs text-stone-400 dark:text-zinc-500">
                      {new Date(o.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ').slice(0, 48)}{o.items.length > 1 ? '…' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold">₹{o.totalAmount}</span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
