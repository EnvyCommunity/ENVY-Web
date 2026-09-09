import { useEffect, useState } from 'react';
import { api } from '../api';
import { DEFAULT_LANDING, DEFAULT_NORMATIVAS, DEFAULT_SETTINGS } from '../defaults';
import { Icon } from '../icons';
import { Logo } from '../logo';
import type { Landing, Mapeado, Normativas, Settings } from '../types';
import { Field, useToast } from './widgets';
import { AdminZonas } from './AdminZonas';
import { AdminMapeados } from './AdminMapeados';
import { AdminNormativas } from './AdminNormativas';
import { AdminLanding } from './AdminLanding';
import { AdminSettings } from './AdminSettings';
import { AdminCuenta } from './AdminCuenta';

type Status = 'loading' | 'login' | 'setup' | 'ready';
type Section = 'zonas' | 'mapeados' | 'normativas' | 'landing' | 'ajustes' | 'cuenta';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'zonas', label: 'Zonas y mapa', icon: 'pin' },
  { key: 'mapeados', label: 'Mapeados', icon: 'layers' },
  { key: 'normativas', label: 'Normativas', icon: 'book' },
  { key: 'landing', label: 'Contenido landing', icon: 'edit' },
  { key: 'ajustes', label: 'Ajustes', icon: 'gear' },
  { key: 'cuenta', label: 'Cuenta', icon: 'key' },
];

export function Admin() {
  const [status, setStatus] = useState<Status>('loading');
  const [section, setSection] = useState<Section>('zonas');
  const [toastNode, notify] = useToast();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [landing, setLanding] = useState<Landing>(DEFAULT_LANDING);
  const [normativas, setNormativas] = useState<Normativas>(DEFAULT_NORMATIVAS);
  const [mapeados, setMapeados] = useState<Mapeado[]>([]);

  async function loadAll() {
    const [pub, norm, ms] = await Promise.all([
      api.public().catch(() => null),
      api.normativas().catch(() => null),
      api.listMapeados().catch(() => ({ mapeados: [] })),
    ]);
    if (pub?.settings) setSettings(pub.settings);
    if (pub?.landing) setLanding(pub.landing);
    if (norm?.secciones) setNormativas(norm);
    setMapeados(ms.mapeados || []);
  }

  useEffect(() => {
    api.me()
      .then((r) => {
        if (r.ok) loadAll().then(() => setStatus('ready'));
        else if (r.needsSetup) setStatus('setup');
        else setStatus('login');
      })
      .catch(() => setStatus('login'));
  }, []);

  if (status === 'loading') return <div className="loading"><div className="spinner" /></div>;
  if (status === 'login' || status === 'setup') {
    return <Gate mode={status} notify={notify}
      onDone={() => { setStatus('loading'); api.me().then((r) => r.ok ? loadAll().then(() => setStatus('ready')) : setStatus('login')); }}
      toast={toastNode} />;
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand"><Logo src={settings.logoUrl} size={30} /> <span style={{ fontSize: 14 }}>Panel</span></div>
        {SECTIONS.map((s) => (
          <button key={s.key} className={'admin-nav' + (section === s.key ? ' active' : '')} onClick={() => setSection(s.key)}>
            <Icon name={s.icon} size={18} /> {s.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <a className="admin-nav" href="#/" target="_blank" rel="noreferrer"><Icon name="arrow" size={18} /> Ver la web</a>
        <button className="admin-nav" onClick={() => api.logout().then(() => location.reload())}>
          <Icon name="logout" size={18} /> Salir
        </button>
      </aside>

      <main className="admin-main">
        {section === 'zonas' && <AdminZonas settings={settings} onChange={setSettings} notify={notify} />}
        {section === 'mapeados' && <AdminMapeados mapeados={mapeados} setMapeados={setMapeados} settings={settings} notify={notify} />}
        {section === 'normativas' && <AdminNormativas value={normativas} onChange={setNormativas} notify={notify} />}
        {section === 'landing' && <AdminLanding value={landing} onChange={setLanding} notify={notify} />}
        {section === 'ajustes' && <AdminSettings value={settings} onChange={setSettings} notify={notify} />}
        {section === 'cuenta' && <AdminCuenta notify={notify} />}
      </main>
      {toastNode}
    </div>
  );
}

function Gate({ mode, onDone, notify, toast }: { mode: 'login' | 'setup'; onDone: () => void; notify: (m: string, t?: 'ok' | 'err') => void; toast: React.ReactNode }) {
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'setup' && pass !== pass2) { notify('Las contraseñas no coinciden', 'err'); return; }
    if (mode === 'setup' && pass.length < 8) { notify('Mínimo 8 caracteres', 'err'); return; }
    setBusy(true);
    try {
      if (mode === 'setup') await api.setup(pass); else await api.login(pass);
      onDone();
    } catch (err: any) {
      notify(err?.status === 401 ? 'Contraseña incorrecta' : 'Error al entrar', 'err');
    } finally { setBusy(false); }
  }

  return (
    <div className="login-shell">
      <form className="card card-pad login-card" onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Logo size={40} />
          <div>
            <h2 style={{ fontSize: 20 }}>Panel de gestión</h2>
            <div className="muted-3" style={{ fontSize: 13 }}>ENVY Community</div>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 14, margin: '10px 0 18px' }}>
          {mode === 'setup' ? 'Primer acceso: crea la contraseña del panel.' : 'Introduce la contraseña para gestionar la web.'}
        </p>
        <Field label="Contraseña">
          <input className="input" type="password" value={pass} autoFocus onChange={(e) => setPass(e.target.value)} />
        </Field>
        {mode === 'setup' && (
          <Field label="Repite la contraseña">
            <input className="input" type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} />
          </Field>
        )}
        <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 6 }}>
          {busy ? 'Entrando…' : mode === 'setup' ? 'Crear y entrar' : 'Entrar'}
        </button>
      </form>
      {toast}
    </div>
  );
}
