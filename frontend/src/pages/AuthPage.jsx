import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, KeyRound, Lock, LogIn, Sparkles, UserPlus } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import TierBadge from '../components/TierBadge.jsx';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, register } = useAuth();

  const redirectTo = searchParams.get('redirect') || '/';
  const [mode, setMode] = useState(() =>
    location.pathname === '/register' ? 'register' : 'login'
  );

  const [demoAccounts, setDemoAccounts] = useState([]);
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('Cinema@123');

  const [regForm, setRegForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    matKhau: '',
    ngaySinh: '2002-05-15',
    gioiTinh: 'Nam',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(location.pathname === '/register' ? 'register' : 'login');
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  useEffect(() => {
    apiRequest('/auth/demo-accounts')
      .then((res) => setDemoAccounts(res.accounts || []))
      .catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, matKhau);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register(regForm);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (acc) => {
    setMode('login');
    setEmail(acc.Email);
    setMatKhau('Cinema@123');
    setError('');
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
      {/* Auth Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              mode === 'login'
                ? 'bg-rose-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
              mode === 'register'
                ? 'bg-rose-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Đăng ký mới
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gmail.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Mật khẩu</label>
              <input
                type="password"
                required
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-500 hover:to-rose-400 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập tài khoản'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={regForm.hoTen}
                  onChange={(e) => setRegForm({ ...regForm, hoTen: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="nguyenvana@gmail.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Số điện thoại (10 số)
                </label>
                <input
                  type="tel"
                  required
                  pattern="0[0-9]{9}"
                  value={regForm.soDienThoai}
                  onChange={(e) => setRegForm({ ...regForm, soDienThoai: e.target.value })}
                  placeholder="0912345678"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Ngày sinh</label>
                <input
                  type="date"
                  value={regForm.ngaySinh}
                  onChange={(e) => setRegForm({ ...regForm, ngaySinh: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Giới tính</label>
                <select
                  value={regForm.gioiTinh}
                  onChange={(e) => setRegForm({ ...regForm, gioiTinh: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Mật khẩu (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regForm.matKhau}
                  onChange={(e) => setRegForm({ ...regForm, matKhau: e.target.value })}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-500 hover:to-rose-400 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký & Đăng nhập'}
            </button>
          </form>
        )}
      </div>

      {/* Demo Accounts Quick-Fill */}
      <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="text-base font-extrabold text-white">Tài khoản Demo (Seed SQL)</h2>
            <p className="text-xs text-slate-400">
              Mật khẩu chung: <code className="font-mono text-amber-300">Cinema@123</code>
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-400">
          Nhấp một tài khoản bên dưới để điền nhanh vào form đăng nhập và kiểm thử giảm giá theo
          hạng thành viên hoặc trạng thái <code className="text-rose-300">BI_KHOA</code>.
        </p>

        <div className="space-y-2.5">
          {demoAccounts.map((acc) => {
            const locked = acc.TrangThai === 'BI_KHOA';
            return (
              <button
                key={acc.MaKhachHang}
                type="button"
                onClick={() => fillDemo(acc)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  locked
                    ? 'border-rose-500/30 bg-rose-500/10 hover:border-rose-500/50'
                    : 'border-slate-800 bg-slate-950/75 hover:border-amber-400/50 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{acc.HoTen}</span>
                  {locked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                      <Lock className="h-3 w-3" />
                      BI_KHOA
                    </span>
                  ) : (
                    <TierBadge
                      maHang={acc.MaHang}
                      tenHang={acc.TenHang}
                      discount={acc.TyLeGiam}
                    />
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">{acc.Email}</span>
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    {acc.DiemTichLuy.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
