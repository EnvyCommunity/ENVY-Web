// ── Modelo de datos ──
// La web se organiza por ZONAS (áreas dibujadas en el mapa). Cada zona reúne
// una lista de MAPEADOS (interiores disponibles: foto + nombre). Ya no hay
// "casas" con coordenadas individuales.

export interface Link { label: string; href: string }

export interface Stat { icon: string; value: string; label: string }

export interface Feature {
  icon: string; title: string; text: string; link: Link;
}

export interface Hero {
  eyebrow: string; title: string; subtitle: string;
  bg: string;
  ctaPrimary: Link; ctaSecondary: Link;
}

export interface Banner { title: string; text: string; bg: string }

export interface Landing {
  hero: Hero;
  stats: Stat[];
  featuresEyebrow: string; featuresTitle: string; featuresSubtitle: string;
  features: Feature[];
  banner: Banner;
}

// Zona = área del mapa (polígono) con nombre y color.
// polygon: lista de vértices [lat, lng] en coordenadas del mapa.
export interface Zona {
  key: string;
  label: string;
  color: string;
  polygon: [number, number][];
}

export interface MapConfig {
  mode: 'image' | 'gta';
  imageUrl: string;
  imageW: number; imageH: number;
  tileBaseUrl: string;
  defaultStyle: 'satellite' | 'atlas' | 'grid';
  minZoom: number; maxZoom: number;
}

export interface Settings {
  serverName: string;
  logoUrl: string;
  discordUrl: string;
  tebexUrl: string;
  connectLabel: string;
  nav: Link[];
  socials: Link[];
  colors: { primary: string; accent: string };
  map: MapConfig;
  zonas: Zona[];
  seo: { title: string; description: string };
}

// ── Normativas ──
export interface NormArticulo { id: string; title: string; html: string }
export interface NormSeccion { id: string; icon: string; title: string; articulos: NormArticulo[] }
export interface Normativas { intro: string; secciones: NormSeccion[] }

// ── Mapeados (interiores disponibles) ──
export interface Mapeado {
  id: string;
  zona: string;               // key de Zona
  nombre: string;
  imgs: string[];             // fotos del mapeado (la 1ª es la portada)
  precio: number;             // 0 = no mostrar precio
  descripcion: string;
  destacado: boolean;
  orden: number;
}

export interface PublicData {
  settings: Settings;
  landing: Landing;
}
