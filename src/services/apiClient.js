export async function apiFetch(path, options = {}) {
  return fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.headers || {})
    }
  });
}

export async function readApiResponse(response) {
  let result = {};

  try {
    result = await response.json();
  } catch (err) {
    result = {};
  }

  if (!response.ok || result.error) {
    const error = new Error(result.error || 'Erro ao processar a requisicao.');
    error.status = response.status;
    throw error;
  }

  return result;
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  return readApiResponse(response);
}
