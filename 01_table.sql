SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;   -- bắt buộc cho filtered index (sqlcmd mặc định OFF)
GO


USE master;
GO

IF DB_ID(N'CinemaBookingDB') IS NOT NULL
BEGIN
    ALTER DATABASE CinemaBookingDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE CinemaBookingDB;
END
GO

CREATE DATABASE CinemaBookingDB COLLATE Vietnamese_100_CI_AS;   -- so sánh / sắp xếp tiếng Việt chuẩn
GO

USE CinemaBookingDB;
GO


-- 1. TheLoai
CREATE TABLE dbo.TheLoai
(
    MaTheLoai   INT IDENTITY(1,1)   NOT NULL,
    TenTheLoai  NVARCHAR(50)        NOT NULL,
    MoTa        NVARCHAR(255)       NULL,

    CONSTRAINT PK_TheLoai            PRIMARY KEY (MaTheLoai),
    CONSTRAINT UQ_TheLoai_TenTheLoai UNIQUE (TenTheLoai)
);
GO

-- 2. Phim
CREATE TABLE dbo.Phim
(
    MaPhim         INT IDENTITY(1,1) NOT NULL,
    TenPhim        NVARCHAR(200)     NOT NULL,
    ThoiLuong      SMALLINT          NOT NULL,
    PhanLoai       VARCHAR(3)        NOT NULL CONSTRAINT DF_Phim_PhanLoai DEFAULT ('P'),
    DaoDien        NVARCHAR(100)     NULL,
    QuocGia        NVARCHAR(50)      NULL,
    NgayKhoiChieu  DATE              NOT NULL,
    NgayKetThuc    DATE              NULL,
    MoTa           NVARCHAR(MAX)     NULL,
    UrlPoster      VARCHAR(500)      NOT NULL CONSTRAINT DF_Phim_UrlPoster DEFAULT ('/images/posters/no-poster.jpg'),
    NgayTao        DATETIME2(0)      NOT NULL CONSTRAINT DF_Phim_NgayTao DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Phim                       PRIMARY KEY (MaPhim),
    CONSTRAINT UQ_Phim_TenPhim_NgayKhoiChieu UNIQUE (TenPhim, NgayKhoiChieu),
    CONSTRAINT CK_Phim_ThoiLuong             CHECK (ThoiLuong BETWEEN 30 AND 300),
    CONSTRAINT CK_Phim_PhanLoai              CHECK (PhanLoai IN ('P','K','T13','T16','T18')),
    CONSTRAINT CK_Phim_NgayChieu             CHECK (NgayKetThuc IS NULL OR NgayKetThuc >= NgayKhoiChieu),
    CONSTRAINT CK_Phim_UrlPoster             CHECK (UrlPoster LIKE 'http%://_%.__%' OR UrlPoster LIKE '/_%')
);
GO

-- 3. PhimTheLoai
CREATE TABLE dbo.PhimTheLoai
(
    MaPhim     INT NOT NULL,
    MaTheLoai  INT NOT NULL,

    CONSTRAINT PK_PhimTheLoai         PRIMARY KEY (MaPhim, MaTheLoai),
    CONSTRAINT FK_PhimTheLoai_Phim    FOREIGN KEY (MaPhim)    REFERENCES dbo.Phim (MaPhim) ON DELETE CASCADE,
    CONSTRAINT FK_PhimTheLoai_TheLoai FOREIGN KEY (MaTheLoai) REFERENCES dbo.TheLoai (MaTheLoai)
);
GO

-- 4. PhongChieu
CREATE TABLE dbo.PhongChieu
(
    MaPhong    INT IDENTITY(1,1) NOT NULL,
    TenPhong   NVARCHAR(50)      NOT NULL,
    LoaiPhong  VARCHAR(10)       NOT NULL CONSTRAINT DF_PhongChieu_LoaiPhong DEFAULT ('2D'),
    TrangThai  VARCHAR(15)       NOT NULL CONSTRAINT DF_PhongChieu_TrangThai DEFAULT ('HOAT_DONG'),

    CONSTRAINT PK_PhongChieu           PRIMARY KEY (MaPhong),
    CONSTRAINT UQ_PhongChieu_TenPhong  UNIQUE (TenPhong),
    CONSTRAINT CK_PhongChieu_LoaiPhong CHECK (LoaiPhong IN ('2D','3D','IMAX','4DX')),
    CONSTRAINT CK_PhongChieu_TrangThai CHECK (TrangThai IN ('HOAT_DONG','BAO_TRI','NGUNG'))
);
GO

