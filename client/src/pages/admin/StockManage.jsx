import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs'];
const EMPTY = { name: '', category: 'General', quantity: 0, threshold: 10, unit: 'kg', costPerUnit: 0, supplier: '' };

export default function StockManage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [restockQty, setRestockQty] = useState({});
  const [error, setError] = useState('');

  const load = () => api.get('/stock').then((d) => setItems(d.items)).catch(() => {});
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/stock', form);
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const restock = async (item) => {
    const qty = Number(restockQty[item._id]);
    if (!qty || qty <= 0) return;
    await api.patch(`/stock/${item._id}/restock`, { quantity: qty });
    setRestockQty((r) => ({ ...r, [item._id]: '' }));
    load();
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove ${item.name} from inventory?`)) return;
    await api.delete(`/stock/${item._id}`);
    load();
  };

  const lowCount = items.filter((i) => i.quantity <= i.threshold).length;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Inventory</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            {lowCount > 0 ? <span className="font-bold text-brand-600">⚠ {lowCount} item{lowCount > 1 ? 's' : ''} running low</span> : 'All stock levels healthy'}
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">+ Add stock item</button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card mt-6 grid gap-4 p-6 sm:grid-cols-3 animate-scale-in">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min="0" step="any" className="input" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Low threshold</label>
            <input type="number" min="0" className="input" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Cost / unit (₹)</label>
            <input type="number" min="0" step="any" className="input" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Supplier</label>
            <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          {error && <p className="text-sm text-brand-600 sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button className="btn-primary">Save item</button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const low = item.quantity <= item.threshold;
          const pct = Math.min(100, (item.quantity / Math.max(1, item.threshold * 3)) * 100);
          return (
            <div key={item._id} className={`card p-5 ${low ? 'ring-2 ring-brand-500/40' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500">{item.category} · {item.supplier || 'no supplier'}</p>
                </div>
                {low && <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">Low</span>}
              </div>
              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{item.quantity}<span className="ml-1 text-sm font-semibold text-stone-400">{item.unit}</span></span>
                  <span className="text-xs text-stone-400">min {item.threshold} {item.unit}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                  <div className={`h-full rounded-full transition-all duration-500 ${low ? 'bg-brand-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(4, pct)}%` }} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="+ qty"
                  className="input !w-24 !px-2 !py-1.5 text-xs"
                  value={restockQty[item._id] || ''}
                  onChange={(e) => setRestockQty((r) => ({ ...r, [item._id]: e.target.value }))}
                />
                <button onClick={() => restock(item)} className="btn-primary !px-3 !py-1.5 text-xs">Restock</button>
                <button onClick={() => remove(item)} className="ml-auto text-xs font-bold text-stone-300 hover:text-brand-600 dark:text-zinc-600">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
