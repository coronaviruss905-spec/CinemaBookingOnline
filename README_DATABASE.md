# Hướng Dẫn Cài Đặt & Chạy Database `CinemaBookingDB`

Tài liệu này hướng dẫn chi tiết cách cài đặt và chạy 3 file SQL để khởi tạo cơ sở dữ liệu **CinemaBookingDB** trên **Microsoft SQL Server**.

---

## 1. Yêu cầu hệ thống

- **Microsoft SQL Server 2017 trở lên** (bản Express, Developer, Standard hoặc Enterprise đều được — vì script sử dụng hàm `STRING_AGG` và cú pháp `CREATE OR ALTER`).
- **Công cụ chạy SQL** (chọn 1 trong 2):
  - **SQL Server Management Studio (SSMS)** (giao diện đồ họa, khuyên dùng cho người mới).
  - Hoặc **`sqlcmd`** (dòng lệnh đi kèm khi cài SQL Server / ODBC Tools).

---

## 2. Thứ tự chạy bắt buộc của các file SQL

Trong thư mục chứa 3 file SQL, **bắt buộc chạy đúng theo thứ tự sau**:

| Thứ tự | Tên file | Chức năng |
| --- | --- | --- |
| **1** | `01_table.sql` | Tạo mới database `CinemaBookingDB` (`Vietnamese_100_CI_AS`), 14 bảng dữ liệu, các ràng buộc (`PK`, `FK`, `UQ`, `CK`) và chỉ mục (`INDEX`). |
| **2** | `02.seeddata.sql` | Nạp dữ liệu mẫu (thể loại, phim, phòng chiếu, ghế, quy tắc giá, hạng thành viên, 80 khách hàng, 80 suất chiếu, 600 đơn đặt vé & nhật ký). |
| **3** | `03.view_function_sp.sql` | Tạo 3 `VIEW`, 2 `FUNCTION`, 3 `STORED PROCEDURE` và 2 `TRIGGER` nghiệp vụ. |

> **Lưu ý quan trọng:**
> - File `01_table.sql` có lệnh `DROP DATABASE CinemaBookingDB` nếu database đã tồn tại. Hãy sao lưu trước nếu bạn đang có dữ liệu quan trọng trùng tên.
> - File `02.seeddata.sql` sinh lịch chiếu tự động xoay quanh **ngày hiện tại của máy** (`GETDATE()` từ `-1` ngày đến `+3` ngày). Nếu sang tuần/tháng mới mà không còn suất chiếu tương lai, bạn chỉ cần chạy lại riêng file `02.seeddata.sql` để làm mới lịch.

---

## 3. Cách 1 — Chạy bằng SQL Server Management Studio (SSMS)

1. Mở **SSMS**, kết nối vào SQL Server của bạn (ví dụ `localhost`, `.` hoặc `.\SQLEXPRESS`).
2. Mở lần lượt từng file (`File` → `Open` → `File...` hoặc kéo thả vào SSMS) và nhấn **`F5` (Execute)** theo đúng thứ tự:
   1. Mở **`01_table.sql`** → nhấn **`F5`** → kiểm tra tab *Messages* báo thành công không có lỗi đỏ.
   2. Mở **`02.seeddata.sql`** → nhấn **`F5`** → đợi khoảng 2–5 giây, tab *Results* sẽ in bảng thống kê số bản ghi của 14 bảng.
   3. Mở **`03.view_function_sp.sql`** → nhấn **`F5`** → kiểm tra tab *Messages* báo *Commands completed successfully*.
3. Ở khung **Object Explorer** bên trái, chuột phải vào **Databases** → **Refresh** để thấy database `CinemaBookingDB`.

> **Mẹo kiểm tra font tiếng Việt trong SSMS:** Sau bước 2, nếu thấy tên phim tiếng Việt trong kết quả bị lỗi font, hãy đảm bảo file `.sql` được mở đúng chuẩn **UTF-8** (`File` → `Save ... As` → mũi tên cạnh nút Save → *Save with Encoding* → chọn `UTF-8` có hoặc không BOM, hoặc chạy bằng Cách 2 với cờ `-f 65001`).

---

## 4. Cách 2 — Chạy bằng dòng lệnh `sqlcmd` (PowerShell / CMD)

Mở **PowerShell** hoặc **Command Prompt**, di chuyển (`cd`) vào thư mục chứa 3 file SQL:

```powershell
cd "đường\dẫn\tới\thư\mục\chứa\file\sql"
```

### Trường hợp A: Kết nối bằng Windows Authentication (`-E`)

```powershell
sqlcmd -S localhost -E -C -I -f 65001 -i 01_table.sql
sqlcmd -S localhost -E -C -I -f 65001 -i 02.seeddata.sql
sqlcmd -S localhost -E -C -I -f 65001 -i 03.view_function_sp.sql
```

### Trường hợp B: Kết nối bằng tài khoản SQL Authentication (`-U` / `-P`)

```powershell
sqlcmd -S localhost -U sa -P "MatKhauCuaBan" -C -I -f 65001 -i 01_table.sql
sqlcmd -S localhost -U sa -P "MatKhauCuaBan" -C -I -f 65001 -i 02.seeddata.sql
sqlcmd -S localhost -U sa -P "MatKhauCuaBan" -C -I -f 65001 -i 03.view_function_sp.sql
```

