USE CinemaBookingDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


-- view 1
CREATE OR ALTER VIEW dbo.vw_LichChieuChiTiet
AS
SELECT
    sc.MaSuatChieu,
    p.MaPhim,
    p.TenPhim,
    p.UrlPoster,
    p.ThoiLuong,
    p.PhanLoai,
    ISNULL(tl.DanhSachTheLoai, N'Chưa phân loại') AS DanhSachTheLoai,
    pc.MaPhong,
    pc.TenPhong,
    pc.LoaiPhong,
    sc.ThoiGianBatDau,
    sc.ThoiGianKetThuc,
    sc.GiaCoBan,
    sc.TrangThai,
    ISNULL(ghe.TongSoGhe, 0)                      AS TongSoGhe,
    ISNULL(ghe.TongSoGhe, 0) - ISNULL(ve.SoGheDaDat, 0) AS SoGheTrong
FROM dbo.SuatChieu AS sc
INNER JOIN dbo.Phim AS p        ON p.MaPhim = sc.MaPhim
INNER JOIN dbo.PhongChieu AS pc ON pc.MaPhong = sc.MaPhong
OUTER APPLY (
    SELECT STRING_AGG(t.TenTheLoai, N', ') WITHIN GROUP (ORDER BY t.TenTheLoai) AS DanhSachTheLoai
    FROM dbo.PhimTheLoai AS pt
    INNER JOIN dbo.TheLoai AS t ON t.MaTheLoai = pt.MaTheLoai
    WHERE pt.MaPhim = p.MaPhim
) AS tl

OUTER APPLY (
    SELECT COUNT(*) AS TongSoGhe
    FROM dbo.Ghe AS g
    WHERE g.MaPhong = sc.MaPhong AND g.TrangThai = 'HOAT_DONG'
) AS ghe

OUTER APPLY (
    SELECT COUNT(*) AS SoGheDaDat
    FROM dbo.Ve AS v
    WHERE v.MaSuatChieu = sc.MaSuatChieu
) AS ve;
GO


-- View 2
CREATE OR ALTER VIEW dbo.vw_SoDoGheSuatChieu
AS
SELECT
    sc.MaSuatChieu,
    g.MaGhe,
    g.HangGhe,
    g.SoGhe,
    lg.TenLoaiGhe,
    lg.HeSoGia,

    CAST(ROUND(sc.GiaCoBan * lg.HeSoGia, -3) AS DECIMAL(12,0)) AS GiaGhe,

    CASE
        WHEN g.TrangThai = 'HONG'           THEN 'HONG'
        WHEN d.TrangThai = 'DA_THANH_TOAN'  THEN 'DA_BAN'
        WHEN d.TrangThai = 'DANG_GIU'       THEN 'DANG_GIU'
        ELSE 'TRONG'
    END AS TrangThaiGhe
FROM dbo.SuatChieu AS sc
INNER JOIN dbo.Ghe AS g       ON g.MaPhong = sc.MaPhong
INNER JOIN dbo.LoaiGhe AS lg  ON lg.MaLoaiGhe = g.MaLoaiGhe
LEFT JOIN dbo.Ve AS v         ON v.MaSuatChieu = sc.MaSuatChieu AND v.MaGhe = g.MaGhe
LEFT JOIN dbo.DonDatVe AS d   ON d.MaDon = v.MaDon;
GO

-- View 3
CREATE OR ALTER VIEW dbo.vw_DoanhThuTheoPhim
AS
SELECT
    p.MaPhim,
    p.TenPhim,
    p.UrlPoster,
    p.NgayKhoiChieu,
    ISNULL(tl.DanhSachTheLoai, N'Chưa phân loại') AS DanhSachTheLoai,

    CASE
        WHEN CAST(SYSDATETIME() AS DATE) < p.NgayKhoiChieu THEN 'SAP_CHIEU'
        WHEN p.NgayKetThuc IS NOT NULL
             AND CAST(SYSDATETIME() AS DATE) > p.NgayKetThuc THEN 'NGUNG_CHIEU'
        ELSE 'DANG_CHIEU'
    END                                           AS TrangThaiPhim,
    COUNT(DISTINCT sc.MaSuatChieu)                AS SoSuatChieu,
    COUNT(v.MaVe)                                 AS SoVeDaBan,
    ISNULL(SUM(v.GiaVe), 0)                       AS TongDoanhThu
