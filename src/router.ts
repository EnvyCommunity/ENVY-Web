import { useEffect, useState } from 'react';

// Router por hash: robusto sobre assets estáticos de Cloudflare (sin fallback
// SPA en el servidor). Rutas: '', 'normativas', 'casas', 'admin'.
export function currentPath(): string {
  return location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
}

export function navigate(to: string) {
  const clean = to.replace(/^#?\/?/, '');
  if (currentPath() !== clean) location.hash = '/' + clean;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function useRoute(): string {
  const [path, setPath] = useState(currentPath());
  useEffect(() => {
    const on = () => setPath(currentPath());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}
