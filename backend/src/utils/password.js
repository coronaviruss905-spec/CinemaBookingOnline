import crypto from 'node:crypto';

/**
 * Matches SQL Server HASHBYTES('SHA2_256', ...) formatted with style 2 (uppercase 64-char hex).
 */
export function hashPassword(plainText) {
  return crypto
    .createHash('sha256')
    .update(String(plainText ?? ''), 'utf8')
    .digest('hex')
    .toUpperCase();
}
