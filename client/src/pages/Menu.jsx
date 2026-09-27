import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const CATEGORIES = ['all', 'Breakfast', 'Main Course', 'Snacks', 'Beverages', 'Desserts', 'Combos'];

const EMOJI = {
  Breakfast: '🌅',
  'Main Course': '🍛',
  Snacks: '🥪',
  Beverages: '☕',
  Desserts: '🍮',
  Combos: '🍱',
};

function MenuCard({ item, onAdd, inCart, qty }) {
  const soldOut = !item.isAvailable;
  return (
    <div className={`card group overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${soldOut ? 'opacity-60' : ''}`}>
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-brand-50 to-stone-100 text-5xl transition-transform duration-300 group-hover:scale-105 dark:from-brand-950/40 dark:to-zinc-900">
        {EMOJI[item.category] || '🍽️'}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-zinc-950/60">
            <span className="badge rotate-[-6deg] bg-brand-600 text-white shadow">Sold out</span>
          </span>
        )}
        <span className={`absolute left-3 top-3 h-4 w-4 rounded-sm border-2 ${item.isVeg ? 'border-green-600' : 'border-brand-600'} bg-white dark:bg-zinc-900`}>
          <span className={`absolute inset-0.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-brand-600'}`} />
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold leading-snug">{item.name}</h3>
            <p className="mt-0.5 line-clamp-2 min-h-8 text-xs text-stone-500 dark:text-zinc-400">{item.description}</p>
          </div>
          <span className="shrink-0 text-lg font-extrabold text-brand-600">₹{item.price}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-zinc-500">
            <span className="font-semibold text-amber-500">★ {item.rating?.toFixed(1) || '—'}</span>
            <span>·</span>
            <span>{item.prepMinutes} min</span>
          </div>
          <button onClick={() => onAdd(item)} disabled={soldOut} className="btn-primary !px-3 !py-1.5 text-xs">
            {inCart ? `In cart · ${qty}` : 'Add +'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const { add, items: cartItems } = useCart();
  const { orderEvents } = useSocket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    api.get('/menu').then((d) => {
      setItems(d.items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Refresh when any menu update event arrives (realtime menu board)
  useEffect(() => {
    if (orderEvents.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderEvents.length]);

  const filtered = useMemo(() => {
    let list = items;
    if (category !== 'all') list = list.filter((i) => i.category === category);
    if (vegOnly) list = list.filter((i) => i.isVeg);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return list;
  }, [items, category, search, vegOnly]);

  const onAdd = (item) => {
    add(item);
    setToast(`${item.name} added to cart`);
    setTimeout(() => setToast(''), 1800);
  };

  const qtyOf = (id) => cartItems.find((c) => c.menuItemId === id)?.quantity || 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Campus Menu</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Fresh from the SymbiEat kitchen · updates live</p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2">
          <input className="input" placeholder="Search paneer, dosa, chai…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all duration-200 ${
              category === c
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-stone-200 text-stone-600 hover:border-brand-300 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            {c === 'all' ? '🍽 All' : `${EMOJI[c] || ''} ${c}`}
          </button>
        ))}
        <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-600 dark:text-zinc-400">
          <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} className="h-4 w-4 accent-green-600" />
          Veg only
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-64" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 font-bold">Nothing matches that</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <MenuCard key={item._id} item={item} onAdd={onAdd} inCart={qtyOf(item._id) > 0} qty={qtyOf(item._id)} />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-scale-in">
          <div className="flex items-center gap-3 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-xl dark:bg-white dark:text-zinc-900">
            <span>✓</span> {toast}
            <Link to="/cart" className="underline underline-offset-2">View cart</Link>
          </div>
        </div>
      )}

      {cartItems.length > 0 && (
        <Link to="/cart" className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-brand-600 px-6 py-4 font-bold text-white shadow-xl transition hover:bg-brand-700 hover:scale-105">
          🛒 {cartItems.reduce((s, i) => s + i.quantity, 0)} items · ₹{cartItems.reduce((s, i) => s + i.quantity * i.price, 0)}
        </Link>
      )}
    </div>
  );
}
