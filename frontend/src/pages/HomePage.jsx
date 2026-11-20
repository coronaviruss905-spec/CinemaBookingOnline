import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import MoviePoster from '../components/MoviePoster.jsx';
import {
  formatAgeShort,
  formatDateTile,
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

const FORMAT_ORDER = ['2D', '3D', 'IMAX', '4DX'];

function getCardsPerView() {
  if (typeof window === 'undefined') return 5;
  if (window.innerWidth >= 1024) return 5;
  if (window.innerWidth >= 768) return 3;
  if (window.innerWidth >= 480) return 2;
  return 1;
}

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [scheduleDates, setScheduleDates] = useState([]);
  const [today, setToday] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');

  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);
  const [error, setError] = useState('');

  const [cardsPerView, setCardsPerView] = useState(getCardsPerView);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setCardsPerView(getCardsPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      setLoadingMovies(true);
      setLoadingShowtimes(true);
      try {
        const [movieRes, showtimeRes] = await Promise.all([
          apiRequest('/movies'),
          apiRequest('/showtimes'),
        ]);
        if (cancelled) return;

        setMovies(movieRes.movies || []);

        const allDates = showtimeRes.availableDates || [];
        const todayStr = showtimeRes.today || '';
        setToday(todayStr);

        const upcoming = todayStr ? allDates.filter((d) => d >= todayStr) : allDates;
        const datesToShow = upcoming.length > 0 ? upcoming : allDates;
        setScheduleDates(datesToShow);

        const defaultDate =
          (todayStr && datesToShow.includes(todayStr) ? todayStr : datesToShow[0]) || '';
        setSelectedDate(defaultDate);
        setShowtimes(
          defaultDate
            ? (showtimeRes.showtimes || []).filter((s) => s.NgayChieu === defaultDate)
            : showtimeRes.showtimes || []
        );
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) {
          setLoadingMovies(false);
          setLoadingShowtimes(false);
        }
      }
    }
    loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    async function loadDayShowtimes() {
      setLoadingShowtimes(true);
      try {
        const res = await apiRequest(`/showtimes?date=${encodeURIComponent(selectedDate)}`);
        if (!cancelled) setShowtimes(res.showtimes || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingShowtimes(false);
      }
    }
    loadDayShowtimes();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const maxIndex = Math.max(0, movies.length - cardsPerView);

  useEffect(() => {
    setSlideIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const groupedSchedule = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const movieMap = new Map();

    for (const sc of showtimes) {
      if (keyword && !sc.TenPhim.toLowerCase().includes(keyword)) {
        continue;
      }
      if (!movieMap.has(sc.MaPhim)) {
        movieMap.set(sc.MaPhim, {
          MaPhim: sc.MaPhim,
          TenPhim: sc.TenPhim,
          UrlPoster: sc.UrlPoster,
          PhanLoai: sc.PhanLoai,
          DanhSachTheLoai: sc.DanhSachTheLoai,
          formatsMap: new Map(),
        });
      }
      const entry = movieMap.get(sc.MaPhim);
      if (!entry.formatsMap.has(sc.LoaiPhong)) {
        entry.formatsMap.set(sc.LoaiPhong, []);
      }
      entry.formatsMap.get(sc.LoaiPhong).push(sc);
    }

    return Array.from(movieMap.values()).map((entry) => {
      const formats = Array.from(entry.formatsMap.entries())
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
      return { ...entry, formats };
    });
  }, [showtimes, search]);

  return (
    <div className="bg-black text-zinc-100">
      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        </div>
      )}

      {/* SECTION 1: TOP FOLD — Phim đang chiếu (Pure Black Cinema Hall Showcase) */}
      <section className="theater-backdrop relative overflow-hidden border-b border-zinc-900 pb-14 pt-9 sm:pb-16 sm:pt-11">
        {/* Photorealistic dark cinema auditorium backdrop */}
        <img
          src="/images/cinema-hall-bg.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_62%] opacity-95"
        />
        {/* Vertical & lateral cinematic vignette overlays */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 via-70% to-black/90"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-center gap-2.5 text-center">
            <Sparkles className="h-5 w-5 text-amber-300/90" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Phim đang chiếu
            </h1>
            <Sparkles className="h-5 w-5 text-amber-300/90" />
          </div>

          {loadingMovies ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-900" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-900" />
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-10 text-center text-sm text-zinc-400">
              Hiện chưa có phim nào.
            </div>
          ) : (
            <div className="relative">
              {slideIndex > 0 && (
                <button
                  type="button"
                  aria-label="Phim trước"
                  onClick={() => setSlideIndex((prev) => Math.max(0, prev - 1))}
                  className="absolute -left-2 top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md shadow-2xl transition hover:scale-105 hover:border-white/40 hover:bg-black/80 sm:-left-5"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {slideIndex < maxIndex && (
                <button
                  type="button"
                  aria-label="Phim tiếp theo"
                  onClick={() => setSlideIndex((prev) => Math.min(maxIndex, prev + 1))}
                  className="absolute -right-2 top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md shadow-2xl transition hover:scale-105 hover:border-white/40 hover:bg-black/80 sm:-right-5"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              <div className="-mx-2.5 overflow-hidden py-1">
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${(slideIndex * 100) / cardsPerView}%)` }}
                >
                  {movies.map((movie, idx) => {
                    const badgeBg = AGE_BADGE_SOLID[movie.PhanLoai] || 'bg-zinc-700';
                    const ageLabel = formatAgeShort(movie.PhanLoai);
                    return (
                      <div
                        key={movie.MaPhim}
                        className="shrink-0 px-2.5"
                        style={{ width: `${100 / cardsPerView}%` }}
                      >
                        <article className="group">
                          <Link
                            to={`/movies/${movie.MaPhim}`}
                            className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl"
                          >
                            <MoviePoster
                              src={movie.UrlPoster}
                              alt={movie.TenPhim}
                              className="h-full w-full transition duration-300 group-hover:scale-105"
                            />

                            {/* Bottom dark scrim for rank readability */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

                            {/* Top-left solid age badge */}
                            <span
                              className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-xs font-extrabold text-white shadow ${badgeBg}`}
                            >
                              {ageLabel}
                            </span>

                            {/* Bottom-left rank numeral */}
                            <span className="pointer-events-none absolute bottom-2 left-3 text-5xl font-black leading-none tracking-tighter text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]">
                              {idx + 1}
                            </span>
                          </Link>

                          <Link
                            to={`/movies/${movie.MaPhim}`}
                            className="mt-3 block line-clamp-1 text-[15px] font-bold text-white transition group-hover:text-pink-400"
                          >
                            {movie.TenPhim}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-zinc-400">
                            {movie.DanhSachTheLoai}
                          </p>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: BELOW FOLD — Lịch chiếu phim (Dark Theme Matching Image 2) */}
      <section className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Lịch chiếu phim
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Chọn ngày và khung giờ chiếu để mở sơ đồ ghế đặt vé trực tuyến.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm phim trong lịch chiếu..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#0c0c0f] shadow-2xl">
          {/* Two-part Calendar Date Tiles */}
          <div className="flex gap-2.5 overflow-x-auto border-b border-zinc-800/90 bg-[#08080a] p-4 sm:p-5">
            {scheduleDates.map((d) => {
              const { dayNumber, label } = formatDateTile(d, today);
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

          {/* Movie Rows */}
          {loadingShowtimes ? (
            <div className="divide-y divide-zinc-800/80">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-5 p-6">
                  <div className="aspect-[2/3] w-28 shrink-0 animate-pulse rounded-xl bg-zinc-900" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-12 animate-pulse rounded bg-zinc-900" />
                    <div className="h-6 w-1/2 animate-pulse rounded bg-zinc-900" />
                    <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-900" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-900" />
                      <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-900" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : groupedSchedule.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-400">
              Không có suất chiếu phù hợp trong ngày {formatDateVN(selectedDate)}.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {groupedSchedule.map((group) => {
                const badgeBg = AGE_BADGE_SOLID[group.PhanLoai] || 'bg-zinc-700';
                const ageLabel = formatAgeShort(group.PhanLoai);
                return (
                  <div
                    key={group.MaPhim}
                    className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6"
                  >
                    <Link
                      to={`/movies/${group.MaPhim}`}
                      className="aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg sm:w-32"
                    >
                      <MoviePoster
                        src={group.UrlPoster}
                        alt={group.TenPhim}
                        className="h-full w-full transition duration-300 hover:scale-105"
                      />
                    </Link>

                    <div className="flex-1 space-y-3">
                      <div>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-extrabold text-white ${badgeBg}`}
                        >
                          {ageLabel}
                        </span>
                        <h3 className="mt-1.5 text-lg font-bold text-white sm:text-xl">
                          <Link
                            to={`/movies/${group.MaPhim}`}
                            className="transition hover:text-pink-400"
                          >
                            {group.TenPhim}
                          </Link>
                        </h3>
                        <p className="mt-0.5 text-sm text-zinc-400">{group.DanhSachTheLoai}</p>
                      </div>

                      <div className="space-y-3 pt-1">
                        {group.formats.map((fmtGroup) => (
                          <div key={fmtGroup.format}>
                            <div className="mb-2 text-sm font-bold text-zinc-200">
                              {fmtGroup.label}
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {fmtGroup.items.map((sc) => {
                                const isOpen = sc.TrangThai === 'MO_BAN';
                                if (!isOpen) {
                                  return (
                                    <span
                                      key={sc.MaSuatChieu}
                                      title={`${sc.TenPhong} • Tạm dừng`}
                                      className="inline-flex cursor-not-allowed items-baseline rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-sm text-zinc-500 opacity-60"
                                    >
                                      <span className="font-bold">
                                        {formatTimeHM(sc.ThoiGianBatDau)}
                                      </span>
                                      <span className="text-xs">
                                        &nbsp;~ {formatTimeHM(sc.ThoiGianKetThuc)} (Tạm dừng)
                                      </span>
                                    </span>
                                  );
                                }

                                return (
                                  <Link
                                    key={sc.MaSuatChieu}
                                    to={`/booking/${sc.MaSuatChieu}`}
                                    title={`${sc.TenPhong} • Còn ${sc.SoGheTrong}/${sc.TongSoGhe} ghế • Giá cơ bản ${formatVnd(sc.GiaCoBan)}`}
                                    className="inline-flex items-baseline rounded-lg border border-sky-500/45 bg-sky-950/25 px-3.5 py-2 text-sm transition hover:border-sky-400 hover:bg-sky-500/15"
                                  >
                                    <span className="font-bold text-sky-300">
                                      {formatTimeHM(sc.ThoiGianBatDau)}
                                    </span>
                                    <span className="text-xs text-zinc-400">
                                      &nbsp;~ {formatTimeHM(sc.ThoiGianKetThuc)}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
