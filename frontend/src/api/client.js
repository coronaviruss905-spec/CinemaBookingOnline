const TOKEN_KEY = 'cinesql_token';

export class ApiError extends Error {
  constructor(message, { status = 500, sqlCode = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.sqlCode = sqlCode;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    body:
      options.body !== undefined && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `Yêu cầu thất bại (HTTP ${response.status}).`;
    throw new ApiError(message, {
      status: response.status,
      sqlCode: data?.sqlCode ?? null,
    });
  }

  return data;
}
