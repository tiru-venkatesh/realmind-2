import { auth } from './firebase.js';

const BASE_URL = import.meta.env.VITE_API_URL;

async function authHeader() {
  const token = await auth.currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function request(method, path, body) {
  const headers = await authHeader();
  const res = await fetch(BASE_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed'); }
  return res.json();
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),

  async stream(path, body, onDelta, onDone) {
    const headers = await authHeader();
    const res = await fetch(BASE_URL + path, { method: 'POST', headers, body: JSON.stringify(body) });
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = dec.decode(value).split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { onDone(); return; }
        try { onDelta(JSON.parse(payload).delta); } catch {}
      }
    }
    onDone();
  },
};
