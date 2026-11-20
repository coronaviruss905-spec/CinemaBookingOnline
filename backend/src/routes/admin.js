import express from 'express';
import { getPool, sql, toNumber } from '../db.js';
import { sendSqlError } from '../utils/sqlError.js';

const router = express.Router();

router.get('/revenue', async (_req, res) => {
  try {
    const pool = await getPool();
    const revRes = await pool.request().query(`
      SELECT
          MaPhim,
          TenPhim,
          UrlPoster,
          CONVERT(VARCHAR(10), NgayKhoiChieu, 23) AS NgayKhoiChieu,
          DanhSachTheLoai,
          TrangThaiPhim,
          SoSuatChieu,
          SoVeDaBan,
          TongDoanhThu
      FROM dbo.vw_DoanhThuTheoPhim
      ORDER BY TongDoanhThu DESC, MaPhim ASC;
    `);

    const kpiRes = await pool.request().query(`
      SELECT
          (SELECT COUNT(*) FROM dbo.PhongChieu WHERE TrangThai = 'HOAT_DONG') AS PhongHoatDong,
          (SELECT COUNT(*) FROM dbo.KhachHang WHERE TrangThai = 'HOAT_DONG')  AS KhachHoatDong,
          (SELECT COUNT(*) FROM dbo.DonDatVe WHERE TrangThai = 'DANG_GIU' AND ThoiGianHetHan > SYSDATETIME()) AS DonDangGiu,
          (SELECT COUNT(*) FROM dbo.DonDatVe WHERE TrangThai = 'DA_THANH_TOAN') AS DonDaThanhToan;
    `);

    const movies = revRes.recordset.map((r) => ({
      MaPhim: toNumber(r.MaPhim),
      TenPhim: r.TenPhim,
      UrlPoster: r.UrlPoster,
      NgayKhoiChieu: r.NgayKhoiChieu,
      DanhSachTheLoai: r.DanhSachTheLoai,
      TrangThaiPhim: r.TrangThaiPhim,
      SoSuatChieu: toNumber(r.SoSuatChieu),
      SoVeDaBan: toNumber(r.SoVeDaBan),
      TongDoanhThu: toNumber(r.TongDoanhThu),
    }));

    const totals = movies.reduce(
      (acc, m) => {
        acc.totalRevenue += m.TongDoanhThu;
        acc.totalTickets += m.SoVeDaBan;
        acc.totalShowtimes += m.SoSuatChieu;
        return acc;
      },
      { totalRevenue: 0, totalTickets: 0, totalShowtimes: 0 }
    );

    const kpi = kpiRes.recordset[0] || {};
    return res.json({
      movies,
      summary: {
        ...totals,
        activeRooms: toNumber(kpi.PhongHoatDong),
        activeCustomers: toNumber(kpi.KhachHoatDong),
        holdingOrders: toNumber(kpi.DonDangGiu),
        paidOrders: toNumber(kpi.DonDaThanhToan),
      },
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/rooms', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
          p.MaPhong,
          p.TenPhong,
          p.LoaiPhong,
          p.TrangThai,
          COUNT(CASE WHEN g.TrangThai = 'HOAT_DONG' THEN 1 END) AS SoGheHoatDong,
          COUNT(g.MaGhe) AS TongSoGhe
      FROM dbo.PhongChieu p
      LEFT JOIN dbo.Ghe g ON g.MaPhong = p.MaPhong
      GROUP BY p.MaPhong, p.TenPhong, p.LoaiPhong, p.TrangThai
      ORDER BY p.MaPhong ASC;
    `);

    return res.json({
      rooms: result.recordset.map((r) => ({
        MaPhong: toNumber(r.MaPhong),
        TenPhong: r.TenPhong,
        LoaiPhong: r.LoaiPhong,
        TrangThai: r.TrangThai,
        SoGheHoatDong: toNumber(r.SoGheHoatDong),
        TongSoGhe: toNumber(r.TongSoGhe),
      })),
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/pricing-rules', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
          MaQuyTac,
          TenQuyTac,
          LoaiNgay,
          CONVERT(VARCHAR(8), GioBatDau, 108)  AS GioBatDau,
          CONVERT(VARCHAR(8), GioKetThuc, 108) AS GioKetThuc,
          LoaiPhong,
          TyLeLapDayTu,
          HeSoGia,
          DoUuTien,
          CONVERT(VARCHAR(10), NgayHieuLuc, 23)    AS NgayHieuLuc,
          CONVERT(VARCHAR(10), NgayHetHieuLuc, 23) AS NgayHetHieuLuc,
          KichHoat
      FROM dbo.QuyTacGia
      ORDER BY DoUuTien DESC, MaQuyTac ASC;
    `);

    return res.json({
      rules: result.recordset.map((q) => ({
        MaQuyTac: toNumber(q.MaQuyTac),
        TenQuyTac: q.TenQuyTac,
        LoaiNgay: q.LoaiNgay,
        GioBatDau: q.GioBatDau,
        GioKetThuc: q.GioKetThuc,
        LoaiPhong: q.LoaiPhong,
        TyLeLapDayTu: toNumber(q.TyLeLapDayTu),
        HeSoGia: toNumber(q.HeSoGia),
        DoUuTien: toNumber(q.DoUuTien),
        NgayHieuLuc: q.NgayHieuLuc,
        NgayHetHieuLuc: q.NgayHetHieuLuc,
        KichHoat: Boolean(q.KichHoat),
      })),
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/showtimes', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
          MaSuatChieu,
          MaPhim,
          TenPhim,
          UrlPoster,
          ThoiLuong,
          PhanLoai,
          DanhSachTheLoai,
          MaPhong,
          TenPhong,
          LoaiPhong,
          CONVERT(VARCHAR(10), ThoiGianBatDau, 23)  AS NgayChieu,
          CONVERT(VARCHAR(19), ThoiGianBatDau, 126) AS ThoiGianBatDau,
          CONVERT(VARCHAR(19), ThoiGianKetThuc, 126) AS ThoiGianKetThuc,
          GiaCoBan,
          TrangThai,
          TongSoGhe,
          SoGheTrong
      FROM dbo.vw_LichChieuChiTiet
      ORDER BY ThoiGianBatDau DESC, MaPhong ASC;
    `);

    return res.json({
      showtimes: result.recordset.map((sc) => ({
        MaSuatChieu: toNumber(sc.MaSuatChieu),
        MaPhim: toNumber(sc.MaPhim),
        TenPhim: sc.TenPhim,
        UrlPoster: sc.UrlPoster,
        ThoiLuong: toNumber(sc.ThoiLuong),
        PhanLoai: sc.PhanLoai,
        DanhSachTheLoai: sc.DanhSachTheLoai,
        MaPhong: toNumber(sc.MaPhong),
        TenPhong: sc.TenPhong,
        LoaiPhong: sc.LoaiPhong,
        NgayChieu: sc.NgayChieu,
        ThoiGianBatDau: sc.ThoiGianBatDau,
        ThoiGianKetThuc: sc.ThoiGianKetThuc,
        GiaCoBan: toNumber(sc.GiaCoBan),
        TrangThai: sc.TrangThai,
        TongSoGhe: toNumber(sc.TongSoGhe),
        SoGheTrong: toNumber(sc.SoGheTrong),
      })),
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/showtimes/:id/seat-view', async (req, res) => {
  try {
    const maSuatChieu = Number(req.params.id);
    if (!Number.isInteger(maSuatChieu) || maSuatChieu <= 0) {
      return res.status(400).json({ error: 'Mã suất chiếu không hợp lệ.' });
    }

    const pool = await getPool();
    const scRes = await pool
      .request()
      .input('MaSuatChieu', sql.Int, maSuatChieu)
      .query(`
        SELECT
            MaSuatChieu,
            MaPhim,
            TenPhim,
            TenPhong,
            LoaiPhong,
            CONVERT(VARCHAR(19), ThoiGianBatDau, 126) AS ThoiGianBatDau,
            CONVERT(VARCHAR(19), ThoiGianKetThuc, 126) AS ThoiGianKetThuc,
            GiaCoBan,
            TrangThai,
            TongSoGhe,
            SoGheTrong
        FROM dbo.vw_LichChieuChiTiet
        WHERE MaSuatChieu = @MaSuatChieu;
      `);

    const sc = scRes.recordset[0];
    if (!sc) {
      return res.status(404).json({ error: 'Không tìm thấy suất chiếu.' });
    }

    const seatRes = await pool
      .request()
      .input('MaSuatChieu', sql.Int, maSuatChieu)
      .query(`
        SELECT
            MaSuatChieu,
            MaGhe,
            HangGhe,
            SoGhe,
            TenLoaiGhe,
            HeSoGia,
            GiaGhe,
            TrangThaiGhe
        FROM dbo.vw_SoDoGheSuatChieu
        WHERE MaSuatChieu = @MaSuatChieu
        ORDER BY HangGhe ASC, SoGhe ASC;
      `);

    const seats = seatRes.recordset.map((s) => ({
      MaSuatChieu: toNumber(s.MaSuatChieu),
      MaGhe: toNumber(s.MaGhe),
      HangGhe: s.HangGhe,
      SoGhe: toNumber(s.SoGhe),
      ViTri: `${s.HangGhe}${s.SoGhe}`,
      TenLoaiGhe: s.TenLoaiGhe,
      HeSoGia: toNumber(s.HeSoGia),
      GiaGhe: toNumber(s.GiaGhe),
      TrangThaiGhe: s.TrangThaiGhe,
    }));

    const counts = seats.reduce(
      (acc, s) => {
        acc[s.TrangThaiGhe] = (acc[s.TrangThaiGhe] || 0) + 1;
        return acc;
      },
      { TRONG: 0, DANG_GIU: 0, DA_BAN: 0, HONG: 0 }
    );

    return res.json({
      showtime: {
        MaSuatChieu: toNumber(sc.MaSuatChieu),
        MaPhim: toNumber(sc.MaPhim),
        TenPhim: sc.TenPhim,
        TenPhong: sc.TenPhong,
        LoaiPhong: sc.LoaiPhong,
        ThoiGianBatDau: sc.ThoiGianBatDau,
        ThoiGianKetThuc: sc.ThoiGianKetThuc,
        GiaCoBan: toNumber(sc.GiaCoBan),
        TrangThai: sc.TrangThai,
        TongSoGhe: toNumber(sc.TongSoGhe),
        SoGheTrong: toNumber(sc.SoGheTrong),
      },
      counts,
      seats,
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.post('/showtimes', async (req, res) => {
  try {
    const maPhim = Number(req.body?.maPhim);
    const maPhong = Number(req.body?.maPhong);
    const rawStart = String(req.body?.thoiGianBatDau || '').trim();
    const giaCoBan = req.body?.giaCoBan !== undefined ? Number(req.body.giaCoBan) : 75000;
    const phutDonPhong =
      req.body?.phutDonPhong !== undefined ? Number(req.body.phutDonPhong) : 15;

    if (!Number.isInteger(maPhim) || maPhim <= 0) {
      return res.status(400).json({ error: 'Vui lòng chọn phim hợp lệ.' });
    }
    if (!Number.isInteger(maPhong) || maPhong <= 0) {
      return res.status(400).json({ error: 'Vui lòng chọn phòng chiếu hợp lệ.' });
    }
    if (!rawStart) {
      return res.status(400).json({ error: 'Vui lòng chọn thời gian bắt đầu.' });
    }
    if (!Number.isFinite(giaCoBan) || giaCoBan <= 0) {
      return res.status(400).json({ error: 'Giá cơ bản phải lớn hơn 0.' });
    }
    if (!Number.isInteger(phutDonPhong) || phutDonPhong < 0 || phutDonPhong > 120) {
      return res.status(400).json({ error: 'Thời gian dọn phòng không hợp lệ (0-120 phút).' });
    }

    // Normalize 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD HH:mm:ss' to 'YYYY-MM-DD HH:mm:ss'
    let normalized = rawStart.replace('T', ' ');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
      normalized += ':00';
    }
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
      return res.status(400).json({ error: 'Định dạng thời gian không hợp lệ (YYYY-MM-DDTHH:mm).' });
    }

    const pool = await getPool();

    // Call sp_LapLichChieu directly — NEVER wrap in a Node.js transaction
    const spResult = await pool
      .request()
      .input('MaPhim', sql.Int, maPhim)
      .input('MaPhong', sql.Int, maPhong)
      .input('ThoiGianBatDauStr', sql.VarChar(19), normalized)
      .input('GiaCoBan', sql.Decimal(12, 0), giaCoBan)
      .input('PhutDonPhong', sql.TinyInt, phutDonPhong)
      .query(`
        DECLARE @MaSuatChieu INT;
        DECLARE @BatDau DATETIME2(0) = CONVERT(DATETIME2(0), @ThoiGianBatDauStr, 120);
        EXEC dbo.sp_LapLichChieu
            @MaPhim         = @MaPhim,
            @MaPhong        = @MaPhong,
            @ThoiGianBatDau = @BatDau,
            @GiaCoBan       = @GiaCoBan,
            @PhutDonPhong   = @PhutDonPhong,
            @MaSuatChieu    = @MaSuatChieu OUTPUT;
        SELECT @MaSuatChieu AS MaSuatChieu;
      `);

    const out =
      spResult.recordsets
        ?.flat()
        ?.find((r) => r && r.MaSuatChieu !== undefined && r.MaSuatChieu !== null) ||
      spResult.recordset?.[0];
    const maSuatChieu = toNumber(out?.MaSuatChieu);
    const createdRes = await pool
      .request()
      .input('MaSuatChieu', sql.Int, maSuatChieu)
      .query(`
        SELECT
            MaSuatChieu,
            MaPhim,
            TenPhim,
            UrlPoster,
            ThoiLuong,
            PhanLoai,
            DanhSachTheLoai,
            MaPhong,
            TenPhong,
            LoaiPhong,
            CONVERT(VARCHAR(10), ThoiGianBatDau, 23)  AS NgayChieu,
            CONVERT(VARCHAR(19), ThoiGianBatDau, 126) AS ThoiGianBatDau,
            CONVERT(VARCHAR(19), ThoiGianKetThuc, 126) AS ThoiGianKetThuc,
            GiaCoBan,
            TrangThai,
            TongSoGhe,
            SoGheTrong
        FROM dbo.vw_LichChieuChiTiet
        WHERE MaSuatChieu = @MaSuatChieu;
      `);

    const sc = createdRes.recordset[0];
    return res.status(201).json({
      showtime: sc
        ? {
            MaSuatChieu: toNumber(sc.MaSuatChieu),
            MaPhim: toNumber(sc.MaPhim),
            TenPhim: sc.TenPhim,
            UrlPoster: sc.UrlPoster,
            ThoiLuong: toNumber(sc.ThoiLuong),
            PhanLoai: sc.PhanLoai,
            DanhSachTheLoai: sc.DanhSachTheLoai,
            MaPhong: toNumber(sc.MaPhong),
            TenPhong: sc.TenPhong,
            LoaiPhong: sc.LoaiPhong,
            NgayChieu: sc.NgayChieu,
            ThoiGianBatDau: sc.ThoiGianBatDau,
            ThoiGianKetThuc: sc.ThoiGianKetThuc,
            GiaCoBan: toNumber(sc.GiaCoBan),
            TrangThai: sc.TrangThai,
            TongSoGhe: toNumber(sc.TongSoGhe),
            SoGheTrong: toNumber(sc.SoGheTrong),
          }
        : { MaSuatChieu: maSuatChieu },
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/logs', async (req, res) => {
  try {
    const hanhDong = req.query.hanhDong ? String(req.query.hanhDong).trim().toUpperCase() : null;
    const pool = await getPool();
    const result = await pool
      .request()
      .input('HanhDong', sql.VarChar(15), hanhDong || null)
      .query(`
        SELECT TOP (100)
            nk.MaNhatKy,
            nk.MaVe,
            nk.MaDon,
            d.MaDatCho,
            kh.HoTen,
            nk.MaSuatChieu,
            p.TenPhim,
            pc.TenPhong,
            nk.MaGhe,
            g.HangGhe + CAST(g.SoGhe AS VARCHAR(2)) AS ViTriGhe,
            nk.GiaVe,
            nk.HanhDong,
            CONVERT(VARCHAR(23), nk.ThoiGian, 126) AS ThoiGian,
            nk.NguoiThucHien
        FROM dbo.NhatKyVe nk
        LEFT JOIN dbo.DonDatVe d    ON d.MaDon = nk.MaDon
        LEFT JOIN dbo.KhachHang kh  ON kh.MaKhachHang = d.MaKhachHang
        LEFT JOIN dbo.SuatChieu sc  ON sc.MaSuatChieu = nk.MaSuatChieu
        LEFT JOIN dbo.Phim p        ON p.MaPhim = sc.MaPhim
        LEFT JOIN dbo.PhongChieu pc ON pc.MaPhong = sc.MaPhong
        LEFT JOIN dbo.Ghe g         ON g.MaGhe = nk.MaGhe
        WHERE (@HanhDong IS NULL OR nk.HanhDong = @HanhDong)
        ORDER BY nk.MaNhatKy DESC;
      `);

    return res.json({
      logs: result.recordset.map((l) => ({
        MaNhatKy: toNumber(l.MaNhatKy),
        MaVe: l.MaVe !== null ? toNumber(l.MaVe) : null,
        MaDon: toNumber(l.MaDon),
        MaDatCho: l.MaDatCho,
        HoTen: l.HoTen,
        MaSuatChieu: toNumber(l.MaSuatChieu),
        TenPhim: l.TenPhim,
        TenPhong: l.TenPhong,
        MaGhe: toNumber(l.MaGhe),
        ViTriGhe: l.ViTriGhe,
        GiaVe: l.GiaVe !== null ? toNumber(l.GiaVe) : null,
        HanhDong: l.HanhDong,
        ThoiGian: l.ThoiGian,
        NguoiThucHien: l.NguoiThucHien,
      })),
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

export default router;
