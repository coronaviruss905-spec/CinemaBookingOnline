const STYLES = {
  P: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  K: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  T13: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  T16: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  T18: 'bg-rose-500/25 text-rose-300 border-rose-500/45',
};

const LABELS = {
  P: 'P • Mọi lứa tuổi',
  K: 'K • Dưới 13t có người giám hộ',
  T13: 'T13 • Từ 13 tuổi',
  T16: 'T16 • Từ 16 tuổi',
  T18: 'T18 • Từ 18 tuổi',
};

export default function AgeBadge({ rating, showDescription = false }) {
  const cls = STYLES[rating] || 'bg-slate-700/60 text-slate-200 border-slate-600';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide ${cls}`}
      title={LABELS[rating] || rating}
    >
      {showDescription ? LABELS[rating] || rating : rating}
    </span>
  );
}
