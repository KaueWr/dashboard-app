# Configuracao de seguranca

Esta etapa adiciona login no dashboard, sessao por cookie seguro e protecao
extra para o Google Apps Script.

Arquivos criados ou atualizados:

- `api/_auth.js`: regras de sessao e cookie.
- `api/auth/login.js`: entrada no dashboard.
- `api/auth/session.js`: verifica sessao ativa.
- `api/auth/logout.js`: encerra sessao.
- `api/data.js`: agora exige sessao ativa antes de acessar os dados.
- `src/components/Login.js`: tela de login.
- `src/components/Seguranca.js`: aba de seguranca.
- `src/services/apiClient.js`: chamadas da API com cookie de sessao.
- `.env.example`: modelo das variaveis necessarias.

## Variaveis necessarias na Vercel

Crie estas variaveis no projeto da Vercel:

```env
APP_PASSWORD=senha_para_entrar_no_dashboard
SESSION_SECRET=chave_grande_aleatoria_para_assinar_cookie
APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_DO_SCRIPT/exec
APPS_SCRIPT_SECRET=chave_grande_aleatoria_para_proteger_o_apps_script
```

Observacao: se voce ja tem `API_KEY` na Vercel, ela pode ficar por enquanto.
O codigo novo prefere `APPS_SCRIPT_SECRET`. Depois que tudo estiver funcionando,
podemos remover a variavel antiga `API_KEY`.

## Como gerar chaves fortes no CMD ou PowerShell

Entre na pasta do projeto:

```bash
cd "C:\Users\kauew\OneDrive\Área de Trabalho\dashboard-app"
```

Gere uma chave para `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Rode o mesmo comando outra vez para gerar `APPS_SCRIPT_SECRET`.

Para `APP_PASSWORD`, use uma senha forte que voce consiga guardar.

## Ordem correta

1. Atualizar o Apps Script com a validacao de segredo.
2. Criar `APPS_SCRIPT_SECRET` no Apps Script.
3. Criar as variaveis na Vercel.
4. Fazer novo deploy na Vercel.
5. Entrar no dashboard usando a senha de `APP_PASSWORD`.

## Atualizar o Apps Script

No Google Apps Script:

1. Abra o projeto do Apps Script.
2. Va em `Project Settings`.
3. Procure `Script Properties`.
4. Clique em `Add script property`.
5. Nome: `APPS_SCRIPT_SECRET`.
6. Valor: use exatamente o mesmo valor que voce vai colocar na Vercel.
7. Salve.

Depois, no editor de codigo do Apps Script, adicione estas funcoes auxiliares:

```javascript
function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function isAuthorized_(e) {
  var expected = PropertiesService
    .getScriptProperties()
    .getProperty('APPS_SCRIPT_SECRET');

  var received = e && e.parameter ? e.parameter.secret : '';

  return Boolean(expected && received && received === expected);
}
```

Agora coloque esta validacao no inicio do seu `doGet(e)`:

```javascript
function doGet(e) {
  if (!isAuthorized_(e)) {
    return jsonResponse_({ error: 'Nao autorizado' });
  }

  // mantenha aqui o codigo que voce ja tem hoje
}
```

E coloque esta validacao no inicio do seu `doPost(e)`:

```javascript
function doPost(e) {
  if (!isAuthorized_(e)) {
    return jsonResponse_({ error: 'Nao autorizado' });
  }

  // mantenha aqui o codigo que voce ja tem hoje
}
```

Importante: nao apague sua logica atual do Apps Script. Apenas coloque a
validacao como primeira coisa dentro de `doGet(e)` e `doPost(e)`.

Depois de alterar:

1. Clique em `Deploy`.
2. Clique em `Manage deployments`.
3. Clique no lapis de editar o deployment atual.
4. Em `Version`, selecione `New version`.
5. Clique em `Deploy`.
6. Copie a URL `/exec` se ela mudar.

## Atualizar a Vercel

Na Vercel:

1. Entre em `https://vercel.com`.
2. Abra o projeto `dashboard-app`.
3. Va em `Settings`.
4. Va em `Environment Variables`.
5. Crie ou confira `APPS_SCRIPT_URL`.
6. Crie `APP_PASSWORD`.
7. Crie `SESSION_SECRET`.
8. Crie `APPS_SCRIPT_SECRET`.
9. Marque `Production`, `Preview` e `Development`.
10. Salve.
11. Va em `Deployments`.
12. Clique nos tres pontos do ultimo deploy.
13. Clique em `Redeploy`.

## Como testar

1. Abra o site publicado na Vercel.
2. A primeira tela deve ser `Acesso ao Dashboard`.
3. Digite a senha configurada em `APP_PASSWORD`.
4. Depois do login, o menu deve mostrar a aba `Seguranca`.
5. Entre na aba `Seguranca`.
6. Confira `Sessao ativa`.
7. Clique em `Sair`.
8. O app deve voltar para a tela de login.

## O que mudou na seguranca

- A chave fixa saiu do frontend.
- A API `/api/data` passou a exigir cookie de sessao.
- O cookie e `HttpOnly`, entao o JavaScript do navegador nao consegue ler.
- O Apps Script passa a exigir um segredo interno.
- As variaveis sensiveis ficam na Vercel e no Apps Script, nao no codigo.
