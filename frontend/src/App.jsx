import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import MovieDetailPage from './pages/MovieDetailPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import MyTicketsPage from './pages/MyTicketsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-black text-zinc-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/movies/:id" element={<MovieDetailPage />} />
              <Route path="/booking/:maSuatChieu" element={<BookingPage />} />
              <Route path="/payment/:maDon" element={<PaymentPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/my-tickets" element={<MyTicketsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-zinc-900 bg-[#050507] py-6 text-center text-xs text-zinc-500">
            CBO — Hệ thống đặt vé xem phim trực tuyến
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
