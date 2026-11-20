import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Clapperboard, LayoutDashboard, LogIn, LogOut, Sparkles, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import TierBadge from './TierBadge.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
      isActive
        ? 'bg-pink-600/20 text-pink-400 ring-1 ring-inset ring-pink-500/30'
        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/25 transition group-hover:scale-105">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white">
                CBO
              </div>
              <div className="text-[11px] text-zinc-400">Đặt vé xem phim trực tuyến</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              <Clapperboard className="h-4 w-4" />
              Phim & Lịch chiếu
            </NavLink>
            <NavLink to="/my-tickets" className={navLinkClass}>
              <Ticket className="h-4 w-4" />
              Vé của tôi
            </NavLink>
            <NavLink to="/admin" className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              Quản trị
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/my-tickets"
                className="hidden items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 transition hover:border-zinc-700 sm:flex"
              >
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{user.HoTen}</div>
                  <div className="flex items-center justify-end gap-1 text-[11px] text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    {user.DiemTichLuy.toLocaleString('vi-VN')} điểm
                  </div>
                </div>
                <TierBadge
                  maHang={user.MaHang}
                  tenHang={user.TenHang}
                  discount={user.TyLeGiam}
                />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-pink-500/40 hover:bg-pink-600/10 hover:text-pink-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-600/20 transition hover:from-pink-500 hover:to-rose-500"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* Mobile navigation strip */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-zinc-800/70 px-4 py-2 md:hidden">
        <NavLink to="/" end className={navLinkClass}>
          <Clapperboard className="h-4 w-4" />
          Phim
        </NavLink>
        <NavLink to="/my-tickets" className={navLinkClass}>
          <Ticket className="h-4 w-4" />
          Vé của tôi
        </NavLink>
        <NavLink to="/admin" className={navLinkClass}>
          <LayoutDashboard className="h-4 w-4" />
          Quản trị
        </NavLink>
      </div>
    </header>
  );
}
