import { useState } from 'react';
import { api } from '../api';
import { Icon } from '../icons';
import { Modal } from '../components/Modal';
import type { Mapeado, Settings } from '../types';
import { Field, ImageList, TextArea, type Notify } from './widgets';

const eur = (n: number) => '$' + (Number(n) || 0).toLocaleString('es-ES');

function blank(orden: number): Mapeado {
  return { id: '', zona: '', nombre: '', imgs: [], precio: 0, descripcion: '', destacado: false, orden };
}

export function AdminMapeados({ mapeados, setMapeados, settings, notify }: {
  mapeados: Mapeado[]; setMapeados: (m: Mapeado[]) => void; settings: Settings; notify: Notify;
}) {
  const [editing, setEditing] = useState<Mapeado | null>(null);
  const zonaInfo = (k: string) => settings.zonas.find((z) => z.key === k);

  async function remove(m: Mapeado) {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return;
    try {
      await api.deleteMapeado(m.id);
      const check = await api.listMapeados().catch(() => null);
      if (check && check.mapeados.some((x) => x.id === m.id)) {
        notify('El servidor no borró el mapeado. Hay que actualizar el backend.', 'err');
        return;
      }
      for (const u of m.imgs || []) {
        try { await api.deleteMedia(u); } catch { /* best-effort */ }
      }
      setMapeados((check?.mapeados) || mapeados.filter((x) => x.id !== m.id));
      notify('Mapeado eliminado');
    } catch {
      notify('No se pudo eliminar', 'err');
    }
  }

  return (
    <>
      <div className="admin-main-head">
        <h1>Mapeados</h1>
        <button className="btn btn-primary" onClick={() => setEditing(blank(mapeados.length + 1))}>
          <Icon name="plus" size={16} /> Nuevo mapeado
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead><tr><th>Foto</th><th>Nombre</th><th>Zona</th><th>Precio</th><th></th></tr></thead>
          <tbody>
            {mapeados.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 30 }}>Aún no hay mapeados. Crea el primero.</td></tr>}
            {mapeados.slice().sort((a, b) => a.orden - b.orden).map((m) => {
              const zi = zonaInfo(m.zona);
              return (
                <tr key={m.id}>
                  <td style={{ width: 70 }}>
                    <div className="thumb" style={{ width: 56, height: 40 }}>
                      {m.imgs[0] ? <img src={m.imgs[0]} alt="" /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-4)' }}><Icon name="image" size={16} /></div>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>{m.destacado && <Icon name="star" size={13} style={{ color: 'var(--warn)', verticalAlign: -2, marginRight: 4 }} />}{m.nombre}</td>
                  <td>{zi ? <span className="badge" style={{ background: zi.color + '22', color: zi.color }}>{zi.label}</span> : '—'}</td>
                  <td>{m.precio > 0 ? eur(m.precio) : '—'}</td>
                  <td><div className="actions">
                    <button className="icon-btn" onClick={() => setEditing(m)}><Icon name="edit" size={15} /></button>
                    <button className="icon-btn" onClick={() => remove(m)}><Icon name="trash" size={15} /></button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <MapeadoEditor mapeado={editing} settings={settings} notify={notify}
          onClose={() => setEditing(null)}
          onSaved={(saved) => { setMapeados([...mapeados.filter((x) => x.id !== saved.id), saved]); setEditing(null); }}
          onUpdated={(saved) => { setMapeados([...mapeados.filter((x) => x.id !== saved.id), saved]); setEditing(saved); }} />
      )}
    </>
  );
}

function MapeadoEditor({ mapeado, settings, notify, onClose, onSaved, onUpdated }: {
  mapeado: Mapeado; settings: Settings; notify: Notify; onClose: () => void;
  onSaved: (m: Mapeado) => void; onUpdated: (m: Mapeado) => void;
}) {
  const [d, setD] = useState<Mapeado>(mapeado);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Mapeado>) => setD((p) => ({ ...p, ...patch }));

  async function save() {
    if (!d.nombre.trim()) { notify('Ponle un nombre al mapeado', 'err'); return; }
    if (!d.zona) { notify('Elige una zona', 'err'); return; }
    setBusy(true);
    try { const r = await api.saveMapeado(d); notify('Mapeado guardado'); onSaved(r.mapeado); }
    catch { notify('No se pudo guardar', 'err'); } finally { setBusy(false); }
  }

  async function onImgsChange(next: string[]) {
    const prev = d.imgs;
    const removed = prev.filter((u) => !next.includes(u));
    set({ imgs: next });
    // Si ya existe en el servidor, persistir al quitar fotos (si no, al F5 vuelven).
    if (!d.id || removed.length === 0) return;
    setBusy(true);
    try {
      const r = await api.saveMapeado({ ...d, imgs: next });
      setD(r.mapeado);
      onUpdated(r.mapeado);
      for (const u of removed) {
        try { await api.deleteMedia(u); } catch { /* ok */ }
      }
      notify('Imagen eliminada');
    } catch {
      notify('No se pudo guardar el cambio de fotos', 'err');
      set({ imgs: prev });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal wide title={mapeado.id ? 'Editar mapeado' : 'Nuevo mapeado'} onClose={onClose}>
      <div className="grid-2">
        <Field label="Nombre del mapeado"><input className="input" value={d.nombre} onChange={(e) => set({ nombre: e.target.value })} placeholder="p. ej. Mansión moderna" /></Field>
        <Field label="Zona">
          <select className="select" value={d.zona} onChange={(e) => set({ zona: e.target.value })}>
            <option value="">— Zona —</option>
            {settings.zonas.map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid-3">
        <Field label="Precio ($) — 0 = ocultar"><input className="input" type="number" value={d.precio} onChange={(e) => set({ precio: +e.target.value })} /></Field>
        <Field label="Orden"><input className="input" type="number" value={d.orden} onChange={(e) => set({ orden: +e.target.value })} /></Field>
        <Field label="Destacado">
          <label className="checkbox" style={{ padding: '10px 0' }}>
            <input type="checkbox" checked={d.destacado} onChange={(e) => set({ destacado: e.target.checked })} /> Mostrar primero
          </label>
        </Field>
      </div>

      <Field label="Descripción"><TextArea value={d.descripcion} onChange={(v) => set({ descripcion: v })} /></Field>

      <Field label="Fotos del mapeado" hint="La primera foto es la portada. Al quitar una foto de un mapeado ya guardado, se borra al momento.">
        <ImageList urls={d.imgs} onChange={(u) => void onImgsChange(u)} notify={notify} />
      </Field>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar mapeado'}</button>
      </div>
    </Modal>
  );
}
