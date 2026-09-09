import { useState } from 'react';
import { api } from '../api';
import { Icon } from '../icons';
import { ZoneMap } from '../components/ZoneMap';
import type { Link as TLink, MapConfig, Settings } from '../types';
import { Field, Uploader, type Notify } from './widgets';

export function AdminSettings({ value, onChange, notify }: { value: Settings; onChange: (s: Settings) => void; notify: Notify }) {
  const [d, setD] = useState<Settings>(value);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Settings>) => setD((p) => ({ ...p, ...patch }));
  const setMap = (patch: Partial<MapConfig>) => set({ map: { ...d.map, ...patch } });

  async function save() {
    setBusy(true);
    try { await api.saveSettings(d); onChange(d); notify('Ajustes guardados'); }
    catch { notify('No se pudo guardar', 'err'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="admin-main-head">
        <h1>Ajustes</h1>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>

      {/* General */}
      <div className="subcard">
        <h3 style={{ marginBottom: 12 }}>General</h3>
        <div className="grid-2">
          <Field label="Nombre del servidor"><input className="input" value={d.serverName} onChange={(e) => set({ serverName: e.target.value })} /></Field>
          <Field label="Texto del botón «Conectar»"><input className="input" value={d.connectLabel} onChange={(e) => set({ connectLabel: e.target.value })} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Enlace de Discord"><input className="input" value={d.discordUrl} onChange={(e) => set({ discordUrl: e.target.value })} /></Field>
          <Field label="Enlace de la tienda (Tebex)"><input className="input" value={d.tebexUrl} onChange={(e) => set({ tebexUrl: e.target.value })} /></Field>
        </div>
        <Field label="Logo">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="thumb" style={{ width: 60, height: 60, background: '#0d0d0d', display: 'grid', placeItems: 'center' }}>
              <img src={d.logoUrl || '/lsrp/logo.png'} alt="" style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <input className="input" placeholder="URL del logo (vacío = logo por defecto)" value={d.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} />
              <div style={{ marginTop: 6 }}><Uploader notify={notify} onDone={(u) => set({ logoUrl: u[0] })} label="Subir logo" /></div>
            </div>
          </div>
        </Field>
        <div className="grid-2">
          <Field label="Color principal (botones)"><ColorInput value={d.colors.primary} onChange={(v) => set({ colors: { ...d.colors, primary: v } })} /></Field>
          <Field label="Color de acento (enlaces)"><ColorInput value={d.colors.accent} onChange={(v) => set({ colors: { ...d.colors, accent: v } })} /></Field>
        </div>
      </div>

      {/* Menú y redes */}
      <div className="grid-2">
        <LinkList title="Menú de navegación" items={d.nav} onChange={(nav) => set({ nav })} hint="Usa #/ , #/normativas o #/casas para páginas internas; una URL para enlaces externos." />
        <LinkList title="Enlaces del pie" items={d.socials} onChange={(socials) => set({ socials })} />
      </div>

      {/* Mapa */}
      <div className="subcard">
        <h3 style={{ marginBottom: 12 }}>Mapa (GTA V)</h3>
        <Field label="Fuente del mapa">
          <select className="select" value={d.map.mode} onChange={(e) => setMap({ mode: e.target.value as MapConfig['mode'] })}>
            <option value="image">Imagen única (placeholder, funciona sin tiles)</option>
            <option value="gta">Tiles de GTA V (RiceaRaul) — recomendado</option>
          </select>
        </Field>

        {d.map.mode === 'image' ? (
          <>
            <Field label="Imagen del mapa" hint="Sube la imagen del mapa (cuadrada, p. ej. 2048×2048).">
              <input className="input" value={d.map.imageUrl} onChange={(e) => setMap({ imageUrl: e.target.value })} />
              <div style={{ marginTop: 6 }}><Uploader notify={notify} onDone={(u) => setMap({ imageUrl: u[0] })} label="Subir imagen del mapa" /></div>
            </Field>
            <div className="grid-2">
              <Field label="Ancho (px)"><input className="input" type="number" value={d.map.imageW} onChange={(e) => setMap({ imageW: +e.target.value })} /></Field>
              <Field label="Alto (px)"><input className="input" type="number" value={d.map.imageH} onChange={(e) => setMap({ imageH: +e.target.value })} /></Field>
            </div>
          </>
        ) : (
          <>
            <Field label="URL base de los tiles"
              hint="Cargará <base>/styleSatelite|styleAtlas|styleGrid/{z}/{x}/{y}.jpg|png. Si pones la carpeta de tiles en public/mapStyles, usa /lsrp/mapStyles.">
              <input className="input" placeholder="/lsrp/mapStyles" value={d.map.tileBaseUrl} onChange={(e) => setMap({ tileBaseUrl: e.target.value.replace(/\/+$/, '') })} />
            </Field>
            <div className="grid-3">
              <Field label="Estilo por defecto">
                <select className="select" value={d.map.defaultStyle} onChange={(e) => setMap({ defaultStyle: e.target.value as MapConfig['defaultStyle'] })}>
                  <option value="atlas">Atlas</option>
                  <option value="satellite">Satélite</option>
                  <option value="grid">Grid</option>
                </select>
              </Field>
              <Field label="Zoom mínimo"><input className="input" type="number" value={d.map.minZoom} onChange={(e) => setMap({ minZoom: +e.target.value })} /></Field>
              <Field label="Zoom máximo"><input className="input" type="number" value={d.map.maxZoom} onChange={(e) => setMap({ maxZoom: +e.target.value })} /></Field>
            </div>
          </>
        )}

        <div className="field">
          <span>Vista previa (las áreas de zona se dibujan en «Zonas y mapa»)</span>
          <div className="pick-map"><ZoneMap map={d.map} zonas={d.zonas} showStyles /></div>
        </div>
      </div>

      {/* SEO */}
      <div className="subcard">
        <h3 style={{ marginBottom: 12 }}>SEO</h3>
        <Field label="Título de la página"><input className="input" value={d.seo.title} onChange={(e) => set({ seo: { ...d.seo, title: e.target.value } })} /></Field>
        <Field label="Descripción"><input className="input" value={d.seo.description} onChange={(e) => set({ seo: { ...d.seo, description: e.target.value } })} /></Field>
      </div>
    </>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 46, height: 40, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function LinkList({ title, items, onChange, hint }: { title: string; items: TLink[]; onChange: (l: TLink[]) => void; hint?: string }) {
  const patch = (i: number, p: Partial<TLink>) => onChange(items.map((x, j) => j === i ? { ...x, ...p } : x));
  return (
    <div className="subcard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3>{title}</h3>
        <button className="btn btn-sm" onClick={() => onChange([...items, { label: '', href: '' }])}><Icon name="plus" size={14} /> Añadir</button>
      </div>
      {items.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="input" placeholder="Texto" value={l.label} onChange={(e) => patch(i, { label: e.target.value })} />
          <input className="input" placeholder="Enlace" value={l.href} onChange={(e) => patch(i, { href: e.target.value })} />
          <button className="icon-btn" onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="trash" size={15} /></button>
        </div>
      ))}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
