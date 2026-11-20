import jwt from 'jsonwebtoken';

function getSecret() {
  return process.env.JWT_SECRET || 'cinebooking-hqtcsdl-demo-secret-2026';
}

export function signToken(user) {
  return jwt.sign(
    {
      maKhachHang: Number(user.MaKhachHang),
      email: user.Email,
    },
    getSecret(),
    { expiresIn: '24h' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
  }
  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, getSecret());
    req.user = {
      maKhachHang: Number(payload.maKhachHang),
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, getSecret());
    req.user = {
      maKhachHang: Number(payload.maKhachHang),
      email: payload.email,
    };
  } catch {
    req.user = null;
  }
  return next();
}