FROM dbo.Phim AS p
LEFT JOIN dbo.SuatChieu AS sc
    ON sc.MaPhim = p.MaPhim AND sc.TrangThai <> 'DA_HUY'
LEFT JOIN dbo.Ve AS v
    ON v.MaSuatChieu = sc.MaSuatChieu
LEFT JOIN dbo.DonDatVe AS d
    ON d.MaDon = v.MaDon AND d.TrangThai = 'DA_THANH_TOAN'

OUTER APPLY (
    SELECT STRING_AGG(t.TenTheLoai, N', ') WITHIN GROUP (ORDER BY t.TenTheLoai) AS DanhSachTheLoai
    FROM dbo.PhimTheLoai AS pt
    INNER JOIN dbo.TheLoai AS t ON t.MaTheLoai = pt.MaTheLoai
    WHERE pt.MaPhim = p.MaPhim
) AS tl
GROUP BY
    p.MaPhim, p.TenPhim, p.UrlPoster,
    p.NgayKhoiChieu, p.NgayKetThuc, tl.DanhSachTheLoai;
GO

-- Function 1
CREATE OR ALTER FUNCTION dbo.fn_TongTienDon (@MaDon BIGINT)
RETURNS DECIMAL(12,0)
AS
BEGIN
    DECLARE @Tong DECIMAL(12,0);

    SELECT @Tong = SUM(GiaVe) FROM dbo.Ve WHERE MaDon = @MaDon;

    IF @Tong IS NULL
        SELECT @Tong = SUM(GiaVe)
        FROM dbo.NhatKyVe
        WHERE MaDon = @MaDon AND HanhDong = 'GIU_CHO';

    RETURN ISNULL(@Tong, 0);
END;
GO

-- Function 2
CREATE OR ALTER FUNCTION dbo.fn_SoDoGheSuatChieu (@MaSuatChieu INT, @MaKhachHang INT = NULL)
RETURNS TABLE
AS
RETURN
(
    SELECT
        g.MaGhe,
        g.HangGhe,
        g.SoGhe,
        g.HangGhe + CAST(g.SoGhe AS VARCHAR(2)) AS ViTri,
        lg.TenLoaiGhe,
        lg.HeSoGia AS HeSoLoaiGhe,
        CASE
            WHEN g.TrangThai <> 'HOAT_DONG'    THEN 'HONG'
            WHEN v.MaVe IS NULL                THEN 'TRONG'
            WHEN d.TrangThai = 'DA_THANH_TOAN' THEN 'DA_BAN'
            ELSE                                    'DANG_GIU'
        END AS TrangThaiGhe,
        sc.GiaCoBan,
        qt.MaQuyTac,
        qt.TenQuyTac,
        ISNULL(qt.HeSoGia, 1.00) AS HeSoQuyTac,
        ISNULL(kh.TyLeGiam, 0)   AS TyLeGiam,
        CAST(ROUND(
            sc.GiaCoBan * lg.HeSoGia * ISNULL(qt.HeSoGia, 1.00) * (1 - ISNULL(kh.TyLeGiam, 0) / 100.0),
            -3
        ) AS DECIMAL(12,0)) AS GiaVe
    FROM dbo.SuatChieu sc
    JOIN dbo.PhongChieu pc ON pc.MaPhong   = sc.MaPhong
    JOIN dbo.Ghe g         ON g.MaPhong    = sc.MaPhong
    JOIN dbo.LoaiGhe lg    ON lg.MaLoaiGhe = g.MaLoaiGhe
    -- Ghép với các vé đang có hiệu lực (đã bán hoặc đang giữ chỗ còn hạn)
    LEFT JOIN (
        dbo.Ve v
        JOIN dbo.DonDatVe d ON d.MaDon = v.MaDon
                           AND (d.TrangThai = 'DA_THANH_TOAN'
                                OR (d.TrangThai = 'DANG_GIU' AND d.ThoiGianHetHan > SYSDATETIME()))
    ) ON v.MaSuatChieu = sc.MaSuatChieu AND v.MaGhe = g.MaGhe
    -- Lấy % giảm giá theo hạng thành viên của khách
    OUTER APPLY (
        SELECT h.TyLeGiam
        FROM dbo.KhachHang k
        JOIN dbo.HangThanhVien h ON h.MaHang = k.MaHang
        WHERE k.MaKhachHang = @MaKhachHang
    ) kh
    -- Chọn 1 quy tắc giá có độ ưu tiên cao nhất khớp với khung giờ & loại phòng
    OUTER APPLY (
        SELECT TOP (1) q.MaQuyTac, q.TenQuyTac, q.HeSoGia
        FROM dbo.QuyTacGia q
        WHERE q.KichHoat = 1
          AND CAST(sc.ThoiGianBatDau AS DATE) >= q.NgayHieuLuc
          AND (q.NgayHetHieuLuc IS NULL OR CAST(sc.ThoiGianBatDau AS DATE) <= q.NgayHetHieuLuc)
          AND CAST(sc.ThoiGianBatDau AS TIME(0)) BETWEEN q.GioBatDau AND q.GioKetThuc
          AND (q.LoaiPhong IS NULL OR q.LoaiPhong = pc.LoaiPhong)
          AND q.LoaiNgay IN (
              'TAT_CA',
              CASE WHEN DATEDIFF(DAY, '19000107', sc.ThoiGianBatDau) % 7 IN (0, 6) THEN 'CUOI_TUAN' ELSE 'NGAY_THUONG' END
          )
          AND q.TyLeLapDayTu = 0
        ORDER BY q.DoUuTien DESC, q.HeSoGia DESC
    ) qt
    WHERE sc.MaSuatChieu = @MaSuatChieu
);
GO

