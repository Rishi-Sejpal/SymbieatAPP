import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';

const ICONS = { order: '🎫', payment: '💳', stock: '📦', system: '📣' };

export default function Notifications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifications } = useSocket();

  const load = () => api.get('/notifications').then((d) => { setRows(d.notifications); setLoading(false); }).catch(() => setLoading(false));
  useEffect(load, []);
  useEffect(() => {
    if (notifications.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setRows((r) => r.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Notifications</h1>
        <button onClick={markAll} className="text-sm font-semibold text-brand-600 hover:underline">Mark all read</button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : rows.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-4xl">🔕</p>
          <p className="mt-3 font-bold">All quiet</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Order updates and canteen announcements will land here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((n) => (
            <Link to={n.link || '#'} key={n._id} className={`card block p-5 transition hover:-translate-y-0.5 hover:shadow-md ${!n.isRead ? 'border-l-4 !border-l-brand-600' : ''}`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl">{ICONS[n.type] || '🔔'}</span>
                <div className="flex-1">
                  <p className="font-bold">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-stone-500 dark:text-zinc-400">{n.body}</p>}
                  <p className="mt-1 text-xs text-stone-400 dark:text-zinc-600">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
