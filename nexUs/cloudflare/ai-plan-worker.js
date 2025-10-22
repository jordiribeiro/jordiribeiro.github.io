// Cloudflare Worker - NexUS AI Planner proxy for OpenAI
// Usage: Deploy with Wrangler and set the OPENAI_API_KEY secret.
// CORS allowlist includes GitHub Pages and localhost for development.

const ALLOWED_ORIGINS = new Set([
  'https://seu-usuario.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
]);

function corsHeaders(origin) {
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.append('Vary', 'Origin');
  }
  return headers;
}

async function handlePlan(req, env) {
  const origin = req.headers.get('Origin') || '';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });

  let body;
  try { body = await req.json(); } catch { body = {}; }
  const goal = (body && body.goal) ? String(body.goal) : '';
  const uid = (body && body.uid) ? String(body.uid) : '';
  if (!goal) return new Response(JSON.stringify({ error: 'goal required' }), { status: 400, headers: new Headers({ ...Object.fromEntries(headers), 'Content-Type': 'application/json' }) });

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente de planejamento estratégico para pequenos negócios.' },
        { role: 'user', content: `Crie um plano de ação claro e prático com checklist, metas (SMART), KPIs e próximos passos para: ${goal}` },
      ],
      temperature: 0.3,
    }),
  });

  const j = await r.json().catch(() => ({}));
  const plan = j?.choices?.[0]?.message?.content || 'Sem resposta.';
  const jsonHeaders = new Headers(headers);
  jsonHeaders.set('Content-Type', 'application/json');
  return new Response(JSON.stringify({ plan, uid }), { status: 200, headers: jsonHeaders });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    // Route handling: only /ai/plan
    if (url.pathname === '/ai/plan') {
      return handlePlan(req, env);
    }
    // Healthcheck or 404
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('ok', { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  },
};