-- sp 1
CREATE OR ALTER PROCEDURE dbo.sp_LapLichChieu
    @MaPhim         INT,
    @MaPhong        INT,
    @ThoiGianBatDau DATETIME2(0),
    @GiaCoBan       DECIMAL(12,0) = 75000,
    @PhutDonPhong   TINYINT       = 15,
    @MaSuatChieu    INT           = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ThoiLuong SMALLINT, @KetThuc DATETIME2(0);

    SELECT @ThoiLuong = ThoiLuong FROM dbo.Phim WHERE MaPhim = @MaPhim;
    IF @ThoiLuong IS NULL
        THROW 50104, N'Phim không tồn tại.', 1;

    SET @KetThuc = DATEADD(MINUTE, @ThoiLuong + ISNULL(@PhutDonPhong, 15), @ThoiGianBatDau);

    BEGIN TRANSACTION;

    -- Kiểm tra xem khung giờ [BatDau, KetThuc) có bị giao với suất chiếu nào khác trong cùng phòng không
    IF EXISTS (
        SELECT 1
        FROM dbo.SuatChieu WITH (UPDLOCK, HOLDLOCK)
        WHERE MaPhong = @MaPhong
          AND TrangThai <> 'DA_HUY'
          AND ThoiGianBatDau < @KetThuc
          AND @ThoiGianBatDau < ThoiGianKetThuc
    )
        THROW 50108, N'Khung giờ này bị trùng với một suất chiếu khác trong cùng phòng.', 1;

    INSERT INTO dbo.SuatChieu (MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaCoBan)
    VALUES (@MaPhim, @MaPhong, @ThoiGianBatDau, @KetThuc, ISNULL(@GiaCoBan, 75000));

    SET @MaSuatChieu = SCOPE_IDENTITY();

    COMMIT TRANSACTION;
END;
GO

