export default async function handler(req, res) {

  const API_KEY = process.env.API_KEY;

  // 🔥 SUA URL REAL DO APPS SCRIPT
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw97cH6tulasWqVrGA8VhRnu-Itdil5Xf9pfY2RGNltHISIaiFDijfJ_vW2_5J14j-zkw/exec";

  const clientKey = req.headers['x-api-key'];

  // 🔐 VALIDAÇÃO DE SEGURANÇA
  if (clientKey !== API_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {

    // 🔄 GET → BUSCAR DADOS
    if (req.method === 'GET') {

      const response = await fetch(SCRIPT_URL);
      const data = await response.json();

      return res.status(200).json(data);
    }

    // 🔥 POST → CADASTRAR DADOS
    if (req.method === 'POST') {

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();

      return res.status(200).json(data);
    }

    // ❌ MÉTODO NÃO PERMITIDO
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}