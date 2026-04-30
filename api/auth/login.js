import { createSessionCookie, getRequiredEnv, parseBody, safeCompare } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const appPassword = getRequiredEnv('APP_PASSWORD');
  const sessionSecret = getRequiredEnv('SESSION_SECRET');

  if (!appPassword || !sessionSecret) {
    return res.status(500).json({
      error: 'Login nao configurado. Verifique APP_PASSWORD e SESSION_SECRET.'
    });
  }

  try {
    const body = parseBody(req.body);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password || !safeCompare(password, appPassword)) {
      return res.status(401).json({ error: 'Senha invalida.' });
    }

    res.setHeader('Set-Cookie', createSessionCookie(sessionSecret));
    return res.status(200).json({ authenticated: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Dados de login invalidos.' });
  }
}
