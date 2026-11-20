import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Film, Globe, Ticket, User } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import AgeBadge from '../components/AgeBadge.jsx';
import MoviePoster from '../components/MoviePoster.jsx';
import {
  formatDateTile,
  formatDateVN,
  formatRoomFormatLabel,
  formatTimeHM,
  formatVnd,
} from '../utils/format.js';

const FORMAT_ORDER = ['2D', '3D', 'IMAX', '4DX'];

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [roomType, setRoomType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMovie() {
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest(`/movies/${id}`);
        if (cancelled) return;
        setMovie(res.movie);
        const list = res.showtimes || [];
        setShowtimes(list);

        const dates = [...new Set(list.map((s) => s.NgayChieu))].sort();
        const bestDate =
          (dates.includes(todayStr) ? todayStr : dates.find((d) => d >= todayStr)) ||
          dates[0] ||
          '';
        setSelectedDate(bestDate);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMovie();
    return () => {
      cancelled = true;
    };
  }, [id, todayStr]);

  const availableDates = useMemo(() => {
    return [...new Set(showtimes.map((s) => s.NgayChieu))].sort();
  }, [showtimes]);

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((sc) => {
      if (selectedDate && sc.NgayChieu !== selectedDate) return false;
      if (roomType && sc.LoaiPhong !== roomType) return false;
      return true;
    });
  }, [showtimes, selectedDate, roomType]);

  const groupedByFormat = useMemo(() => {
    const map = new Map();
    for (const sc of filteredShowtimes) {
      if (!map.has(sc.LoaiPhong)) map.set(sc.LoaiPhong, []);
      map.get(sc.LoaiPhong).push(sc);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const ia = FORMAT_ORDER.indexOf(a);
        const ib = FORMAT_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map(([format, items]) => ({
        format,
        label: formatRoomFormatLabel(format),
        items,
      }));
  }, [filteredShowtimes]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        <div className="h-80 animate-pulse rounded-3xl bg-zinc-900" />
        <div className="h-48 animate-pulse rounded-3xl bg-zinc-900" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-rose-200">
          <p className="text-lg font-bold">{error || 'Không tìm thấy phim.'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Phim &amp; Lịch chiếu
      </Link>

      {/* Movie Detail Header */}
      <section className="overflow-hidden rounded-3xl border border-zinc-800/90 bg-[#0c0c0f] p-6 shadow-2xl sm:p-8">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <div className="mx-auto aspect-[2/3] w-56 overflow-hidden rounded-2xl border border-zinc-800 shadow-xl md:w-full">
            <MoviePoster src={movie.UrlPoster} alt={movie.TenPhim} className="h-full w-full" />
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <AgeBadge rating={movie.PhanLoai} showDescription />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {movie.TenPhim}
            </h1>

            <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">{movie.MoTa}</p>

            <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Film className="h-4 w-4 text-pink-400" />
                <span className="text-zinc-400">Thể loại:</span>
                <span className="font-semibold text-white">{movie.DanhSachTheLoai}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-zinc-400">Thời lượng:</span>
                <span className="font-semibold text-white">{movie.ThoiLuong} phút</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <User className="h-4 w-4 text-sky-400" />
                <span className="text-zinc-400">Đạo diễn:</span>
                <span className="font-semibold text-white">{movie.DaoDien || 'Đang cập nhật'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Globe className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-400">Quốc gia:</span>
                <span className="font-semibold text-white">{movie.QuocGia || 'Đang cập nhật'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span className="text-zinc-400">Khởi chiếu:</span>
                <span className="font-semibold text-white">{formatDateVN(movie.NgayKhoiChieu)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Ticket className="h-4 w-4 text-amber-400" />
                <span className="text-zinc-400">Vé đã bán:</span>
                <span className="font-semibold text-white">
                  {movie.SoVeDaBan.toLocaleString('vi-VN')} vé
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showtime Picker */}
      <section className="overflow-hidden rounded-3xl border border-zinc-800/90 bg-[#0c0c0f] shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-zinc-800/90 bg-[#08080a] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">Chọn suất chiếu</h2>
            <p className="mt-0.5 text-sm text-zinc-400">
              Giá vé cuối cùng tự động áp dụng quy tắc giờ chiếu &amp; hạng thành viên.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['', '2D', '3D', 'IMAX', '4DX'].map((fmt) => (
              <button
                key={fmt || 'ALL'}
                type="button"
                onClick={() => setRoomType(fmt)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  roomType === fmt
                    ? 'bg-pink-600 text-white'
                    : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {fmt || 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {availableDates.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            Hiện chưa có suất chiếu nào được lập cho phim này.
          </div>
        ) : (
          <div className="space-y-6 p-5 sm:p-6">
            {/* Two-part Calendar Date Strip */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {availableDates.map((d) => {
                const { dayNumber, label } = formatDateTile(d, todayStr);
                const active = selectedDate === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`flex min-w-[76px] shrink-0 flex-col overflow-hidden rounded-xl border text-center transition ${
                      active
                        ? 'border-pink-600 shadow-lg shadow-pink-600/15'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span
                      className={`px-3 py-1.5 text-lg font-extrabold leading-tight ${
                        active ? 'bg-pink-600 text-white' : 'bg-zinc-900 text-zinc-100'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <span
                      className={`bg-zinc-950 px-2 py-1 text-[11px] ${
                        active ? 'font-bold text-pink-400' : 'font-medium text-zinc-400'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {groupedByFormat.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-400">
                Không có suất chiếu định dạng {roomType || 'này'} trong ngày {formatDateVN(selectedDate)}.
              </div>
            ) : (
              <div className="space-y-5">
                {groupedByFormat.map((fmtGroup) => (
                  <div key={fmtGroup.format}>
                    <h3 className="mb-2.5 text-sm font-bold text-zinc-200">{fmtGroup.label}</h3>
                    <div className="flex flex-wrap gap-3">
                      {fmtGroup.items.map((sc) => {
                        const isOpen = sc.TrangThai === 'MO_BAN';
                        if (!isOpen) {
                          return (
                            <span
                              key={sc.MaSuatChieu}
                              className="inline-flex cursor-not-allowed items-baseline rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-500 opacity-60"
                            >
                              <span className="font-bold">{formatTimeHM(sc.ThoiGianBatDau)}</span>
                              <span className="text-xs">
                                &nbsp;~ {formatTimeHM(sc.ThoiGianKetThuc)} (
                                {sc.TrangThai === 'TAM_DUNG' ? 'Tạm dừng' : 'Đã hủy'})
                              </span>
                            </span>
                          );
                        }

                        return (
                          <Link
                            key={sc.MaSuatChieu}
                            to={`/booking/${sc.MaSuatChieu}`}
                            title={`${sc.TenPhong} • Còn ${sc.SoGheTrong}/${sc.TongSoGhe} ghế • Giá cơ bản ${formatVnd(sc.GiaCoBan)}`}
                            className="group inline-flex flex-col rounded-xl border border-sky-500/45 bg-sky-950/25 px-4 py-2.5 transition hover:border-sky-400 hover:bg-sky-500/15"
                          >
                            <div className="flex items-baseline text-sm">
                              <span className="font-bold text-sky-300 group-hover:text-sky-200">
                                {formatTimeHM(sc.ThoiGianBatDau)}
                              </span>
                              <span className="text-xs text-zinc-400">
                                &nbsp;~ {formatTimeHM(sc.ThoiGianKetThuc)}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-zinc-400">
                              {sc.TenPhong} • Còn {sc.SoGheTrong}/{sc.TongSoGhe} ghế
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
