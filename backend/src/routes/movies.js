import express from 'express';
import { getPool, sql, toNumber } from '../db.js';
import { sendSqlError } from '../utils/sqlError.js';

const router = express.Router();

router.get('/genres', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT MaTheLoai, TenTheLoai, MoTa
      FROM dbo.TheLoai
      ORDER BY TenTheLoai ASC;
    `);
    return res.json({
      genres: result.recordset.map((g) => ({
        MaTheLoai: toNumber(g.MaTheLoai),
        TenTheLoai: g.TenTheLoai,
        MoTa: g.MoTa,
      })),
    });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/movies', async (req, res) => {
  try {
    const genreId = req.query.genreId ? Number(req.query.genreId) : null;
    const search = req.query.search ? String(req.query.search).trim() : '';

    const pool = await getPool();
    const request = pool.request();
    request.input('GenreId', sql.Int, Number.isInteger(genreId) && genreId > 0 ? genreId : null);
    request.input('Search', sql.NVarChar(200), search ? `%${search}%` : null);

    const result = await request.query(`
      SELECT
          v.MaPhim,
          v.TenPhim,
          v.UrlPoster,
          CONVERT(VARCHAR(10), v.NgayKhoiChieu, 23) AS NgayKhoiChieu,
          CONVERT(VARCHAR(10), p.NgayKetThuc, 23)   AS NgayKetThuc,
          v.DanhSachTheLoai,
          v.TrangThaiPhim,
          v.SoSuatChieu,
          v.SoVeDaBan,
          v.TongDoanhThu,
          p.ThoiLuong,
          p.PhanLoai,
          p.DaoDien,
          p.QuocGia,
          p.MoTa
      FROM dbo.vw_DoanhThuTheoPhim v
      JOIN dbo.Phim p ON p.MaPhim = v.MaPhim
      WHERE (@GenreId IS NULL OR EXISTS (
          SELECT 1 FROM dbo.PhimTheLoai pt
          WHERE pt.MaPhim = v.MaPhim AND pt.MaTheLoai = @GenreId
      ))
      AND (@Search IS NULL OR p.TenPhim LIKE @Search OR p.DaoDien LIKE @Search)
      ORDER BY
          CASE v.TrangThaiPhim
              WHEN 'DANG_CHIEU' THEN 1
              WHEN 'SAP_CHIEU'  THEN 2
              ELSE 3
          END,
          v.MaPhim ASC;
    `);

    const movies = result.recordset.map((m) => ({
      MaPhim: toNumber(m.MaPhim),
      TenPhim: m.TenPhim,
      UrlPoster: m.UrlPoster,
      NgayKhoiChieu: m.NgayKhoiChieu,
      NgayKetThuc: m.NgayKetThuc,
      DanhSachTheLoai: m.DanhSachTheLoai,
      TrangThaiPhim: m.TrangThaiPhim,
      SoSuatChieu: toNumber(m.SoSuatChieu),
      SoVeDaBan: toNumber(m.SoVeDaBan),
      TongDoanhThu: toNumber(m.TongDoanhThu),
      ThoiLuong: toNumber(m.ThoiLuong),
      PhanLoai: m.PhanLoai,
      DaoDien: m.DaoDien,
      QuocGia: m.QuocGia,
      MoTa: m.MoTa,
    }));

    return res.json({ movies });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/movies/:id', async (req, res) => {
  try {
    const maPhim = Number(req.params.id);
    if (!Number.isInteger(maPhim) || maPhim <= 0) {
      return res.status(400).json({ error: 'Mã phim không hợp lệ.' });
    }

    const pool = await getPool();
    const movieResult = await pool
      .request()
      .input('MaPhim', sql.Int, maPhim)
      .query(`
        SELECT
            v.MaPhim,
            v.TenPhim,
            v.UrlPoster,
            CONVERT(VARCHAR(10), v.NgayKhoiChieu, 23) AS NgayKhoiChieu,
            CONVERT(VARCHAR(10), p.NgayKetThuc, 23)   AS NgayKetThuc,
            v.DanhSachTheLoai,
            v.TrangThaiPhim,
            v.SoSuatChieu,
            v.SoVeDaBan,
            v.TongDoanhThu,
            p.ThoiLuong,
            p.PhanLoai,
            p.DaoDien,
            p.QuocGia,
            p.MoTa
        FROM dbo.vw_DoanhThuTheoPhim v
        JOIN dbo.Phim p ON p.MaPhim = v.MaPhim
        WHERE v.MaPhim = @MaPhim;
      `);

    const m = movieResult.recordset[0];
    if (!m) {
      return res.status(404).json({ error: 'Không tìm thấy phim.' });
    }

    const showtimesResult = await pool
      .request()
      .input('MaPhim', sql.Int, maPhim)
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
        WHERE MaPhim = @MaPhim
        ORDER BY ThoiGianBatDau ASC, MaPhong ASC;
      `);

    const movie = {
      MaPhim: toNumber(m.MaPhim),
      TenPhim: m.TenPhim,
      UrlPoster: m.UrlPoster,
      NgayKhoiChieu: m.NgayKhoiChieu,
      NgayKetThuc: m.NgayKetThuc,
      DanhSachTheLoai: m.DanhSachTheLoai,
      TrangThaiPhim: m.TrangThaiPhim,
      SoSuatChieu: toNumber(m.SoSuatChieu),
      SoVeDaBan: toNumber(m.SoVeDaBan),
      TongDoanhThu: toNumber(m.TongDoanhThu),
      ThoiLuong: toNumber(m.ThoiLuong),
      PhanLoai: m.PhanLoai,
      DaoDien: m.DaoDien,
      QuocGia: m.QuocGia,
      MoTa: m.MoTa,
    };

    const showtimes = showtimesResult.recordset.map((sc) => ({
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
    }));

    return res.json({ movie, showtimes });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

export default router;
