import express from 'express';
import { getPool, sql, toNumber } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { hashPassword } from '../utils/password.js';
import { sendSqlError } from '../utils/sqlError.js';

const router = express.Router();

async function getCustomerWithTier(pool, maKhachHang) {
  const result = await pool
    .request()
    .input('MaKhachHang', sql.Int, maKhachHang)
    .query(`
      SELECT
          kh.MaKhachHang,
          kh.HoTen,
          kh.Email,
          kh.SoDienThoai,
          CONVERT(VARCHAR(10), kh.NgaySinh, 23) AS NgaySinh,
          kh.GioiTinh,
          kh.MaHang,
          ht.TenHang,
          ht.DiemToiThieu,
          ht.TyLeGiam,
          kh.DiemTichLuy,
          CONVERT(VARCHAR(19), kh.NgayDangKy, 126) AS NgayDangKy,
          kh.TrangThai
      FROM dbo.KhachHang kh
      JOIN dbo.HangThanhVien ht ON ht.MaHang = kh.MaHang
      WHERE kh.MaKhachHang = @MaKhachHang;
    `);

  const row = result.recordset[0];
  if (!row) return null;

  const nextResult = await pool
    .request()
    .input('Diem', sql.Int, row.DiemTichLuy)
    .query(`
      SELECT TOP (1) MaHang, TenHang, DiemToiThieu, TyLeGiam
      FROM dbo.HangThanhVien
      WHERE DiemToiThieu > @Diem
      ORDER BY DiemToiThieu ASC;
    `);

  const nextRow = nextResult.recordset[0] || null;

  return {
    MaKhachHang: toNumber(row.MaKhachHang),
    HoTen: row.HoTen,
    Email: row.Email,
    SoDienThoai: row.SoDienThoai,
    NgaySinh: row.NgaySinh,
    GioiTinh: row.GioiTinh,
    MaHang: toNumber(row.MaHang),
    TenHang: row.TenHang,
    DiemToiThieu: toNumber(row.DiemToiThieu),
    TyLeGiam: toNumber(row.TyLeGiam),
    DiemTichLuy: toNumber(row.DiemTichLuy),
    NgayDangKy: row.NgayDangKy,
    TrangThai: row.TrangThai,
    nextTier: nextRow
      ? {
          MaHang: toNumber(nextRow.MaHang),
          TenHang: nextRow.TenHang,
          DiemToiThieu: toNumber(nextRow.DiemToiThieu),
          TyLeGiam: toNumber(nextRow.TyLeGiam),
        }
      : null,
  };
}

