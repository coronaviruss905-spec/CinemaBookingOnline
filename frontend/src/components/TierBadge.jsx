import { Award } from 'lucide-react';

const TIER_STYLES = {
  1: 'bg-slate-800/90 text-slate-200 border-slate-600/60',
  2: 'bg-slate-300/15 text-slate-200 border-slate-300/40',
  3: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
  4: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
};

export default function TierBadge({ maHang = 1, tenHang = 'Thành viên', discount }) {
  const cls = TIER_STYLES[maHang] || TIER_STYLES[1];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <Award className="h-3.5 w-3.5" />
      <span>{tenHang}</span>
      {discount > 0 && <span className="opacity-85">(-{discount}%)</span>}
    </span>
  );
}
