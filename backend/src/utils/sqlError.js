/**
 * Extract SQL Server error number and clean user-facing message from mssql / msnodesqlv8 errors.
 */
export function parseSqlError(err) {
  const sqlCode =
    err?.number ??
    err?.originalError?.info?.number ??
    err?.precedingErrors?.[0]?.number ??
    null;

  const rawMessage =
    err?.originalError?.info?.message ??
    err?.precedingErrors?.[0]?.message ??
    err?.message ??
    'Lỗi hệ thống cơ sở dữ liệu.';

  const cleanMessage = String(rawMessage)
    .replace(/^(\[Microsoft\]\[ODBC[^\]]*\]\[SQL Server\])+/gi, '')
    .trim();

  let status = 500;
  let message = cleanMessage || 'Lỗi hệ thống cơ sở dữ liệu.';

  if (sqlCode === 50104 || sqlCode === 50301) {
    status = 404;
  } else if (sqlCode === 50108 || sqlCode === 50212) {
    status = 409;
  } else if (sqlCode === 50208 || sqlCode === 50401 || sqlCode === 50402 || sqlCode === 547) {
    status = 400;
  } else if (sqlCode === 50306) {
    status = 410;
  } else if (sqlCode === 2601 || sqlCode === 2627) {
    status = 409;
    if (/UQ_KhachHang_Email/i.test(cleanMessage)) {
      message = 'Email này đã được đăng ký.';
    } else if (/UQ_KhachHang_SoDienThoai/i.test(cleanMessage)) {
      message = 'Số điện thoại này đã được đăng ký.';
    } else if (/UX_ThanhToan_MaGiaoDichNganHang/i.test(cleanMessage)) {
      message = 'Mã giao dịch ngân hàng này đã được ghi nhận trước đó.';
    } else if (/UQ_Ve_SuatChieu_Ghe/i.test(cleanMessage)) {
      message = 'Ghế này đã có người đặt.';
    }
  }

  return { status, sqlCode, message };
}

export function sendSqlError(res, err) {
  const parsed = parseSqlError(err);
  if (parsed.status >= 500) {
    console.error('[SQL ERROR]', err);
  }
  return res.status(parsed.status).json({
    error: parsed.message,
    sqlCode: parsed.sqlCode,
  });
}
