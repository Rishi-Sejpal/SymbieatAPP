import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';

export default function Feedback() {
  const [menu, setMenu] = useState([]);
  const [mine, setMine] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [menuItem, setMenuItem] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/menu').then((d) => setMenu(d.items)).catch(() => {});
    api.get('/feedback?mine=1').then((d) => setMine(d.feedback)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/feedback', {
        rating,
        comment,
        menuItem: menuItem || undefined,
      });
      setDone(true);
      setRating(0);
      setComment('');
      setMenuItem('');
      const d = await api.get('/feedback?mine=1');
      setMine(d.feedback);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold">Feedback</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Your words shape the menu. The committee reads every entry.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card h-fit p-6">
          <h2 className="font-bold">Share your experience</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="item">About a specific item? (optional)</label>
              <select id="item" className="input" value={menuItem} onChange={(e) => setMenuItem(e.target.value)}>
                <option value="">Overall canteen experience</option>
                {menu.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <span className="label">Rating</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className={`text-3xl transition-transform hover:scale-110 ${n <= rating ? 'grayscale-0' : 'grayscale opacity-40'}`} aria-label={`${n} stars`}>⭐</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="cmt">Comments</label>
              <textarea id="cmt" rows={3} className="input" placeholder="What should we keep doing? What should change?" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            {error && <p className="text-sm text-brand-600">{error}</p>}
            {done && <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Submitted — thank you! 🌟</p>}
            <button className="btn-primary w-full" disabled={!rating || busy}>{busy ? 'Sending…' : 'Submit feedback'}</button>
          </form>
        </div>

        <div>
          <h2 className="mb-3 font-bold">Your submissions</h2>
          {mine.length === 0 ? (
            <div className="card p-8 text-center text-sm text-stone-500 dark:text-zinc-400">Nothing yet — be the first to speak up.</div>
          ) : (
            <div className="space-y-3">
              {mine.map((f) => (
                <div key={f._id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-500">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                    <span className="text-xs text-stone-400">{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600 dark:text-zinc-300">{f.menuItem?.name || 'Overall experience'}</p>
                  {f.comment && <p className="mt-1 text-sm">{f.comment}</p>}
                  {f.adminReply && (
                    <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs dark:bg-brand-950/40">
                      <span className="font-bold text-brand-700 dark:text-brand-300">Canteen team:</span> {f.adminReply}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
