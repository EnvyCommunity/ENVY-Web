import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { DEFAULT_MAPEADOS } from '../defaults';
import { Icon } from '../icons';
import { ZoneMap } from '../components/ZoneMap';
import { Modal } from '../components/Modal';
import type { Mapeado, Settings } from '../types';

const eur = (n: number) => '$' + (Number(n) || 0).toLocaleString('es-ES');

export function Casas({ settings }: { settings: Settings }) {
  const [mapeados, setMapeados] = useState<Mapeado[]>(DEFAULT_MAPEADOS);
  const [zona, setZona] = useState('');
  const [detalle, setDetalle] = useState<Mapeado | null>(null);

  useEffect(() => {
    api.mapeados().then((d) => { if (d.mapeados) setMapeados(d.mapeados); }).catch(() => { /* respaldo */ });
  }, []);

  const zonaInfo = (k: string) => settings.zonas.find((z) => z.key === k);
  const filtrados = useMemo(() => mapeados
    .filter((m) => !zona || m.zona === zona)
    .sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) || a.orden - b.orden), [mapeados, zona]);

  // Cuántos mapeados por zona (para la lista de filtros).
  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    mapeados.forEach((m) => { c[m.zona] = (c[m.zona] || 0) + 1; });
    return c;
  }, [mapeados]);

  return (
    <>
      <div className="page-head">
        <div className="wrap casas-top">
          <div>
            <div className="crumbs"><a href="#/">Inicio</a> / <span>Casas</span></div>
            <h1 className="page-title">SISTEMA DE CASAS</h1>
            <p className="page-sub">Explora el mapa por zonas. Pulsa una zona para ver sus mapeados interiores disponibles.</p>
          </div>
          <div className="toolbar">
            <span className="badge" style={{ background: 'var(--fill-3)', color: 'var(--text-2)' }}>
              <Icon name="layers" size={15} /> {filtrados.length} mapeados
            </span>
            <a className="btn btn-sm" href={settings.discordUrl || '#'} target="_blank" rel="noreferrer">¿Cómo comprar?</a>
          </div>
        </div>
      </div>

      <div className="wrap">
        {/* ── Barra de zonas (widget de chips) ── */}
        <div className="zone-chips">
          <button className={'zone-chip' + (zona === '' ? ' active' : '')}
            style={zona === '' ? { background: 'var(--accent)', color: '#04121f' } : undefined}
            onClick={() => setZona('')}>
            Todas <span className="n">{mapeados.length}</span>
          </button>
          {settings.zonas.map((z) => (
            <button key={z.key} className={'zone-chip' + (zona === z.key ? ' active' : '')}
              style={zona === z.key ? { background: z.color, color: '#111' } : undefined}
              onClick={() => setZona((prev) => (prev === z.key ? '' : z.key))}>
              <span className="dot" style={{ background: zona === z.key ? '#111' : z.color }} /> {z.label}
              <span className="n" style={zona === z.key ? { color: 'rgba(0,0,0,.55)' } : undefined}>{conteo[z.key] || 0}</span>
            </button>
          ))}
        </div>

        <div className="casas-main">
          {/* ── Mapa por zonas ── */}
          <ZoneMap map={settings.map} zonas={settings.zonas} selectedZona={zona || null}
            onZonaClick={(k) => setZona((prev) => (prev === k ? '' : k))} />

          {/* ── Mapeados de la zona ── */}
          <div className="props">
            <div className="props-head">
              {zona
                ? <div className="badge" style={{ background: (zonaInfo(zona)?.color || '#3ba9ff') + '22', color: zonaInfo(zona)?.color }}>
                    <span className="dot" style={{ background: zonaInfo(zona)?.color }} /> {zonaInfo(zona)?.label}
                  </div>
                : <div className="muted-3" style={{ fontSize: 13 }}>Mostrando todos los mapeados</div>}
            </div>
            {filtrados.length === 0 && <p className="muted">No hay mapeados en esta zona todavía.</p>}
          {filtrados.map((m) => {
            const zi = zonaInfo(m.zona);
            return (
              <article className="prop hover-lift" key={m.id} onClick={() => setDetalle(m)} style={{ cursor: 'pointer' }}>
                <div className="prop-media">
                  {m.imgs[0] ? <img src={m.imgs[0]} alt={m.nombre} /> : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-4)' }}><Icon name="image" size={40} /></div>
                  )}
                  {zi && <span className="badge clase-badge" style={{ background: zi.color + 'dd', color: '#111' }}>{zi.label}</span>}
                  {m.destacado && <span className="badge estado" style={{ background: 'rgba(0,0,0,.6)', color: 'var(--warn)' }}><Icon name="star" size={12} /> Destacado</span>}
                </div>
                <div className="prop-body">
                  <div className="prop-title">
                    <h4>{m.nombre}</h4>
                    {m.precio > 0 && <span className="prop-price">{eur(m.precio)}</span>}
                  </div>
                  {zi && <div className="prop-zone"><Icon name="pin" size={14} /> {zi.label}</div>}
                  <button className="btn btn-sm btn-block" onClick={(e) => { e.stopPropagation(); setDetalle(m); }}>
                    Ver mapeado <Icon name="arrow" size={14} />
                  </button>
                </div>
              </article>
            );
          })}
          </div>
        </div>
      </div>

      {detalle && <MapeadoDetalle mapeado={detalle} settings={settings} onClose={() => setDetalle(null)} />}
    </>
  );
}

function MapeadoDetalle({ mapeado, settings, onClose }: { mapeado: Mapeado; settings: Settings; onClose: () => void }) {
  const [big, setBig] = useState<string | null>(null);
  const zi = settings.zonas.find((z) => z.key === mapeado.zona);
  return (
    <Modal wide title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{mapeado.nombre}
      {zi && <span className="badge" style={{ background: zi.color + '22', color: zi.color }}>{zi.label}</span>}</span>} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }} className="detalle-grid">
        <div>
          <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', background: '#111' }}>
            {(big || mapeado.imgs[0])
              ? <img src={big || mapeado.imgs[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-4)' }}><Icon name="image" size={48} /></div>}
          </div>
          {mapeado.imgs.length > 1 && (
            <div className="gallery" style={{ marginTop: 8 }}>
              {mapeado.imgs.map((u, i) => <img key={i} src={u} onClick={() => setBig(u)} alt="" />)}
            </div>
          )}
        </div>
        <div>
          {mapeado.precio > 0 && <div style={{ fontSize: 30, fontWeight: 800 }}>{eur(mapeado.precio)}</div>}
          {zi && <div className="prop-zone" style={{ marginTop: 4 }}><Icon name="pin" size={15} /> {zi.label}</div>}
          {mapeado.descripcion && <p className="muted" style={{ marginTop: 14 }}>{mapeado.descripcion}</p>}
          <a className="btn pill-discord btn-block" style={{ marginTop: 16 }} href={settings.discordUrl || '#'} target="_blank" rel="noreferrer">
            <Icon name="discord" size={18} /> Consultar en Discord
          </a>
        </div>
      </div>
    </Modal>
  );
}
