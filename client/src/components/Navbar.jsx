import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../lib/api.js';

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 0c-4 0-6 2.5-6 6 0 4 2 7 6 10 4-3 6-6 6-10 0-3.5-2-6-6-6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 11c0 1.5 1 3 3 4 2-1 3-2.5 3-4" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        Symbi<span className="text-brand-600">Eat</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { notifications } = useSocket();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then((d) => setUnread(d.unread)).catch(() => {});
  }, [user, notifications.length]);

  useEffect(() => {
    const close = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const roleLinks =
    user?.role === 'admin'
      ? [
          { to: '/admin', label: 'Dashboard' },
          { to: '/admin/orders', label: 'Orders' },
          { to: '/admin/menu', label: 'Menu' },
          { to: '/admin/stock', label: 'Stock' },
        ]
      : ['chef', 'staff'].includes(user?.role)
        ? [{ to: '/kitchen', label: 'Kitchen' }]
        : [
            { to: '/menu', label: 'Menu' },
            { to: '/orders', label: 'My Orders' },
          ];

  const unreadCount = unread + notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
      <div className="dark:border-b dark:border-zinc-800 dark:bg-zinc-950/85 mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {roleLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-xl p-2.5 text-stone-500 transition hover:bg-stone-100 hover:text-brand-600 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user && (
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((v) => !v)}
                aria-label="Notifications"
                className="relative rounded-xl p-2.5 text-stone-500 transition hover:bg-stone-100 hover:text-brand-600 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="card absolute right-0 mt-2 w-80 animate-scale-in overflow-hidden p-0">
                  <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-zinc-800">
                    <span className="text-sm font-bold">Notifications</span>
                    <Link to="/notifications" className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => setBellOpen(false)}>
                      View all
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-stone-400 dark:text-zinc-500">No live updates right now.</p>
                    )}
                    {notifications.slice(0, 6).map((n) => (
                      <div key={n._id || n.title} className="border-b border-stone-50 px-4 py-3 last:border-0 dark:border-zinc-800/60">
                        <p className="text-sm font-semibold">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{n.body}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user?.role !== 'admin' && user?.role !== 'chef' && (
            <Link to="/cart" className="relative rounded-xl p-2.5 text-stone-500 transition hover:bg-stone-100 hover:text-brand-600 dark:text-zinc-400 dark:hover:bg-zinc-900" aria-label="Cart">
              🛒
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white animate-scale-in">
                  {count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="ml-1 flex items-center gap-2 rounded-xl border border-stone-200 py-1.5 pl-1.5 pr-3 transition hover:border-brand-300 dark:border-zinc-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </span>
                <span className="hidden text-sm font-semibold sm:block">{user.name?.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="card absolute right-0 mt-2 w-52 animate-scale-in p-1.5">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-xs capitalize text-brand-600">{user.role}</p>
                  </div>
                  <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>
                      Admin panel
                    </Link>
                  )}
                  <Link to="/profile" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost !py-2">Sign in</Link>
              <Link to="/register" className="btn-primary !py-2 hidden sm:inline-flex">Get started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