### Giải thích các tham số quan trọng
- `-S localhost`: Tên SQL Server instance. Nếu dùng bản **SQL Server Express**, đổi thành `.\SQLEXPRESS` hoặc `localhost\SQLEXPRESS`.
- `-f 65001`: **Bắt buộc** để đọc file theo bảng mã **UTF-8**, tránh lỗi dấu tiếng Việt (`Ngày Tận Thế`, `Thường`, `Vàng`...).
- `-I`: Bật `QUOTED_IDENTIFIER ON` ngay từ đầu phiên (bắt buộc cho các bảng có *filtered index* như `DonDatVe`, `ThanhToan`).
- `-C`: Tin cậy chứng chỉ SSL nội bộ (*Trust Server Certificate*, cần thiết trên `sqlcmd` / ODBC Driver 18).

---

## 5. Kiểm tra kết quả sau khi chạy

Bạn có thể chạy đoạn SQL sau trong SSMS (hoặc `sqlcmd`) để xác nhận toàn bộ bảng, dữ liệu mẫu, View, Function, Stored Procedure và Trigger đã hoạt động đúng:

```sql
USE CinemaBookingDB;
GO

-- 1. Kiểm tra danh sách đối tượng nghiệp vụ (kỳ vọng: 3 View, 2 Function, 3 SP, 2 Trigger)
SELECT type_desc, name
FROM sys.objects
WHERE is_ms_shipped = 0
  AND type IN ('V', 'FN', 'IF', 'TF', 'P', 'TR')
ORDER BY type_desc, name;

-- 2. Kiểm tra dữ liệu mẫu và dấu tiếng Việt
SELECT MaPhim, TenPhim, ThoiLuong, PhanLoai FROM dbo.Phim ORDER BY MaPhim;
SELECT COUNT(*) AS TongSuatChieu, MIN(ThoiGianBatDau) AS TuNgay, MAX(ThoiGianBatDau) AS DenNgay
FROM dbo.SuatChieu;

-- 3. Chạy thử View & Function
SELECT TOP 5 * FROM dbo.vw_LichChieuChiTiet ORDER BY ThoiGianBatDau DESC;
SELECT * FROM dbo.vw_DoanhThuTheoPhim;
SELECT TOP 10 * FROM dbo.fn_SoDoGheSuatChieu(1, 1) ORDER BY HangGhe, SoGhe;
GO
```

**Kết quả kỳ vọng sau khi nạp `02.seeddata.sql`:**
- `TheLoai`: 12 dòng
- `Phim`: 6 dòng
- `PhongChieu`: 5 dòng (`Cinema 05` đang ở trạng thái `BAO_TRI`)
- `LoaiGhe`: 3 dòng (`Thường`, `VIP`, `Couple`)
- `Ghe`: 420 dòng (gồm 2 ghế `HONG`: phòng 1 ghế `E8`, phòng 3 ghế `K4`)
- `SuatChieu`: 80 suất chiếu
- `QuyTacGia`: 6 quy tắc
- `HangThanhVien`: 4 hạng (`Thành viên`, `Bạc`, `Vàng`, `Kim cương`)
- `KhachHang`: 80 tài khoản (mật khẩu mẫu chung trước khi băm SHA2-256 là **`Cinema@123`**; có 2 tài khoản ở trạng thái `BI_KHOA`)
- `DonDatVe`: 600 đơn mẫu cùng các bản ghi tương ứng ở `Ve`, `ThanhToan`, `NhatKyVe`

---

## 6. Xử lý các lỗi thường gặp

| Lỗi gặp phải | Nguyên nhân & Cách khắc phục |
| --- | --- |
| **`Named Pipes / TCP Provider: A network-related or instance-specific error...`** | SQL Server chưa bật service hoặc sai tên instance. Mở **Services** (`services.msc`) kiểm tra `SQL Server (MSSQLSERVER)` hoặc `SQL Server (SQLEXPRESS)` đang `Running`, hoặc đổi `-S localhost` thành `-S .\SQLEXPRESS`. |
| **`Msg 1934: ... incorrect settings: 'QUOTED_IDENTIFIER'`** | Khi chạy bằng `sqlcmd`, bạn thiếu cờ `-I` hoặc chưa có `SET QUOTED_IDENTIFIER ON;`. Hãy thêm `-I` vào lệnh `sqlcmd`. |
| **Tên phim/thể loại bị lỗi font tiếng Việt (`Ã`, `?`, ô vuông)** | Khi chạy `sqlcmd`, bạn thiếu cờ `-f 65001`. Hãy chạy lại `02.seeddata.sql` kèm `-f 65001`. |
| **`Invalid object name 'dbo.Phim'` hoặc `'dbo.vw_LichChieuChiTiet'`** | Chạy nhầm thứ tự file hoặc đang đứng ở database `master`. Phải chạy `01_table.sql` → `02.seeddata.sql` → `03.view_function_sp.sql` và chọn đúng `USE CinemaBookingDB;`. |
| **`Could not find stored procedure 'STRING_AGG'`** | Phiên bản SQL Server cũ hơn SQL Server 2017. Cần nâng cấp lên SQL Server 2017 trở lên. |
