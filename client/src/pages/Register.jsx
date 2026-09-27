import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', studentId: '', department: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        studentId: form.studentId,
        department: form.department,
      });
      navigate('/menu', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-900/50" />
        <Link to="/" className="relative text-xl font-extrabold">Symbi<span className="text-brand-200">Eat</span></Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight">Join the campus<br />food revolution.</h2>
          <ul className="mt-6 space-y-3 text-brand-100">
            <li>✓ Skip the lunch rush with tokens</li>
            <li>✓ Pay by UPI or card in seconds</li>
            <li>✓ Track every order live</li>
          </ul>
        </div>
        <p className="relative text-sm text-brand-200">Symbiosis International University · Lavale, Pune</p>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 hover:text-brand-600 dark:text-zinc-500 lg:hidden">← Back to home</Link>
          <h1 className="font-display text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">Students register here — staff accounts are issued by the canteen office.</p>

          {error && (
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300">{error}</div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" required className="input" placeholder="Aarav Mehta" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label" htmlFor="email">College email</label>
              <input id="email" type="email" required className="input" placeholder="you@sitpune.edu.in" value={form.email} onChange={set('email')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="sid">Student / PRN</label>
                <input id="sid" className="input" placeholder="S2023_0451" value={form.studentId} onChange={set('studentId')} />
              </div>
              <div>
                <label className="label" htmlFor="dept">Department</label>
                <input id="dept" className="input" placeholder="SIT B.Tech" value={form.department} onChange={set('department')} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="pw">Password</label>
              <input id="pw" type="password" required minLength={6} className="input" placeholder="Minimum 6 characters" value={form.password} onChange={set('password')} />
            </div>
            <div>
              <label className="label" htmlFor="cpw">Confirm password</label>
              <input id="cpw" type="password" required className="input" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">{busy ? 'Creating…' : 'Create account'}</button>
            <p className="text-center text-sm text-stone-500 dark:text-zinc-400">
              Already registered? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
