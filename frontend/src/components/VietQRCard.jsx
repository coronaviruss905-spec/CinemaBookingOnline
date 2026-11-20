import { useState } from 'react';
import { Check, Copy, QrCode, X } from 'lucide-react';
import { formatVnd } from '../utils/format.js';

const MB_ACCOUNT = '0836443099';

function FallbackQrSvg({ seed }) {
  const size = 19;
  const cells = [];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r, c) =>
    (r < 6 && c < 6) || (r < 6 && c >= size - 6) || (r >= size - 6 && c < 6);

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      let on = false;
      if (isFinder(r, c)) {
        const lr = r >= size - 6 ? r - (size - 6) : r;
        const lc = c >= size - 6 ? c - (size - 6) : c;
        on =
          lr === 0 ||
          lr === 5 ||
          lc === 0 ||
          lc === 5 ||
          (lr >= 2 && lr <= 3 && lc >= 2 && lc <= 3);
      } else {
        const v = (hash ^ (r * 37 + c * 19 + r * c)) >>> 0;
        on = v % 2 === 0;
      }
      if (on) {
        cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#09090b" />);
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-48 w-48 rounded-lg bg-white p-2">
      {cells}
    </svg>
  );
}

export default function VietQRCard({ amount, transferContent, bookingCode, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const qrUrl = `https://img.vietqr.io/image/MB-${MB_ACCOUNT}-qr_only.png?amount=${encodeURIComponent(
    amount || 0
  )}&addInfo=${encodeURIComponent(transferContent || '')}&accountName=CBO%20CINEMA`;

  const copyValue = async (field, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  return (
    <div className="relative flex h-full flex-col items-center justify-between bg-gradient-to-br from-[#c01862] via-[#9d174d] to-[#500724] p-6 text-white">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thanh toán"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="w-full pt-1 text-center">
        <h3 className="text-sm font-bold tracking-wide text-white/95 sm:text-base">
          Quét mã QR MB Bank để thanh toán
        </h3>
      </div>

      {/* White QR Frame with Magenta Corner Brackets */}
      <div className="my-5 rounded-2xl bg-white p-4 shadow-2xl">
        <div className="relative p-2">
          <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-[3px] border-t-[3px] border-[#c01862]" />
          <span className="pointer-events-none absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-[3px] border-t-[3px] border-[#c01862]" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-[3px] border-l-[3px] border-[#c01862]" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-[3px] border-r-[3px] border-[#c01862]" />

          {!imgError ? (
            <img
              src={qrUrl}
              alt={`VietQR MB Bank ${MB_ACCOUNT} - ${transferContent}`}
              onError={() => setImgError(true)}
              className="h-48 w-48 object-contain"
            />
          ) : (
            <FallbackQrSvg seed={`${MB_ACCOUNT}-${transferContent || bookingCode || 'CINE'}`} />
          )}
        </div>

        <div className="mt-1 text-center font-mono text-[11px] font-bold tracking-wider text-zinc-700">
          MB BANK • {MB_ACCOUNT}
        </div>
      </div>

      {/* Compact Copy Chips & Instruction */}
      <div className="w-full space-y-2.5">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => copyValue('stk', MB_ACCOUNT)}
            className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-left ring-1 ring-white/15 transition hover:bg-black/45"
          >
            <div className="min-w-0">
              <div className="text-[10px] text-pink-200/80">STK MB Bank</div>
              <div className="truncate font-mono font-bold text-white">{MB_ACCOUNT}</div>
            </div>
            {copiedField === 'stk' ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0 text-pink-200/80" />
            )}
          </button>

          <button
            type="button"
            onClick={() => copyValue('memo', transferContent || '')}
            className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-left ring-1 ring-white/15 transition hover:bg-black/45"
          >
            <div className="min-w-0">
              <div className="text-[10px] text-pink-200/80">Nội dung CK</div>
              <div className="truncate font-mono font-bold text-amber-200">
                {transferContent}
              </div>
            </div>
            {copiedField === 'memo' ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0 text-pink-200/80" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-center text-xs text-pink-100/90">
          <QrCode className="h-3.5 w-3.5 shrink-0" />
          <span>
            Sử dụng App ngân hàng hoặc ứng dụng Camera hỗ trợ QR code để quét mã ({formatVnd(amount)}).
          </span>
        </div>
      </div>
    </div>
  );
}