-- 5. LoaiGhe
CREATE TABLE dbo.LoaiGhe
(
    MaLoaiGhe   INT IDENTITY(1,1) NOT NULL,
    TenLoaiGhe  NVARCHAR(30)      NOT NULL,
    HeSoGia     DECIMAL(4,2)      NOT NULL CONSTRAINT DF_LoaiGhe_HeSoGia DEFAULT (1.00),
    MoTa        NVARCHAR(255)     NULL,

    CONSTRAINT PK_LoaiGhe            PRIMARY KEY (MaLoaiGhe),
    CONSTRAINT UQ_LoaiGhe_TenLoaiGhe UNIQUE (TenLoaiGhe),
    CONSTRAINT CK_LoaiGhe_HeSoGia    CHECK (HeSoGia BETWEEN 0.50 AND 5.00)
);
GO

-- 6. Ghe
CREATE TABLE dbo.Ghe
(
    MaGhe      INT IDENTITY(1,1) NOT NULL,
    MaPhong    INT               NOT NULL,
    MaLoaiGhe  INT               NOT NULL,
    HangGhe    CHAR(1)           NOT NULL, 
    SoGhe      TINYINT           NOT NULL, 
    TrangThai  VARCHAR(15)       NOT NULL CONSTRAINT DF_Ghe_TrangThai DEFAULT ('HOAT_DONG'),

    CONSTRAINT PK_Ghe               PRIMARY KEY (MaGhe),
    CONSTRAINT FK_Ghe_PhongChieu    FOREIGN KEY (MaPhong)   REFERENCES dbo.PhongChieu (MaPhong),
    CONSTRAINT FK_Ghe_LoaiGhe       FOREIGN KEY (MaLoaiGhe) REFERENCES dbo.LoaiGhe (MaLoaiGhe),
    CONSTRAINT UQ_Ghe_Phong_Hang_So UNIQUE (MaPhong, HangGhe, SoGhe),
    CONSTRAINT CK_Ghe_HangGhe       CHECK (HangGhe LIKE '[A-Z]'),
    CONSTRAINT CK_Ghe_SoGhe         CHECK (SoGhe BETWEEN 1 AND 50),
    CONSTRAINT CK_Ghe_TrangThai     CHECK (TrangThai IN ('HOAT_DONG','HONG'))
);
GO

-- 7. SuatChieu
CREATE TABLE dbo.SuatChieu
(
    MaSuatChieu     INT IDENTITY(1,1) NOT NULL,
    MaPhim          INT               NOT NULL,
    MaPhong         INT               NOT NULL,
    ThoiGianBatDau  DATETIME2(0)      NOT NULL,
    ThoiGianKetThuc DATETIME2(0)      NOT NULL,
    GiaCoBan        DECIMAL(12,0)     NOT NULL CONSTRAINT DF_SuatChieu_GiaCoBan DEFAULT (75000),
    TrangThai       VARCHAR(15)       NOT NULL CONSTRAINT DF_SuatChieu_TrangThai DEFAULT ('MO_BAN'),

    CONSTRAINT PK_SuatChieu              PRIMARY KEY (MaSuatChieu),
    CONSTRAINT FK_SuatChieu_Phim         FOREIGN KEY (MaPhim)  REFERENCES dbo.Phim (MaPhim),
    CONSTRAINT FK_SuatChieu_PhongChieu   FOREIGN KEY (MaPhong) REFERENCES dbo.PhongChieu (MaPhong),
    CONSTRAINT UQ_SuatChieu_Phong_BatDau UNIQUE (MaPhong, ThoiGianBatDau),
    CONSTRAINT CK_SuatChieu_ThoiGian     CHECK (ThoiGianKetThuc > ThoiGianBatDau),
    CONSTRAINT CK_SuatChieu_GiaCoBan     CHECK (GiaCoBan > 0),
    CONSTRAINT CK_SuatChieu_TrangThai    CHECK (TrangThai IN ('MO_BAN','TAM_DUNG','DA_HUY'))
);
GO


