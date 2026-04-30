import { getRequiredEnv, verifySession } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const sessionSecret = getRequiredEnv('SESSION_SECRET');

  if (!sessionSecret) {
    return res.status(500).json({ error: 'SESSION_SECRET nao configurado no servidor.' });
  }

  const session = verifySession(req, sessionSecret);

  return res.status(200).json(session);
}
