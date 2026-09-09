import { useState } from 'react';
import { api } from '../api';
import { Icon } from '../icons';
import { ZoneMap } from '../components/ZoneMap';
import type { Settings, Zona } from '../types';
import { Field, type Notify } from './widgets';

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'zona';

export function AdminZonas({ settings, onChange, notify }: { settings: Settings; onChange: (s: Settings) => void; notify: Notify }) {
  const [zonas, setZonas] = useState<Zona[]>(settings.zonas.map((z) => ({ ...z, polygon: (z.polygon || []) as [number, number][] })));
  const [sel, setSel] = useState(0);
  const [busy, setBusy] = useState(false);

  const setZona = (i: number, patch: Partial<Zona>) => setZonas((zs) => zs.map((z, j) => j === i ? { ...z, ...patch } : z));
  const cur = zonas[sel];

  function addZona() {
    const key = 'zona' + (zonas.length + 1);
    setZonas((zs) => [...zs, { key, label: 'Nueva zona', color: '#3ba9ff', polygon: [] }]);
    setSel(zonas.length);
  }
  function removeZona(i: number) {
    if (!confirm('¿Eliminar esta zona?')) return;
    setZonas((zs) => zs.filter((_, j) => j !== i));
    setSel(0);
  }

  async function save() {
    setBusy(true);
    try {
      const next = { ...settings, zonas };
      await api.saveSettings(next);
      onChange(next);
      notify('Zonas guardadas');
    } catch { notify('No se pudo guardar', 'err'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="admin-main-head">
        <h1>Zonas y mapa</h1>
        <div className="toolbar">
          <button className="btn btn-sm" onClick={addZona}><Icon name="plus" size={15} /> Nueva zona</button>
          <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }} className="zonas-grid">
        <div className="card zona-list" style={{ padding: 10 }}>
          {zonas.map((z, i) => (
            <button key={i} className={'admin-nav' + (i === sel ? ' active' : '')} onClick={() => setSel(i)}>
              <span className="dot" style={{ background: z.color }} />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.label}</span>
              <span style={{ color: 'var(--text-4)', fontSize: 11 }}>{z.polygon.length || 0}p</span>
            </button>
          ))}
          {zonas.length === 0 && <div className="hint" style={{ padding: 8 }}>Sin zonas. Crea la primera.</div>}
        </div>

        <div>
          {cur ? (
            <>
              <div className="subcard" style={{ marginBottom: 12 }}>
                <div className="grid-3">
                  <Field label="Nombre">
                    <input className="input" value={cur.label}
                      onChange={(e) => setZona(sel, { label: e.target.value, key: cur.key || slug(e.target.value) })} />
                  </Field>
                  <Field label="Clave"><input className="input" value={cur.key} onChange={(e) => setZona(sel, { key: slug(e.target.value) })} /></Field>
                  <Field label="Color">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={cur.color} onChange={(e) => setZona(sel, { color: e.target.value })} style={{ width: 46, height: 40, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
                      <input className="input" value={cur.color} onChange={(e) => setZona(sel, { color: e.target.value })} />
                    </div>
                  </Field>
                </div>
                <div className="toolbar">
                  <button className="btn btn-sm" onClick={() => setZona(sel, { polygon: cur.polygon.slice(0, -1) })} disabled={!cur.polygon.length}>
                    <Icon name="arrow" size={14} style={{ transform: 'scaleX(-1)' }} /> Deshacer punto
                  </button>
                  <button className="btn btn-sm" onClick={() => setZona(sel, { polygon: [] })} disabled={!cur.polygon.length}>Vaciar área</button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeZona(sel)}><Icon name="trash" size={14} /> Eliminar zona</button>
                  <span className="hint" style={{ marginLeft: 'auto' }}>{cur.polygon.length} punto(s)</span>
                </div>
              </div>

              <div className="pick-map">
                <ZoneMap map={settings.map} zonas={zonas} editKey={cur.key} editColor={cur.color}
                  editPolygon={cur.polygon} onEditPolygon={(poly) => setZona(sel, { polygon: poly })} showStyles />
              </div>
              <div className="hint" style={{ marginTop: 8 }}>Dibuja el área de la zona pulsando en el mapa. Necesita al menos 3 puntos para formar un polígono.</div>
            </>
          ) : <div className="card card-pad muted">Crea una zona para empezar.</div>}
        </div>
      </div>
    </>
  );
}
