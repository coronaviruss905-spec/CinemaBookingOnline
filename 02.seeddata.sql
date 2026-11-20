SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE CinemaBookingDB;
GO

/* =====================================================================
   XÓA DỮ LIỆU CŨ & RESET IDENTITY AN TOÀN
   ===================================================================== */
DELETE FROM dbo.NhatKyVe;
DELETE FROM dbo.ThanhToan;
DELETE FROM dbo.Ve;
DELETE FROM dbo.DonDatVe;
DELETE FROM dbo.KhachHang;
DELETE FROM dbo.HangThanhVien;
DELETE FROM dbo.QuyTacGia;
DELETE FROM dbo.SuatChieu;
DELETE FROM dbo.Ghe;
DELETE FROM dbo.LoaiGhe;
DELETE FROM dbo.PhongChieu;
DELETE FROM dbo.PhimTheLoai;
DELETE FROM dbo.Phim;
DELETE FROM dbo.TheLoai;

DECLARE @Bang TABLE (Ten SYSNAME PRIMARY KEY);
INSERT @Bang VALUES ('dbo.TheLoai'), ('dbo.Phim'), ('dbo.PhongChieu'), ('dbo.LoaiGhe'), ('dbo.Ghe'),
                    ('dbo.SuatChieu'), ('dbo.QuyTacGia'), ('dbo.KhachHang'), ('dbo.DonDatVe'),
                    ('dbo.Ve'), ('dbo.ThanhToan'), ('dbo.NhatKyVe');
