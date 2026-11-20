import { Database } from 'lucide-react';

export default function SqlBadge({ name, label }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-indigo-300"
      title={`Truy vấn trực tiếp SQL Server: ${name}`}
    >
      <Database className="h-3 w-3 text-indigo-400" />
      {label ? <span className="text-slate-300 font-sans">{label}:</span> : null}
      <span>{name}</span>
    </span>
  );
}