-- sp 2
CREATE OR ALTER PROCEDURE dbo.sp_GiuCho
    @MaKhachHang        INT,
    @MaSuatChieu        INT,
    @DanhSachGhe        VARCHAR(100),         -- VD: 'E5,E6'
    @PhutGiu            TINYINT       = 10,
    @MaDon              BIGINT        = NULL OUTPUT,
    @NoiDungChuyenKhoan VARCHAR(25)   = NULL OUTPUT,
    @TongTien           DECIMAL(12,0) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now DATETIME2(0) = SYSDATETIME();
    DECLARE @GheChon TABLE (MaGhe INT PRIMARY KEY);

    -- 1. Tìm MaGhe tương ứng với chuỗi vị trí ghế (VD: 'E5,E6') trong phòng của suất chiếu
    INSERT INTO @GheChon (MaGhe)
    SELECT DISTINCT g.MaGhe
    FROM STRING_SPLIT(@DanhSachGhe, ',') s
    JOIN dbo.SuatChieu sc ON sc.MaSuatChieu = @MaSuatChieu
    JOIN dbo.Ghe g        ON g.MaPhong = sc.MaPhong
                         AND g.HangGhe + CAST(g.SoGhe AS VARCHAR(2)) = LTRIM(RTRIM(s.value))
    WHERE g.TrangThai = 'HOAT_DONG';

    IF NOT EXISTS (SELECT 1 FROM @GheChon)
        THROW 50208, N'Danh sách ghế không hợp lệ hoặc ghế không hoạt động.', 1;

    BEGIN TRANSACTION;

    -- Khóa dòng SuatChieu để tuần tự hóa mọi giao dịch đặt vé của cùng 1 suất chiếu (chống Deadlock trên bảng Ve)
    SELECT 1 FROM dbo.SuatChieu WITH (UPDLOCK, HOLDLOCK) WHERE MaSuatChieu = @MaSuatChieu;

    -- 2. Giải phóng các đơn giữ chỗ đã quá hạn của suất chiếu này (nếu có)
    DECLARE @DonQuaHan TABLE (MaDon BIGINT PRIMARY KEY);
    INSERT INTO @DonQuaHan (MaDon)
    SELECT DISTINCT d.MaDon
    FROM dbo.Ve v WITH (UPDLOCK, HOLDLOCK)
    JOIN dbo.DonDatVe d ON d.MaDon = v.MaDon
    WHERE v.MaSuatChieu = @MaSuatChieu
      AND d.TrangThai = 'DANG_GIU' AND d.ThoiGianHetHan <= @Now;

    IF EXISTS (SELECT 1 FROM @DonQuaHan)
    BEGIN
        INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong)
        SELECT v.MaVe, v.MaDon, v.MaSuatChieu, v.MaGhe, v.GiaVe, 'HET_HAN'
        FROM dbo.Ve v JOIN @DonQuaHan q ON q.MaDon = v.MaDon;

        DELETE v FROM dbo.Ve v JOIN @DonQuaHan q ON q.MaDon = v.MaDon;
        UPDATE d SET TrangThai = 'HET_HAN'  FROM dbo.DonDatVe d  JOIN @DonQuaHan q ON q.MaDon = d.MaDon;
        UPDATE t SET TrangThai = 'THAT_BAI' FROM dbo.ThanhToan t JOIN @DonQuaHan q ON q.MaDon = t.MaDon;
    END

    -- 3. Kiểm tra ghế khách chọn có bị người khác giữ/mua mất chưa
    IF EXISTS (
        SELECT 1 FROM @GheChon c
        JOIN dbo.Ve v WITH (UPDLOCK, HOLDLOCK) ON v.MaSuatChieu = @MaSuatChieu AND v.MaGhe = c.MaGhe
    )
        THROW 50212, N'Một hoặc nhiều ghế bạn chọn vừa có người đặt. Vui lòng chọn ghế khác.', 1;

    -- 4. Tạo đơn đặt vé + Vé + Nhật ký + Giao dịch chờ VietQR
    INSERT INTO dbo.DonDatVe (MaKhachHang, ThoiGianTao, ThoiGianHetHan)
    VALUES (@MaKhachHang, @Now, DATEADD(MINUTE, @PhutGiu, @Now));
    SET @MaDon = SCOPE_IDENTITY();

    INSERT INTO dbo.Ve (MaDon, MaSuatChieu, MaGhe, MaQuyTac, GiaVe)
    SELECT @MaDon, @MaSuatChieu, f.MaGhe, f.MaQuyTac, f.GiaVe
    FROM dbo.fn_SoDoGheSuatChieu(@MaSuatChieu, @MaKhachHang) f
    JOIN @GheChon c ON c.MaGhe = f.MaGhe;

    INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong)
    SELECT MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, 'GIU_CHO'
    FROM dbo.Ve WHERE MaDon = @MaDon;

    SET @TongTien = dbo.fn_TongTienDon(@MaDon);
    SELECT @NoiDungChuyenKhoan = 'CINE' + MaDatCho FROM dbo.DonDatVe WHERE MaDon = @MaDon;

    INSERT INTO dbo.ThanhToan (MaDon, NoiDungChuyenKhoan, SoTien, ThoiGianTao)
    VALUES (@MaDon, @NoiDungChuyenKhoan, @TongTien, @Now);

    COMMIT TRANSACTION;
END;
GO

