import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'symbieat-cart-v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.menuItemId === item._id);
      if (found) {
        return prev.map((i) => (i.menuItemId === item._id ? { ...i, quantity: Math.min(20, i.quantity + qty) } : i));
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, isVeg: item.isVeg, quantity: qty }];
    });
  }, []);

  const setQty = useCallback((menuItemId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.menuItemId !== menuItemId)
        : prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: Math.min(20, quantity) } : i))
    );
  }, []);

  const remove = useCallback((menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return { items, add, setQty, remove, clear, count, total };
  }, [items, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
