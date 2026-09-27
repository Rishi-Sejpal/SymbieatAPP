import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', phone: user?.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/auth/profile', form);
      setMsg('Profile saved ✓');
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', { ...pw });
      setPwMsg('Password updated ✓');
      setPw({ currentPassword: '', newPassword: '' });
      setTimeout(() => setPwMsg(''), 2500);
    } catch (err) {
      setPwMsg(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold">Profile</h1>

      <div className="card mt-6 p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-extrabold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-bold">{user?.name}</p>
            <p className="text-sm text-stone-500 dark:text-zinc-400">{user?.email}</p>
            <span className="badge mt-1 bg-brand-100 capitalize text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-6 space-y-4 border-t border-stone-100 pt-6 dark:border-zinc-800">
          <h2 className="font-bold">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pname">Full name</label>
              <input id="pname" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pdept">Department</label>
              <input id="pdept" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pphone">Phone</label>
              <input id="pphone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="psid">Student / PRN</label>
              <input id="psid" className="input bg-stone-50 dark:bg-zinc-800" value={user?.studentId || '—'} disabled />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            {msg && <span className="text-sm font-semibold text-emerald-600">{msg}</span>}
          </div>
        </form>

        <form onSubmit={changePw} className="mt-6 space-y-4 border-t border-stone-100 pt-6 dark:border-zinc-800">
          <h2 className="font-bold">Change password</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cpw1">Current password</label>
              <input id="cpw1" type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="cpw2">New password</label>
              <input id="cpw2" type="password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost">Update password</button>
            {pwMsg && <span className={`text-sm font-semibold ${pwMsg.includes('✓') ? 'text-emerald-600' : 'text-brand-600'}`}>{pwMsg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