-- 8. QuyTacGia
CREATE TABLE dbo.QuyTacGia
(
    MaQuyTac        INT IDENTITY(1,1) NOT NULL,
    TenQuyTac       NVARCHAR(100)     NOT NULL,
    LoaiNgay        VARCHAR(12)       NOT NULL CONSTRAINT DF_QuyTacGia_LoaiNgay DEFAULT ('TAT_CA'),
    GioBatDau       TIME(0)           NOT NULL CONSTRAINT DF_QuyTacGia_GioBatDau DEFAULT ('00:00:00'),
    GioKetThuc      TIME(0)           NOT NULL CONSTRAINT DF_QuyTacGia_GioKetThuc DEFAULT ('23:59:59'),
    LoaiPhong       VARCHAR(10)       NULL, 
    TyLeLapDayTu    DECIMAL(5,2)      NOT NULL CONSTRAINT DF_QuyTacGia_TyLeLapDayTu DEFAULT (0),
    HeSoGia         DECIMAL(4,2)      NOT NULL,
    DoUuTien        TINYINT           NOT NULL CONSTRAINT DF_QuyTacGia_DoUuTien DEFAULT (0),
    NgayHieuLuc     DATE              NOT NULL CONSTRAINT DF_QuyTacGia_NgayHieuLuc DEFAULT (CAST(GETDATE() AS DATE)),
    NgayHetHieuLuc  DATE              NULL, 
    KichHoat        BIT               NOT NULL CONSTRAINT DF_QuyTacGia_KichHoat DEFAULT (1),

    CONSTRAINT PK_QuyTacGia            PRIMARY KEY (MaQuyTac),
    CONSTRAINT UQ_QuyTacGia_TenQuyTac  UNIQUE (TenQuyTac),
    CONSTRAINT CK_QuyTacGia_LoaiNgay   CHECK (LoaiNgay IN ('TAT_CA','NGAY_THUONG','CUOI_TUAN')),
    CONSTRAINT CK_QuyTacGia_LoaiPhong  CHECK (LoaiPhong IS NULL OR LoaiPhong IN ('2D','3D','IMAX','4DX')),
    CONSTRAINT CK_QuyTacGia_TyLeLapDay CHECK (TyLeLapDayTu BETWEEN 0 AND 100),
    CONSTRAINT CK_QuyTacGia_HeSoGia    CHECK (HeSoGia BETWEEN 0.50 AND 3.00),
    CONSTRAINT CK_QuyTacGia_KhungGio   CHECK (GioKetThuc > GioBatDau),
    CONSTRAINT CK_QuyTacGia_HieuLuc    CHECK (NgayHetHieuLuc IS NULL OR NgayHetHieuLuc >= NgayHieuLuc)
);
GO

-- 9. HangThanhVien
CREATE TABLE dbo.HangThanhVien
(
    MaHang          TINYINT         NOT NULL, 
    TenHang         NVARCHAR(30)    NOT NULL,
    DiemToiThieu    INT             NOT NULL
                    CONSTRAINT DF_HangThanhVien_DiemToiThieu DEFAULT (0),
    TyLeGiam        DECIMAL(5,2)    NOT NULL
                    CONSTRAINT DF_HangThanhVien_TyLeGiam DEFAULT (0),

    CONSTRAINT PK_HangThanhVien              PRIMARY KEY (MaHang),
    CONSTRAINT UQ_HangThanhVien_TenHang      UNIQUE (TenHang),
    CONSTRAINT UQ_HangThanhVien_DiemToiThieu UNIQUE (DiemToiThieu),
    CONSTRAINT CK_HangThanhVien_DiemToiThieu CHECK (DiemToiThieu >= 0),
    CONSTRAINT CK_HangThanhVien_TyLeGiam     CHECK (TyLeGiam BETWEEN 0 AND 50)
);
GO

