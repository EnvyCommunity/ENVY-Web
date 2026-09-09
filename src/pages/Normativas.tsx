import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { DEFAULT_NORMATIVAS } from '../defaults';
import { Icon } from '../icons';
import type { Normativas as TNorm, Settings } from '../types';

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function Normativas({ settings }: { settings: Settings }) {
  const [data, setData] = useState<TNorm>(DEFAULT_NORMATIVAS);
  const [active, setActive] = useState<string>('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.normativas()
      .then((d) => { if (d && d.secciones?.length) setData(d); })
      .catch(() => { /* respaldo */ });
  }, []);

  useEffect(() => {
    if (!active && data.secciones[0]) setActive(data.secciones[0].id);
  }, [data, active]);

  // Buscador: filtra secciones/artículos por texto (título + cuerpo).
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data.secciones;
    return data.secciones
      .map((s) => ({
        ...s,
        articulos: s.articulos.filter((a) =>
          (a.title + ' ' + stripHtml(a.html)).toLowerCase().includes(term)),
      }))
      .filter((s) => s.title.toLowerCase().includes(term) || s.articulos.length);
  }, [data, q]);

  const current = q.trim()
    ? filtered
    : data.secciones.filter((s) => s.id === active);

  return (
    <>
      <div className="page-head">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div className="crumbs"><a href="#/">Inicio</a> / <span>Normativas</span></div>
            <h1 className="page-title">NORMATIVAS</h1>
            <p className="page-sub">{data.intro}</p>
          </div>
          <div className="norm-search" style={{ minWidth: 280, marginTop: 24 }}>
            <Icon name="search" size={17} />
            <input className="input" placeholder="Buscar norma…" value={q} onChange={(e) => setQ(e.target.value)} />
            {!q && <span className="kbd">Ctrl K</span>}
          </div>
        </div>
      </div>

      <div className="wrap norm">
        <aside className="norm-side">
          <nav className="norm-nav">
            {data.secciones.map((s) => (
              <button key={s.id}
                className={'norm-nav-item' + (!q && s.id === active ? ' active' : '')}
                onClick={() => { setQ(''); setActive(s.id); }}>
                <Icon name={s.icon} size={18} /> {s.title}
              </button>
            ))}
          </nav>
        </aside>

        <section className="norm-body">
          {current.length === 0 && (
            <p className="muted">No se han encontrado normas para «{q}».</p>
          )}
          {current.map((s) => (
            <div key={s.id} style={{ marginBottom: 34 }}>
              {q && <h2 className="sec" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name={s.icon} size={22} /> {s.title}</h2>}
              {s.articulos.map((a) => (
                <article className="norm-art" key={a.id}>
                  <h3>{a.title}</h3>
                  <div className="rt" dangerouslySetInnerHTML={{ __html: a.html }} />
                </article>
              ))}
            </div>
          ))}
          <div className="callout" style={{ marginTop: 30 }}>
            <Icon name="discord" size={20} />
            <div>¿Dudas sobre alguna norma? Pregunta al staff en el <a href={settings.discordUrl || '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Discord</a>.</div>
          </div>
        </section>
      </div>
    </>
  );
}
