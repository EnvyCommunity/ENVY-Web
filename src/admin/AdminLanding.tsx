import { useState } from 'react';
import { api } from '../api';
import { ICON_NAMES, Icon } from '../icons';
import type { Feature, Landing } from '../types';
import { Field, TextArea, Uploader, type Notify } from './widgets';

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

function ImgField({ label, url, onChange, notify }: { label: string; url: string; onChange: (u: string) => void; notify: Notify }) {
  return (
    <Field label={label}>
      <input className="input" placeholder="URL de la imagen (o súbela abajo)" value={url} onChange={(e) => onChange(e.target.value)} />
      <div style={{ marginTop: 6 }}><Uploader notify={notify} onDone={(u) => onChange(u[0])} label="Subir imagen" /></div>
      {url && <div className="thumb" style={{ width: 120, height: 68, marginTop: 8 }}><img src={url} alt="" /></div>}
    </Field>
  );
}

export function AdminLanding({ value, onChange, notify }: { value: Landing; onChange: (l: Landing) => void; notify: Notify }) {
  const [d, setD] = useState<Landing>(value);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Landing>) => setD((p) => ({ ...p, ...patch }));

  async function save() {
    setBusy(true);
    try { await api.saveLanding(d); onChange(d); notify('Landing guardada'); }
    catch { notify('No se pudo guardar', 'err'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="admin-main-head">
        <h1>Contenido landing</h1>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>

      <div className="subcard">
        <h3 style={{ marginBottom: 14 }}>Hero (cabecera)</h3>
        <Field label="Antetítulo"><input className="input" value={d.hero.eyebrow} onChange={(e) => set({ hero: { ...d.hero, eyebrow: e.target.value } })} /></Field>
        <Field label="Título (una línea por salto)" hint="Usa Enter para partir el título en dos líneas."><TextArea rows={2} value={d.hero.title} onChange={(v) => set({ hero: { ...d.hero, title: v } })} /></Field>
        <Field label="Subtítulo"><TextArea value={d.hero.subtitle} onChange={(v) => set({ hero: { ...d.hero, subtitle: v } })} /></Field>
        <ImgField label="Imagen de fondo del hero" url={d.hero.bg} onChange={(u) => set({ hero: { ...d.hero, bg: u } })} notify={notify} />
        <div className="grid-2">
          <div className="subcard" style={{ background: 'var(--bg-base)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Botón principal</div>
            <Field label="Texto"><input className="input" value={d.hero.ctaPrimary.label} onChange={(e) => set({ hero: { ...d.hero, ctaPrimary: { ...d.hero.ctaPrimary, label: e.target.value } } })} /></Field>
            <Field label="Enlace"><input className="input" value={d.hero.ctaPrimary.href} onChange={(e) => set({ hero: { ...d.hero, ctaPrimary: { ...d.hero.ctaPrimary, href: e.target.value } } })} /></Field>
          </div>
          <div className="subcard" style={{ background: 'var(--bg-base)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Botón secundario</div>
            <Field label="Texto"><input className="input" value={d.hero.ctaSecondary.label} onChange={(e) => set({ hero: { ...d.hero, ctaSecondary: { ...d.hero.ctaSecondary, label: e.target.value } } })} /></Field>
            <Field label="Enlace"><input className="input" value={d.hero.ctaSecondary.href} onChange={(e) => set({ hero: { ...d.hero, ctaSecondary: { ...d.hero.ctaSecondary, href: e.target.value } } })} /></Field>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="subcard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Estadísticas</h3>
          <button className="btn btn-sm" onClick={() => set({ stats: [...d.stats, { icon: 'star', value: '', label: '' }] })}><Icon name="plus" size={14} /> Añadir</button>
        </div>
        {d.stats.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 40px', gap: 8, marginBottom: 8 }}>
            <IconSelect value={s.icon} onChange={(v) => set({ stats: patch(d.stats, i, { icon: v }) })} />
            <input className="input" placeholder="Valor (+2.500)" value={s.value} onChange={(e) => set({ stats: patch(d.stats, i, { value: e.target.value }) })} />
            <input className="input" placeholder="Etiqueta (Miembros)" value={s.label} onChange={(e) => set({ stats: patch(d.stats, i, { label: e.target.value }) })} />
            <button className="icon-btn" onClick={() => set({ stats: d.stats.filter((_, j) => j !== i) })}><Icon name="trash" size={15} /></button>
          </div>
        ))}
      </div>

      {/* Sección de características */}
      <div className="subcard">
        <h3 style={{ marginBottom: 12 }}>Sección de secciones</h3>
        <Field label="Antetítulo"><input className="input" value={d.featuresEyebrow} onChange={(e) => set({ featuresEyebrow: e.target.value })} /></Field>
        <Field label="Título (una línea por salto)"><TextArea rows={2} value={d.featuresTitle} onChange={(v) => set({ featuresTitle: v })} /></Field>
        <Field label="Subtítulo"><input className="input" value={d.featuresSubtitle} onChange={(e) => set({ featuresSubtitle: e.target.value })} /></Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
          <div className="eyebrow">Tarjetas</div>
          <button className="btn btn-sm" onClick={() => set({ features: [...d.features, { icon: 'star', title: '', text: '', link: { label: '', href: '' } }] })}><Icon name="plus" size={14} /> Añadir</button>
        </div>
        {d.features.map((f, i) => (
          <div className="subcard" style={{ background: 'var(--bg-base)' }} key={i}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 130 }}><IconSelect value={f.icon} onChange={(v) => set({ features: patch(d.features, i, { icon: v }) })} /></div>
              <input className="input" placeholder="Título" value={f.title} onChange={(e) => set({ features: patch(d.features, i, { title: e.target.value }) })} />
              <button className="icon-btn" onClick={() => set({ features: d.features.filter((_, j) => j !== i) })}><Icon name="trash" size={15} /></button>
            </div>
            <input className="input" placeholder="Texto" style={{ marginBottom: 8 }} value={f.text} onChange={(e) => set({ features: patch(d.features, i, { text: e.target.value }) })} />
            <div className="row">
              <input className="input" placeholder="Texto del enlace" value={f.link.label} onChange={(e) => set({ features: patch<Feature>(d.features, i, { link: { ...f.link, label: e.target.value } }) })} />
              <input className="input" placeholder="Enlace (#/normativas o URL)" value={f.link.href} onChange={(e) => set({ features: patch<Feature>(d.features, i, { link: { ...f.link, href: e.target.value } }) })} />
            </div>
          </div>
        ))}
      </div>

      {/* Banner */}
      <div className="subcard">
        <h3 style={{ marginBottom: 12 }}>Banner inferior</h3>
        <Field label="Título (una línea por salto)"><TextArea rows={2} value={d.banner.title} onChange={(v) => set({ banner: { ...d.banner, title: v } })} /></Field>
        <Field label="Texto"><TextArea value={d.banner.text} onChange={(v) => set({ banner: { ...d.banner, text: v } })} /></Field>
        <ImgField label="Imagen de fondo del banner" url={d.banner.bg} onChange={(u) => set({ banner: { ...d.banner, bg: u } })} notify={notify} />
      </div>
    </>
  );
}

function patch<T>(arr: T[], i: number, p: Partial<T>): T[] {
  return arr.map((x, j) => j === i ? { ...x, ...p } : x);
}
