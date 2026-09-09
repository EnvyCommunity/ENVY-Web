import { useEffect, useState } from 'react';
import { api } from './api';
import { DEFAULT_LANDING, DEFAULT_SETTINGS } from './defaults';
import { useRoute } from './router';
import type { Landing, Settings } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Inicio } from './pages/Inicio';
import { Normativas } from './pages/Normativas';
import { Casas } from './pages/Casas';
import { Admin } from './admin/Admin';

export default function App() {
  const route = useRoute();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [landing, setLanding] = useState<Landing>(DEFAULT_LANDING);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.public()
      .then((d) => { if (d.settings) setSettings(d.settings); if (d.landing) setLanding(d.landing); })
      .catch(() => { /* respaldo: valores por defecto */ })
      .finally(() => setReady(true));
  }, []);

  // Aplica los colores de marca y el SEO en cuanto se conocen.
  useEffect(() => {
    const r = document.documentElement.style;
    if (settings.colors?.primary) r.setProperty('--primary', settings.colors.primary);
    if (settings.colors?.accent) r.setProperty('--accent', settings.colors.accent);
    document.title = settings.seo?.title || settings.serverName;
  }, [settings]);

  // El panel es una app aparte: no lleva la cabecera/pie públicos.
  if (route === 'admin' || route.startsWith('admin/')) {
    return <Admin />;
  }

  const page = route === 'normativas' ? <Normativas settings={settings} />
    : route === 'casas' ? <Casas settings={settings} />
    : <Inicio settings={settings} landing={landing} ready={ready} />;

  return (
    <>
      <Header settings={settings} route={route} />
      <main>{page}</main>
      <Footer settings={settings} />
    </>
  );
}
