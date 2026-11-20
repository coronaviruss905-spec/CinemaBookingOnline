import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Grid3X3,
  RefreshCw,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { formatDateTimeVN, formatDateVN, formatTimeHM, formatVnd } from '../utils/format.js';

function getTomorrowEveningDefault() {
  const dt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T19:30`;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('revenue');

  // Revenue tab state
  const [revenueData, setRevenueData] = useState({ movies: [], summary: null });

  // Schedule tab state
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [adminShowtimes, setAdminShowtimes] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    maPhim: '1',
    maPhong: '1',
    thoiGianBatDau: getTomorrowEveningDefault(),
    giaCoBan: '95000',
    phutDonPhong: '15',
  });
  const [scheduleResult, setScheduleResult] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Seat view tab state
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');
  const [seatViewData, setSeatViewData] = useState(null);

  // Logs & pricing rules tab state
  const [logs, setLogs] = useState([]);
  const [logActionFilter, setLogActionFilter] = useState('');
  const [pricingRules, setPricingRules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRevenue = useCallback(async () => {
    const res = await apiRequest('/admin/revenue');
    setRevenueData(res);
  }, []);

  const loadScheduleDeps = useCallback(async () => {
    const [mRes, rRes, sRes] = await Promise.all([
      apiRequest('/movies'),
      apiRequest('/admin/rooms'),
      apiRequest('/admin/showtimes'),
    ]);
    setMovies(mRes.movies || []);
    setRooms(rRes.rooms || []);
    const list = sRes.showtimes || [];
    setAdminShowtimes(list);
    setSelectedShowtimeId((prev) => prev || (list[0] ? String(list[0].MaSuatChieu) : ''));
  }, []);

  const loadLogsAndRules = useCallback(async (actionFilter = '') => {
    const q = actionFilter ? `?hanhDong=${encodeURIComponent(actionFilter)}` : '';
    const [lRes, qRes] = await Promise.all([
      apiRequest(`/admin/logs${q}`),
      apiRequest('/admin/pricing-rules'),
    ]);
    setLogs(lRes.logs || []);
    setPricingRules(qRes.rules || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        await Promise.all([loadRevenue(), loadScheduleDeps(), loadLogsAndRules('')]);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [loadRevenue, loadScheduleDeps, loadLogsAndRules]);

  useEffect(() => {
    if (!selectedShowtimeId) return;
    let cancelled = false;
    apiRequest(`/admin/showtimes/${selectedShowtimeId}/seat-view`)
      .then((res) => {
        if (!cancelled) setSeatViewData(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedShowtimeId]);

  const handleLogFilterChange = async (action) => {
    setLogActionFilter(action);
    try {
      const q = action ? `?hanhDong=${encodeURIComponent(action)}` : '';
      const lRes = await apiRequest(`/admin/logs${q}`);
      setLogs(lRes.logs || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    setSubmittingSchedule(true);
    setScheduleError(null);
    setScheduleResult(null);
    try {
      const res = await apiRequest('/admin/showtimes', {
        method: 'POST',
        body: {
          maPhim: Number(scheduleForm.maPhim),
          maPhong: Number(scheduleForm.maPhong),
          thoiGianBatDau: scheduleForm.thoiGianBatDau,
          giaCoBan: Number(scheduleForm.giaCoBan),
          phutDonPhong: Number(scheduleForm.phutDonPhong),
        },
      });
      setScheduleResult(res.showtime);
      await loadScheduleDeps();
    } catch (err) {
      setScheduleError({ message: err.message, sqlCode: err.sqlCode });
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const maxRevenue = useMemo(() => {
    return Math.max(1, ...revenueData.movies.map((m) => m.TongDoanhThu || 0));
  }, [revenueData.movies]);

  const seatViewRows = useMemo(() => {
    const map = new Map();
    for (const s of seatViewData?.seats || []) {
      if (!map.has(s.HangGhe)) map.set(s.HangGhe, []);
      map.get(s.HangGhe).push(s);
    }
    return Array.from(map.entries());
  }, [seatViewData]);

  const tabs = [
    { id: 'revenue', label: 'Doanh thu phim', icon: BarChart3 },
    { id: 'schedule', label: 'Lập lịch chiếu', icon: CalendarPlus },
    { id: 'seats', label: 'Sơ đồ ghế', icon: Grid3X3 },
    { id: 'logs', label: 'Nhật ký & Quy tắc giá', icon: ClipboardList },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Bảng điều khiển quản trị
          </h1>
          <p className="text-sm text-slate-400">
            Theo dõi doanh thu, lập lịch chiếu, giám sát sơ đồ ghế và nhật ký giao dịch vé.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadRevenue();
            loadScheduleDeps();
            loadLogsAndRules(logActionFilter);
          }}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                active
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REVENUE */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tổng doanh thu</span>
                <Wallet className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-amber-400">
                {formatVnd(revenueData.summary?.totalRevenue)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tổng vé ghi nhận</span>
                <Ticket className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {(revenueData.summary?.totalTickets || 0).toLocaleString('vi-VN')} vé
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Đơn đang giữ chỗ</span>
                <RefreshCw className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-sky-300">
                {revenueData.summary?.holdingOrders || 0} đơn
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Phòng & Thành viên</span>
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-emerald-300">
                {revenueData.summary?.activeRooms || 0} phòng •{' '}
                {revenueData.summary?.activeCustomers || 0} KH
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-white">So sánh doanh thu theo phim</h2>
            </div>

            <div className="space-y-4">
              {revenueData.movies.map((m) => {
                const pct = Math.round((m.TongDoanhThu / maxRevenue) * 100);
                return (
                  <div key={m.MaPhim} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-bold text-white">{m.TenPhim}</span>
                      <span className="font-mono text-xs text-amber-300">
                        {formatVnd(m.TongDoanhThu)} ({m.SoVeDaBan} vé / {m.SoSuatChieu} suất)
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-950">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/75">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Phim</th>
                    <th className="px-5 py-3.5">Thể loại</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Suất chiếu</th>
                    <th className="px-5 py-3.5 text-right">Số vé</th>
                    <th className="px-5 py-3.5 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {revenueData.movies.map((m) => (
                    <tr key={m.MaPhim} className="hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-bold text-white">{m.TenPhim}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{m.DanhSachTheLoai}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                          {m.TrangThaiPhim}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-300">
                        {m.SoSuatChieu}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-300">
                        {m.SoVeDaBan}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-300">
                        {formatVnd(m.TongDoanhThu)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE SHOWTIME */}
      {activeTab === 'schedule' && (
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <form
            onSubmit={handleCreateShowtime}
            className="h-fit space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-white">Thêm suất chiếu mới</h2>
            </div>
            <p className="text-xs text-slate-400">
              Hệ thống tự tính giờ kết thúc theo thời lượng phim và tự động kiểm tra trùng giờ phòng chiếu.
            </p>

            {scheduleError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-xs text-rose-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <div>
                    {scheduleError.sqlCode && (
                      <div className="font-mono font-bold text-rose-300">
                        SQL Error #{scheduleError.sqlCode}
                      </div>
                    )}
                    <p>{scheduleError.message}</p>
                  </div>
                </div>
              </div>
            )}

            {scheduleResult && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">
                      Đã lập suất chiếu #{scheduleResult.MaSuatChieu}
                    </div>
                    <p>
                      {scheduleResult.TenPhim} • {scheduleResult.TenPhong} •{' '}
                      {formatDateTimeVN(scheduleResult.ThoiGianBatDau)} –{' '}
                      {formatTimeHM(scheduleResult.ThoiGianKetThuc)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Phim</label>
              <select
                value={scheduleForm.maPhim}
                onChange={(e) => setScheduleForm({ ...scheduleForm, maPhim: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
              >
                {movies.map((m) => (
                  <option key={m.MaPhim} value={m.MaPhim}>
                    {m.TenPhim} ({m.ThoiLuong} phút)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Phòng chiếu</label>
              <select
                value={scheduleForm.maPhong}
                onChange={(e) => setScheduleForm({ ...scheduleForm, maPhong: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
              >
                {rooms.map((r) => (
                  <option key={r.MaPhong} value={r.MaPhong}>
                    {r.TenPhong} ({r.LoaiPhong}) — {r.TrangThai} ({r.SoGheHoatDong} ghế)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Thời gian bắt đầu
              </label>
              <input
                type="datetime-local"
                required
                value={scheduleForm.thoiGianBatDau}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, thoiGianBatDau: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  Giá cơ bản (VNĐ)
                </label>
                <input
                  type="number"
                  min={10000}
                  step={5000}
                  required
                  value={scheduleForm.giaCoBan}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, giaCoBan: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  Dọn phòng (phút)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  required
                  value={scheduleForm.phutDonPhong}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, phutDonPhong: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingSchedule}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50"
            >
              <CalendarPlus className="h-4 w-4" />
              {submittingSchedule ? 'Đang lưu...' : 'Lập lịch chiếu'}
            </button>
          </form>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/75">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-5">
              <h3 className="text-base font-extrabold text-white">
                Lịch chiếu hiện có ({adminShowtimes.length} suất)
              </h3>
              <span className="text-xs text-slate-400">
                Bấm &quot;Thử trùng giờ&quot; để kiểm tra cảnh báo trùng lịch phòng
              </span>
            </div>
            <div className="max-h-[540px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Mã</th>
                    <th className="px-4 py-3">Phim</th>
                    <th className="px-4 py-3">Phòng</th>
                    <th className="px-4 py-3">Khung giờ</th>
                    <th className="px-4 py-3 text-right">Còn trống</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {adminShowtimes.map((sc) => (
                    <tr key={sc.MaSuatChieu} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-slate-400">#{sc.MaSuatChieu}</td>
                      <td className="px-4 py-3 font-semibold text-white">{sc.TenPhim}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {sc.TenPhong} ({sc.LoaiPhong})
                      </td>
                      <td className="px-4 py-3 font-mono text-amber-300">
                        {formatDateVN(sc.ThoiGianBatDau)} {formatTimeHM(sc.ThoiGianBatDau)}–
                        {formatTimeHM(sc.ThoiGianKetThuc)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-300">
                        {sc.SoGheTrong}/{sc.TongSoGhe}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleForm((prev) => ({
                              ...prev,
                              maPhong: String(sc.MaPhong),
                              thoiGianBatDau: sc.ThoiGianBatDau.slice(0, 16),
                            }));
                            setScheduleError(null);
                            setScheduleResult(null);
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-rose-500/50 hover:text-rose-200"
                        >
                          Thử trùng giờ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SEAT VIEW */}
      {activeTab === 'seats' && (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/75 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">Giám sát sơ đồ ghế theo suất</h2>
              </div>
              <p className="text-xs text-slate-400">
                Kiểm tra trạng thái từng ghế và giá niêm yết theo loại ghế của suất chiếu.
              </p>
            </div>

            <select
              value={selectedShowtimeId}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white lg:w-[440px]"
            >
              {adminShowtimes.map((sc) => (
                <option key={sc.MaSuatChieu} value={sc.MaSuatChieu}>
                  #{sc.MaSuatChieu} • {sc.TenPhim} • {sc.TenPhong} ({formatDateTimeVN(sc.ThoiGianBatDau)})
                </option>
              ))}
            </select>
          </div>

          {seatViewData && (
            <>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200">
                  Trống: <strong className="text-white">{seatViewData.counts.TRONG}</strong>
                </span>
                <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300">
                  Đang giữ: <strong>{seatViewData.counts.DANG_GIU}</strong>
                </span>
                <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                  Đã bán: <strong>{seatViewData.counts.DA_BAN}</strong>
                </span>
                <span className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-rose-300">
                  Hỏng: <strong>{seatViewData.counts.HONG}</strong>
                </span>
              </div>

              <div className="overflow-x-auto pt-2">
                <div className="mx-auto flex min-w-[520px] max-w-2xl flex-col gap-1.5">
                  {seatViewRows.map(([rowLetter, rowSeats]) => (
                    <div key={rowLetter} className="flex items-center justify-center gap-1.5">
                      <span className="w-6 font-mono text-xs font-bold text-slate-500">
                        {rowLetter}
                      </span>
                      <div className="flex flex-1 justify-center gap-1.5">
                        {rowSeats.map((s) => {
                          let cls = 'border-slate-700 bg-slate-800/70 text-slate-200';
                          if (s.TrangThaiGhe === 'DA_BAN') {
                            cls = 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300';
                          } else if (s.TrangThaiGhe === 'DANG_GIU') {
                            cls = 'border-amber-500/40 bg-amber-500/20 text-amber-300';
                          } else if (s.TrangThaiGhe === 'HONG') {
                            cls = 'border-rose-500/30 bg-rose-500/15 text-rose-400';
                          }
                          return (
                            <div
                              key={s.MaGhe}
                              title={`${s.ViTri} (${s.TenLoaiGhe}) • ${formatVnd(s.GiaGhe)} • ${s.TrangThaiGhe}`}
                              className={`flex h-8 items-center justify-center rounded border font-mono text-[10px] font-bold ${
                                rowLetter === 'K' ? 'w-16' : 'w-8'
                              } ${cls}`}
                            >
                              {s.ViTri}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS & PRICING RULES */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Pricing Rules */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/75">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-5">
              <h2 className="text-lg font-extrabold text-white">Quy tắc giá động</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Tên quy tắc</th>
                    <th className="px-4 py-3">Loại ngày</th>
                    <th className="px-4 py-3">Khung giờ</th>
                    <th className="px-4 py-3">Loại phòng</th>
                    <th className="px-4 py-3 text-right">Lấp đầy từ</th>
                    <th className="px-4 py-3 text-right">Hệ số giá</th>
                    <th className="px-4 py-3 text-right">Ưu tiên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {pricingRules.map((q) => (
                    <tr key={q.MaQuyTac} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-white">{q.TenQuyTac}</td>
                      <td className="px-4 py-3 font-mono text-sky-300">{q.LoaiNgay}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {q.GioBatDau} – {q.GioKetThuc}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {q.LoaiPhong || 'Tất cả'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {q.TyLeLapDayTu}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                        ×{q.HeSoGia.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {q.DoUuTien}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/75">
            <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">Nhật ký vé (100 mới nhất)</h2>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['', 'GIU_CHO', 'THANH_TOAN', 'HUY', 'HET_HAN', 'HOAN_VE'].map((act) => (
                  <button
                    key={act || 'ALL'}
                    type="button"
                    onClick={() => handleLogFilterChange(act)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                      logActionFilter === act
                        ? 'bg-rose-500 text-white'
                        : 'border border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {act || 'TẤT CẢ'}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[480px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Hành động</th>
                    <th className="px-4 py-3">Đơn / Khách hàng</th>
                    <th className="px-4 py-3">Phim / Phòng / Ghế</th>
                    <th className="px-4 py-3 text-right">Giá vé</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Nguồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {logs.map((l) => (
                    <tr key={l.MaNhatKy} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono text-slate-400">#{l.MaNhatKy}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                            l.HanhDong === 'THANH_TOAN'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : l.HanhDong === 'GIU_CHO'
                              ? 'bg-amber-500/20 text-amber-300'
                              : l.HanhDong === 'HUY' || l.HanhDong === 'HOAN_VE'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {l.HanhDong}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-mono font-bold text-slate-200">
                          #{l.MaDatCho || l.MaDon}
                        </div>
                        <div className="text-slate-400">{l.HoTen}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-white">{l.TenPhim}</div>
                        <div className="text-slate-400">
                          {l.TenPhong} • Ghế{' '}
                          <span className="font-mono font-bold text-amber-300">{l.ViTriGhe}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                        {formatVnd(l.GiaVe)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">
                        {formatDateTimeVN(l.ThoiGian)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                        {l.NguoiThucHien}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
