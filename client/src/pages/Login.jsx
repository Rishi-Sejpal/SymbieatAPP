import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO = [
  ['Student', 'student@symbieat.dev', 'student123'],
  ['Chef', 'chef@symbieat.dev', 'chef123'],
  ['Staff', 'staff@symbieat.dev', 'staff123'],
  ['Admin', 'admin@symbieat.dev', 'admin123'],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      const from = location.state?.from;
      const fallback = { admin: '/admin', chef: '/kitchen', staff: '/kitchen' }[user.role] || '/menu';
      navigate(from || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fill = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-900/50" />
        <Link to="/" className="relative text-xl font-extrabold">Symbi<span className="text-brand-200">Eat</span></Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight">Welcome back to the <br /> fastest queue on campus.</h2>
          <p className="mt-4 max-w-md text-brand-100">Sign in to track orders, grab tokens and pay in seconds.</p>
        </div>
        <p className="relative text-sm text-brand-200">Symbiosis International University · Lavale, Pune</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 hover:text-brand-600 dark:text-zinc-500 lg:hidden">
            ← Back to home
          </Link>
          <h1 className="font-display text-3xl font-bold">Sign in to SymbiEat</h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">Use your college email. New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></p>

          {error && (
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email" className="input" placeholder="you@sitpune.edu.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-4 dark:border-zinc-700">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">Demo accounts (one-click fill)</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO.map(([role, email, pass]) => (
                <button key={email} type="button" onClick={() => fill(email, pass)} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold capitalize transition hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:hover:border-brand-600">
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
