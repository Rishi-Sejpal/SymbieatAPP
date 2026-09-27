import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function FeedbackView() {
  const [rows, setRows] = useState([]);
  const [replyFor, setReplyFor] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/feedback').then((d) => { setRows(d.feedback); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const sendReply = async (fb) => {
    if (!reply.trim()) return;
    await api.patch(`/feedback/${fb._id}/reply`, { reply });
    setReplyFor(null);
    setReply('');
    load();
  };

  const remove = async (fb) => {
    if (!window.confirm('Delete this feedback?')) return;
    await api.delete(`/feedback/${fb._id}`);
    load();
  };

  const avg = rows.length ? (rows.reduce((s, f) => s + f.rating, 0) / rows.length).toFixed(1) : '—';
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: rows.filter((f) => f.rating === n).length }));

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-bold">Feedback</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Reply publicly — students see your answers.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-4">
        <div className="card p-6 text-center">
          <p className="font-display text-5xl font-bold text-brand-600">{avg}</p>
          <p className="text-sm text-stone-400">average of {rows.length} reviews</p>
        </div>
        <div className="card p-6 lg:col-span-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-400">Rating distribution</h2>
          <div className="mt-4 space-y-2">
            {dist.map(({ n, c }) => (
              <div key={n} className="flex items-center gap-3 text-sm">
                <span className="w-10 font-bold text-amber-500">{n}★</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                  <div className="h-full rounded-full bg-brand-400 transition-all duration-500" style={{ width: `${rows.length ? (c / rows.length) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right text-xs font-semibold text-stone-400">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : rows.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-3 font-bold">No feedback yet</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((f) => (
            <div key={f._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                    {f.user?.name?.[0] || '?'}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{f.user?.name || 'Anonymous'}</p>
                    <p className="text-xs text-stone-400">
                      {f.menuItem?.name || 'Overall experience'} · {new Date(f.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-500">{'★'.repeat(f.rating)}<span className="text-stone-200 dark:text-zinc-700">{'★'.repeat(5 - f.rating)}</span></span>
                  <button onClick={() => remove(f)} className="text-xs font-bold text-stone-300 hover:text-brand-600 dark:text-zinc-600">Delete</button>
                </div>
              </div>
              {f.comment && <p className="mt-3 text-sm text-stone-600 dark:text-zinc-300">"{f.comment}"</p>}

              {f.adminReply ? (
                <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm dark:bg-brand-950/40">
                  <span className="font-bold text-brand-700 dark:text-brand-300">Your reply:</span> {f.adminReply}
                </p>
              ) : replyFor === f._id ? (
                <div className="mt-3 flex gap-2">
                  <input autoFocus className="input" placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendReply(f)} />
                  <button onClick={() => sendReply(f)} className="btn-primary !px-4 !py-2 text-xs">Send</button>
                  <button onClick={() => setReplyFor(null)} className="btn-ghost !px-4 !py-2 text-xs">Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setReplyFor(f._id); setReply(''); }} className="mt-3 text-xs font-bold text-brand-600 hover:underline">↩ Reply</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
