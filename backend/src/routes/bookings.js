import express from 'express';
import { getPool, sql, toNumber } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSqlError } from '../utils/sqlError.js';

const router = express.Router();

export async function getBookingDetail(pool, maDon) {
  const headerResult = await pool
    .request()
    .input('MaDon', sql.BigInt, maDon)
    .query(`
      SELECT
          d.MaDon,
          d.MaDatCho,
          d.MaKhachHang,
          kh.HoTen,
          kh.Email,
          kh.SoDienThoai,
          ht.TenHang,
          ht.TyLeGiam,
          CONVERT(VARCHAR(19), d.ThoiGianTao, 126)    AS ThoiGianTao,
          CONVERT(VARCHAR(19), d.ThoiGianHetHan, 126) AS ThoiGianHetHan,
          DATEDIFF(SECOND, SYSDATETIME(), d.ThoiGianHetHan) AS SoGiayConLai,
          d.TrangThai,
          dbo.fn_TongTienDon(d.MaDon) AS TongTien
      FROM dbo.DonDatVe d
      JOIN dbo.KhachHang kh     ON kh.MaKhachHang = d.MaKhachHang
      JOIN dbo.HangThanhVien ht ON ht.MaHang = kh.MaHang
      WHERE d.MaDon = @MaDon;
    `);

  const h = headerResult.recordset[0];
  if (!h) return null;

  const activeTicketsRes = await pool
    .request()
    .input('MaDon', sql.BigInt, maDon)
    .query(`
      SELECT
          v.MaVe,
          v.MaSuatChieu,
          v.MaGhe,
          g.HangGhe,
          g.SoGhe,
          g.HangGhe + CAST(g.SoGhe AS VARCHAR(2)) AS ViTri,
          lg.TenLoaiGhe,
          v.MaQuyTac,
          qt.TenQuyTac,
          v.GiaVe,
          CONVERT(VARCHAR(36), v.MaVach) AS MaVach
      FROM dbo.Ve v
      JOIN dbo.Ghe g        ON g.MaGhe = v.MaGhe
      JOIN dbo.LoaiGhe lg   ON lg.MaLoaiGhe = g.MaLoaiGhe
      LEFT JOIN dbo.QuyTacGia qt ON qt.MaQuyTac = v.MaQuyTac
      WHERE v.MaDon = @MaDon
      ORDER BY g.HangGhe ASC, g.SoGhe ASC;
    `);

  let tickets = activeTicketsRes.recordset.map((t) => ({
    MaVe: toNumber(t.MaVe),
    MaSuatChieu: toNumber(t.MaSuatChieu),
    MaGhe: toNumber(t.MaGhe),
    HangGhe: t.HangGhe,
    SoGhe: toNumber(t.SoGhe),
    ViTri: t.ViTri,
    TenLoaiGhe: t.TenLoaiGhe,
    MaQuyTac: t.MaQuyTac !== null ? toNumber(t.MaQuyTac) : null,
    TenQuyTac: t.TenQuyTac,
    GiaVe: toNumber(t.GiaVe),
    MaVach: t.MaVach,
    isSnapshot: false,
  }));

  if (tickets.length === 0) {
    const logTicketsRes = await pool
      .request()
      .input('MaDon', sql.BigInt, maDon)
      .query(`
        SELECT
            nk.MaSuatChieu,
            nk.MaGhe,
            g.HangGhe,
            g.SoGhe,
            g.HangGhe + CAST(g.SoGhe AS VARCHAR(2)) AS ViTri,
            lg.TenLoaiGhe,
            nk.GiaVe
        FROM dbo.NhatKyVe nk
        JOIN dbo.Ghe g      ON g.MaGhe = nk.MaGhe
        JOIN dbo.LoaiGhe lg ON lg.MaLoaiGhe = g.MaLoaiGhe
        WHERE nk.MaDon = @MaDon AND nk.HanhDong = 'GIU_CHO'
        ORDER BY g.HangGhe ASC, g.SoGhe ASC;
      `);

    tickets = logTicketsRes.recordset.map((t) => ({
      MaVe: null,
      MaSuatChieu: toNumber(t.MaSuatChieu),
      MaGhe: toNumber(t.MaGhe),
      HangGhe: t.HangGhe,
      SoGhe: toNumber(t.SoGhe),
      ViTri: t.ViTri,
      TenLoaiGhe: t.TenLoaiGhe,
      MaQuyTac: null,
      TenQuyTac: null,
      GiaVe: toNumber(t.GiaVe),
      MaVach: null,
      isSnapshot: true,
    }));
  }

  let showtime = null;
  const maSuatChieu = tickets[0]?.MaSuatChieu;
  if (maSuatChieu) {
    const scRes = await pool
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
    const sc = scRes.recordset[0];
    if (sc) {
      showtime = {
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
  }

  const payRes = await pool
    .request()
    .input('MaDon', sql.BigInt, maDon)
    .query(`
      SELECT
          MaThanhToan,
          MaDon,
          PhuongThuc,
          NoiDungChuyenKhoan,
          SoTien,
          LoaiGiaoDich,
          TrangThai,
          MaGiaoDichNganHang,
          CONVERT(VARCHAR(19), ThoiGianTao, 126)     AS ThoiGianTao,
          CONVERT(VARCHAR(19), ThoiGianXacNhan, 126) AS ThoiGianXacNhan
      FROM dbo.ThanhToan
      WHERE MaDon = @MaDon
      ORDER BY ThoiGianTao ASC, MaThanhToan ASC;
    `);

  const payments = payRes.recordset.map((p) => ({
    MaThanhToan: toNumber(p.MaThanhToan),
    MaDon: toNumber(p.MaDon),
    PhuongThuc: p.PhuongThuc,
    NoiDungChuyenKhoan: p.NoiDungChuyenKhoan,
    SoTien: toNumber(p.SoTien),
    LoaiGiaoDich: p.LoaiGiaoDich,
    TrangThai: p.TrangThai,
    MaGiaoDichNganHang: p.MaGiaoDichNganHang,
    ThoiGianTao: p.ThoiGianTao,
    ThoiGianXacNhan: p.ThoiGianXacNhan,
  }));

  const primaryPayment =
    payments.find((p) => p.LoaiGiaoDich === 'THANH_TOAN') || payments[0] || null;

  return {
    MaDon: toNumber(h.MaDon),
    MaDatCho: h.MaDatCho,
    MaKhachHang: toNumber(h.MaKhachHang),
    HoTen: h.HoTen,
    Email: h.Email,
    SoDienThoai: h.SoDienThoai,
    TenHang: h.TenHang,
    TyLeGiam: toNumber(h.TyLeGiam),
    ThoiGianTao: h.ThoiGianTao,
    ThoiGianHetHan: h.ThoiGianHetHan,
    SoGiayConLai: Math.max(0, toNumber(h.SoGiayConLai)),
    TrangThai: h.TrangThai,
    TongTien: toNumber(h.TongTien),
    NoiDungChuyenKhoan: primaryPayment?.NoiDungChuyenKhoan || null,
    showtime,
    tickets,
    payments,
  };
}

router.post('/hold', requireAuth, async (req, res) => {
  try {
    const maSuatChieu = Number(req.body?.maSuatChieu);
    const phutGiuRaw = req.body?.phutGiu !== undefined ? Number(req.body.phutGiu) : 10;
    const phutGiu = Number.isInteger(phutGiuRaw) && phutGiuRaw >= 1 && phutGiuRaw <= 30 ? phutGiuRaw : 10;

    if (!Number.isInteger(maSuatChieu) || maSuatChieu <= 0) {
      return res.status(400).json({ error: 'Mã suất chiếu không hợp lệ.' });
    }

    const rawSeats = Array.isArray(req.body?.danhSachGhe)
      ? req.body.danhSachGhe
      : String(req.body?.danhSachGhe || '').split(',');

    const normalizedSeats = [
      ...new Set(
        rawSeats
          .map((s) => String(s || '').trim().toUpperCase())
          .filter(Boolean)
      ),
    ];

    if (normalizedSeats.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 ghế.' });
    }
    if (normalizedSeats.length > 10) {
      return res.status(400).json({ error: 'Chỉ được đặt tối đa 10 ghế trong một đơn.' });
    }

    const danhSachGhe = normalizedSeats.join(',');
    const pool = await getPool();

    // Pre-check showtime availability before invoking sp_GiuCho
    const scCheck = await pool
      .request()
      .input('MaSuatChieu', sql.Int, maSuatChieu)
      .query(`SELECT MaSuatChieu, TrangThai FROM dbo.SuatChieu WHERE MaSuatChieu = @MaSuatChieu;`);

    const sc = scCheck.recordset[0];
    if (!sc) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại.' });
    }
    if (sc.TrangThai !== 'MO_BAN') {
      return res.status(400).json({
        error:
          sc.TrangThai === 'TAM_DUNG'
            ? 'Suất chiếu này đang tạm dừng bán vé.'
            : 'Suất chiếu này đã bị hủy.',
      });
    }

    // Call sp_GiuCho directly — NEVER wrap in a Node.js transaction
    const spResult = await pool
      .request()
      .input('MaKhachHang', sql.Int, req.user.maKhachHang)
      .input('MaSuatChieu', sql.Int, maSuatChieu)
      .input('DanhSachGhe', sql.VarChar(100), danhSachGhe)
      .input('PhutGiu', sql.TinyInt, phutGiu)
      .query(`
        DECLARE @MaDon BIGINT, @NoiDungChuyenKhoan VARCHAR(25), @TongTien DECIMAL(12,0);
        EXEC dbo.sp_GiuCho
            @MaKhachHang        = @MaKhachHang,
            @MaSuatChieu        = @MaSuatChieu,
            @DanhSachGhe        = @DanhSachGhe,
            @PhutGiu            = @PhutGiu,
            @MaDon              = @MaDon OUTPUT,
            @NoiDungChuyenKhoan = @NoiDungChuyenKhoan OUTPUT,
            @TongTien           = @TongTien OUTPUT;
        SELECT
            @MaDon              AS MaDon,
            @NoiDungChuyenKhoan AS NoiDungChuyenKhoan,
            @TongTien           AS TongTien;
      `);

    const out =
      spResult.recordsets
        ?.flat()
        ?.find((r) => r && r.MaDon !== undefined && r.MaDon !== null) ||
      spResult.recordset?.[0];
    const maDon = toNumber(out?.MaDon);
    const booking = await getBookingDetail(pool, maDon);

    return res.status(201).json({ booking });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.post('/confirm-payment', requireAuth, async (req, res) => {
  try {
    const noiDungChuyenKhoan = String(req.body?.noiDungChuyenKhoan || '').trim().toUpperCase();
    if (!noiDungChuyenKhoan) {
      return res.status(400).json({ error: 'Thiếu nội dung chuyển khoản.' });
    }

    let maGiaoDichNganHang = String(req.body?.maGiaoDichNganHang || '').trim();
    if (!maGiaoDichNganHang) {
      const rand = Math.floor(100 + Math.random() * 900);
      maGiaoDichNganHang = `FT${Date.now()}${rand}`;
    }

    const pool = await getPool();

    // Check order ownership if payment record exists
    const lookupRes = await pool
      .request()
      .input('NoiDung', sql.VarChar(25), noiDungChuyenKhoan)
      .query(`
        SELECT TOP (1) tt.MaDon, d.MaKhachHang
        FROM dbo.ThanhToan tt
        JOIN dbo.DonDatVe d ON d.MaDon = tt.MaDon
        WHERE tt.NoiDungChuyenKhoan = @NoiDung
          AND tt.LoaiGiaoDich = 'THANH_TOAN'
        ORDER BY tt.MaThanhToan DESC;
      `);

    const target = lookupRes.recordset[0];
    if (target && toNumber(target.MaKhachHang) !== req.user.maKhachHang) {
      return res.status(403).json({ error: 'Bạn không có quyền xác nhận đơn đặt vé của người khác.' });
    }

    // Read pre-payment loyalty snapshot to highlight trigger trg_KhachHang_CapNhatHang
    const preRes = await pool
      .request()
      .input('MaKhachHang', sql.Int, req.user.maKhachHang)
      .query(`
        SELECT kh.DiemTichLuy, kh.MaHang, ht.TenHang, ht.TyLeGiam
        FROM dbo.KhachHang kh
        JOIN dbo.HangThanhVien ht ON ht.MaHang = kh.MaHang
        WHERE kh.MaKhachHang = @MaKhachHang;
      `);
    const pre = preRes.recordset[0];

    // Call sp_XacNhanThanhToan directly — NEVER wrap in a Node.js transaction
    await pool
      .request()
      .input('NoiDungChuyenKhoan', sql.VarChar(25), noiDungChuyenKhoan)
      .input('MaGiaoDichNganHang', sql.VarChar(50), maGiaoDichNganHang)
      .query(`
        EXEC dbo.sp_XacNhanThanhToan
            @NoiDungChuyenKhoan = @NoiDungChuyenKhoan,
            @MaGiaoDichNganHang = @MaGiaoDichNganHang;
      `);

    const postRes = await pool
      .request()
      .input('MaKhachHang', sql.Int, req.user.maKhachHang)
      .query(`
        SELECT kh.DiemTichLuy, kh.MaHang, ht.TenHang, ht.TyLeGiam
        FROM dbo.KhachHang kh
        JOIN dbo.HangThanhVien ht ON ht.MaHang = kh.MaHang
        WHERE kh.MaKhachHang = @MaKhachHang;
      `);
    const post = postRes.recordset[0];

    const previousPoints = toNumber(pre?.DiemTichLuy);
    const newPoints = toNumber(post?.DiemTichLuy);
    const loyaltyUpdate = {
      previousPoints,
      newPoints,
      pointsEarned: Math.max(0, newPoints - previousPoints),
      previousTier: pre?.TenHang || null,
      newTier: post?.TenHang || null,
      newDiscountRate: toNumber(post?.TyLeGiam),
      upgraded: Boolean(pre && post && toNumber(post.MaHang) > toNumber(pre.MaHang)),
    };

    const maDon = toNumber(target?.MaDon);
    const booking = maDon ? await getBookingDetail(pool, maDon) : null;

    return res.json({ booking, loyaltyUpdate });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.post('/:maDon/cancel', requireAuth, async (req, res) => {
  try {
    const maDon = Number(req.params.maDon);
    if (!Number.isInteger(maDon) || maDon <= 0) {
      return res.status(400).json({ error: 'Mã đơn không hợp lệ.' });
    }

    const pool = await getPool();
    const checkRes = await pool
      .request()
      .input('MaDon', sql.BigInt, maDon)
      .query(`SELECT MaDon, MaKhachHang, TrangThai FROM dbo.DonDatVe WHERE MaDon = @MaDon;`);

    const don = checkRes.recordset[0];
    if (!don) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đặt vé.' });
    }
    if (toNumber(don.MaKhachHang) !== req.user.maKhachHang) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy đơn của người khác.' });
    }
    if (don.TrangThai !== 'DANG_GIU') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn đang ở trạng thái giữ chỗ.' });
    }

    await pool
      .request()
      .input('MaDon', sql.BigInt, maDon)
      .query(`
        SET XACT_ABORT ON;
        BEGIN TRANSACTION;

        INSERT INTO dbo.NhatKyVe (MaVe, MaDon, MaSuatChieu, MaGhe, GiaVe, HanhDong, NguoiThucHien)
        SELECT NULL, v.MaDon, v.MaSuatChieu, v.MaGhe, v.GiaVe, 'HUY', N'web_app'
        FROM dbo.Ve v
        WHERE v.MaDon = @MaDon;

        UPDATE dbo.NhatKyVe
        SET MaVe = NULL
        WHERE MaDon = @MaDon;

        DELETE FROM dbo.Ve
        WHERE MaDon = @MaDon;

        UPDATE dbo.DonDatVe
        SET TrangThai = 'DA_HUY'
        WHERE MaDon = @MaDon;

        UPDATE dbo.ThanhToan
        SET TrangThai = 'THAT_BAI'
        WHERE MaDon = @MaDon AND TrangThai = 'CHO_XAC_NHAN';

        COMMIT TRANSACTION;
      `);

    const booking = await getBookingDetail(pool, maDon);
    return res.json({ booking });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('MaKhachHang', sql.Int, req.user.maKhachHang)
      .query(`
        SELECT
            d.MaDon,
            d.MaDatCho,
            CONVERT(VARCHAR(19), d.ThoiGianTao, 126)    AS ThoiGianTao,
            CONVERT(VARCHAR(19), d.ThoiGianHetHan, 126) AS ThoiGianHetHan,
            DATEDIFF(SECOND, SYSDATETIME(), d.ThoiGianHetHan) AS SoGiayConLai,
            d.TrangThai,
            dbo.fn_TongTienDon(d.MaDon) AS TongTien,
            pay.NoiDungChuyenKhoan,
            pay.TrangThai AS TrangThaiThanhToan,
            info.MaSuatChieu,
            info.TenPhim,
            info.UrlPoster,
            info.TenPhong,
            info.LoaiPhong,
            CONVERT(VARCHAR(19), info.ThoiGianBatDau, 126) AS ThoiGianBatDau,
            info.SoLuongGhe,
            info.DanhSachGhe
        FROM dbo.DonDatVe d
        OUTER APPLY (
            SELECT TOP (1) tt.NoiDungChuyenKhoan, tt.TrangThai
            FROM dbo.ThanhToan tt
            WHERE tt.MaDon = d.MaDon AND tt.LoaiGiaoDich = 'THANH_TOAN'
            ORDER BY tt.MaThanhToan DESC
        ) pay
        OUTER APPLY (
            SELECT
                MAX(src.MaSuatChieu) AS MaSuatChieu,
                MAX(sc.TenPhim)      AS TenPhim,
                MAX(sc.UrlPoster)    AS UrlPoster,
                MAX(sc.TenPhong)     AS TenPhong,
                MAX(sc.LoaiPhong)    AS LoaiPhong,
                MAX(sc.ThoiGianBatDau) AS ThoiGianBatDau,
                COUNT(*)             AS SoLuongGhe,
                STRING_AGG(CAST(src.ViTri AS NVARCHAR(10)), N', ') WITHIN GROUP (ORDER BY src.HangGhe, src.SoGhe) AS DanhSachGhe
            FROM (
                SELECT v.MaSuatChieu, g.HangGhe, g.SoGhe, g.HangGhe + CAST(g.SoGhe AS VARCHAR(2)) AS ViTri
                FROM dbo.Ve v
                JOIN dbo.Ghe g ON g.MaGhe = v.MaGhe
                WHERE v.MaDon = d.MaDon
                UNION ALL
                SELECT nk.MaSuatChieu, g.HangGhe, g.SoGhe, g.HangGhe + CAST(g.SoGhe AS VARCHAR(2)) AS ViTri
                FROM dbo.NhatKyVe nk
                JOIN dbo.Ghe g ON g.MaGhe = nk.MaGhe
                WHERE nk.MaDon = d.MaDon
                  AND nk.HanhDong = 'GIU_CHO'
                  AND NOT EXISTS (SELECT 1 FROM dbo.Ve v2 WHERE v2.MaDon = d.MaDon)
            ) src
            JOIN dbo.vw_LichChieuChiTiet sc ON sc.MaSuatChieu = src.MaSuatChieu
        ) info
        WHERE d.MaKhachHang = @MaKhachHang
        ORDER BY d.ThoiGianTao DESC, d.MaDon DESC;
      `);

    const bookings = result.recordset.map((b) => ({
      MaDon: toNumber(b.MaDon),
      MaDatCho: b.MaDatCho,
      ThoiGianTao: b.ThoiGianTao,
      ThoiGianHetHan: b.ThoiGianHetHan,
      SoGiayConLai: Math.max(0, toNumber(b.SoGiayConLai)),
      TrangThai: b.TrangThai,
      TongTien: toNumber(b.TongTien),
      NoiDungChuyenKhoan: b.NoiDungChuyenKhoan,
      TrangThaiThanhToan: b.TrangThaiThanhToan,
      MaSuatChieu: b.MaSuatChieu !== null ? toNumber(b.MaSuatChieu) : null,
      TenPhim: b.TenPhim,
      UrlPoster: b.UrlPoster,
      TenPhong: b.TenPhong,
      LoaiPhong: b.LoaiPhong,
      ThoiGianBatDau: b.ThoiGianBatDau,
      SoLuongGhe: toNumber(b.SoLuongGhe),
      DanhSachGhe: b.DanhSachGhe || '',
    }));

    return res.json({ bookings });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/:maDon', requireAuth, async (req, res) => {
  try {
    const maDon = Number(req.params.maDon);
    if (!Number.isInteger(maDon) || maDon <= 0) {
      return res.status(400).json({ error: 'Mã đơn không hợp lệ.' });
    }

    const pool = await getPool();
    const booking = await getBookingDetail(pool, maDon);
    if (!booking) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đặt vé.' });
    }
    if (booking.MaKhachHang !== req.user.maKhachHang) {
      return res.status(403).json({ error: 'Bạn không có quyền xem đơn đặt vé này.' });
    }

    return res.json({ booking });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

export default router;
