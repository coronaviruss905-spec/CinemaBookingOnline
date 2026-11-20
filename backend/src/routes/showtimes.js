import express from 'express';
import { getPool, sql, toNumber } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { sendSqlError } from '../utils/sqlError.js';

const router = express.Router();

function mapShowtime(sc) {
  return {
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
  };
}

router.get('/', async (req, res) => {
  try {
    const movieId = req.query.movieId ? Number(req.query.movieId) : null;
    const date = req.query.date ? String(req.query.date).trim() : null;
    const roomType = req.query.roomType ? String(req.query.roomType).trim() : null;
    const includeCanceled = String(req.query.includeCanceled || 'false').toLowerCase() === 'true';

    const pool = await getPool();
    const request = pool.request();
    request.input('MovieId', sql.Int, Number.isInteger(movieId) && movieId > 0 ? movieId : null);
    request.input('DateStr', sql.VarChar(10), date || null);
    request.input('RoomType', sql.VarChar(10), roomType || null);
    request.input('IncludeCanceled', sql.Bit, includeCanceled ? 1 : 0);

    const result = await request.query(`
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
      WHERE (@MovieId IS NULL OR MaPhim = @MovieId)
        AND (@DateStr IS NULL OR CONVERT(VARCHAR(10), ThoiGianBatDau, 23) = @DateStr)
        AND (@RoomType IS NULL OR LoaiPhong = @RoomType)
        AND (@IncludeCanceled = 1 OR TrangThai <> 'DA_HUY')
      ORDER BY ThoiGianBatDau ASC, MaPhong ASC;
    `);

    const datesResult = await pool.request().query(`
      SELECT DISTINCT CONVERT(VARCHAR(10), ThoiGianBatDau, 23) AS NgayChieu
      FROM dbo.vw_LichChieuChiTiet
      WHERE TrangThai <> 'DA_HUY'
      ORDER BY NgayChieu ASC;
    `);

    const todayResult = await pool.request().query(`
      SELECT CONVERT(VARCHAR(10), CAST(SYSDATETIME() AS DATE), 23) AS Today;
    `);

    return res.json({
      showtimes: result.recordset.map(mapShowtime),
      availableDates: datesResult.recordset.map((d) => d.NgayChieu),
      today: todayResult.recordset[0]?.Today || null,
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const maSuatChieu = Number(req.params.id);
    if (!Number.isInteger(maSuatChieu) || maSuatChieu <= 0) {
      return res.status(400).json({ error: 'Mã suất chiếu không hợp lệ.' });
    }

    const pool = await getPool();
    const result = await pool
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

    const row = result.recordset[0];
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy suất chiếu.' });
    }

    return res.json({ showtime: mapShowtime(row) });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/:id/seats', optionalAuth, async (req, res) => {
  try {
    const maSuatChieu = Number(req.params.id);
    if (!Number.isInteger(maSuatChieu) || maSuatChieu <= 0) {
      return res.status(400).json({ error: 'Mã suất chiếu không hợp lệ.' });
    }

    const maKhachHang = req.user?.maKhachHang ?? null;
    const pool = await getPool();

    const scResult = await pool
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

    const showtimeRow = scResult.recordset[0];
    if (!showtimeRow) {
      return res.status(404).json({ error: 'Không tìm thấy suất chiếu.' });
    }

    const seatResult = await pool
      .request()
      .input('MaSuatChieu', sql.Int, maSuatChieu)
      .input('MaKhachHang', sql.Int, maKhachHang)
      .query(`
        SELECT
            MaGhe,
            HangGhe,
            SoGhe,
            ViTri,
            TenLoaiGhe,
            HeSoLoaiGhe,
            TrangThaiGhe,
            GiaCoBan,
            MaQuyTac,
            TenQuyTac,
            HeSoQuyTac,
            TyLeGiam,
            GiaVe
        FROM dbo.fn_SoDoGheSuatChieu(@MaSuatChieu, @MaKhachHang)
        ORDER BY HangGhe ASC, SoGhe ASC;
      `);

    let customerTier = null;
    if (maKhachHang) {
      const tierRes = await pool
        .request()
        .input('MaKhachHang', sql.Int, maKhachHang)
        .query(`
          SELECT kh.MaKhachHang, kh.HoTen, kh.DiemTichLuy, ht.MaHang, ht.TenHang, ht.TyLeGiam
          FROM dbo.KhachHang kh
          JOIN dbo.HangThanhVien ht ON ht.MaHang = kh.MaHang
          WHERE kh.MaKhachHang = @MaKhachHang;
        `);
      const t = tierRes.recordset[0];
      if (t) {
        customerTier = {
          MaKhachHang: toNumber(t.MaKhachHang),
          HoTen: t.HoTen,
          DiemTichLuy: toNumber(t.DiemTichLuy),
          MaHang: toNumber(t.MaHang),
          TenHang: t.TenHang,
          TyLeGiam: toNumber(t.TyLeGiam),
        };
      }
    }

    const seats = seatResult.recordset.map((s) => ({
      MaGhe: toNumber(s.MaGhe),
      HangGhe: s.HangGhe,
      SoGhe: toNumber(s.SoGhe),
      ViTri: s.ViTri,
      TenLoaiGhe: s.TenLoaiGhe,
      HeSoLoaiGhe: toNumber(s.HeSoLoaiGhe),
      TrangThaiGhe: s.TrangThaiGhe,
      GiaCoBan: toNumber(s.GiaCoBan),
      MaQuyTac: s.MaQuyTac !== null ? toNumber(s.MaQuyTac) : null,
      TenQuyTac: s.TenQuyTac,
      HeSoQuyTac: toNumber(s.HeSoQuyTac, 1),
      TyLeGiam: toNumber(s.TyLeGiam),
      GiaVe: toNumber(s.GiaVe),
    }));

    return res.json({
      showtime: mapShowtime(showtimeRow),
      seats,
      customerTier,
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

export default router;
