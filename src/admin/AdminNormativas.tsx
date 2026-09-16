import { useState } from 'react';
import { api } from '../api';
import { ICON_NAMES, Icon } from '../icons';
import type { NormDoc, Normativas } from '../types';
import { Field, Uploader, type Notify } from './widgets';

const genId = (p: string) => p + Math.random().toString(36).slice(2, 8);

function titleFromFile(name: string) {
  return name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() || 'Normativa';
}

export function AdminNormativas({ value, onChange, notify }: { value: Normativas; onChange: (n: Normativas) => void; notify: Notify }) {
  const [d, setD] = useState<Normativas>({ intro: value.intro || '', docs: value.docs || [] });
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);

  const setDoc = (i: number, patch: Partial<NormDoc>) =>
    setD((p) => ({ ...p, docs: p.docs.map((doc, j) => j === i ? { ...doc, ...patch } : doc) }));

  function addDoc(url: string, fileName: string) {
    const doc: NormDoc = {
      id: genId('pdf-'),
      icon: 'book',
      title: titleFromFile(fileName),
      pdfUrl: url,
      fileName,
    };
    setD((p) => ({ ...p, docs: [...p.docs, doc] }));
    setActive(d.docs.length);
    notify('PDF subido');
  }

  function moveDoc(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= d.docs.length) return;
    const arr = d.docs.slice();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setD((p) => ({ ...p, docs: arr }));
    setActive(j);
  }

  function removeDoc(i: number) {
    if (!confirm('¿Eliminar este PDF de las normativas?')) return;
    setD((p) => ({ ...p, docs: p.docs.filter((_, j) => j !== i) }));
    setActive(0);
  }

  async function save() {
    setBusy(true);
    try {
      const payload: Normativas = { intro: d.intro, docs: d.docs };
      await api.saveNormativas(payload);
      onChange(payload);
      notify('Normativas guardadas');
    } catch {
      notify('No se pudo guardar', 'err');
    } finally {
      setBusy(false);
    }
  }

  const doc = d.docs[active];

  return (
    <>
      <div className="admin-main-head">
        <h1>Normativas</h1>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>

      <Field label="Introducción (subtítulo de la página)">
        <input className="input" value={d.intro} onChange={(e) => setD({ ...d, intro: e.target.value })} />
      </Field>

      <div className="subcard" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Subir PDF</h3>
        <p className="hint" style={{ marginBottom: 10 }}>
          Sube uno o varios PDFs (por ejemplo Normativa General, Comercios…). Los jugadores los verán con el lector integrado.
        </p>
        <Uploader
          accept="application/pdf,.pdf"
          label="Subir PDF de normativa"
          notify={notify}
          onDone={(urls, files) => {
            const file = files?.[0];
            addDoc(urls[0], file?.name || 'normativa.pdf');
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ padding: 8 }}>
          {d.docs.map((s, i) => (
            <button key={s.id} className={'admin-nav' + (i === active ? ' active' : '')} onClick={() => setActive(i)}>
              <Icon name={s.icon || 'book'} size={16} />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
            </button>
          ))}
          {d.docs.length === 0 && <div className="hint" style={{ padding: 10 }}>Aún no hay PDFs.</div>}
        </div>

        {doc ? (
          <div className="card card-pad">
            <div className="grid-2">
              <Field label="Icono">
                <select className="select" value={doc.icon} onChange={(e) => setDoc(active, { icon: e.target.value })}>
                  {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Título">
                <input className="input" value={doc.title} onChange={(e) => setDoc(active, { title: e.target.value })} />
              </Field>
            </div>

            <div className="toolbar" style={{ marginBottom: 14 }}>
              <button className="btn btn-sm" onClick={() => moveDoc(active, -1)}>↑ Subir</button>
              <button className="btn btn-sm" onClick={() => moveDoc(active, 1)}>↓ Bajar</button>
              <button className="btn btn-sm btn-danger" onClick={() => removeDoc(active)}>
                <Icon name="trash" size={14} /> Eliminar
              </button>
            </div>

            <Field label="Archivo PDF" hint={doc.fileName || 'PDF subido'}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <a className="btn btn-sm" href={doc.pdfUrl} target="_blank" rel="noreferrer">Abrir PDF</a>
                <Uploader
                  accept="application/pdf,.pdf"
                  label="Reemplazar PDF"
                  notify={notify}
                  onDone={(urls, files) => {
                    const file = files?.[0];
                    setDoc(active, {
                      pdfUrl: urls[0],
                      fileName: file?.name || doc.fileName,
                    });
                    notify('PDF reemplazado');
                  }}
                />
              </div>
            </Field>

            {doc.pdfUrl && (
              <iframe
                className="pdf-frame pdf-frame-admin"
                title={doc.title}
                src={doc.pdfUrl + '#toolbar=1&navpanes=0'}
              />
            )}
          </div>
        ) : (
          <div className="card card-pad muted">Sube un PDF para empezar.</div>
        )}
      </div>
    </>
  );
}
