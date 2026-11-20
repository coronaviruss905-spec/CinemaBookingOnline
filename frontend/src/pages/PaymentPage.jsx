import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Sparkles,
  Ticket,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import VietQRCard from '../components/VietQRCard.jsx';
import {
  formatAgeShort,
  formatCountdown,
  formatDateTimeVN,
  formatDateVN,
  formatRoomFormatLabel,
  formatTimeHM,
  formatVnd,
} from '../utils/format.js';

const AGE_BADGE_SOLID = {
  P: 'bg-emerald-500',
  K: 'bg-sky-500',
  T13: 'bg-amber-500',
  T16: 'bg-orange-500',
  T18: 'bg-red-600',
};

function createBankTxRef(maDon) {
  const suffix = String(Date.now()).slice(-6);
  return `FT26${maDon}${suffix}`;
}

export default function PaymentPage() {
  const { maDon } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [booking, setBooking] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [bankTxId, setBankTxId] = useState(() => createBankTxRef(maDon));
  const [loyaltyUpdate, setLoyaltyUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState(null);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest(`/bookings/${maDon}`);
      setBooking(res.booking);
      setSecondsLeft(res.booking.SoGiayConLai || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [maDon]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?redirect=/payment/${maDon}`);
      return;
    }
    loadBooking();
  }, [authLoading, user, maDon, navigate, loadBooking]);

  useEffect(() => {
    if (!booking || booking.TrangThai !== 'DANG_GIU' || secondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [booking, secondsLeft]);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!booking?.NoiDungChuyenKhoan) return;

    setProcessing(true);
    setActionError(null);
    try {
      const res = await apiRequest('/bookings/confirm-payment', {
        method: 'POST',
        body: {
          noiDungChuyenKhoan: booking.NoiDungChuyenKhoan,
          maGiaoDichNganHang: bankTxId.trim() || createBankTxRef(maDon),
        },
      });
      setBooking(res.booking);
      setLoyaltyUpdate(res.loyaltyUpdate);
      await refreshUser();
    } catch (err) {
      setActionError({ message: err.message, sqlCode: err.sqlCode });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelHold = async () => {
    if (!window.confirm('Bạn muốn hủy đơn giữ chỗ này và giải phóng ghế ngay?')) return;
    setProcessing(true);
    setActionError(null);
    try {
      const res = await apiRequest(`/bookings/${maDon}/cancel`, { method: 'POST' });
      setBooking(res.booking);
    } catch (err) {
      setActionError({ message: err.message, sqlCode: err.sqlCode });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div className="h-96 animate-pulse rounded-3xl bg-zinc-900" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-rose-200">
          <p className="font-bold">{error || 'Không tìm thấy đơn đặt vé.'}</p>
          <Link
            to="/my-tickets"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Xem vé của tôi
          </Link>
        </div>
      </div>
    );
  }

  const isHolding = booking.TrangThai === 'DANG_GIU';
  const isPaid = booking.TrangThai === 'DA_THANH_TOAN';
  const isExpiredTime = isHolding && secondsLeft <= 0;
  const ageBg = AGE_BADGE_SOLID[booking.showtime?.PhanLoai] || 'bg-zinc-700';

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/my-tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách vé của tôi
        </Link>
        <span className="font-mono text-xs text-zinc-400">
          Mã đặt chỗ: <strong className="text-zinc-200">#{booking.MaDatCho}</strong>
        </span>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-sm text-rose-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              {actionError.sqlCode && (
                <div className="font-mono text-xs font-bold text-rose-300">
                  SQL Error #{actionError.sqlCode}
                </div>
              )}
              <p>{actionError.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* HOLDING STATE: Split Modal Card matching Image 1 in Dark Theme (no RẠP, MB Bank 0836443099) */}
      {isHolding && (
        <>
          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#0d0d11] shadow-2xl md:grid md:grid-cols-[1.08fr_0.92fr]">
            {/* Left Info Column */}
            <div className="flex flex-col justify-between p-6 sm:p-7">
              <div className="space-y-5">
                {/* Movie Title & Age Badge + Live Hold Timer */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {booking.showtime?.PhanLoai && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white ${ageBg}`}
                      >
                        {formatAgeShort(booking.showtime.PhanLoai)}
                      </span>
                    )}
                    <h1 className="text-lg font-extrabold text-white sm:text-xl">
                      {booking.showtime?.TenPhim || `Đơn #${booking.MaDatCho}`}
                    </h1>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${
                      isExpiredTime
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                        : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {formatCountdown(secondsLeft)}
                  </span>
                </div>

                {/* THỜI GIAN | NGÀY CHIẾU */}
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/90 pt-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Thời gian
                    </div>
                    <div className="mt-1 text-base font-extrabold text-white">
                      {formatTimeHM(booking.showtime?.ThoiGianBatDau)} ~{' '}
                      {formatTimeHM(booking.showtime?.ThoiGianKetThuc)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Ngày chiếu
                    </div>
                    <div className="mt-1 text-base font-extrabold text-white">
                      {formatDateVN(booking.showtime?.ThoiGianBatDau)}
                    </div>
                  </div>
                </div>

                {/* PHÒNG CHIẾU | ĐỊNH DẠNG (RẠP omitted as requested) */}
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/90 pt-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Phòng chiếu
                    </div>
                    <div className="mt-1 text-base font-extrabold text-white">
                      {booking.showtime?.TenPhong}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Định dạng
                    </div>
                    <div className="mt-1 text-base font-extrabold text-white">
                      {booking.showtime?.LoaiPhong
                        ? formatRoomFormatLabel(booking.showtime.LoaiPhong)
                        : ''}
                    </div>
                  </div>
                </div>

                {/* GHẾ */}
                <div className="border-t border-zinc-800/90 pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Ghế
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="font-mono text-base font-extrabold text-white">
                      {booking.tickets.map((t) => t.ViTri).join(', ')}
                    </span>
                    <span className="text-base font-extrabold text-white">
                      {formatVnd(booking.TongTien)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tạm tính / Tổng cộng */}
              <div className="mt-6 border-t border-zinc-800/90 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-zinc-200">Tạm tính</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    {formatVnd(booking.TongTien)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs italic text-zinc-500">
                  {booking.TyLeGiam > 0
                    ? `Đã áp dụng ưu đãi hạng ${booking.TenHang} (-${booking.TyLeGiam}%).`
                    : 'Ưu đãi (nếu có) đã được áp dụng tự động theo hạng thành viên.'}
                </p>
                {isExpiredTime && (
                  <p className="mt-2 text-xs font-semibold text-rose-400">
                    Đã hết thời gian giữ chỗ 10 phút. Vui lòng hủy đơn và đặt lại ghế mới.
                  </p>
                )}
              </div>
            </div>

            {/* Right QR Panel (MB Bank 0836443099) */}
            <VietQRCard
              amount={booking.TongTien}
              transferContent={booking.NoiDungChuyenKhoan}
              bookingCode={booking.MaDatCho}
              onClose={() => navigate('/my-tickets')}
            />
          </div>

          {/* Demo Webhook Confirmation & Cancel Bar */}
          <form
            onSubmit={handleConfirmPayment}
            className="space-y-4 rounded-2xl border border-zinc-800 bg-[#0d0d11] p-5"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-5 w-5 text-pink-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Xác nhận thanh toán chuyển khoản (Mô phỏng Webhook)
                </h3>
                <p className="text-xs text-zinc-400">
                  Xác nhận đã nhận tiền chuyển khoản để hoàn tất đơn vé &amp; cộng điểm tích lũy.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">
                  Nội dung chuyển khoản
                </label>
                <input
                  type="text"
                  readOnly
                  value={booking.NoiDungChuyenKhoan || ''}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 font-mono text-sm font-bold text-amber-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">
                  Mã giao dịch ngân hàng
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={bankTxId}
                    onChange={(e) => setBankTxId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 font-mono text-sm text-white focus:border-pink-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setBankTxId(createBankTxRef(maDon))}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-zinc-300 hover:bg-zinc-800"
                    title="Tạo mã mới"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {processing ? 'Đang xử lý...' : 'Xác nhận đã chuyển khoản'}
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={handleCancelHold}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Hủy giữ chỗ
              </button>
            </div>
          </form>
        </>
      )}

      {/* PAID STATE */}
      {isPaid && (
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-400" />
                <div>
                  <h1 className="text-xl font-extrabold text-white">
                    Thanh toán thành công • Mã đặt chỗ {booking.MaDatCho}
                  </h1>
                  <p className="text-sm text-emerald-200/90">
                    Giao dịch đã được xác nhận thành công và phát hành mã vạch vé điện tử.
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40">
                ĐÃ THANH TOÁN
              </span>
            </div>

            {loyaltyUpdate && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-zinc-950/70 p-4 text-sm">
                <div className="flex items-center gap-2.5 text-emerald-200">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span>
                    Cộng <strong className="text-amber-300">+{loyaltyUpdate.pointsEarned} điểm</strong>{' '}
                    (Tổng: <strong>{loyaltyUpdate.newPoints.toLocaleString('vi-VN')} điểm</strong>)
                  </span>
                </div>
                {loyaltyUpdate.upgraded ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-pink-600 px-3.5 py-1 text-xs font-extrabold text-white shadow-lg">
                    <Award className="h-4 w-4" />
                    Thăng hạng thành viên: {loyaltyUpdate.previousTier} → {loyaltyUpdate.newTier} (-
                    {loyaltyUpdate.newDiscountRate}%)
                  </div>
                ) : (
                  <div className="text-xs text-zinc-300">
                    Hạng hiện tại: <strong className="text-white">{loyaltyUpdate.newTier}</strong> (-
                    {loyaltyUpdate.newDiscountRate}%)
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-white">
              <Ticket className="h-5 w-5 text-pink-400" />
              Vé điện tử của bạn ({booking.tickets.length} vé)
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {booking.tickets.map((t) => (
                <div
                  key={t.MaVe}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d11] shadow-xl"
                >
                  <div className="border-b border-dashed border-zinc-800 bg-gradient-to-r from-pink-600/20 to-amber-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-pink-300">
                        #{booking.MaDatCho}
                      </span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                        HỢP LỆ
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-base font-extrabold text-white">
                      {booking.showtime?.TenPhim}
                    </h3>
                    <p className="text-xs text-zinc-300">
                      {booking.showtime?.TenPhong} ({booking.showtime?.LoaiPhong}) •{' '}
                      {formatDateTimeVN(booking.showtime?.ThoiGianBatDau)}
                    </p>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase text-zinc-400">Ghế</div>
                        <div className="font-mono text-2xl font-extrabold text-amber-400">
                          {t.ViTri}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] uppercase text-zinc-400">{t.TenLoaiGhe}</div>
                        <div className="text-base font-bold text-white">{formatVnd(t.GiaVe)}</div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white p-3 text-center">
                      <div className="ticket-barcode mx-auto h-10 w-full" />
                      <div className="mt-1.5 font-mono text-[10px] font-semibold text-zinc-700">
                        {t.MaVach}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CANCELED / EXPIRED STATE */}
      {!isHolding && !isPaid && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#0d0d11] p-5">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-rose-400" />
              <div>
                <h1 className="text-lg font-extrabold text-white">
                  Đơn #{booking.MaDatCho} —{' '}
                  {booking.TrangThai === 'DA_HUY' ? 'Đã hủy đơn' : 'Đã hết hạn giữ chỗ'}
                </h1>
                <p className="text-sm text-zinc-400">
                  Ghế thuộc đơn này đã được giải phóng để khách khác có thể đặt.
                </p>
              </div>
            </div>
            {booking.showtime && (
              <Link
                to={`/booking/${booking.showtime.MaSuatChieu}`}
                className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white hover:bg-pink-500"
              >
                Đặt lại suất này
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d11] p-5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Phim</span>
              <span className="font-bold text-white">{booking.showtime?.TenPhim}</span>
            </div>
            <div className="mt-2 flex justify-between text-zinc-400">
              <span>Ghế</span>
              <span className="font-mono font-bold text-white">
                {booking.tickets.map((t) => t.ViTri).join(', ')}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-zinc-400">
              <span>Tổng tiền</span>
              <span className="font-bold text-amber-400">{formatVnd(booking.TongTien)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment History when Paid / Canceled */}
      {!isHolding && booking.payments?.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-[#0d0d11] p-5">
          <h3 className="mb-3 text-sm font-bold text-white">Lịch sử giao dịch VietQR</h3>
          <div className="space-y-2 text-xs">
            {booking.payments.map((p) => (
              <div
                key={p.MaThanhToan}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5"
              >
                <div>
                  <span className="font-mono font-bold text-zinc-200">{p.NoiDungChuyenKhoan}</span>
                  <span className="mx-2 text-zinc-600">•</span>
                  <span className="text-zinc-400">{p.LoaiGiaoDich}</span>
                  {p.MaGiaoDichNganHang && (
                    <>
                      <span className="mx-2 text-zinc-600">•</span>
                      <span className="font-mono text-sky-300">{p.MaGiaoDichNganHang}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-300">{formatVnd(p.SoTien)}</span>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                      p.TrangThai === 'THANH_CONG'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : p.TrangThai === 'CHO_XAC_NHAN'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {p.TrangThai}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