-- sp 3
CREATE OR ALTER PROCEDURE dbo.sp_XacNhanThanhToan
    @NoiDungChuyenKhoan VARCHAR(25),
    @MaGiaoDichNganHang VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now DATETIME2(0) = SYSDATETIME();
    DECLARE @MaThanhToan BIGINT, @MaDon BIGINT, @SoTien DECIMAL(12,0);
    DECLARE @TrangThaiDon VARCHAR(15), @HetHan DATETIME2(0), @MaKH INT, @DiemCong INT;

    BEGIN TRANSACTION;

    -- 1. Tìm giao dịch đang chờ xác nhận theo nội dung chuyển khoản VietQR
    SELECT @MaThanhToan  = tt.MaThanhToan,
           @MaDon        = tt.MaDon,
           @SoTien       = tt.SoTien,
           @TrangThaiDon = d.TrangThai,
           @HetHan       = d.ThoiGianHetHan,
           @MaKH         = d.MaKhachHang
    FROM dbo.ThanhToan tt WITH (UPDLOCK, HOLDLOCK)
    JOIN dbo.DonDatVe d   ON d.MaDon = tt.MaDon
    WHERE tt.NoiDungChuyenKhoan = UPPER(LTRIM(RTRIM(@NoiDungChuyenKhoan)))
      AND tt.LoaiGiaoDich = 'THANH_TOAN'
      AND tt.TrangThai = 'CHO_XAC_NHAN';

    IF @MaThanhToan IS NULL
        THROW 50301, N'Không tìm thấy giao dịch chờ thanh toán phù hợp.', 1;

    -- 2. Kiểm tra đơn còn trong thời hạn giữ chỗ 10 phút hay không
    IF @TrangThaiDon <> 'DANG_GIU' OR @Now > @HetHan
        THROW 50306, N'Đơn đặt vé đã hết thời gian giữ chỗ.', 1;

    -- 3. Xác nhận đơn & giao dịch thành công
    UPDATE dbo.DonDatVe
    SET TrangThai = 'DA_THANH_TOAN'
    WHERE MaDon = @MaDon;

    UPDATE dbo.ThanhToan
    SET TrangThai          = 'THANH_CONG',
        MaGiaoDichNganHang = @MaGiaoDichNganHang,
        ThoiGianXacNhan    = @Now
    WHERE MaThanhToan = @MaThanhToan;

    -- 4. Cộng điểm tích lũy
    SET @DiemCong = CAST(FLOOR(@SoTien / 1000) AS INT);

    UPDATE dbo.KhachHang
    SET DiemTichLuy = DiemTichLuy + @DiemCong
    WHERE MaKhachHang = @MaKH;

    -- 5. Ghi nhật ký vé
    INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong)
    SELECT MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, 'THANH_TOAN'
    FROM dbo.Ve WHERE MaDon = @MaDon;

    COMMIT TRANSACTION;
END;
GO

-- Trigger 1
CREATE OR ALTER TRIGGER dbo.trg_KhachHang_CapNhatHang
ON dbo.KhachHang
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(DiemTichLuy) RETURN;

    UPDATE k
    SET k.MaHang = ISNULL(h_moi.MaHang, k.MaHang)
    FROM dbo.KhachHang k
    JOIN inserted i ON i.MaKhachHang = k.MaKhachHang
    OUTER APPLY (
        SELECT TOP (1) h.MaHang
        FROM dbo.HangThanhVien h
        WHERE h.DiemToiThieu <= i.DiemTichLuy
        ORDER BY h.DiemToiThieu DESC
    ) h_moi
    WHERE k.MaHang <> h_moi.MaHang;
END;
GO

-- Trigger 2
CREATE OR ALTER TRIGGER dbo.trg_Ve_KiemTraHopLe
ON dbo.Ve
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Ghế phải thuộc đúng phòng của suất chiếu
    IF EXISTS (
        SELECT 1
        FROM   inserted i
        JOIN   dbo.Ghe g        ON g.MaGhe        = i.MaGhe
        JOIN   dbo.SuatChieu sc ON sc.MaSuatChieu = i.MaSuatChieu
        WHERE  g.MaPhong <> sc.MaPhong
    )
    BEGIN
        THROW 50401, N'Lỗi toàn vẹn: Ghế không thuộc phòng chiếu của suất chiếu này.', 1;
    END

    -- 2. Không cho phép tạo vé trên ghế đang hỏng
    IF EXISTS (
        SELECT 1
        FROM   inserted i
        JOIN   dbo.Ghe g ON g.MaGhe = i.MaGhe
        WHERE  g.TrangThai <> 'HOAT_DONG'
    )
    BEGIN
        THROW 50402, N'Lỗi nghiệp vụ: Không thể xuất vé cho ghế đang hỏng.', 1;
    END
END;
GO