import { useState } from 'react';
import { Film } from 'lucide-react';

export default function MoviePoster({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-rose-950/60 p-4 text-center text-slate-300 ${className}`}
      >
        <Film className="mb-2 h-10 w-10 text-rose-400/80" />
        <span className="line-clamp-3 text-sm font-semibold leading-snug">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
