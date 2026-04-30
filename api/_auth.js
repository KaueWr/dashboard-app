import crypto from 'crypto';

export const AUTH_COOKIE_NAME = 'gt_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function parseBody(body) {
  if (typeof body === 'string') {
    return JSON.parse(body || '{}');
  }

  return body || {};
}

export function safeCompare(value, expectedValue) {
  const valueBuffer = Buffer.from(String(value));
  const expectedBuffer = Buffer.from(String(expectedValue));

  return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  parts.push(`Path=${options.path || '/'}`);
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);

  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim()).filter(Boolean);

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=');
    const cookieName = separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie;
    const cookieValue = separatorIndex >= 0 ? cookie.slice(separatorIndex + 1) : '';

    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }

  return '';
}

export function createSessionCookie(secret) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(JSON.stringify({
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS
  }));
  const signature = sign(payload, secret);
  const token = `${payload}.${signature}`;

  return serializeCookie(AUTH_COOKIE_NAME, encodeURIComponent(token), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV !== 'development'
  });
}

export function clearSessionCookie() {
  return serializeCookie(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV !== 'development'
  });
}

export function verifySession(req, secret) {
  const token = getCookie(req, AUTH_COOKIE_NAME);

  if (!token) {
    return { authenticated: false };
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature || !safeCompare(signature, sign(payload, secret))) {
    return { authenticated: false };
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload));
    const now = Math.floor(Date.now() / 1000);

    if (!session.exp || session.exp <= now) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      expiresAt: session.exp * 1000
    };
  } catch (err) {
    return { authenticated: false };
  }
}

export function requireAuth(req, res) {
  const sessionSecret = getRequiredEnv('SESSION_SECRET');

  if (!sessionSecret) {
    res.status(500).json({ error: 'SESSION_SECRET nao configurado no servidor.' });
    return { authenticated: false, handled: true };
  }

  const session = verifySession(req, sessionSecret);

  if (!session.authenticated) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return { authenticated: false, handled: true };
  }

  return session;
}
