import { useState } from 'react';
import { Logo } from '../logo';
import { Icon } from '../icons';
import type { Settings } from '../types';

function isInternal(href: string) { return href.startsWith('#/') || href === '#' || href.startsWith('/lsrp'); }

export function Header({ settings, route }: { settings: Settings; route: string }) {
  const [open, setOpen] = useState(false);
  const connect = settings.discordUrl || '#';

  return (
    <header className="nav">
      <div className="wrap">
        <a className="nav-brand" href="#/" onClick={() => setOpen(false)}>
          <Logo src={settings.logoUrl} size={34} />
        </a>

        <nav className={'nav-links' + (open ? ' open' : '')}>
          {settings.nav.map((l, i) => {
            const internalPath = l.href.replace(/^#\/?/, '').replace(/\/+$/, '');
            const active = isInternal(l.href) && internalPath === route;
            const ext = !isInternal(l.href);
            return (
              <a key={i} className={'nav-link' + (active ? ' active' : '')}
                href={l.href || '#'}
                target={ext ? '_blank' : undefined} rel={ext ? 'noreferrer' : undefined}
                onClick={() => setOpen(false)}>
                {l.label}
              </a>
            );
          })}
        </nav>

        <a className="btn pill-discord" href={connect} target="_blank" rel="noreferrer">
          <Icon name="discord" size={18} /> Discord
        </a>
        <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menú">
          <Icon name={open ? 'x' : 'drag'} size={22} />
        </button>
      </div>
    </header>
  );
}
