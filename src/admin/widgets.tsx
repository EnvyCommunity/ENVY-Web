import { useRef, useState, type ReactNode } from 'react';
import { api } from '../api';
import { Icon } from '../icons';

export type Notify = (msg: string, type?: 'ok' | 'err') => void;

// Campo de formulario con etiqueta.
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea({ value, onChange, rows = 4 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className="textarea" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />;
}

// Subida de una o varias imágenes a R2. Devuelve las URLs por onDone.
export function Uploader({ multiple, onDone, notify, label = 'Subir imagen' }: {
  multiple?: boolean; onDone: (urls: string[]) => void; notify: Notify; label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function handle(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const { url } = await api.upload(f);
        urls.push(url);
      }
      onDone(urls);
    } catch { notify('No se pudo subir la imagen', 'err'); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  }
  return (
    <>
      <div className="uploader" onClick={() => ref.current?.click()}>
        {busy ? 'Subiendo…' : <><Icon name="image" size={16} style={{ verticalAlign: -3, marginRight: 6 }} />{label}</>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden
        onChange={(e) => handle(e.target.files)} />
    </>
  );
}

// Galería editable: miniaturas con borrar + añadir.
export function ImageList({ urls, onChange, notify }: { urls: string[]; onChange: (u: string[]) => void; notify: Notify }) {
  return (
    <div>
      <div className="thumbs">
        {urls.map((u, i) => (
          <div className="thumb" key={i}>
            <img src={u} alt="" />
            <button onClick={() => onChange(urls.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Uploader multiple notify={notify} label="Añadir imágenes" onDone={(nu) => onChange([...urls, ...nu])} />
      </div>
    </div>
  );
}

export function useToast(): [ReactNode, Notify] {
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const notify: Notify = (msg, type = 'ok') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2600);
  };
  const node = toast ? (
    <div className={'toast ' + toast.type}>
      <Icon name={toast.type === 'ok' ? 'checkCircle' : 'info'} size={16} /> {toast.msg}
    </div>
  ) : null;
  return [node, notify];
}
