import { useEffect, useState } from 'react';
import { api } from '../api';
import { DEFAULT_NORMATIVAS } from '../defaults';
import { Icon } from '../icons';
import type { Normativas as TNorm, Settings } from '../types';

export function Normativas({ settings }: { settings: Settings }) {
  const [data, setData] = useState<TNorm>(DEFAULT_NORMATIVAS);
  const [active, setActive] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.normativas()
      .then((d) => {
        if (d && Array.isArray(d.docs)) setData({ intro: d.intro || '', docs: d.docs });
        else if (d) setData({ intro: d.intro || DEFAULT_NORMATIVAS.intro, docs: [] });
      })
      .catch(() => { /* respaldo */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active && data.docs[0]) setActive(data.docs[0].id);
  }, [data, active]);

  const current = data.docs.find((d) => d.id === active) || data.docs[0];

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="crumbs"><a href="#/">Inicio</a> / <span>Normativas</span></div>
          <h1 className="page-title">NORMATIVAS</h1>
          <p className="page-sub">{data.intro}</p>
        </div>
      </div>

      <div className="wrap norm">
        {data.docs.length > 1 && (
          <aside className="norm-side">
            <nav className="norm-nav">
              {data.docs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={'norm-nav-item' + (d.id === current?.id ? ' active' : '')}
                  onClick={() => setActive(d.id)}
                >
                  <Icon name={d.icon || 'book'} size={18} /> {d.title}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <section className={'norm-body' + (data.docs.length <= 1 ? ' norm-body-full' : '')}>
          {loading ? (
            <div className="loading" style={{ minHeight: 280 }}><div className="spinner" /></div>
          ) : !current?.pdfUrl ? (
            <div className="card card-pad muted">
              Aún no hay normativas publicadas. Vuelve pronto o pregunta al staff en Discord.
            </div>
          ) : (
            <>
              <div className="pdf-toolbar">
                <div>
                  <h2 className="sec" style={{ margin: 0 }}>{current.title}</h2>
                  {current.fileName ? <div className="hint">{current.fileName}</div> : null}
                </div>
                <div className="hero-cta" style={{ marginTop: 0 }}>
                  <a className="btn btn-sm" href={current.pdfUrl} target="_blank" rel="noreferrer">
                    Abrir en nueva pestaña
                  </a>
                  <a className="btn btn-sm btn-primary" href={current.pdfUrl} download={current.fileName || 'normativa.pdf'}>
                    Descargar PDF
                  </a>
                </div>
              </div>

              <iframe
                className="pdf-frame"
                title={current.title}
                src={current.pdfUrl + '#toolbar=1&navpanes=0&view=FitH'}
              />
            </>
          )}

          <div className="callout" style={{ marginTop: 22 }}>
            <Icon name="discord" size={20} />
            <div>
              ¿Dudas sobre alguna norma? Pregunta al staff en el{' '}
              <a href={settings.discordUrl || '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                Discord
              </a>.
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
