import { Logo } from '../logo';
import type { Settings } from '../types';

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const links = (settings.socials || []).filter((s) => s.href);
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo src={settings.logoUrl} size={30} />
          <div>
            <div style={{ fontWeight: 700 }}>{settings.serverName}</div>
            <div className="muted-3" style={{ fontSize: 13 }}>© {year} · Todos los derechos reservados</div>
          </div>
        </div>
        <div className="footer-links">
          <a href="#/">Inicio</a>
          <a href="#/normativas">Normativas</a>
          <a href="#/casas">Casas</a>
          {links.map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
