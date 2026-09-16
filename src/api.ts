// Cliente de la API. Todo cuelga de /lsrp/api (backend de ReXyo, mismo origen
// cuando la web se sirve bajo /lsrp).
import type { Landing, Mapeado, Normativas, PublicData, Settings } from './types';

const BASE = '/lsrp/api';

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { ...(opts.body ? { 'content-type': 'application/json' } : {}), ...(opts.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((data as any).error || 'error'), { status: r.status, data });
  return data as T;
}

export const api = {
  // ── Público ──
  public: () => req<PublicData>('/public'),
  normativas: () => req<Normativas>('/normativas'),
  mapeados: () => req<{ mapeados: Mapeado[] }>('/mapeados'),

  // ── Sesión del panel ──
  me: () => req<{ ok: boolean; needsSetup?: boolean }>('/admin/me'),
  login: (password: string) => req<{ ok: boolean }>('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  setup: (password: string) => req<{ ok: boolean }>('/admin/setup', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => req<{ ok: boolean }>('/admin/logout', { method: 'POST' }),
  changePassword: (actual: string, nueva: string) =>
    req<{ ok: boolean }>('/admin/password', { method: 'POST', body: JSON.stringify({ actual, nueva }) }),

  // ── Gestión (requiere sesión) ──
  saveSettings: (settings: Settings) => req<{ ok: boolean }>('/admin/settings', { method: 'POST', body: JSON.stringify(settings) }),
  saveLanding: (landing: Landing) => req<{ ok: boolean }>('/admin/landing', { method: 'POST', body: JSON.stringify(landing) }),
  saveNormativas: (n: Normativas) => req<{ ok: boolean }>('/admin/normativas', { method: 'POST', body: JSON.stringify(n) }),

  listMapeados: () => req<{ mapeados: Mapeado[] }>('/admin/mapeados'),
  saveMapeado: (m: Mapeado) => req<{ ok: boolean; mapeado: Mapeado }>('/admin/mapeados', { method: 'POST', body: JSON.stringify(m) }),
  deleteMapeado: (id: string) => req<{ ok: boolean }>('/admin/mapeados/' + encodeURIComponent(id), { method: 'DELETE' }),

  upload: async (file: File): Promise<{ url: string }> => {
    const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    const r = await fetch(BASE + '/admin/media?name=' + encodeURIComponent(file.name), {
      method: 'PUT', headers: { 'content-type': type }, body: file,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error((data as any).error || 'error'), { status: r.status });
    return data as { url: string };
  },
};
