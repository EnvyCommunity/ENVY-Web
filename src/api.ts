// Cliente de la API propia del Worker (/lsrp/api, mismo origen en producción).
import type { Landing, Mapeado, Normativas, PublicData, Settings } from './types';

const BASE = '/lsrp/api';

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(BASE + path, {
    ...opts,
    cache: 'no-store',
    credentials: 'same-origin',
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
  saveNormativas: (n: Normativas) =>
    req<{ ok: boolean; normativas?: Normativas }>('/admin/normativas', { method: 'POST', body: JSON.stringify(n) }),
  deleteNormDoc: (id: string) =>
    req<{ ok: boolean; normativas: Normativas }>('/admin/normativas', {
      method: 'POST',
      body: JSON.stringify({ _deleteDocId: id }),
    }),

  listMapeados: () => req<{ mapeados: Mapeado[] }>('/admin/mapeados'),
  saveMapeado: (m: Mapeado) => req<{ ok: boolean; mapeado: Mapeado }>('/admin/mapeados', { method: 'POST', body: JSON.stringify(m) }),
  deleteMapeado: async (id: string) => {
    try {
      return await req<{ ok: boolean }>('/admin/mapeados/' + encodeURIComponent(id), { method: 'DELETE' });
    } catch (e: any) {
      // Algunos proxies bloquean DELETE: fallback por POST.
      if (e?.status === 404 || e?.status === 405 || e?.status === 501) {
        return req<{ ok: boolean }>('/admin/mapeados', {
          method: 'POST',
          body: JSON.stringify({ id, _delete: true }),
        });
      }
      throw e;
    }
  },

  /** Extrae la key R2 de una URL /lsrp/api/media?k=… (o null si no es media nuestra). */
  mediaKey(url: string): string | null {
    try {
      const u = new URL(url, typeof location !== 'undefined' ? location.origin : 'https://local');
      const k = u.searchParams.get('k');
      return k && k.startsWith('lsrp/') ? k : null;
    } catch {
      return null;
    }
  },

  deleteMedia: async (urlOrKey: string): Promise<void> => {
    const key = urlOrKey.startsWith('lsrp/') ? urlOrKey : api.mediaKey(urlOrKey);
    if (!key) return;
    const r = await fetch(BASE + '/admin/media?k=' + encodeURIComponent(key), {
      method: 'DELETE',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!r.ok && r.status !== 404 && r.status !== 405) {
      const data = await r.json().catch(() => ({}));
      throw Object.assign(new Error((data as any).error || 'error'), { status: r.status });
    }
  },

  upload: async (file: File): Promise<{ url: string }> => {
    const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    const r = await fetch(BASE + '/admin/media?name=' + encodeURIComponent(file.name), {
      method: 'PUT',
      headers: { 'content-type': type },
      body: file,
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error((data as any).error || 'error'), { status: r.status });
    return data as { url: string };
  },
};
