import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Cart() {
  const { items, setQty, remove, clear, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-md animate-scale-in p-10 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">Add something delicious from the campus menu.</p>
        <Link to="/menu" className="btn-primary mt-6">Browse the menu</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Your Cart</h1>
        <button onClick={clear} className="text-sm font-semibold text-brand-600 hover:underline">Clear all</button>
      </div>

      <div className="card divide-y divide-stone-100 p-2 dark:divide-zinc-800">
        {items.map((i) => (
          <div key={i.menuItemId} className="flex items-center gap-4 p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${i.isVeg ? 'bg-green-50 dark:bg-green-950/40' : 'bg-brand-50 dark:bg-brand-950/40'}`}>
              {i.isVeg ? '🥗' : '🍗'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{i.name}</p>
              <p className="text-sm text-stone-400 dark:text-zinc-500">₹{i.price} each</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-stone-200 p-1 dark:border-zinc-700">
              <button onClick={() => setQty(i.menuItemId, i.quantity - 1)} className="h-8 w-8 rounded-lg text-lg font-bold text-stone-500 transition hover:bg-stone-100 dark:hover:bg-zinc-800" aria-label={`Reduce ${i.name}`}>−</button>
              <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
              <button onClick={() => setQty(i.menuItemId, i.quantity + 1)} className="h-8 w-8 rounded-lg text-lg font-bold text-brand-600 transition hover:bg-brand-50 dark:hover:bg-brand-950/40" aria-label={`Add ${i.name}`}>+</button>
            </div>
            <span className="w-20 text-right font-extrabold">₹{i.price * i.quantity}</span>
            <button onClick={() => remove(i.menuItemId)} className="text-stone-300 transition hover:text-brand-600 dark:text-zinc-600" aria-label={`Remove ${i.name}`}>✕</button>
          </div>
        ))}
      </div>

      <div className="card mt-5 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 dark:text-zinc-400">Items</span>
          <span className="font-semibold">{count}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-dashed border-stone-200 pt-3 dark:border-zinc-800">
          <span className="font-bold">Total</span>
          <span className="text-2xl font-extrabold text-brand-600">₹{total}</span>
        </div>
        <Link to="/checkout" className="btn-primary mt-5 w-full py-3 text-base">Proceed to checkout →</Link>
      </div>
    </div>
  );
}