DECLARE @TenBang SYSNAME;
WHILE EXISTS (SELECT 1 FROM @Bang)
BEGIN
    SELECT TOP (1) @TenBang = Ten FROM @Bang;
    IF EXISTS (SELECT 1 FROM sys.identity_columns
               WHERE object_id = OBJECT_ID(@TenBang) AND last_value IS NOT NULL)
        EXEC (N'DBCC CHECKIDENT (''' + @TenBang + N''', RESEED, 0) WITH NO_INFOMSGS;');
    DELETE FROM @Bang WHERE Ten = @TenBang;
END
GO

-- 1. Bảng TheLoai
INSERT INTO dbo.TheLoai (TenTheLoai, MoTa)
VALUES
    (N'Hành động',           N'Cháy nổ, rượt đuổi, võ thuật'),
    (N'Phiêu lưu',           N'Hành trình khám phá vùng đất mới'),
    (N'Hoạt hình',           N'Phim hoạt hình 2D/3D'),
    (N'Hài',                 N'Giải trí, gây cười'),
    (N'Kinh dị',             N'Rùng rợn, tâm linh'),
    (N'Tâm lý',              N'Khai thác nội tâm nhân vật'),
    (N'Tình cảm',            N'Chuyện tình yêu, lãng mạn'),
    (N'Khoa học viễn tưởng', N'Tương lai, vũ trụ, công nghệ'),
    (N'Gia đình',            N'Phù hợp xem cùng gia đình'),
    (N'Hình sự',             N'Phá án, trinh thám, tội phạm'),
    (N'Nhạc kịch',           N'Kể chuyện bằng âm nhạc và vũ đạo'),
    (N'Tài liệu',            N'Phim tư liệu, sự kiện có thật');
GO

-- 2. Bảng Phim 
DECLARE @HomNay DATE = CAST(GETDATE() AS DATE);

INSERT INTO dbo.Phim (TenPhim, ThoiLuong, PhanLoai, DaoDien, QuocGia, NgayKhoiChieu, NgayKetThuc, MoTa, UrlPoster)
VALUES
    (N'Avengers: Ngày Tận Thế',           165, 'T13', N'Anthony Russo',         N'Mỹ',       DATEADD(DAY, -20, @HomNay), NULL,                       N'Biệt đội Avengers tập hợp chống lại mối đe dọa đa vũ trụ mới.',                                            'https://image.tmdb.org/t/p/w500/zHTxblqPcqRpA93ex2Hj0RdpVBs.jpg'),
    (N'Mai',                              131, 'T18', N'Trấn Thành',            N'Việt Nam', DATEADD(DAY, -30, @HomNay), DATEADD(DAY, 30, @HomNay),  N'Câu chuyện tâm lý tình cảm sâu sắc về cuộc đời và những tổn thương của người phụ nữ tên Mai.',             'https://image.tmdb.org/t/p/w500/2nF8xD200rcDawuCg5ObxxqA2fC.jpg'),
    (N'Người Nhện: Khởi Đầu Mới',         150, 'T16', N'Destin Daniel Cretton', N'Mỹ',       DATEADD(DAY, -45, @HomNay), DATEADD(DAY, 15, @HomNay),  N'Sau khi mất mọi người thân, Peter Parker bắt đầu hành trình anh hùng đơn độc bảo vệ thành phố New York.',  'https://image.tmdb.org/t/p/w500/tV712n7bMaRuaKyltFl65HPNRiP.jpg'),
    (N'Trại buôn người',                  135, 'T18', N'Toni Dương Bảo Anh',    N'Việt Nam', DATEADD(DAY, -25, @HomNay), DATEADD(DAY, 45, @HomNay),  N'Bộ phim là hành trình sinh tồn đầy kịch tính nhằm giải cứu những nạn nhân khỏi trại buôn người tàn khốc.', 'https://image.tmdb.org/t/p/w500/u1NNSLQFnKWbKCc8zZCH6WBhS2F.jpg'),
    (N'Doraemon: Bản Giao Hưởng Địa Cầu', 115, 'P',   N'Imai Kazuaki',          N'Nhật Bản', DATEADD(DAY, -15, @HomNay), NULL,                       N'Cuộc phiêu lưu âm nhạc giải cứu Trái Đất của nhóm bạn Nobita và mèo máy Doraemon.',                        'https://image.tmdb.org/t/p/w500/l7De73OojBP0I5nmzxJpeBHmJvu.jpg'),
    (N'Người mẹ khác',                    93,  'K',   N'Rob Savage',            N'Mỹ',       DATEADD(DAY, -10, @HomNay), DATEADD(DAY, 25, @HomNay),  N'Bộ phim theo chân một cô bé dũng cảm đối đầu với "người mẹ khác" quỷ quyệt để giải cứu gia đình.',         'https://image.tmdb.org/t/p/w500/nZYi7HeXJVfJmZ0kprb1cJBHN2g.jpg');
GO

-- 3. Bảng PhimTheLoai
INSERT INTO dbo.PhimTheLoai (MaPhim, MaTheLoai)
VALUES
    (1, 1), (1, 2), (1, 8),
    (2, 6), (2, 7),    
    (3, 1), (3, 2), (3, 8),     
    (4, 1), (4, 6), (4, 10),     
    (5, 2), (5, 3), (5, 9), (5, 11), 
    (6, 5), (6, 6);  
GO

-- 4. Bảng PhongChieu
INSERT INTO dbo.PhongChieu (TenPhong, LoaiPhong, TrangThai)
VALUES
    (N'Cinema 01', '2D',   'HOAT_DONG'),
    (N'Cinema 02', '3D',   'HOAT_DONG'),
    (N'Cinema 03', 'IMAX', 'HOAT_DONG'),
    (N'Cinema 04', '4DX',  'HOAT_DONG'),
    (N'Cinema 05', '2D',   'BAO_TRI');
GO

-- 5. Bảng LoaiGhe
INSERT INTO dbo.LoaiGhe (TenLoaiGhe, HeSoGia, MoTa)
VALUES
    (N'Thường', 1.00, N'Ghế tiêu chuẩn'),
    (N'VIP',    1.20, N'Ghế rộng, vị trí trung tâm phía sau'),
    (N'Couple', 2.20, N'Ghế đôi không vách ngăn');
GO

-- 6. Bảng QuyTacGia
DECLARE @DauNam DATE = DATEADD(MONTH, -6, CAST(GETDATE() AS DATE));
DECLARE @CuoiNam DATE = DATEADD(MONTH, 6, CAST(GETDATE() AS DATE));

INSERT INTO dbo.QuyTacGia (TenQuyTac, LoaiNgay, GioBatDau, GioKetThuc, LoaiPhong, TyLeLapDayTu, HeSoGia, DoUuTien, NgayHieuLuc, NgayHetHieuLuc)
VALUES
    (N'Suất chiếu sáng',    'NGAY_THUONG', '08:00:00', '11:59:59', NULL,   0.00,  0.80, 1, @DauNam, NULL),
    (N'Cuối tuần',          'CUOI_TUAN',   '00:00:00', '23:59:59', NULL,   0.00,  1.10, 1, @DauNam, NULL),
    (N'Giờ vàng cuối tuần', 'CUOI_TUAN',   '18:00:00', '23:00:00', NULL,   0.00,  1.20, 2, @DauNam, NULL),
    (N'Phụ thu phòng IMAX', 'TAT_CA',      '00:00:00', '23:59:59', 'IMAX', 0.00,  1.20, 3, @DauNam, NULL),
    (N'Suất chiếu hot',     'TAT_CA',      '00:00:00', '23:59:59', NULL,   70.00, 1.25, 3, @DauNam, @CuoiNam),
    (N'Suất khuya',         'TAT_CA',      '22:00:00', '23:59:59', NULL,   0.00,  0.85, 1, @DauNam, NULL);
GO

-- 7. Bảng HangThanhVien
INSERT INTO dbo.HangThanhVien (MaHang, TenHang, DiemToiThieu, TyLeGiam)
VALUES
    (1, N'Thành viên', 0,    0.00),
    (2, N'Bạc',        500,  3.00),
    (3, N'Vàng',       1500, 5.00),
    (4, N'Kim cương',  4000, 10.00);
GO

-- 8. Bảng KhachHang
DECLARE @MatKhauDemo VARCHAR(255) = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'Cinema@123'), 2);
DECLARE @NgayHienTai DATE = CAST(GETDATE() AS DATE);

INSERT INTO dbo.KhachHang 
    (HoTen, Email, SoDienThoai, MatKhauHash, NgaySinh, GioiTinh, MaHang, DiemTichLuy, TrangThai, NgayDangKy)
SELECT
    ds.Ho + N' ' + ds.DemTen AS HoTen,
    ds.TenKD + '.' + ds.HoKD + CAST(ds.stt AS VARCHAR(5)) + '@gmail.com' AS Email,
    '090' + RIGHT('0000000' + CAST(1000000 + ds.stt AS VARCHAR(7)), 7) AS SoDienThoai,
    @MatKhauDemo AS MatKhauHash,
    DATEADD(DAY, -(ds.stt * 11), DATEADD(YEAR, -(14 + (ds.stt % 31)), @NgayHienTai)) AS NgaySinh,
    ds.GioiTinh,
    CASE ds.stt % 4 WHEN 0 THEN 4    WHEN 1 THEN 3    WHEN 2 THEN 2   ELSE 1   END AS MaHang,
    CASE ds.stt % 4 WHEN 0 THEN 4500 WHEN 1 THEN 2000 WHEN 2 THEN 800 ELSE 100 END AS DiemTichLuy,
    CASE WHEN ds.stt IN (13, 57) THEN 'BI_KHOA' ELSE 'HOAT_DONG' END AS TrangThai,
    DATEADD(HOUR, -(ds.stt * 18), DATEADD(DAY, -60, SYSDATETIME())) AS NgayDangKy
FROM
(
    SELECT 
        ROW_NUMBER() OVER (ORDER BY ho.HoKD, ten.TenKD) AS stt,
        ho.Ho, ho.HoKD, ten.DemTen, ten.TenKD, ten.GioiTinh
    FROM 
    (
        VALUES 
            (N'Nguyễn', 'nguyen'), (N'Trần', 'tran'), (N'Lê', 'le'), (N'Phạm', 'pham'),
            (N'Hoàng',  'hoang'),  (N'Vũ',   'vu'),   (N'Đặng', 'dang'), (N'Bùi', 'bui')
    ) AS ho(Ho, HoKD)
    CROSS JOIN
    (
        VALUES 
            (N'Văn An',      'an',   N'Nam'),
            (N'Minh Tuấn',   'tuan', N'Nam'),
            (N'Quốc Bảo',    'bao',  N'Nam'),
            (N'Đức Huy',     'huy',  N'Nam'),
            (N'Hoàng Long',  'long', N'Nam'),
            (N'Thị Lan',     'lan',  N'Nữ'),
            (N'Ngọc Anh',    'anh',  N'Nữ'),
            (N'Thu Hà',      'ha',   N'Nữ'),
            (N'Phương Thảo', 'thao', N'Nữ'),
            (N'Mai Linh',    'linh', N'Nữ')
    ) AS ten(DemTen, TenKD, GioiTinh)
) AS ds
ORDER BY ds.stt;
GO

-- 9. Bảng Ghe
INSERT INTO dbo.Ghe (MaPhong, MaLoaiGhe, HangGhe, SoGhe, TrangThai)
SELECT
    p.MaPhong,
    CASE WHEN h.HangGhe IN ('A', 'B', 'C', 'D')           THEN 1
         WHEN h.HangGhe IN ('E', 'F', 'G', 'H', 'I', 'J') THEN 2
         ELSE 3
    END AS MaLoaiGhe,
    h.HangGhe,
    s.SoGhe,
    CASE WHEN p.MaPhong = 1 AND h.HangGhe = 'E' AND s.SoGhe = 8 THEN 'HONG'
         WHEN p.MaPhong = 3 AND h.HangGhe = 'K' AND s.SoGhe = 4 THEN 'HONG'
         ELSE 'HOAT_DONG'
    END AS TrangThai
FROM dbo.PhongChieu p
CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J'), ('K')) AS h(HangGhe)
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10))                           AS s(SoGhe)
WHERE p.MaPhong IN (1, 2, 3, 4) AND (h.HangGhe <> 'K' OR s.SoGhe <= 5)
ORDER BY p.MaPhong, h.HangGhe, s.SoGhe;
GO

-- 10. Bảng SuatChieu
INSERT INTO dbo.SuatChieu (MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaCoBan, TrangThai)
SELECT
    lich.MaPhim,
    lich.MaPhong,
    lich.ThoiGianBatDau,
    DATEADD(MINUTE, p.ThoiLuong + 25, lich.ThoiGianBatDau) AS ThoiGianKetThuc,
    lich.GiaCoBan,
    CASE WHEN lich.LechNgay = 3 AND lich.MaPhong = 2 AND lich.Gio = 22 THEN 'TAM_DUNG'
         WHEN lich.LechNgay = 3 AND lich.MaPhong = 4 AND lich.Gio = 22 THEN 'DA_HUY'
         ELSE 'MO_BAN'
    END AS TrangThai
FROM
(
    SELECT
        ngay.LechNgay,
        ngay.NgayChieu,
        khung.MaPhong,
        khung.MaPhim,
        khung.Gio,
        DATETIMEFROMPARTS(YEAR(ngay.NgayChieu), MONTH(ngay.NgayChieu), DAY(ngay.NgayChieu),khung.Gio, khung.Phut, 0, 0) AS ThoiGianBatDau,
        khung.GiaCoBan
    FROM 
    (
        SELECT d.LechNgay, DATEADD(DAY, d.LechNgay, CAST(GETDATE() AS DATE)) AS NgayChieu
        FROM (VALUES (-1), (0), (1), (2), (3)) AS d(LechNgay)
    ) AS ngay
    CROSS JOIN
    (
        VALUES
            (1, 1,  9,  0,  75000), (1, 2, 13, 0,  80000), (1, 3, 17, 0,  85000), (1, 4, 21,  0,  90000),
            (2, 5,  9,  0,  80000), (2, 6, 13, 0,  90000), (2, 1, 17, 0,  95000), (2, 2, 22, 15, 100000),
            (3, 3,  9,  0, 100000), (3, 4, 13, 0, 110000), (3, 5, 17, 0, 120000), (3, 6, 21,  0, 120000),
            (4, 2,  9,  0, 105000), (4, 1, 13, 0, 115000), (4, 6, 17, 0, 125000), (4, 3, 22, 15, 130000)
    ) AS khung(MaPhong, MaPhim, Gio, Phut, GiaCoBan)
) AS lich
JOIN dbo.Phim p ON p.MaPhim = lich.MaPhim
ORDER BY lich.ThoiGianBatDau, lich.MaPhong;
GO

-- 11, 12, 13. DonDatVe, Ve, ThanhToan
DECLARE @i INT = 1, @SoDon INT = 600;
DECLARE @TrangThaiDon VARCHAR(15), @MaDatCho VARCHAR(10), @CoHoanTien BIT;
DECLARE @MaSuat INT, @MaPhong INT, @LoaiPhong VARCHAR(10), @PhanLoaiPhim VARCHAR(3);
DECLARE @BatDau DATETIME2(0), @GiaCoBan DECIMAL(12,0), @LoaiNgaySuat VARCHAR(12), @TyLeLapDay DECIMAL(5,2);
DECLARE @MaKH INT, @TyLeGiam DECIMAL(5,2);
DECLARE @MaQuyTac INT, @HeSoQT DECIMAL(4,2);
DECLARE @MocThamChieu DATETIME2(0), @ThoiGianTao DATETIME2(0), @MaDon BIGINT, @TongTien DECIMAL(12,0);

WHILE @i <= @SoDon
BEGIN
    -- Phân bổ đủ 4 trạng thái đơn: DANG_GIU, HET_HAN, DA_HUY, DA_THANH_TOAN
    SET @TrangThaiDon = CASE WHEN @i > @SoDon - 8 THEN 'DANG_GIU'
                             WHEN @i % 20 = 0     THEN 'HET_HAN'
                             WHEN @i % 25 = 0     THEN 'DA_HUY'
                             ELSE                      'DA_THANH_TOAN' 
                        END;
    -- Một nửa số đơn DA_HUY là đơn đã thanh toán sau đó khách yêu cầu hoàn vé/hoàn tiền
    SET @CoHoanTien = CASE WHEN @TrangThaiDon = 'DA_HUY' AND @i % 50 = 0 THEN 1 ELSE 0 END;

    -- Chọn suất chiếu đang mở bán và còn tối thiểu 4 ghế trống
    SELECT TOP 1
        @MaSuat       = sc.MaSuatChieu,
        @MaPhong      = sc.MaPhong,
        @LoaiPhong    = pc.LoaiPhong,
        @PhanLoaiPhim = p.PhanLoai,
        @BatDau       = sc.ThoiGianBatDau,
        @GiaCoBan     = sc.GiaCoBan,
        @TyLeLapDay   = CAST((SELECT COUNT(*) FROM dbo.Ve v WHERE v.MaSuatChieu = sc.MaSuatChieu) * 100.0 / 104.0 AS DECIMAL(5,2))
    FROM dbo.SuatChieu sc
    JOIN dbo.PhongChieu pc ON pc.MaPhong = sc.MaPhong
    JOIN dbo.Phim p        ON p.MaPhim   = sc.MaPhim
    WHERE sc.TrangThai = 'MO_BAN' AND (@TrangThaiDon <> 'DANG_GIU' OR sc.ThoiGianBatDau > SYSDATETIME())
      AND (
          SELECT COUNT(*)
          FROM dbo.Ghe g
          WHERE g.MaPhong = sc.MaPhong AND g.TrangThai = 'HOAT_DONG'
            AND NOT EXISTS (SELECT 1 FROM dbo.Ve v WHERE v.MaSuatChieu = sc.MaSuatChieu AND v.MaGhe = g.MaGhe)
      ) >= 4
    ORDER BY NEWID();

    -- Chọn khách hàng phù hợp với độ tuổi phân loại của phim
    SELECT TOP 1 @MaKH = kh.MaKhachHang, @TyLeGiam = h.TyLeGiam
    FROM dbo.KhachHang kh
    JOIN dbo.HangThanhVien h ON h.MaHang = kh.MaHang
    WHERE kh.TrangThai = 'HOAT_DONG'
      AND (
          kh.NgaySinh IS NULL
          OR @PhanLoaiPhim IN ('P', 'K')
          OR (@PhanLoaiPhim = 'T13' AND DATEADD(YEAR, 13, kh.NgaySinh) <= CAST(@BatDau AS DATE))
          OR (@PhanLoaiPhim = 'T16' AND DATEADD(YEAR, 16, kh.NgaySinh) <= CAST(@BatDau AS DATE))
          OR (@PhanLoaiPhim = 'T18' AND DATEADD(YEAR, 18, kh.NgaySinh) <= CAST(@BatDau AS DATE))
      )
    ORDER BY NEWID();

    -- Xác định quy tắc giá khớp thực tế với suất chiếu
    SET @LoaiNgaySuat = CASE WHEN DATEDIFF(DAY, '19000107', CAST(@BatDau AS DATE)) % 7 IN (0, 6) THEN 'CUOI_TUAN' ELSE 'NGAY_THUONG' END;
    SET @MaQuyTac = NULL;
    SET @HeSoQT   = 1.00;

    SELECT TOP 1 @MaQuyTac = qt.MaQuyTac, @HeSoQT = qt.HeSoGia
    FROM dbo.QuyTacGia qt
    WHERE qt.KichHoat = 1
      AND qt.LoaiNgay IN ('TAT_CA', @LoaiNgaySuat)
      AND CAST(@BatDau AS TIME(0)) BETWEEN qt.GioBatDau AND qt.GioKetThuc
      AND (qt.LoaiPhong IS NULL OR qt.LoaiPhong = @LoaiPhong)
      AND @TyLeLapDay >= qt.TyLeLapDayTu
      AND CAST(@BatDau AS DATE) >= qt.NgayHieuLuc
      AND (qt.NgayHetHieuLuc IS NULL OR CAST(@BatDau AS DATE) <= qt.NgayHetHieuLuc)
    ORDER BY qt.DoUuTien DESC, qt.HeSoGia DESC;

    -- Đảm bảo ThoiGianTao luôn nằm trong quá khứ và trước giờ chiếu
    SET @MocThamChieu = CASE WHEN @BatDau < SYSDATETIME() THEN @BatDau ELSE SYSDATETIME() END;
    SET @ThoiGianTao  = CASE WHEN @TrangThaiDon = 'DANG_GIU' THEN DATEADD(SECOND, -(60 + (@i % 300)), SYSDATETIME())
                             ELSE DATEADD(SECOND, -(1800 + (@i * 53) % 86400), @MocThamChieu)
                        END;

    SET @MaDatCho = RIGHT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 10);

    INSERT INTO dbo.DonDatVe (MaDatCho, MaKhachHang, ThoiGianTao, ThoiGianHetHan, TrangThai)
    VALUES (@MaDatCho, @MaKH, @ThoiGianTao, DATEADD(MINUTE, 10, @ThoiGianTao), @TrangThaiDon);
    SET @MaDon = SCOPE_IDENTITY();

    -- Tạo vé cho TẤT CẢ các đơn
    INSERT INTO dbo.Ve (MaDon, MaSuatChieu, MaGhe, MaQuyTac, GiaVe)
    SELECT TOP (2 + (@i % 3))
        @MaDon,
        @MaSuat,
        g.MaGhe,
        @MaQuyTac,
        ROUND(@GiaCoBan * lg.HeSoGia * @HeSoQT * (1 - @TyLeGiam / 100.0), -3)
    FROM dbo.Ghe g
    JOIN dbo.LoaiGhe lg ON lg.MaLoaiGhe = g.MaLoaiGhe
    WHERE g.MaPhong = @MaPhong AND g.TrangThai = 'HOAT_DONG'
      AND NOT EXISTS (SELECT 1 FROM dbo.Ve v WHERE v.MaSuatChieu = @MaSuat AND v.MaGhe = g.MaGhe)
    ORDER BY CHECKSUM(@MaDon, g.HangGhe), g.SoGhe;

    SELECT @TongTien = SUM(GiaVe) FROM dbo.Ve WHERE MaDon = @MaDon;

    -- Giao dịch thanh toán gốc
    INSERT INTO dbo.ThanhToan (MaDon, PhuongThuc, NoiDungChuyenKhoan, SoTien, LoaiGiaoDich, TrangThai, MaGiaoDichNganHang, ThoiGianTao, ThoiGianXacNhan)
    VALUES (
        @MaDon,
        'VIETQR',
        'CINE' + @MaDatCho,
        @TongTien,
        'THANH_TOAN',
        CASE WHEN @TrangThaiDon = 'DA_THANH_TOAN' OR @CoHoanTien = 1 THEN 'THANH_CONG'
             WHEN @TrangThaiDon = 'DANG_GIU'                         THEN 'CHO_XAC_NHAN'
             ELSE                                                         'THAT_BAI'
        END,
        CASE WHEN @TrangThaiDon = 'DA_THANH_TOAN' OR @CoHoanTien = 1 THEN 'FT263000' + CAST(@MaDon AS VARCHAR(10)) ELSE NULL END,
        @ThoiGianTao,
        CASE WHEN @TrangThaiDon = 'DA_THANH_TOAN' OR @CoHoanTien = 1 THEN DATEADD(MINUTE, 2, @ThoiGianTao) ELSE NULL END
    );

    -- Nếu là đơn DA_HUY có hoàn tiền, sinh thêm giao dịch HOAN_TIEN thành công
    IF @CoHoanTien = 1
    BEGIN
        INSERT INTO dbo.ThanhToan (MaDon, PhuongThuc, NoiDungChuyenKhoan, SoTien, LoaiGiaoDich, TrangThai, MaGiaoDichNganHang, ThoiGianTao, ThoiGianXacNhan)
        VALUES (
            @MaDon,
            'VIETQR',
            'HOAN' + @MaDatCho,
            @TongTien,
            'HOAN_TIEN',
            'THANH_CONG',
            'RF263000' + CAST(@MaDon AS VARCHAR(10)),
            DATEADD(MINUTE, 12, @ThoiGianTao),
            DATEADD(MINUTE, 15, @ThoiGianTao)
        );
    END

    SET @i = @i + 1;
END;
GO

/* =====================================================================
   TẠO BẢN GHI CHO BẢNG LOG (NhatKyVe) & GIẢI PHÓNG GHẾ ĐƠN HẾT HẠN / ĐÃ HỦY
   ===================================================================== */

-- 1. Mọi đơn đều có log 'GIU_CHO' lúc mới tạo đơn
INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong, ThoiGian, NguoiThucHien)
SELECT v.MaVe, v.MaDon, v.MaSuatChieu, v.MaGhe, v.GiaVe, 'GIU_CHO', dv.ThoiGianTao, N'web_app'
FROM dbo.Ve v 
JOIN dbo.DonDatVe dv ON dv.MaDon = v.MaDon;

-- 2. Đơn có giao dịch THANH_TOAN thành công (gồm đơn DA_THANH_TOAN và đơn DA_HUY có hoàn tiền) có thêm log 'THANH_TOAN'
INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong, ThoiGian, NguoiThucHien)
SELECT v.MaVe, v.MaDon, v.MaSuatChieu, v.MaGhe, v.GiaVe, 'THANH_TOAN', tt.ThoiGianXacNhan, N'web_app'
FROM dbo.Ve v
JOIN dbo.ThanhToan tt ON tt.MaDon = v.MaDon 
WHERE tt.LoaiGiaoDich = 'THANH_TOAN' AND tt.TrangThai = 'THANH_CONG';

-- 3. Đơn hết hạn có thêm log 'HET_HAN'
INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong, ThoiGian, NguoiThucHien)
SELECT NULL, v.MaDon, v.MaSuatChieu, v.MaGhe, v.GiaVe, 'HET_HAN', DATEADD(MINUTE, 1, dv.ThoiGianHetHan), N'job_giai_phong_ghe'
FROM dbo.Ve v 
JOIN dbo.DonDatVe dv ON dv.MaDon = v.MaDon
WHERE dv.TrangThai = 'HET_HAN';

-- 4. Đơn DA_HUY trước thanh toán có thêm log 'HUY'; đơn DA_HUY sau thanh toán có thêm log 'HOAN_VE'
INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong, ThoiGian, NguoiThucHien)
SELECT
    NULL,
    v.MaDon,
    v.MaSuatChieu,
    v.MaGhe,
    v.GiaVe,
    CASE WHEN ht.MaThanhToan IS NOT NULL THEN 'HOAN_VE' ELSE 'HUY' END,
     COALESCE(ht.ThoiGianXacNhan, DATEADD(MINUTE, 5, dv.ThoiGianTao)),
    N'web_app'
FROM dbo.Ve v
JOIN dbo.DonDatVe dv ON dv.MaDon = v.MaDon
LEFT JOIN dbo.ThanhToan ht ON ht.MaDon = dv.MaDon AND ht.LoaiGiaoDich = 'HOAN_TIEN'
WHERE dv.TrangThai = 'DA_HUY';

-- 5. Xóa vé của các đơn 'HET_HAN' và 'DA_HUY' khỏi bảng Ve để giải phóng ghế trống cho người khác mua
UPDATE nk SET MaVe = NULL
FROM dbo.NhatKyVe nk
JOIN dbo.DonDatVe dv ON dv.MaDon = nk.MaDon
WHERE dv.TrangThai IN ('HET_HAN', 'DA_HUY');

DELETE v
FROM dbo.Ve v
JOIN dbo.DonDatVe dv ON dv.MaDon = v.MaDon
WHERE dv.TrangThai IN ('HET_HAN', 'DA_HUY');
GO

-- Thống kê kết quả sau khi chạy dữ liệu mẫu
SELECT N'TheLoai' AS Bang, COUNT(*) AS SoBanGhi FROM dbo.TheLoai
UNION ALL SELECT N'Phim',          COUNT(*) FROM dbo.Phim
UNION ALL SELECT N'PhimTheLoai',   COUNT(*) FROM dbo.PhimTheLoai
UNION ALL SELECT N'PhongChieu',    COUNT(*) FROM dbo.PhongChieu
UNION ALL SELECT N'LoaiGhe',       COUNT(*) FROM dbo.LoaiGhe
UNION ALL SELECT N'Ghe',           COUNT(*) FROM dbo.Ghe
UNION ALL SELECT N'SuatChieu',     COUNT(*) FROM dbo.SuatChieu
UNION ALL SELECT N'QuyTacGia',     COUNT(*) FROM dbo.QuyTacGia
UNION ALL SELECT N'HangThanhVien', COUNT(*) FROM dbo.HangThanhVien
UNION ALL SELECT N'KhachHang',     COUNT(*) FROM dbo.KhachHang
UNION ALL SELECT N'DonDatVe',      COUNT(*) FROM dbo.DonDatVe
UNION ALL SELECT N'Ve',            COUNT(*) FROM dbo.Ve
UNION ALL SELECT N'ThanhToan',     COUNT(*) FROM dbo.ThanhToan
UNION ALL SELECT N'NhatKyVe (log)',COUNT(*) FROM dbo.NhatKyVe;
GO