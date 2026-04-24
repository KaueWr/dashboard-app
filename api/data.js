export default async function handler(req, res) {
  const API_KEY = process.env.API_KEY;
  const SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  const clientKey = req.headers['x-api-key'];

  if (clientKey !== API_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(req.body)
      });

      return res.status(200).json({ success: true });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}