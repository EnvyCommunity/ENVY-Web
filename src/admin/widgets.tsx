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

export function TextArea({ value, onChange, rows = 4 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className="textarea" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />;
}

// Subida de archivos a R2. Devuelve las URLs por onDone (y opcionalmente los File).
export function Uploader({ multiple, onDone, notify, label = 'Subir imagen', accept = 'image/*' }: {
  multiple?: boolean;
  onDone: (urls: string[], files?: File[]) => void;
  notify: Notify;
  label?: string;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function handle(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const list = Array.from(files);
      const urls: string[] = [];
      for (const f of list) {
        const { url } = await api.upload(f);
        urls.push(url);
      }
      onDone(urls, list);
    } catch {
      notify(accept.includes('pdf') ? 'No se pudo subir el PDF' : 'No se pudo subir la imagen', 'err');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }
  const isPdf = accept.includes('pdf');
  return (
    <>
      <div className="uploader" onClick={() => ref.current?.click()}>
        {busy
          ? 'Subiendo…'
          : <>
              <Icon name={isPdf ? 'book' : 'image'} size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
              {label}
            </>}
      </div>
      <input ref={ref} type="file" accept={accept} multiple={multiple} hidden
        onChange={(e) => handle(e.target.files)} />
    </>
  );
}

// Galería editable: miniaturas con borrar + añadir.
// El × solo quita la URL de la lista; guarda el mapeado/formulario para persistir.
// (No borramos R2 aquí para no romper si el usuario cancela sin guardar.)
export function ImageList({ urls, onChange, notify }: { urls: string[]; onChange: (u: string[]) => void; notify: Notify }) {
  return (
    <div>
      <div className="thumbs">
        {urls.map((u, i) => (
          <div className="thumb" key={u + i}>
            <img src={u} alt="" />
            <button type="button" onClick={() => onChange(urls.filter((_, j) => j !== i))} aria-label="Quitar imagen">×</button>
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
