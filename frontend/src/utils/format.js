const vndFormatter = new Intl.NumberFormat('vi-VN');

export function formatVnd(amount) {
  const num = Number(amount || 0);
  return `${vndFormatter.format(Number.isFinite(num) ? num : 0)} đ`;
}

/**
 * Parse SQL local string ('YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss') strictly without UTC shift.
 */
export function parseLocalDateTime(str) {
  if (!str) return null;
  const cleaned = String(str).trim().replace(' ', 'T');
  const [datePart, timePart = '00:00:00'] = cleaned.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map((x) => parseInt(x, 10) || 0);
  return new Date(y, m - 1, d, hh, mm, ss);
}

export function formatTimeHM(str) {
  if (!str) return '--:--';
  const [, timePart = ''] = String(str).replace(' ', 'T').split('T');
  return timePart.slice(0, 5) || '--:--';
}

export function formatDateVN(str) {
  const dt = parseLocalDateTime(str);
  if (!dt) return str || '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatWeekdayShort(dateStr) {
  const dt = parseLocalDateTime(dateStr);
  if (!dt) return dateStr;
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return {
    weekday: days[dt.getDay()],
    dayMonth: `${dd}/${mm}`,
  };
}

export function formatDateTimeVN(str) {
  if (!str) return '';
  return `${formatTimeHM(str)} • ${formatDateVN(str)}`;
}

export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatAgeShort(rating) {
  const map = {
    T18: '18+',
    T16: '16+',
    T13: '13+',
    K: 'K',
    P: 'P',
  };
  return map[rating] || rating || '';
}

export function formatDateTile(dateStr, todayStr) {
  const dt = parseLocalDateTime(dateStr);
  if (!dt) return { dayNumber: dateStr || '', label: '' };
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return {
    dayNumber: String(dt.getDate()),
    label: todayStr && dateStr === todayStr ? 'Hôm nay' : days[dt.getDay()],
  };
}

export function formatRoomFormatLabel(loaiPhong) {
  const map = {
    '2D': '2D Phụ đề',
    '3D': '3D Phụ đề',
    IMAX: 'IMAX Phụ đề',
    '4DX': '4DX Phụ đề',
  };
  return map[loaiPhong] || `${loaiPhong} Phụ đề`;
}
