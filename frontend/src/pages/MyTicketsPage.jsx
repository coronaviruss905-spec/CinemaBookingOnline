import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Calendar, Clock, LogIn, MapPin, Sparkles, Ticket } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import MoviePoster from '../components/MoviePoster.jsx';
import TierBadge from '../components/TierBadge.jsx';
import { formatDateTimeVN, formatVnd } from '../utils/format.js';

const STATUS_BADGE = {
  DA_THANH_TOAN: { text: 'Đã thanh toán', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  DANG_GIU: { text: 'Đang giữ chỗ', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  DA_HUY: { text: 'Đã hủy', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  HET_HAN: { text: 'Hết hạn', cls: 'bg-slate-700/60 text-slate-300 border-slate-600' },
};

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function loadMyBookings() {
      setLoading(true);
      try {
        const res = await apiRequest('/bookings/my');
        if (!cancelled) setBookings(res.bookings || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMyBookings();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const filteredBookings = useMemo(() => {
    if (filter === 'ALL') return bookings;
    return bookings.filter((b) => b.TrangThai === filter);
  }, [bookings, filter]);

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/75 p-8">
          <Ticket className="mx-auto h-12 w-12 text-rose-400" />
          <h1 className="text-2xl font-extrabold text-white">Đăng nhập để xem vé của bạn</h1>
          <p className="text-sm text-slate-400">
            Theo dõi đơn đang giữ chỗ VietQR, vé điện tử đã phát hành và điểm tích lũy thành viên.
          </p>
          <Link
            to="/login?redirect=/my-tickets"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white hover:bg-rose-400"
          >
            <LogIn className="h-4 w-4" />
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  const nextTier = user?.nextTier;
  const progressPct = nextTier
    ? Math.min(100, Math.round((user.DiemTichLuy / nextTier.DiemToiThieu) * 100))
    : 100;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Membership Loyalty Card */}
      {user && (
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <TierBadge
                  maHang={user.MaHang}
                  tenHang={user.TenHang}
                  discount={user.TyLeGiam}
                />
              </div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{user.HoTen}</h1>
              <p className="text-sm text-slate-400">
                {user.Email} • {user.SoDienThoai}
              </p>
            </div>

            <div className="min-w-[260px] space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Điểm tích lũy
                </span>
                <span className="font-mono text-lg font-extrabold text-amber-300">
                  {user.DiemTichLuy.toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {nextTier ? (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Cần thêm{' '}
                    <strong className="text-slate-200">
                      {(nextTier.DiemToiThieu - user.DiemTichLuy).toLocaleString('vi-VN')}
                    </strong>{' '}
                    điểm lên <strong className="text-amber-300">{nextTier.TenHang}</strong>
                  </span>
                  <span>-{nextTier.TyLeGiam}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300">
                  <Award className="h-3.5 w-3.5" />
                  Bạn đang ở hạng thành viên cao nhất!
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bookings List */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">Lịch sử đặt vé</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'DA_THANH_TOAN', label: 'Đã thanh toán' },
              { id: 'DANG_GIU', label: 'Đang giữ chỗ' },
              { id: 'DA_HUY', label: 'Đã hủy' },
              { id: 'HET_HAN', label: 'Hết hạn' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  filter === tab.id
                    ? 'bg-rose-500 text-white'
                    : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-900" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
            Chưa có đơn đặt vé nào trong mục này.{' '}
            <Link to="/" className="font-semibold text-rose-400 hover:underline">
              Đặt vé ngay →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const badge = STATUS_BADGE[b.TrangThai] || STATUS_BADGE.HET_HAN;
              return (
                <div
                  key={b.MaDon}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/75 p-4 transition hover:border-slate-700 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-800">
                      <MoviePoster
                        src={b.UrlPoster}
                        alt={b.TenPhim || b.MaDatCho}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          #{b.MaDatCho}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white">
                        {b.TenPhim || `Đơn đặt vé #${b.MaDon}`}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {b.TenPhong && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-400" />
                            {b.TenPhong} ({b.LoaiPhong})
                          </span>
                        )}
                        {b.ThoiGianBatDau && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                            {formatDateTimeVN(b.ThoiGianBatDau)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          Tạo lúc {formatDateTimeVN(b.ThoiGianTao)}
                        </span>
                      </div>

                      {b.DanhSachGhe && (
                        <div className="text-xs text-slate-300">
                          Ghế:{' '}
                          <span className="font-mono font-bold text-amber-300">
                            {b.DanhSachGhe}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Tổng tiền</div>
                      <div className="text-lg font-extrabold text-amber-400">
                        {formatVnd(b.TongTien)}
                      </div>
                    </div>

                    <Link
                      to={`/payment/${b.MaDon}`}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        b.TrangThai === 'DANG_GIU'
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {b.TrangThai === 'DANG_GIU'
                        ? 'Thanh toán VietQR'
                        : b.TrangThai === 'DA_THANH_TOAN'
                        ? 'Xem vé điện tử'
                        : 'Chi tiết'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