-- 10. KhachHang
CREATE TABLE dbo.KhachHang
(
    MaKhachHang  INT IDENTITY(1,1) NOT NULL,
    HoTen        NVARCHAR(100)     NOT NULL,
    Email        VARCHAR(100)      NOT NULL,
    SoDienThoai  VARCHAR(10)       NOT NULL,
    MatKhauHash  VARCHAR(255)      NOT NULL,
    NgaySinh     DATE              NULL,
    GioiTinh     NVARCHAR(4)       NULL,
    MaHang       TINYINT           NOT NULL CONSTRAINT DF_KhachHang_MaHang DEFAULT (1),
    DiemTichLuy  INT               NOT NULL CONSTRAINT DF_KhachHang_DiemTichLuy DEFAULT (0),
    NgayDangKy   DATETIME2(0)      NOT NULL CONSTRAINT DF_KhachHang_NgayDangKy DEFAULT (SYSDATETIME()),
    TrangThai    VARCHAR(10)       NOT NULL CONSTRAINT DF_KhachHang_TrangThai DEFAULT ('HOAT_DONG'),

    CONSTRAINT PK_KhachHang               PRIMARY KEY (MaKhachHang),
    CONSTRAINT FK_KhachHang_HangThanhVien FOREIGN KEY (MaHang) REFERENCES dbo.HangThanhVien (MaHang),
    CONSTRAINT UQ_KhachHang_Email         UNIQUE (Email),
    CONSTRAINT UQ_KhachHang_SoDienThoai   UNIQUE (SoDienThoai),
    CONSTRAINT CK_KhachHang_Email         CHECK (Email LIKE '%_@_%._%'),
    CONSTRAINT CK_KhachHang_SoDienThoai   CHECK (SoDienThoai LIKE '0[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
    CONSTRAINT CK_KhachHang_NgaySinh      CHECK (NgaySinh IS NULL OR NgaySinh < CAST(GETDATE() AS DATE)),
    CONSTRAINT CK_KhachHang_GioiTinh      CHECK (GioiTinh IS NULL OR GioiTinh IN (N'Nam', N'Nữ', N'Khác')),
    CONSTRAINT CK_KhachHang_DiemTichLuy   CHECK (DiemTichLuy >= 0),
    CONSTRAINT CK_KhachHang_TrangThai     CHECK (TrangThai IN ('HOAT_DONG','BI_KHOA'))
);
GO


-- 11. DonDatVe
CREATE TABLE dbo.DonDatVe
(
    MaDon           BIGINT IDENTITY(1,1) NOT NULL,
    MaDatCho        VARCHAR(12)          NOT NULL CONSTRAINT DF_DonDatVe_MaDatCho DEFAULT (UPPER(LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 10))),
    MaKhachHang     INT                  NOT NULL,
    ThoiGianTao     DATETIME2(0)         NOT NULL CONSTRAINT DF_DonDatVe_ThoiGianTao DEFAULT (SYSDATETIME()),
    ThoiGianHetHan  DATETIME2(0)         NOT NULL CONSTRAINT DF_DonDatVe_ThoiGianHetHan DEFAULT (DATEADD(MINUTE, 10, SYSDATETIME())),
    TrangThai       VARCHAR(15)          NOT NULL CONSTRAINT DF_DonDatVe_TrangThai DEFAULT ('DANG_GIU'),
    PhienBan        ROWVERSION           NOT NULL,

    CONSTRAINT PK_DonDatVe           PRIMARY KEY (MaDon),
    CONSTRAINT FK_DonDatVe_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES dbo.KhachHang (MaKhachHang),
    CONSTRAINT UQ_DonDatVe_MaDatCho  UNIQUE (MaDatCho),
    CONSTRAINT CK_DonDatVe_TrangThai CHECK (TrangThai IN ('DANG_GIU','DA_THANH_TOAN','DA_HUY','HET_HAN')),
    CONSTRAINT CK_DonDatVe_HetHan    CHECK (ThoiGianHetHan > ThoiGianTao)
);
GO

