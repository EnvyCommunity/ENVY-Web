import { useState } from 'react';
import { api } from '../api';
import { Field, type Notify } from './widgets';

export function AdminCuenta({ notify }: { notify: Notify }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [nueva2, setNueva2] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (nueva.length < 8) { notify('La nueva contraseña necesita 8+ caracteres', 'err'); return; }
    if (nueva !== nueva2) { notify('Las contraseñas nuevas no coinciden', 'err'); return; }
    setBusy(true);
    try {
      await api.changePassword(actual, nueva);
      notify('Contraseña actualizada');
      setActual(''); setNueva(''); setNueva2('');
    } catch (err: any) {
      notify(err?.status === 401 ? 'La contraseña actual no es correcta' : 'No se pudo cambiar', 'err');
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="admin-main-head"><h1>Cuenta</h1></div>
      <form className="card card-pad" style={{ maxWidth: 460 }} onSubmit={submit}>
        <Field label="Contraseña actual"><input className="input" type="password" value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
        <Field label="Nueva contraseña"><input className="input" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} /></Field>
        <Field label="Repite la nueva contraseña"><input className="input" type="password" value={nueva2} onChange={(e) => setNueva2(e.target.value)} /></Field>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
      </form>
    </>
  );
}
