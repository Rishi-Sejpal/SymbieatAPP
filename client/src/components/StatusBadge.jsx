const STYLES = {
  placed: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  completed: 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
  cancelled: 'bg-brand-100 text-brand-800 dark:bg-brand-950/70 dark:text-brand-300',
};

const LABELS = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || STYLES.placed}`}>{LABELS[status] || status}</span>;
}
