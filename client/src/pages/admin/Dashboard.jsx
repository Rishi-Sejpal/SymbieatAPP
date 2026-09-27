import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

function Bars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((d) => (
        <div key={d._id} className="group flex flex-1 flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-stone-400 opacity-0 transition group-hover:opacity-100">₹{d.revenue}</span>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500 hover:from-brand-700"
            style={{ height: `${Math.max(6, (d.revenue / max) * 100)}%` }}
          />
          <span className="text-[10px] text-stone-400 dark:text-zinc-500">{d._id.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    api.get(`/analytics/dashboard?days=${days}`).then((d) => setData(d.analytics)).catch(() => {});
  }, [days]);

  if (!data) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>;
  }

  const statusMap = Object.fromEntries(data.statusCounts.map((s) => [s._id, s.count]));

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Canteen Dashboard</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Live operating picture for the last {data.days} days.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${days === d ? 'bg-brand-600 text-white' : 'border border-stone-200 text-stone-500 hover:border-brand-300 dark:border-zinc-700'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Revenue (paid)', `₹${data.totals.totalRevenue?.toLocaleString('en-IN')}`, '💰', 'text-emerald-600'],
          ['Total orders', data.totals.totalOrders?.toLocaleString('en-IN'), '🧾', 'text-brand-600'],
          ['Avg order value', `₹${Math.round(data.totals.avgOrder || 0)}`, '📈', 'text-blue-600'],
          ['Menu items', data.menuCount, '🍽️', 'text-amber-600'],
        ].map(([label, value, icon, color]) => (
          <div key={label} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400 dark:text-zinc-500">{label}</p>
              <span className="text-xl">{icon}</span>
            </div>
            <p className={`mt-2 text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Daily revenue</h2>
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">paid orders</span>
          </div>
          {data.revenueTrend.length === 0 ? (
            <p className="mt-8 text-center text-sm text-stone-400">No paid orders in this window yet.</p>
          ) : (
            <div className="mt-6">
              <Bars data={data.revenueTrend} />
            </div>
          )}
        </div>

        {/* Status distribution */}
        <div className="card p-6">
          <h2 className="font-bold">Order status mix</h2>
          <div className="mt-5 space-y-3">
            {['completed', 'ready', 'preparing', 'confirmed', 'placed', 'cancelled'].map((s) => {
              const count = statusMap[s] || 0;
              const pct = data.totals.totalOrders ? Math.round((count / data.totals.totalOrders) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize text-stone-600 dark:text-zinc-300">{s}</span>
                    <span className="text-stone-400">{count} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Top items */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-bold">Best sellers</h2>
          <div className="mt-4 space-y-3">
            {data.topItems.length === 0 && <p className="text-sm text-stone-400">No sales recorded yet.</p>}
            {data.topItems.map((t, i) => (
              <div key={t._id} className="flex items-center gap-4">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{t._id}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-brand-400" style={{ width: `${(t.qty / data.topItems[0].qty) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">{t.qty} sold · ₹{t.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users + feedback */}
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="font-bold">Campus users</h2>
            <div className="mt-4 space-y-2.5">
              {data.users.map((u) => (
                <div key={u._id} className="flex items-center justify-between text-sm">
                  <span className="font-semibold capitalize">{u._id}s</span>
                  <span className="badge bg-stone-100 dark:bg-zinc-800">{u.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
            <h2 className="font-bold">Feedback pulse</h2>
            <p className="mt-2 font-display text-4xl font-bold">{data.feedback.avg ? data.feedback.avg.toFixed(1) : '—'}★</p>
            <p className="text-sm text-brand-100">{data.feedback.count} reviews · keep it up!</p>
            <Link to="/admin/feedback" className="mt-4 inline-block rounded-xl bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur transition hover:bg-white/25">
              Read feedback →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/admin/orders" className="btn-primary">Manage live orders</Link>
        <Link to="/admin/menu" className="btn-ghost">Edit menu</Link>
        <Link to="/admin/stock" className="btn-ghost">Inventory</Link>
        <Link to="/admin/attendance" className="btn-ghost">Attendance</Link>
      </div>
    </div>
  );
}
