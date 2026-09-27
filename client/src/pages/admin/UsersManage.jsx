import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const ROLES = ['student', 'staff', 'chef', 'admin'];

export default function UsersManage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', department: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (search) params.set('search', search);
    api.get(`/users?${params}`).then((d) => setUsers(d.users)).catch(() => {});
  };
  useEffect(load, [roleFilter]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'staff', department: '' });
      setMsg('Account created ✓');
      setTimeout(() => setMsg(''), 2500);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const patch = async (id, body) => {
    try {
      await api.patch(`/users/${id}`, body);
      load();
    } catch (err) {
      setMsg(err.message);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}'s account permanently?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Users & Roles</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">Create staff, chef and admin accounts · control access.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">+ New account</button>
      </div>

      {msg && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{msg}</p>}

      {showForm && (
        <form onSubmit={createUser} className="card mt-6 grid gap-4 p-6 sm:grid-cols-2 animate-scale-in">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input className="input" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          {error && <p className="text-sm text-brand-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button className="btn-primary">Create account</button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input className="input !w-64" placeholder="Search name, email, PRN…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {['all', ...ROLES].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`rounded-full px-3.5 py-2 text-xs font-bold capitalize transition ${roleFilter === r ? 'bg-brand-600 text-white' : 'border border-stone-200 text-stone-500 hover:border-brand-300 dark:border-zinc-700'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-5 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400 dark:border-zinc-800">
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/60">
            {users.map((u) => (
              <tr key={u.id} className="transition hover:bg-stone-50/60 dark:hover:bg-zinc-800/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold text-white">{u.name[0]}</span>
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-stone-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <select className="input !w-28 !px-2 !py-1.5 text-xs capitalize" value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3.5 text-stone-500 dark:text-zinc-400">{u.department || '—'}</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => patch(u.id, { isActive: !u.isActive })}
                    className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-stone-200 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
                  >
                    {u.isActive ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => remove(u)} className="text-xs font-bold text-stone-300 hover:text-brand-600 dark:text-zinc-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
