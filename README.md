# CineSQL — Website Demo Đặt Vé Xem Phim Trực Tuyến

Ứng dụng demo đặt vé xem phim trực tuyến xây dựng trên **Microsoft SQL Server (`CinemaBookingDB`)**, **Node.js + Express (Raw SQL / `mssql/msnodesqlv8`)** và **React (Vite) + TailwindCSS**.

## Cấu trúc thư mục

- `01_table.sql`, `02.seeddata.sql`, `03.view_function_sp.sql` — Schema, dữ liệu mẫu, View, Function, Stored Procedure và Trigger gốc (giữ nguyên không chỉnh sửa).
- `backend/` — Express API server kết nối trực tiếp tới SQL Server qua `mssql/msnodesqlv8` (Windows Integrated Auth) hoặc `mssql` (SQL Auth), thực thi Raw SQL và gọi trực tiếp View/Function/SP.
- `frontend/` — React + Vite + TailwindCSS SPA.

## Ánh xạ Tính năng ↔ Đối tượng SQL Server

| Tính năng trên giao diện | Đối tượng SQL Server được gọi trực tiếp |
| --- | --- |
| Danh sách phim, trạng thái chiếu, báo cáo doanh thu | `dbo.vw_DoanhThuTheoPhim` |
| Lịch chiếu chi tiết & số ghế trống theo suất | `dbo.vw_LichChieuChiTiet` |
| Giám sát sơ đồ ghế & giá cơ sở trong Admin | `dbo.vw_SoDoGheSuatChieu` |
| Sơ đồ ghế tương tác & tính giá động (Quy tắc giá + Hạng thành viên) | `dbo.fn_SoDoGheSuatChieu(@MaSuatChieu, @MaKhachHang)` |
| Tính tổng tiền đơn đặt vé (gồm cả đơn đã hủy / hết hạn) | `dbo.fn_TongTienDon(@MaDon)` |
| Giữ chỗ ghế 10 phút + sinh mã thanh toán VietQR | `EXEC dbo.sp_GiuCho` (SP tự quản lý transaction) |
| Xác nhận thanh toán VietQR + cộng điểm tích lũy | `EXEC dbo.sp_XacNhanThanhToan` (SP tự quản lý transaction) |
| Lập lịch chiếu & chống trùng giờ phòng chiếu | `EXEC dbo.sp_LapLichChieu` (SP tự quản lý transaction) |
| Tự động nâng hạng thành viên khi tăng điểm tích lũy | Trigger `dbo.trg_KhachHang_CapNhatHang` |
| Kiểm tra ghế hợp lệ (đúng phòng & không hỏng) khi xuất vé | Trigger `dbo.trg_Ve_KiemTraHopLe` |

## Cấu hình & Chạy dự án

### 1. Cấu hình `backend/.env`

Mặc định sử dụng **Windows Authentication** qua `ODBC Driver 17 for SQL Server`:

```env
PORT=5000
JWT_SECRET=cinebooking-hqtcsdl-demo-secret-2026
DB_AUTH=windows
DB_DRIVER=ODBC Driver 17 for SQL Server
DB_SERVER=localhost
DB_NAME=CinemaBookingDB
```

### 2. Khởi chạy Backend

```powershell
cd backend
npm install
npm start
```

Backend chạy tại: `http://localhost:5000` (health check: `http://localhost:5000/api/health`).

### 3. Khởi chạy Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173` (proxy `/api` → `http://localhost:5000`).

## Tài khoản Demo

- Mật khẩu chung cho toàn bộ 80 tài khoản mẫu trong `02.seeddata.sql`: **`Cinema@123`**
- Trên trang `/login`, có sẵn danh sách tài khoản đại diện từng hạng (`Thành viên`, `Bạc`, `Vàng`, `Kim cương`) và 1 tài khoản `BI_KHOA` để bấm chọn nhanh.
