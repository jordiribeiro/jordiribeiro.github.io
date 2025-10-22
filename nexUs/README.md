# NexUS - Clube Empreendedor

Landing page estática construída com HTML, CSS e JavaScript seguindo boas práticas de acessibilidade, SEO e responsividade.

## Como usar

- Abra o arquivo `index.html` no navegador.
- Opcional: sirva a pasta com um servidor estático para melhor experiência (cache/rotas), por exemplo:

```bash
python3 -m http.server 5173
# depois acesse http://localhost:5173
```

## Estrutura

- `index.html`: marcação semântica e metas de SEO/OpenGraph
- `styles/styles.css`: estilos responsivos com design tokens (CSS variables), light/dark
- `scripts/script.js`: interações (menu mobile, rolagem suave, toggle de tema, formulário)
- `scripts/auth.js`: autenticação (login/cadastro, estado de sessão, área de membros)
- `scripts/firebase-config.js`: inicialização do Firebase (edite com suas chaves)
- `scripts/app.js`: app de membro (abas, CRM básico com Firestore, IA planner)
- `assets/logo.svg`: logotipo em SVG

## Boas práticas aplicadas

- Semântica HTML com `header`, `main`, `section`, `nav`, `footer`
- Acessibilidade: `skip-link`, `aria-*` nos controles, foco gerenciado pós-scroll, contraste
- Responsividade com CSS Grid/Flex e `clamp()` para tipografia fluida
- Design tokens (CSS variables) e suporte a `prefers-color-scheme`
- Toggle de tema com `localStorage` e `data-theme`
- SEO: `meta description`, OpenGraph/Twitter, `title`, `viewport`
- Performance: imagens com `loading="lazy"`, CSS crítico simples, sem fontes externas

## Personalização

- Cores: ajuste em `styles/styles.css` nas variáveis `--brand-*`, `--bg`, `--text` etc.
- Seções: edite/adicione blocos em `index.html` conforme necessidade.
- Scripts: acrescente integrações (analytics, formulário real) em `scripts/script.js`.

## Habilitar Login/Cadastro (Firebase Auth)

Compatível com GitHub Pages (cliente puro).

1) Crie um projeto em Firebase Console e adicione um app Web.
2) Copie as credenciais e edite `scripts/firebase-config.js` substituindo os `REPLACE_ME`.
3) Em Authentication > Sign-in method, ative Email/Password.
4) Em Authentication > Settings, defina domínios autorizados (ex.: `seu-usuario.github.io`).
5) Faça deploy no GitHub Pages. A página detecta o login e libera a seção `#membros`.

## Firestore (CRM básico)

- Ative Firestore no Firebase Console (modo production) e adicione regras mínimas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid != null;
    }
  }
}
```

- A UI de CRM cria/escuta coleções `contacts` e `deals` por `uid`.

## Firestore (Perfil da empresa)

- Collection: `companies` com documentos por `uid` do usuário logado.
- Campos: `{ uid, type, revenue, cnpj, startedAt, updatedAt }`.
- Regras sugeridas:

```
match /companies/{uid} {
  allow read, update, delete: if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null
    && request.resource.data.uid == request.auth.uid;
}
```

- Elegibilidade:
  - Incentivo 1%: `revenue >= 1_000_000`.
  - Isenção 3 meses: se `startedAt` for nos últimos 90 dias.

## IA Planner (OpenAI via Cloud Function)

1) Crie uma Cloud Function HTTP (Node 20+), com variável de ambiente `OPENAI_API_KEY`.
2) Exemplo (Express) — endpoint retorna `plan`:

```js
import express from 'express';
import fetch from 'node-fetch';
const app = express();
app.use(express.json());
app.post('/ai/plan', async (req, res) => {
  const { goal, uid } = req.body || {};
  if (!goal) return res.status(400).json({ error: 'goal required' });
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente de planejamento estratégico para pequenos negócios.' },
        { role: 'user', content: `Crie um plano de ação claro e prático para: ${goal}` }
      ],
      temperature: 0.3
    })
  });
  const j = await r.json();
  const plan = j.choices?.[0]?.message?.content || 'Sem resposta.';
  res.json({ plan, uid });
});
export default app;
```

3) Depois do deploy, copie a URL pública e defina em `scripts/firebase-config.js` o `aiPlannerEndpoint`.

### CORS (produção e local)

Use este exemplo com allowlist para seu GitHub Pages e localhost:

```js
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Ajuste sua lista de origens permitidas
const allowedOrigins = new Set([
  'https://seu-usuario.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
]);

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

app.post('/ai/plan', async (req, res) => {
  const { goal } = req.body || {};
  if (!goal) return res.status(400).json({ error: 'goal required' });
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente de planejamento estratégico para pequenos negócios.' },
        { role: 'user', content: `Crie um plano de ação claro e prático para: ${goal}` }
      ],
      temperature: 0.3
    })
  });
  const j = await r.json();
  const plan = j.choices?.[0]?.message?.content || 'Sem resposta.';
  res.json({ plan });
});

export default app;
```

Local (emulador/functions): defina `aiPlannerEndpoint` para algo como

```
http://localhost:5001/SEU_PROJETO/us-central1/ai/plan
```

## IA Planner (chamada direta ao OpenAI, no navegador)

- Alternativa sem Functions (requer chave paga da OpenAI):
  - Na aba IA, cole sua API Key e clique “Salvar chave”.
  - Deixe `aiPlannerEndpoint` vazio em `scripts/firebase-config.js`.
  - O app chamará `https://api.openai.com/v1/chat/completions` diretamente do navegador sempre que `aiPlannerEndpoint` estiver vazio.

ATENÇÃO: guardar a chave no navegador é conveniente para uso pessoal, porém não é recomendado em produção multiusuário. Prefira o proxy via Function para esconder a chave no servidor quando publicar para múltiplos usuários.

## IA Planner com Abacus.AI (alternativa com cota gratuita)

- Na aba IA, selecione o provedor "Abacus.AI" e cole sua API Key do Abacus.
- O app envia POST para `https://routellm.abacus.ai/v1/chat/completions` com `{ model: 'route-llm', messages, stream: false }`.
- Para usar via proxy (Worker), troque o destino no Worker e defina `ABACUS_API_KEY`.

## Cloudflare Worker (proxy recomendado)

Arquivos adicionados:
- `cloudflare/ai-plan-worker.js`: proxy para OpenAI com CORS, rota `/ai/plan`.

Passos:
1) Instale e autentique Wrangler:
   - `npm i -g wrangler`
   - `wrangler login`
2) Crie um projeto Worker (ou use existente):
   - `wrangler init nexus-ai`
   - Substitua o `src/index.js` pelo conteúdo de `cloudflare/ai-plan-worker.js`, ou aponte o `main` no `wrangler.toml` para esse arquivo.
3) Defina a chave da OpenAI como segredo:
   - `wrangler secret put OPENAI_API_KEY`
4) Ajuste a allowlist de CORS em `ai-plan-worker.js` (seu GitHub Pages e localhost).
5) Deploy:
   - `wrangler deploy`
6) Copie a URL pública do Worker e defina em `scripts/firebase-config.js`:
   - `export const aiPlannerEndpoint = 'https://seu-worker.workers.dev/ai/plan'`.

Observações:
- O Worker não precisa de dependências extras (usa fetch nativo). Sem custos no plano gratuito até limites da Cloudflare.
- Em caso de 401/429, confira a chave e limites da OpenAI.



## Licença

Este projeto é fornecido como base educacional. Use e adapte livremente.