router.get('/demo-accounts', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      WITH ActiveByTier AS (
          SELECT
              kh.MaKhachHang,
              kh.HoTen,
              kh.Email,
              kh.SoDienThoai,
              kh.MaHang,
              ht.TenHang,
              ht.TyLeGiam,
              kh.DiemTichLuy,
              kh.TrangThai,
              ROW_NUMBER() OVER (PARTITION BY kh.MaHang ORDER BY kh.MaKhachHang ASC) AS rn
          FROM dbo.KhachHang kh
          JOIN dbo.HangThanhVien ht ON ht.MaHang = kh.MaHang
          WHERE kh.TrangThai = 'HOAT_DONG'
      ),
      LockedSample AS (
          SELECT TOP (1)
              kh.MaKhachHang,
              kh.HoTen,
              kh.Email,
              kh.SoDienThoai,
              kh.MaHang,
              ht.TenHang,
              ht.TyLeGiam,
              kh.DiemTichLuy,
              kh.TrangThai
          FROM dbo.KhachHang kh
          JOIN dbo.HangThanhVien ht ON ht.MaHang = kh.MaHang
          WHERE kh.TrangThai = 'BI_KHOA'
          ORDER BY kh.MaKhachHang ASC
      )
      SELECT MaKhachHang, HoTen, Email, SoDienThoai, MaHang, TenHang, TyLeGiam, DiemTichLuy, TrangThai
      FROM ActiveByTier
      WHERE rn = 1
      UNION ALL
      SELECT MaKhachHang, HoTen, Email, SoDienThoai, MaHang, TenHang, TyLeGiam, DiemTichLuy, TrangThai
      FROM LockedSample
      ORDER BY TrangThai DESC, MaHang ASC;
    `);

    const accounts = result.recordset.map((r) => ({
      MaKhachHang: toNumber(r.MaKhachHang),
      HoTen: r.HoTen,
      Email: r.Email,
      SoDienThoai: r.SoDienThoai,
      MaHang: toNumber(r.MaHang),
      TenHang: r.TenHang,
      TyLeGiam: toNumber(r.TyLeGiam),
      DiemTichLuy: toNumber(r.DiemTichLuy),
      TrangThai: r.TrangThai,
    }));

    return res.json({ accounts });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const matKhau = String(req.body?.matKhau || '');

    if (!email || !matKhau) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('Email', sql.VarChar(100), email)
      .query(`
        SELECT MaKhachHang, Email, MatKhauHash, TrangThai
        FROM dbo.KhachHang
        WHERE LOWER(Email) = @Email;
      `);

    const account = result.recordset[0];
    if (!account) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const inputHash = hashPassword(matKhau);
    if (String(account.MatKhauHash || '').toUpperCase() !== inputHash) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    if (account.TrangThai === 'BI_KHOA') {
      return res.status(403).json({ error: 'Tài khoản này đang bị khóa (BI_KHOA). Vui lòng liên hệ hỗ trợ.' });
    }

    const user = await getCustomerWithTier(pool, account.MaKhachHang);
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.post('/register', async (req, res) => {
  try {
    const hoTen = String(req.body?.hoTen || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const soDienThoai = String(req.body?.soDienThoai || '').trim();
    const matKhau = String(req.body?.matKhau || '');
    const ngaySinh = req.body?.ngaySinh ? String(req.body.ngaySinh).trim() : null;
    const gioiTinh = req.body?.gioiTinh ? String(req.body.gioiTinh).trim() : null;

    if (!hoTen || !email || !soDienThoai || !matKhau) {
      return res.status(400).json({ error: 'Vui lòng điền Họ tên, Email, Số điện thoại và Mật khẩu.' });
    }
    if (!/^0\d{9}$/.test(soDienThoai)) {
      return res.status(400).json({ error: 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0.' });
    }
    if (matKhau.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu cần tối thiểu 6 ký tự.' });
    }
    if (gioiTinh && !['Nam', 'Nữ', 'Khác'].includes(gioiTinh)) {
      return res.status(400).json({ error: 'Giới tính không hợp lệ (Nam, Nữ, Khác).' });
    }

    const matKhauHash = hashPassword(matKhau);
    const pool = await getPool();
    const insertResult = await pool
      .request()
      .input('HoTen', sql.NVarChar(100), hoTen)
      .input('Email', sql.VarChar(100), email)
      .input('SoDienThoai', sql.VarChar(10), soDienThoai)
      .input('MatKhauHash', sql.VarChar(255), matKhauHash)
      .input('NgaySinh', sql.VarChar(10), ngaySinh || null)
      .input('GioiTinh', sql.NVarChar(4), gioiTinh || null)
      .query(`
        INSERT INTO dbo.KhachHang (HoTen, Email, SoDienThoai, MatKhauHash, NgaySinh, GioiTinh)
        OUTPUT INSERTED.MaKhachHang
        VALUES (
            @HoTen,
            @Email,
            @SoDienThoai,
            @MatKhauHash,
            CASE WHEN @NgaySinh IS NULL OR @NgaySinh = '' THEN NULL ELSE CONVERT(DATE, @NgaySinh, 23) END,
            @GioiTinh
        );
      `);

    const maKhachHang = insertResult.recordset[0]?.MaKhachHang;
    const user = await getCustomerWithTier(pool, maKhachHang);
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const user = await getCustomerWithTier(pool, req.user.maKhachHang);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản khách hàng.' });
    }
    return res.json({ user });
  } catch (err) {
    return sendSqlError(res, err);
  }
});

export default router;
