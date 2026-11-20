import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  Film,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import MoviePoster from '../components/MoviePoster.jsx';
import TierBadge from '../components/TierBadge.jsx';
import { formatAgeShort, formatDateVN, formatTimeHM, formatVnd } from '../utils/format.js';

const MAX_SELECT_SEATS = 10;

const AGE_BADGE_SOLID = {
  P: 'bg-emerald-500',
  K: 'bg-sky-500',
  T13: 'bg-amber-500',
  T16: 'bg-orange-500',
  T18: 'bg-red-600',
};

export default function BookingPage() {
  const { maSuatChieu } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [customerTier, setCustomerTier] = useState(null);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sqlErrorInfo, setSqlErrorInfo] = useState(null);

  const loadSeatMap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest(`/showtimes/${maSuatChieu}/seats`);
      setShowtime(res.showtime);
      setSeats(res.seats || []);
      setCustomerTier(res.customerTier || null);
      const availableSet = new Set(
        (res.seats || []).filter((s) => s.TrangThaiGhe === 'TRONG').map((s) => s.ViTri)
      );
      setSelectedPositions((prev) => prev.filter((pos) => availableSet.has(pos)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [maSuatChieu]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap, user?.MaKhachHang]);

  const seatRows = useMemo(() => {
    const map = new Map();
    for (const s of seats) {
      if (!map.has(s.HangGhe)) map.set(s.HangGhe, []);
      map.get(s.HangGhe).push(s);
    }
    return Array.from(map.entries());
  }, [seats]);

  const activeRule = useMemo(() => {
    const withRule = seats.find((s) => s.TenQuyTac);
    return withRule
      ? { TenQuyTac: withRule.TenQuyTac, HeSoQuyTac: withRule.HeSoQuyTac }
      : null;
  }, [seats]);

  const pricesByType = useMemo(() => {
    const findPrice = (name) => seats.find((s) => s.TenLoaiGhe === name)?.GiaVe ?? null;
    return {
      normal: findPrice('Thường'),
      vip: findPrice('VIP'),
      couple: findPrice('Couple'),
    };
  }, [seats]);

  const selectedSeats = useMemo(() => {
    const set = new Set(selectedPositions);
    return seats.filter((s) => set.has(s.ViTri));
  }, [seats, selectedPositions]);

  const totalAmount = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + s.GiaVe, 0);
  }, [selectedSeats]);

  const toggleSeat = (seat) => {
    if (seat.TrangThaiGhe !== 'TRONG') return;
    setSqlErrorInfo(null);
    setSelectedPositions((prev) => {
      if (prev.includes(seat.ViTri)) {
        return prev.filter((p) => p !== seat.ViTri);
      }
      if (prev.length >= MAX_SELECT_SEATS) {
        setSqlErrorInfo({
          message: `Bạn chỉ có thể chọn tối đa ${MAX_SELECT_SEATS} ghế cho mỗi đơn đặt vé.`,
          sqlCode: null,
        });
        return prev;
      }
      return [...prev, seat.ViTri];
    });
  };

  const handleHoldSeats = async () => {
    if (!user) {
      navigate(`/login?redirect=/booking/${maSuatChieu}`);
      return;
    }
    if (selectedSeats.length === 0) return;

    setSubmitting(true);
    setSqlErrorInfo(null);
    try {
      const res = await apiRequest('/bookings/hold', {
        method: 'POST',
        body: {
          maSuatChieu: Number(maSuatChieu),
          danhSachGhe: selectedSeats.map((s) => s.ViTri),
          phutGiu: 10,
        },
      });
      navigate(`/payment/${res.booking.MaDon}`);
    } catch (err) {
      setSqlErrorInfo({
        message: err.message,
        sqlCode: err.sqlCode,
      });
      if (err.status === 409) {
        await loadSeatMap();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !showtime) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        <div className="h-32 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="h-[520px] animate-pulse rounded-3xl bg-zinc-900" />
      </div>
    );
  }

  if (error && !showtime) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-rose-200">
          <p className="font-bold">{error}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const showtimeUnavailable = showtime && showtime.TrangThai !== 'MO_BAN';
  const ageBg = AGE_BADGE_SOLID[showtime.PhanLoai] || 'bg-zinc-700';

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-black text-zinc-100">
      {/* Compact Header Strip matching Image 2 */}
      <div className="border-b border-zinc-900 bg-[#08080b]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to={`/movies/${showtime.MaPhim}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            title="Quay lại"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Film className="h-4 w-4 text-sky-400" />
            <span>Đặt vé xem phim</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadSeatMap}
              disabled={loading}
              title="Làm mới sơ đồ ghế"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/"
              title="Đóng"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Centered Content */}
      <div className="relative flex-1 bg-gradient-to-b from-[#07080d] via-black to-[#070910] pb-10 pt-5">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* Movie Info Card (Centered Dark Card matching Image 2) */}
          <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800/90 bg-[#0d0d11] p-4 shadow-2xl sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 sm:w-24">
                <MoviePoster
                  src={showtime.UrlPoster}
                  alt={showtime.TenPhim}
                  className="h-full w-full"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-white sm:text-lg">
                    {showtime.TenPhim} ({showtime.PhanLoai}) - {showtime.LoaiPhong} - Phụ đề
                  </h1>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white ${ageBg}`}
                  >
                    {formatAgeShort(showtime.PhanLoai)}
                  </span>
                </div>

                <div className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 sm:text-sm">
                  <div className="text-zinc-400">
                    Suất chiếu:{' '}
                    <strong className="text-zinc-100">
                      {formatTimeHM(showtime.ThoiGianBatDau)} ~{' '}
                      {formatTimeHM(showtime.ThoiGianKetThuc)}
                    </strong>
                  </div>
                  <div className="text-zinc-400">
                    Ngày:{' '}
                    <strong className="text-zinc-100">
                      {formatDateVN(showtime.ThoiGianBatDau)}
                    </strong>
                  </div>
                  <div className="text-zinc-400">
                    Phòng chiếu: <strong className="text-zinc-100">{showtime.TenPhong}</strong>
                  </div>
                  <div className="text-zinc-400">
                    Ghế trống:{' '}
                    <strong className="text-emerald-400">
                      {showtime.SoGheTrong}/{showtime.TongSoGhe}
                    </strong>
                  </div>
                </div>

                {(activeRule || customerTier) && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {activeRule && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        <Tag className="h-3 w-3" />
                        {activeRule.TenQuyTac} (×{activeRule.HeSoQuyTac.toFixed(2)})
                      </span>
                    )}
                    {customerTier ? (
                      <TierBadge
                        maHang={customerTier.MaHang}
                        tenHang={customerTier.TenHang}
                        discount={customerTier.TyLeGiam}
                      />
                    ) : (
                      <Link
                        to={`/login?redirect=/booking/${maSuatChieu}`}
                        className="text-[11px] font-semibold text-pink-400 hover:underline"
                      >
                        Đăng nhập để áp dụng ưu đãi hạng thành viên →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showtimeUnavailable && (
            <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <span>
                Suất chiếu này hiện ở trạng thái <strong>{showtime.TrangThai}</strong> nên không nhận
                đặt vé mới.
              </span>
            </div>
          )}

          {sqlErrorInfo && (
            <div className="mx-auto flex max-w-3xl items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-xs text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                {sqlErrorInfo.sqlCode && (
                  <span className="mr-1.5 font-mono font-bold text-rose-300">
                    [SQL #{sqlErrorInfo.sqlCode}]
                  </span>
                )}
                <span>{sqlErrorInfo.message}</span>
              </div>
            </div>
          )}

          {/* Legend Strip with Dynamic Prices */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-md bg-zinc-700" />
              <span>Ghế đã đặt</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-md bg-teal-400" />
              <div className="leading-tight">
                <div className="text-zinc-300">Thường</div>
                {pricesByType.normal !== null && (
                  <div className="font-bold text-white">{formatVnd(pricesByType.normal)}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-md bg-amber-400" />
              <div className="leading-tight">
                <div className="text-zinc-300">VIP</div>
                {pricesByType.vip !== null && (
                  <div className="font-bold text-white">{formatVnd(pricesByType.vip)}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-md bg-pink-500" />
              <div className="leading-tight">
                <div className="text-zinc-300">Couple</div>
                {pricesByType.couple !== null && (
                  <div className="font-bold text-white">{formatVnd(pricesByType.couple)}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-zinc-950">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </span>
              <span>Đang chọn</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="h-4 w-4 rounded border border-amber-500/60 bg-amber-500/20" />
              <span>Đang giữ</span>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-500">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-zinc-800 bg-zinc-900">
                <Wrench className="h-2.5 w-2.5" />
              </span>
              <span>Hỏng</span>
            </div>
          </div>

          {/* Screen + Seat Grid + Floating Zoom Controls */}
          <div className="relative">
            {/* Floating Zoom Controls on Right Edge */}
            <div className="fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#121218]/95 shadow-2xl md:flex">
              <button
                type="button"
                aria-label="Phóng to sơ đồ"
                onClick={() => setZoom((z) => Math.min(1.35, Number((z + 0.15).toFixed(2))))}
                className="flex h-9 w-9 items-center justify-center border-b border-zinc-800 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Thu nhỏ sơ đồ"
                onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
                className="flex h-9 w-9 items-center justify-center border-b border-zinc-800 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Đặt lại thu phóng"
                onClick={() => setZoom(1)}
                className="flex h-9 w-9 items-center justify-center text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Screen Curve */}
            <div className="mx-auto mb-7 max-w-lg">
              <div className="cinema-screen h-8 w-full" />
              <div className="-mt-3.5 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                Màn hình {showtime.LoaiPhong}
              </div>
            </div>

            {/* Seat Matrix */}
            <div className="overflow-x-auto pb-4">
              <div
                className="mx-auto flex min-w-[520px] max-w-2xl flex-col gap-2 transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              >
                {seatRows.map(([rowLetter, rowSeats]) => {
                  const isCoupleRow = rowLetter === 'K';
                  return (
                    <div key={rowLetter} className="flex items-center justify-center gap-2">
                      <span className="w-5 text-center font-mono text-xs font-bold text-zinc-500">
                        {rowLetter}
                      </span>

                      <div className="flex flex-1 items-center justify-center gap-1.5">
                        {rowSeats.map((seat, idx) => {
                          const isSelected = selectedPositions.includes(seat.ViTri);
                          const addAisle = !isCoupleRow && idx === 5;
                          const status = seat.TrangThaiGhe;

                          let seatCls = '';
                          if (status === 'HONG') {
                            seatCls =
                              'cursor-not-allowed border-zinc-800 bg-zinc-900/60 text-zinc-600';
                          } else if (status === 'DA_BAN') {
                            seatCls =
                              'cursor-not-allowed border-zinc-700 bg-zinc-700/80 text-zinc-400';
                          } else if (status === 'DANG_GIU') {
                            seatCls =
                              'cursor-not-allowed border-amber-500/50 bg-amber-500/20 text-amber-300';
                          } else if (isSelected) {
                            seatCls =
                              'border-white bg-white text-zinc-950 shadow-lg shadow-white/20 ring-2 ring-white/50';
                          } else if (seat.TenLoaiGhe === 'Couple') {
                            seatCls =
                              'border-pink-400/60 bg-pink-500/85 text-white hover:bg-pink-400';
                          } else if (seat.TenLoaiGhe === 'VIP') {
                            seatCls =
                              'border-amber-400/60 bg-amber-400/90 text-zinc-950 hover:bg-amber-300';
                          } else {
                            seatCls =
                              'border-teal-400/60 bg-teal-400/90 text-zinc-950 hover:bg-teal-300';
                          }

                          return (
                            <div key={seat.MaGhe} className={addAisle ? 'ml-5' : ''}>
                              <button
                                type="button"
                                disabled={status !== 'TRONG' || showtimeUnavailable}
                                onClick={() => toggleSeat(seat)}
                                title={`${seat.ViTri} • ${seat.TenLoaiGhe} • ${formatVnd(seat.GiaVe)}`}
                                className={`flex h-9 items-center justify-center rounded-lg border font-mono text-[11px] font-extrabold transition ${
                                  isCoupleRow ? 'w-24' : 'w-9'
                                } ${seatCls}`}
                              >
                                {status === 'HONG' ? (
                                  <Wrench className="h-3.5 w-3.5" />
                                ) : isSelected ? (
                                  <Check className="h-4 w-4 stroke-[3]" />
                                ) : (
                                  seat.ViTri
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <span className="w-5 text-center font-mono text-xs font-bold text-zinc-500">
                        {rowLetter}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar matching Image 2 */}
      <div className="sticky bottom-0 z-30 border-t border-zinc-800 bg-[#0b0b0f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 text-sm">
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-zinc-400">
                  Đã chọn {selectedSeats.length} ghế:
                </span>
                <span className="font-mono font-bold text-white">
                  {selectedSeats.map((s) => s.ViTri).join(', ')}
                </span>
                {totalAmount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                    <Sparkles className="h-3 w-3" />+{Math.floor(totalAmount / 1000)} điểm
                  </span>
                )}
              </div>
            ) : (
              <span className="text-zinc-400">Vui lòng chọn ghế trống trên sơ đồ (tối đa 10 ghế).</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="text-left sm:text-right">
              <div className="text-[11px] text-zinc-400">Tổng tiền vé:</div>
              <div className="text-xl font-extrabold text-white">{formatVnd(totalAmount)}</div>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length === 0 || submitting || showtimeUnavailable}
              onClick={handleHoldSeats}
              className="rounded-xl bg-[#0055a5] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/50 transition hover:bg-[#0066c4] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {!user
                ? 'Đăng nhập để tiếp tục'
                : submitting
                ? 'Đang giữ ghế...'
                : 'Tiếp tục'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
