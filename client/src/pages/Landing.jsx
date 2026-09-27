import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    icon: '📋',
    title: 'Live Digital Menu',
    text: 'Today’s menu, prices and sold-out alerts in real time — no more peering at whiteboards.',
  },
  {
    icon: '🎫',
    title: 'Token-Based Ordering',
    text: 'Order from your seat, get a unique token, skip the queue entirely.',
  },
  {
    icon: '💳',
    title: 'UPI & Card Payments',
    text: 'Pay in two taps with UPI or card. Cash-at-counter is still supported.',
  },
  {
    icon: '📡',
    title: 'Live Order Tracking',
    text: 'Watch your order move from Confirmed to Ready, with instant notifications.',
  },
  {
    icon: '📦',
    title: 'Smart Stock Control',
    text: 'Inventory auto-depletes with orders and warns admins before anything runs out.',
  },
  {
    icon: '📊',
    title: 'Admin Analytics',
    text: 'Revenue trends, best-sellers and feedback pulse — data the canteen committee loves.',
  },
];

const STEPS = [
  { n: '01', t: 'Browse & add', d: 'Pick from the live menu — veg indicators, ratings and prep times included.' },
  { n: '02', t: 'Pay your way', d: 'UPI, card or cash at the counter. Payments are verified server-side.' },
  { n: '03', t: 'Track your token', d: 'Live status updates until you hear "token ready" at the pickup counter.' },
];

const FAQS = [
  ['Who can use SymbiEat?', 'Every Symbiosis student and staff member — sign up with your college email and you’re in.'],
  ['What if an item sells out?', 'The menu updates in real time and we never let you pay for an unavailable item.'],
  ['Can I still pay cash?', 'Yes. Choose "Cash at counter" and the canteen staff confirms it when you collect.'],
  ['Where do I collect my order?', 'Each counter (Main, North, South, Beverages) has a pickup shelf sorted by token number.'],
];

