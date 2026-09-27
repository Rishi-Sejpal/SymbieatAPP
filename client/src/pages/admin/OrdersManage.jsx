import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function OrdersManage() {
  const { orderEvents } = useSocket();
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([api.get('/orders/queue'), api.get('/users/chefs')])
      .then(([q, c]) => {
        setOrders(q.orders);
        setChefs(c.chefs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    if (orderEvents.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderEvents.length]);

  const assign = async (order, chefId) => {
    if (!chefId) return;
    await api.patch(`/orders/${order._id}/assign`, { chefId });
    load();
  };

  const setStatus = async (order, status) => {
    await api.patch(`/orders/${order._id}/status`, { status });
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Live Orders</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Assign chefs, override status, keep the line moving.</p>
        </div>
        <button onClick={load} className="btn-ghost">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-5xl">📭</p>
          <p className="mt-4 text-lg font-bold">No active orders</p>
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400 dark:border-zinc-800">
                <th className="px-5 py-3.5">Token</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Chef</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/60">
              {orders.map((o) => (
                <tr key={o._id} className="transition hover:bg-stone-50/60 dark:hover:bg-zinc-800/40">
                  <td className="px-5 py-3.5">
                    <p className="font-mono font-bold">{o.token}</p>
                    <p className="text-xs text-stone-400">pick {o.pickupCode} · {o.counter}</p>
                  </td>
                  <td className="px-5 py-3.5">{o.customer?.name}</td>
                  <td className="px-5 py-3.5 max-w-48">
                    <p className="truncate text-xs">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-brand-600">₹{o.totalAmount}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3.5">
                    <select
                      className="input !w-36 !px-2 !py-1.5 text-xs"
                      value={o.assignedChef?._id || ''}
                      onChange={(e) => assign(o, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {chefs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      {o.status === 'placed' && <button onClick={() => setStatus(o, 'confirmed')} className="btn-primary !px-3 !py-1.5 text-xs">Confirm</button>}
                      {o.status === 'confirmed' && <button onClick={() => setStatus(o, 'preparing')} className="btn-primary !px-3 !py-1.5 text-xs">Prepare</button>}
                      {o.status === 'preparing' && <button onClick={() => setStatus(o, 'ready')} className="btn-primary !px-3 !py-1.5 text-xs">Ready</button>}
                      {o.status === 'ready' && <button onClick={() => setStatus(o, 'completed')} className="btn-primary !px-3 !py-1.5 text-xs">Complete</button>}
                      {!['ready', 'completed', 'cancelled'].includes(o.status) && (
                        <button onClick={() => { if (window.confirm(`Cancel ${o.token}?`)) setStatus(o, 'cancelled'); }} className="btn-ghost !px-3 !py-1.5 text-xs text-brand-600">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
