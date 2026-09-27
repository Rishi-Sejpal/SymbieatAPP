import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useSocket } from '../../context/SocketContext.jsx';

const CATEGORIES = ['Breakfast', 'Main Course', 'Snacks', 'Beverages', 'Desserts', 'Combos'];
const COUNTERS = ['main', 'north', 'south', 'beverages'];

const EMPTY = {
  name: '', description: '', price: 50, category: 'Main Course', counter: 'main',
  isVeg: true, prepMinutes: 10, dailyStockLimit: 0,
};

export default function MenuManage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/menu').then((d) => setItems(d.items)).catch(() => {});
  useEffect(load, []);

  const openNew = () => { setEditing('new'); setForm(EMPTY); setError(''); };
  const openEdit = (item) => {
    setEditing(item._id);
    setForm({
      name: item.name, description: item.description, price: item.price, category: item.category,
      counter: item.counter, isVeg: item.isVeg, prepMinutes: item.prepMinutes, dailyStockLimit: item.dailyStockLimit,
    });
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing === 'new') await api.post('/menu', form);
      else await api.put(`/menu/${editing}`, form);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item) => {
    await api.patch(`/menu/${item._id}/availability`, { isAvailable: !item.isAvailable });
    load();
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return;
    await api.delete(`/menu/${item._id}`);
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Menu Management</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Changes go live for every student instantly.</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add item</button>
      </div>

      {editing !== null && (
        <div className="card mt-6 p-6 animate-scale-in">
          <h2 className="font-bold">{editing === 'new' ? 'New menu item' : 'Edit item'}</h2>
          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" min="0" className="input" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Counter</label>
              <select className="input" value={form.counter} onChange={(e) => setForm({ ...form, counter: e.target.value })}>
                {COUNTERS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prep time (min)</label>
              <input type="number" min="1" className="input" value={form.prepMinutes} onChange={(e) => setForm({ ...form, prepMinutes: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Daily limit (0 = unlimited)</label>
              <input type="number" min="0" className="input" value={form.dailyStockLimit} onChange={(e) => setForm({ ...form, dailyStockLimit: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-green-600" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} />
              Vegetarian
            </label>
            {error && <p className="text-sm text-brand-600 sm:col-span-2">{error}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save item'}</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400 dark:border-zinc-800">
              <th className="px-5 py-3.5">Item</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Counter</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5">Rating</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/60">
            {items.map((item) => (
              <tr key={item._id} className="transition hover:bg-stone-50/60 dark:hover:bg-zinc-800/40">
                <td className="px-5 py-3.5">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-stone-400">{item.isVeg ? '🟢 Veg' : '🔴 Non-veg'}</p>
                </td>
                <td className="px-5 py-3.5">{item.category}</td>
                <td className="px-5 py-3.5 capitalize">{item.counter}</td>
                <td className="px-5 py-3.5 font-bold text-brand-600">₹{item.price}</td>
                <td className="px-5 py-3.5 text-amber-500">★ {item.rating?.toFixed(1) || '—'}</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggle(item)} className={`badge ${item.isAvailable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'}`}>
                    {item.isAvailable ? 'Available' : 'Sold out'}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(item)} className="text-xs font-bold text-stone-500 hover:text-brand-600">Edit</button>
                    <button onClick={() => remove(item)} className="text-xs font-bold text-stone-300 hover:text-brand-600 dark:text-zinc-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
