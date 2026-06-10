(function () {
  const CONFIG = {
    model: 'google/gemma-4-26b-a4b-it:free',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '', // Set via WebhooksEmail.setApiKey() or OPENROUTER_KEY env
    siteURL: window.location.origin || 'https://webhooks.email',
    siteName: 'webhooks.email',
  };

  const dom = {
    messages: document.getElementById('messages'),
    promptInput: document.getElementById('promptInput'),
    sendBtn: document.getElementById('sendBtn'),
    preview: document.getElementById('preview'),
    deviceBtns: document.querySelectorAll('.device-btn'),
    clearBtn: document.getElementById('clearPreviewBtn'),
  };

  let abortController = null;
  let lastResult = null;
  let desktopURL = '';

  function setApiKey (key) {
    CONFIG.apiKey = key;
  }

  function setBaseURL (url) {
    CONFIG.baseURL = url;
  }

  function setProxyEndpoint (endpoint) {
    CONFIG.proxyEndpoint = endpoint;
  }

  function setDesktopIP (ip) {
    desktopURL = ip.startsWith('http') ? ip : 'http://' + ip;
    desktopURL = desktopURL.replace(/\/+$/, '') + ':3000';
    const btn = document.getElementById('sendDesktopBtn');
    if (btn) btn.style.display = desktopURL ? 'inline-flex' : 'none';
  }

  function addMessage (text, role) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    el.textContent = text;
    dom.messages.appendChild(el);
    dom.messages.scrollTop = dom.messages.scrollHeight;
    return el;
  }

  function removeTyping () {
    const t = dom.messages.querySelector('.msg.typing');
    if (t) t.remove();
  }

  function renderPreview (data) {
    const html = data.html || '';
    const css = data.css || '';
    const js = data.js || '';
    const fullDoc = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>${css}</style></head>
<body>${html}
<script>${js}<\/script>
</body>
</html>`;
    const blob = new Blob([fullDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    dom.preview.src = url;
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function sendPrompt (prompt) {
    if (!prompt.trim()) return;
    if (!CONFIG.apiKey) {
      addMessage('API key not set. Call setApiKey() with your OpenRouter key.', 'error');
      return;
    }

    dom.sendBtn.disabled = true;
    abortController = new AbortController();
    addMessage(prompt, 'user');
    dom.promptInput.value = '';
    dom.promptInput.style.height = 'auto';

    const typingEl = addMessage('Gemma is thinking…', 'typing');

    const systemPrompt = `You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Include all HTML in 'html', all styles in 'css', and all scripts in 'js'. Be creative but practical.`;

    try {
      let data;

      if (CONFIG.proxyEndpoint) {
        const res = await fetch(CONFIG.proxyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
          signal: abortController.signal,
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(res.status + ': ' + errBody);
        }
        data = await res.json();
      } else {
        const res = await fetch(CONFIG.baseURL + '/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + CONFIG.apiKey,
            'HTTP-Referer': CONFIG.siteURL,
            'X-Title': CONFIG.siteName,
          },
          body: JSON.stringify({
            model: CONFIG.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            extra_body: { reasoning: { enabled: true } },
          }),
          signal: abortController.signal,
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(res.status + ': ' + errBody);
        }
        const raw = await res.json();
        const content = raw.choices?.[0]?.message?.content || '';
        try {
          data = JSON.parse(content);
        } catch {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            data = JSON.parse(match[0]);
          } else {
            throw new Error('Model returned invalid JSON: ' + content.slice(0, 200));
          }
        }
      }

      removeTyping();
      lastResult = data;
      addMessage('Rendered live!', 'assistant');
      renderPreview(data);
      const sendBtn = document.getElementById('sendDesktopBtn');
      if (sendBtn) sendBtn.style.display = desktopURL ? 'inline-flex' : 'none';
    } catch (err) {
      removeTyping();
      if (err.name === 'AbortError') {
        addMessage('Generation cancelled.', 'assistant');
      } else {
        addMessage('Error: ' + err.message, 'error');
      }
    } finally {
      dom.sendBtn.disabled = false;
      abortController = null;
    }
  }

  dom.sendBtn.addEventListener('click', () => sendPrompt(dom.promptInput.value));

  dom.promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(dom.promptInput.value);
    }
  });

  dom.promptInput.addEventListener('input', () => {
    dom.promptInput.style.height = 'auto';
    dom.promptInput.style.height = Math.min(dom.promptInput.scrollHeight, 120) + 'px';
  });

  dom.deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.deviceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dom.preview.classList.toggle('mobile', btn.dataset.device === 'mobile');
    });
  });

  dom.clearBtn.addEventListener('click', () => {
    dom.preview.src = 'about:blank';
    lastResult = null;
    const btn = document.getElementById('sendDesktopBtn');
    if (btn) btn.style.display = 'none';
  });

  async function sendToDesktop () {
    if (!lastResult) {
      addMessage('Nothing to send — generate a UI first.', 'error');
      return;
    }
    if (!desktopURL) {
      addMessage('Set the desktop IP first: WebhooksEmail.setDesktopIP("192.168.x.x")', 'error');
      return;
    }
    const html = lastResult.html || '';
    const css = lastResult.css || '';
    const js = lastResult.js || '';
    const fullDoc = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>${css}</style></head>
<body>${html}
<script>${js}<\/script>
</body>
</html>`;
    const msg = addMessage('Sending to desktop…', 'typing');
    try {
      const res = await fetch(desktopURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'wek_desktop_sync_key_change_me',
        },
        body: JSON.stringify({
          filename: 'webhooks-ui.html',
          content: fullDoc,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      removeTyping();
      addMessage('Sent to desktop! Open webhooks-ui.html on your laptop.', 'assistant');
    } catch (err) {
      removeTyping();
      addMessage('Desktop send failed: ' + err.message, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('sendDesktopBtn');
    if (btn) {
      btn.addEventListener('click', sendToDesktop);
      btn.style.display = 'none';
    }
  });

  window.WebhooksEmail = { setApiKey, setBaseURL, setProxyEndpoint, setDesktopIP, sendPrompt, sendToDesktop };
})();
