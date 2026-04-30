import { getRequiredEnv, parseBody, requireAuth } from './_auth.js';

const MAX_BODY_SIZE = 100000;
const MAX_TEXT_SIZE = 500;
const MAX_ITEMS = 100;

const VALID_ARTIGO_STATUS = new Set([
  'APROVADO',
  'REPROVADO',
  'AJUSTAR',
  'AG. RETORNO'
]);

const VALID_PEDIDO_STATUS = new Set([
  'PENDENTE',
  'EM PRODUCAO',
  'EM PRODUCAO',
  'EM PRODUÃ‡ÃƒO',
  'EM PRODUÃƒÂ‡ÃƒÂ£O',
  'FINALIZADO',
  'CANCELADO'
]);

const VALID_COMISSOES = new Set(['2', '3', '4', '5', '6', '7', '8', '9']);

const ARTIGO_FIELDS = [
  'NOME DO PROJETO',
  'MALHARIA',
  'REPRESENTANTE',
  'CLIENTE',
  'DATA DO PROJETO',
  'DATA DE ENVIO',
  'SITUAÇÃO',
  'SITUACAO',
  'SITUAÃ‡ÃƒO',
  'SITUAÃƒâ€¡ÃƒÆ’O',
  'OBSERVAÇÃO',
  'OBSERVACAO',
  'OBSERVAÃ‡ÃƒO',
  'OBSERVAÃƒâ€¡ÃƒÆ’O',
  'DATA DE CADASTRO'
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toCleanString(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
}

function normalizeText(value) {
  return toCleanString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function hasValidTextSize(value) {
  return toCleanString(value).length <= MAX_TEXT_SIZE;
}

function isDateOrEmpty(value) {
  const cleanValue = toCleanString(value);
  return cleanValue === '' || /^\d{4}-\d{2}-\d{2}$/.test(cleanValue);
}

function isPositiveNumber(value) {
  const numberValue = Number(String(value).replace(',', '.'));
  return Number.isFinite(numberValue) && numberValue > 0;
}

function getFirstField(body, fields) {
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      return toCleanString(body[field]);
    }
  }

  return '';
}

function validatePayloadSize(body) {
  const bodySize = JSON.stringify(body || {}).length;

  if (bodySize > MAX_BODY_SIZE) {
    return 'Dados muito grandes para processar.';
  }

  return '';
}

function validateArtigoPayload(body) {
  const sizeError = validatePayloadSize(body);
  if (sizeError) {
    return { error: sizeError };
  }

  const nomeProjeto = getFirstField(body, ['NOME DO PROJETO']);
  const cliente = getFirstField(body, ['CLIENTE']);
  const situacao = getFirstField(body, ['SITUAÇÃO', 'SITUACAO', 'SITUAÃ‡ÃƒO', 'SITUAÃƒâ€¡ÃƒÆ’O']);

  if (!nomeProjeto || !cliente || !situacao) {
    return { error: 'Preencha nome do projeto, cliente e situacao.' };
  }

  if (!VALID_ARTIGO_STATUS.has(normalizeText(situacao))) {
    return { error: 'Situacao do artigo invalida.' };
  }

  if (!isDateOrEmpty(body['DATA DO PROJETO']) || !isDateOrEmpty(body['DATA DE ENVIO'])) {
    return { error: 'Datas do artigo invalidas.' };
  }

  const payload = {};

  for (const field of ARTIGO_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      if (!hasValidTextSize(body[field])) {
        return { error: `Campo muito longo: ${field}.` };
      }

      payload[field] = toCleanString(body[field]);
    }
  }

  return { payload };
}