-- 12. Ve
CREATE TABLE dbo.Ve
(
    MaVe         BIGINT IDENTITY(1,1) NOT NULL,
    MaDon        BIGINT               NOT NULL,
    MaSuatChieu  INT                  NOT NULL,
    MaGhe        INT                  NOT NULL,
    MaQuyTac     INT                  NULL, 
    GiaVe        DECIMAL(12,0)        NOT NULL,
    MaVach       UNIQUEIDENTIFIER     NOT NULL CONSTRAINT DF_Ve_MaVach DEFAULT (NEWID()),

    CONSTRAINT PK_Ve               PRIMARY KEY (MaVe),
    CONSTRAINT FK_Ve_DonDatVe      FOREIGN KEY (MaDon)       REFERENCES dbo.DonDatVe (MaDon),
    CONSTRAINT FK_Ve_SuatChieu     FOREIGN KEY (MaSuatChieu) REFERENCES dbo.SuatChieu (MaSuatChieu),
    CONSTRAINT FK_Ve_Ghe           FOREIGN KEY (MaGhe)       REFERENCES dbo.Ghe (MaGhe),
    CONSTRAINT FK_Ve_QuyTacGia     FOREIGN KEY (MaQuyTac)    REFERENCES dbo.QuyTacGia (MaQuyTac),
    CONSTRAINT UQ_Ve_SuatChieu_Ghe UNIQUE (MaSuatChieu, MaGhe),
    CONSTRAINT UQ_Ve_MaVach        UNIQUE (MaVach),
    CONSTRAINT CK_Ve_GiaVe         CHECK (GiaVe >= 0)
);
GO

-- 13. ThanhToan 
CREATE TABLE dbo.ThanhToan
(
    MaThanhToan         BIGINT IDENTITY(1,1) NOT NULL,
    MaDon               BIGINT               NOT NULL,
    PhuongThuc          VARCHAR(10)          NOT NULL CONSTRAINT DF_ThanhToan_PhuongThuc DEFAULT ('VIETQR'),
    NoiDungChuyenKhoan  VARCHAR(25)          NOT NULL, 
    SoTien              DECIMAL(12,0)        NOT NULL,
    LoaiGiaoDich        VARCHAR(10)          NOT NULL CONSTRAINT DF_ThanhToan_LoaiGiaoDich DEFAULT ('THANH_TOAN'),
    TrangThai           VARCHAR(12)          NOT NULL CONSTRAINT DF_ThanhToan_TrangThai DEFAULT ('CHO_XAC_NHAN'),
    MaGiaoDichNganHang  VARCHAR(50)          NULL,   
    ThoiGianTao         DATETIME2(0)         NOT NULL CONSTRAINT DF_ThanhToan_ThoiGianTao DEFAULT (SYSDATETIME()),
    ThoiGianXacNhan     DATETIME2(0)         NULL,

    CONSTRAINT PK_ThanhToan                    PRIMARY KEY (MaThanhToan),
    CONSTRAINT FK_ThanhToan_DonDatVe           FOREIGN KEY (MaDon)REFERENCES dbo.DonDatVe (MaDon),
    CONSTRAINT UQ_ThanhToan_NoiDungChuyenKhoan UNIQUE (NoiDungChuyenKhoan),
    CONSTRAINT CK_ThanhToan_PhuongThuc         CHECK (PhuongThuc = 'VIETQR'),
    CONSTRAINT CK_ThanhToan_NoiDungChuyenKhoan CHECK (LEN(NoiDungChuyenKhoan) >= 6 AND NoiDungChuyenKhoan COLLATE Latin1_General_BIN NOT LIKE '%[^A-Z0-9]%'),
    CONSTRAINT CK_ThanhToan_SoTien             CHECK (SoTien > 0),
    CONSTRAINT CK_ThanhToan_LoaiGiaoDich       CHECK (LoaiGiaoDich IN ('THANH_TOAN','HOAN_TIEN')),
    CONSTRAINT CK_ThanhToan_TrangThai          CHECK (TrangThai IN ('CHO_XAC_NHAN','THANH_CONG','THAT_BAI')),
    CONSTRAINT CK_ThanhToan_XacNhan            CHECK (TrangThai <> 'THANH_CONG' OR (MaGiaoDichNganHang IS NOT NULL AND ThoiGianXacNhan IS NOT NULL)),
    CONSTRAINT CK_ThanhToan_ThoiGianXacNhan    CHECK (ThoiGianXacNhan IS NULL OR ThoiGianXacNhan >= ThoiGianTao)
);
GO

