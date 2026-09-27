import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-stone-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">S</span>
          <span className="font-bold">
            Symbi<span className="text-brand-600">Eat</span>
          </span>
          <span className="text-stone-400 dark:text-zinc-600">·</span>
          <span className="text-stone-500 dark:text-zinc-400">Symbiosis International University, Pune</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-stone-500 dark:text-zinc-400">
          <Link to="/menu" className="transition hover:text-brand-600">Menu</Link>
          <Link to="/feedback" className="transition hover:text-brand-600">Feedback</Link>
          <span>Lavale Campus · Building C</span>
          <span className="text-stone-400 dark:text-zinc-600">7:30 AM – 9:00 PM</span>
        </nav>
      </div>
    </footer>
  );
}