function validatePedidoPayload(body) {
  const sizeError = validatePayloadSize(body);
  if (sizeError) {
    return { error: sizeError };
  }

  const cliente = toCleanString(body.cliente);
  const representante = toCleanString(body.representante);
  const comissao = toCleanString(body.comissao);
  const data = toCleanString(body.data);
  const status = toCleanString(body.status);
  const observacao = toCleanString(body.observacao);

  if (!cliente || !representante || !comissao || !data || !status) {
    return { error: 'Preencha cliente, representante, comissao, data e status.' };
  }

  if (!VALID_COMISSOES.has(comissao)) {
    return { error: 'Comissao invalida.' };
  }

  if (!VALID_PEDIDO_STATUS.has(normalizeText(status))) {
    return { error: 'Status do pedido invalido.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { error: 'Data do pedido invalida.' };
  }

  if (!Array.isArray(body.itens) || body.itens.length === 0 || body.itens.length > MAX_ITEMS) {
    return { error: 'Informe entre 1 e 100 itens no pedido.' };
  }

  const itens = [];

  for (const item of body.itens) {
    if (!isPlainObject(item)) {
      return { error: 'Item do pedido invalido.' };
    }

    const artigo = toCleanString(item.artigo);
    const cor = toCleanString(item.cor);
    const quantidade = toCleanString(item.quantidade);
    const peso = toCleanString(item.peso);
    const valor = toCleanString(item.valor);

    if (!artigo || !cor || !quantidade || !peso || !valor) {
      return { error: 'Preencha artigo, cor, quantidade, peso e valor de todos os itens.' };
    }

    if (!isPositiveNumber(quantidade) || !isPositiveNumber(peso) || !isPositiveNumber(valor)) {
      return { error: 'Quantidade, peso e valor devem ser maiores que zero.' };
    }

    if (![artigo, cor, quantidade, peso, valor].every(hasValidTextSize)) {
      return { error: 'Um dos campos do item esta muito longo.' };
    }

    itens.push({ artigo, cor, quantidade, peso, valor });
  }

  return {
    payload: {
      tipo: 'pedido',
      cliente,
      representante,
      comissao,
      data,
      status,
      observacao,
      itens
    }
  };
}

function validatePostBody(body) {
  if (!isPlainObject(body)) {
    return { error: 'Corpo da requisicao invalido.' };
  }

  if (body.tipo === 'pedido') {
    return validatePedidoPayload(body);
  }

  return validateArtigoPayload(body);
}

function getAppsScriptSecret() {
  return getRequiredEnv('APPS_SCRIPT_SECRET') || getRequiredEnv('API_KEY');
}

function getScriptUrlWithSecret(scriptUrl, secret) {
  const url = new URL(scriptUrl);
  url.searchParams.set('secret', secret);
  return url.toString();
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  return JSON.parse(text);
}

export default async function handler(req, res) {
  const session = requireAuth(req, res);

  if (!session.authenticated) {
    return;
  }

  const scriptUrl = getRequiredEnv('APPS_SCRIPT_URL');
  const appsScriptSecret = getAppsScriptSecret();

  if (!scriptUrl || !appsScriptSecret) {
    return res.status(500).json({
      error: 'Configuracao ausente no servidor. Verifique APPS_SCRIPT_URL e APPS_SCRIPT_SECRET.'
    });
  }

  try {
    const protectedScriptUrl = getScriptUrlWithSecret(scriptUrl, appsScriptSecret);

    if (req.method === 'GET') {
    const response = await fetch(process.env.APPS_SCRIPT_URL, {
     method: 'GET',
      headers: {
      'x-api-key': process.env.APPS_SCRIPT_SECRET
     }
      });

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = parseBody(req.body);
      const validation = validatePostBody(body);

      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }

      const response = await fetch(process.env.APPS_SCRIPT_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.APPS_SCRIPT_SECRET
  },
  body: JSON.stringify(body)
});

      const data = await readJsonResponse(response);

      if (!response.ok || data.error) {
        return res.status(response.ok ? 502 : response.status).json({
          error: data.error || 'Erro ao cadastrar dados no Apps Script.'
        });
      }

      return res.status(200).json(data);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao processar a requisicao.' });
  }
}