-- bảng log
CREATE TABLE dbo.NhatKyVe
(
    MaNhatKy       BIGINT IDENTITY(1,1) NOT NULL,
    MaVe           BIGINT               NULL,
    MaDon          BIGINT               NOT NULL,
    MaSuatChieu    INT                  NOT NULL,
    MaGhe          INT                  NOT NULL,
    GiaVe          DECIMAL(12,0)        NULL,
    HanhDong       VARCHAR(15)          NOT NULL,
    ThoiGian       DATETIME2(3)         NOT NULL CONSTRAINT DF_NhatKyVe_ThoiGian DEFAULT (SYSDATETIME()),
    NguoiThucHien  NVARCHAR(128)        NOT NULL CONSTRAINT DF_NhatKyVe_NguoiThucHien DEFAULT (SUSER_SNAME()),

    CONSTRAINT PK_NhatKyVe          PRIMARY KEY (MaNhatKy),
    CONSTRAINT CK_NhatKyVe_HanhDong CHECK (HanhDong IN ('GIU_CHO','THANH_TOAN','HUY','HET_HAN','HOAN_VE'))
);
GO



/* =====================================================================
   CHỈ MỤC HỖ TRỢ TRUY VẤN (không phải ràng buộc)
   ===================================================================== */
CREATE NONCLUSTERED INDEX IX_PhimTheLoai_MaTheLoai    ON dbo.PhimTheLoai (MaTheLoai);   -- tra phim theo thể loại
CREATE NONCLUSTERED INDEX IX_Ghe_MaLoaiGhe            ON dbo.Ghe (MaLoaiGhe);
CREATE NONCLUSTERED INDEX IX_SuatChieu_MaPhim         ON dbo.SuatChieu (MaPhim);
CREATE NONCLUSTERED INDEX IX_SuatChieu_Phong_ThoiGian ON dbo.SuatChieu (MaPhong, ThoiGianBatDau, ThoiGianKetThuc);
CREATE NONCLUSTERED INDEX IX_KhachHang_MaHang         ON dbo.KhachHang (MaHang);
CREATE NONCLUSTERED INDEX IX_DonDatVe_MaKhachHang     ON dbo.DonDatVe (MaKhachHang);
CREATE NONCLUSTERED INDEX IX_DonDatVe_DangGiu_HetHan  ON dbo.DonDatVe (ThoiGianHetHan)
    WHERE TrangThai = 'DANG_GIU';                     -- phục vụ job giải phóng ghế hết hạn
CREATE NONCLUSTERED INDEX IX_Ve_MaDon                 ON dbo.Ve (MaDon);
CREATE NONCLUSTERED INDEX IX_Ve_MaGhe                 ON dbo.Ve (MaGhe);
CREATE NONCLUSTERED INDEX IX_Ve_MaQuyTac              ON dbo.Ve (MaQuyTac);
CREATE NONCLUSTERED INDEX IX_ThanhToan_MaDon          ON dbo.ThanhToan (MaDon);
CREATE UNIQUE NONCLUSTERED INDEX UX_ThanhToan_MaGiaoDichNganHang
    ON dbo.ThanhToan (MaGiaoDichNganHang)
    WHERE MaGiaoDichNganHang IS NOT NULL;             -- chống ghi nhận trùng 1 giao dịch ngân hàng
                                                      -- (UNIQUE constraint chỉ cho 1 NULL nên dùng filtered index)
CREATE NONCLUSTERED INDEX IX_NhatKyVe_MaDon           ON dbo.NhatKyVe (MaDon);
GO