export default function Landing() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [openFaq, setOpenFaq] = useState(-1);

  useEffect(() => {
    api.get('/menu?available=true').then((d) => setItems(d.items.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-brand-100 blur-3xl dark:bg-brand-950/50" />
          <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-50 blur-3xl dark:bg-zinc-900" />
        </div>

        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="badge mb-6 bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
              🎓 Symbiosis International University · Pune
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Campus dining,
              <br />
              <span className="text-brand-600">minus the queue.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600 dark:text-zinc-400">
              SymbiEat is the university canteen, rebuilt for your phone: browse the live menu,
              order with a token, pay by UPI or card, and track every step — while our kitchen runs on
              real-time dashboards.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <Link to="/menu" className="btn-primary px-6 py-3 text-base">
                  Order now
                  <span aria-hidden>→</span>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary px-6 py-3 text-base">
                    Get started — it’s free
                  </Link>
                  <Link to="/login" className="btn-ghost px-6 py-3 text-base">
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-stone-500 dark:text-zinc-400">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> 4 counters live</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> ~6 min average wait</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> 100% UPI-ready</span>
            </div>
          </div>

          {/* Mock order card */}
          <div className="relative mx-auto w-full max-w-md animate-scale-in lg:max-w-none">
            <div className="card overflow-hidden p-0 shadow-xl">
              <div className="flex items-center justify-between bg-brand-600 px-5 py-4 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Order token</p>
                  <p className="font-display text-2xl font-bold">SIE-000412</p>
                </div>
                <span className="badge bg-white/15 text-white backdrop-blur">● Preparing</span>
              </div>
              <div className="space-y-4 p-5">
                {[
                  ['Paneer Butter Masala + Naan', '×1', '₹130'],
                  ['Masala Chai', '×2', '₹30'],
                  ['Gulab Jamun (2 pc)', '×1', '₹40'],
                ].map(([n, q, p]) => (
                  <div key={n} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{n}</span>
                    <span className="text-stone-400 dark:text-zinc-500">{q}</span>
                    <span className="font-bold">{p}</span>
                  </div>
                ))}
                <div className="border-t border-dashed border-stone-200 pt-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500 dark:text-zinc-400">Paid via UPI</span>
                    <span className="text-lg font-extrabold text-brand-600">₹200</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 dark:bg-zinc-800/60">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-400">Pickup code</span>
                  <span className="font-mono text-lg font-bold tracking-widest">4821</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rotate-[-4deg] rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-stone-100 dark:bg-zinc-900 dark:ring-zinc-800 sm:block">
              <p className="text-xs text-stone-400 dark:text-zinc-500">Orders served today</p>
              <p className="text-xl font-extrabold text-brand-600">312</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────── */}
      <section className="my-8 rounded-3xl bg-brand-700 px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            ['12k+', 'orders served monthly'],
            ['4', 'campus counters'],
            ['4.6★', 'average meal rating'],
            ['<60s', 'average order time'],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-display text-3xl font-bold sm:text-4xl">{v}</p>
              <p className="mt-1 text-sm text-brand-100">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">Everything in one place</span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Built for the whole campus</h2>
          <p className="mt-4 text-stone-600 dark:text-zinc-400">
            Students skip the line. Chefs see a live queue. Administrators get numbers they can act on.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl transition group-hover:scale-110 dark:bg-brand-950/60">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-zinc-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Menu preview ─────────────────────────────────── */}
      <section className="py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">Straight from the kitchen</span>
            <h2 className="mt-3 font-display text-3xl font-bold">Today at the canteen</h2>
          </div>
          <Link to="/menu" className="btn-ghost">
            Full menu <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40" />)
            : items.map((item) => (
                <Link to="/menu" key={item._id} className="card group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-brand-50 to-stone-100 text-4xl dark:from-brand-950/40 dark:to-zinc-900">
                    {item.isVeg ? '🥗' : '🍗'}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-snug">{item.name}</h3>
                      <span className="shrink-0 font-extrabold text-brand-600">₹{item.price}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-stone-500 dark:text-zinc-400">{item.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-stone-400 dark:text-zinc-500">
                      <span className="font-semibold text-amber-500">★ {item.rating?.toFixed(1) || '—'}</span>
                      <span>· {item.prepMinutes} min</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">Three steps</span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">From craving to counter</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-dashed border-brand-200 p-6 dark:border-brand-900" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="font-display text-4xl font-bold text-brand-200 dark:text-brand-900">{s.n}</span>
              <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-zinc-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="py-10">
        <h2 className="text-center font-display text-3xl font-bold">Loved on campus</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ['Aarav M.', 'B.Tech IT, 3rd Year', 'I order from the library and my chai is ready when I get there. The token screen is genius.'],
            ['Prof. R. Kulkarni', 'Faculty, SIT', 'Lunch break finally feels like a break. The staff dashboard keeps everything moving.'],
            ['Sneha T.', 'MBA, 1st Year', 'The feedback button actually works — they added a south indian counter after our requests.'],
          ].map(([n, r, q]) => (
            <figure key={n} className="card p-6">
              <div className="text-amber-400">★★★★★</div>
              <blockquote className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-zinc-300">"{q}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">{n[0]}</span>
                <div>
                  <p className="text-sm font-bold">{n}</p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500">{r}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold">Questions, answered</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map(([q, a], i) => (
              <div key={q} className="card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                  <span className="font-semibold">{q}</span>
                  <span className={`text-brand-600 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>＋</span>
                </button>
                {openFaq === i && <p className="animate-fade-in px-5 pb-5 text-sm leading-relaxed text-stone-600 dark:text-zinc-400">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-14 text-center text-white shadow-xl sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-brand-800/60" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Hungry? The queue isn’t.</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Join thousands of Symbiosis students ordering smarter. Your first token is 30 seconds away.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link to="/menu" className="btn bg-white px-8 py-3 text-base font-bold text-brand-700 hover:bg-brand-50">
                Browse the menu
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn bg-white px-8 py-3 text-base font-bold text-brand-700 hover:bg-brand-50">
                  Create your account
                </Link>
                <Link to="/login" className="btn border border-white/40 px-8 py-3 text-base font-bold text-white hover:bg-white/10">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
