import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const STATUSES = ['present', 'absent', 'leave', 'half-day'];
const STYLE = {
  present: 'bg-emerald-600 text-white',
  absent: 'bg-brand-600 text-white',
  leave: 'bg-amber-500 text-white',
  'half-day': 'bg-blue-500 text-white',
  unmarked: 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function Attendance() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  const load = useCallback(() => {
    api.get(`/attendance?date=${date}`).then((d) => { setRows(d.rows); setLoading(false); }).catch(() => setLoading(false));
  }, [date]);
  useEffect(load, [load]);

  const mark = async (row, status) => {
    setSaving(row.staffId);
    await api.post('/attendance', { staffId: row.staffId, date, status });
    load();
    setTimeout(() => setSaving(''), 400);
  };

  const summary = STATUSES.map((s) => ({ s, n: rows.filter((r) => r.status === s).length }));

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Attendance</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Kitchen & canteen staff roster.</p>
        </div>
        <input type="date" className="input !w-44" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.map(({ s, n }) => (
          <div key={s} className="card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400 dark:text-zinc-500">{s}</p>
            <p className="mt-1 text-2xl font-extrabold">{n}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : (
        <div className="card mt-6 divide-y divide-stone-50 p-2 dark:divide-zinc-800/60">
          {rows.map((row) => (
            <div key={row.staffId} className="flex flex-wrap items-center gap-4 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">{row.name[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{row.name}</p>
                <p className="text-xs capitalize text-stone-400">{row.role} · {row.department || 'general'}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => mark(row, s)}
                    disabled={saving === row.staffId}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all duration-200 ${
                      row.status === s ? STYLE[s] + ' shadow-md scale-105' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
