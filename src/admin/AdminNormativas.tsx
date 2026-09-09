import { useState } from 'react';
import { api } from '../api';
import { ICON_NAMES, Icon } from '../icons';
import type { NormArticulo, NormSeccion, Normativas } from '../types';
import { Field, TextArea, type Notify } from './widgets';

const genId = (p: string) => p + Math.random().toString(36).slice(2, 8);

export function AdminNormativas({ value, onChange, notify }: { value: Normativas; onChange: (n: Normativas) => void; notify: Notify }) {
  const [d, setD] = useState<Normativas>(value);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<Record<string, boolean>>({});

  const setSec = (i: number, patch: Partial<NormSeccion>) =>
    setD((p) => ({ ...p, secciones: p.secciones.map((s, j) => j === i ? { ...s, ...patch } : s) }));

  function addSeccion() {
    setD((p) => ({ ...p, secciones: [...p.secciones, { id: genId('sec-'), icon: 'book', title: 'Nueva sección', articulos: [] }] }));
    setActive(d.secciones.length);
  }
  function moveSeccion(i: number, dir: -1 | 1) {
    const j = i + dir; if (j < 0 || j >= d.secciones.length) return;
    const arr = d.secciones.slice(); [arr[i], arr[j]] = [arr[j], arr[i]];
    setD((p) => ({ ...p, secciones: arr })); setActive(j);
  }
  function removeSeccion(i: number) {
    if (!confirm('¿Eliminar esta sección y sus artículos?')) return;
    setD((p) => ({ ...p, secciones: p.secciones.filter((_, j) => j !== i) }));
    setActive(0);
  }

  const sec = d.secciones[active];
  const setArt = (ai: number, patch: Partial<NormArticulo>) =>
    setSec(active, { articulos: sec.articulos.map((a, j) => j === ai ? { ...a, ...patch } : a) });

  async function save() {
    setBusy(true);
    try { await api.saveNormativas(d); onChange(d); notify('Normativas guardadas'); }
    catch { notify('No se pudo guardar', 'err'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="admin-main-head">
        <h1>Normativas</h1>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>

      <Field label="Introducción (subtítulo de la página)">
        <input className="input" value={d.intro} onChange={(e) => setD({ ...d, intro: e.target.value })} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ padding: 8 }}>
          {d.secciones.map((s, i) => (
            <button key={s.id} className={'admin-nav' + (i === active ? ' active' : '')} onClick={() => setActive(i)}>
              <Icon name={s.icon} size={16} /> <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
            </button>
          ))}
          <button className="btn btn-sm btn-block" style={{ marginTop: 8 }} onClick={addSeccion}><Icon name="plus" size={14} /> Añadir sección</button>
        </div>

        {sec ? (
          <div className="card card-pad">
            <div className="grid-2">
              <Field label="Icono">
                <select className="select" value={sec.icon} onChange={(e) => setSec(active, { icon: e.target.value })}>
                  {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Título de la sección"><input className="input" value={sec.title} onChange={(e) => setSec(active, { title: e.target.value })} /></Field>
            </div>
            <div className="toolbar" style={{ marginBottom: 14 }}>
              <button className="btn btn-sm" onClick={() => moveSeccion(active, -1)}>↑ Subir</button>
              <button className="btn btn-sm" onClick={() => moveSeccion(active, 1)}>↓ Bajar</button>
              <button className="btn btn-sm btn-danger" onClick={() => removeSeccion(active)}><Icon name="trash" size={14} /> Eliminar sección</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="eyebrow">Artículos</div>
              <button className="btn btn-sm" onClick={() => setSec(active, { articulos: [...sec.articulos, { id: genId('art-'), title: 'Nuevo artículo', html: '<p></p>' }] })}>
                <Icon name="plus" size={14} /> Añadir artículo
              </button>
            </div>

            {sec.articulos.map((a, ai) => (
              <div className="subcard" key={a.id}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="input" value={a.title} onChange={(e) => setArt(ai, { title: e.target.value })} />
                  <button className="btn btn-sm" onClick={() => setPreview((p) => ({ ...p, [a.id]: !p[a.id] }))}>{preview[a.id] ? 'Editar' : 'Vista'}</button>
                  <button className="icon-btn" onClick={() => setSec(active, { articulos: sec.articulos.filter((_, j) => j !== ai) })}><Icon name="trash" size={15} /></button>
                </div>
                {preview[a.id]
                  ? <div className="rt" style={{ padding: '4px 2px' }} dangerouslySetInnerHTML={{ __html: a.html }} />
                  : <TextArea rows={5} value={a.html} onChange={(v) => setArt(ai, { html: v })} />}
              </div>
            ))}
            {sec.articulos.length === 0 && <div className="hint">Sin artículos en esta sección.</div>}
            <div className="hint" style={{ marginTop: 10 }}>Se admite HTML básico: &lt;p&gt;, &lt;ul&gt;&lt;li&gt;, &lt;strong&gt;, &lt;em&gt; y la caja destacada &lt;div class="callout"&gt;…&lt;/div&gt;.</div>
          </div>
        ) : <div className="card card-pad muted">Crea una sección para empezar.</div>}
      </div>
    </>
  );
}
