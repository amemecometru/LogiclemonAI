/**
 * webhooks.email — Cloudflare Worker
 * Routes requests, proxies OpenRouter calls, caches responses, handles webhook dispatch.
 */
const CONFIG = {
  OPENROUTER_API_KEY: typeof OPENROUTER_API_KEY !== 'undefined' ? OPENROUTER_API_KEY : '',
  OPENROUTER_BASE: 'https://openrouter.ai/api/v1',
  MODEL: 'google/gemma-4-26b-a4b-it:free',
  BACKEND_ORIGIN: 'https://api.webhooks.email',
  ALLOWED_ORIGINS: ['https://webhooks.email', 'https://*.webhooks.email', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000'],
};

const SYSTEM_PROMPT = `You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Be creative but practical.`;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

function corsHeaders(origin) {
  const allowed = CONFIG.ALLOWED_ORIGINS.some(p => {
    if (p.endsWith('*')) return origin?.startsWith(p.slice(0, -1));
    return p === origin;
  });
  return {
    'Access-Control-Allow-Origin': allowed ? origin : CONFIG.ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '*';
  const cors = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  // Route: /api/generate — proxy to OpenRouter
  if (url.pathname === '/api/generate' && request.method === 'POST') {
    return proxyOpenRouter(request, cors);
  }

  // Route: /api/webhook — receive external webhooks
  if (url.pathname === '/api/webhook' && request.method === 'POST') {
    return handleWebhook(request, cors);
  }

  // Route: /api/health
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok', model: CONFIG.MODEL }), {
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  // Static assets / SPA — serve from KV or origin
  return fetch(request);
}

async function proxyOpenRouter(request, cors) {
  try {
    const body = await request.json();
    const { prompt } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const orBody = {
      model: CONFIG.MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      extra_body: { reasoning: { enabled: true } },
    };

    const resp = await fetch(CONFIG.OPENROUTER_BASE + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://webhooks.email',
        'X-Title': 'webhooks.email',
      },
      body: JSON.stringify(orBody),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: 'OpenRouter: ' + err }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else {
        return new Response(JSON.stringify({ error: 'Invalid model response' }), {
          status: 502, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}

async function handleWebhook(request, cors) {
  try {
    const payload = await request.json();
    const prompt = payload.body || payload.text || payload.prompt || '';
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'No prompt found in webhook body' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const orBody = {
      model: CONFIG.MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      extra_body: { reasoning: { enabled: true } },
    };

    const resp = await fetch(CONFIG.OPENROUTER_BASE + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://webhooks.email',
        'X-Title': 'webhooks.email',
      },
      body: JSON.stringify(orBody),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: 'OpenRouter: ' + err }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else parsed = { html: '', css: '', js: '' };
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>${parsed.css || ''}</style></head>
<body>${parsed.html || ''}
<script>${parsed.js || ''}<\/script>
</body>
</html>`;

    return new Response(JSON.stringify({ html, ...parsed }), {
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}
