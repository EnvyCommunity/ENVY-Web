import type { Landing, Mapeado, Normativas, Settings, Zona } from './types';

// Contenido por defecto: lo que se ve nada más abrir la web (y el respaldo si la
// API no responde). El backend siembra estos mismos valores la primera vez.

// Polígono cuadrado de referencia sobre el mapa placeholder (coords [lat,lng]).
const sq = (y: number, x: number, r: number): [number, number][] =>
  [[y - r, x - r], [y - r, x + r], [y + r, x + r], [y + r, x - r]];

export const DEFAULT_ZONAS: Zona[] = [
  { key: 'vinewood', label: 'Vinewood', color: '#f5b510', polygon: sq(1420, 1180, 200) },
  { key: 'richman', label: 'Richman', color: '#c874ff', polygon: sq(1520, 900, 190) },
  { key: 'delperro', label: 'Del Perro', color: '#3ba9ff', polygon: sq(980, 520, 180) },
  { key: 'vespucci', label: 'Vespucci', color: '#37d399', polygon: sq(1120, 740, 170) },
  { key: 'centro', label: 'Centro (Downtown)', color: '#ff8a5a', polygon: sq(1150, 1050, 160) },
  { key: 'south', label: 'South Los Santos', color: '#8ad0ff', polygon: sq(760, 1080, 190) },
  { key: 'paleto', label: 'Paleto Bay', color: '#7cffb0', polygon: sq(1880, 1120, 200) },
  { key: 'sandy', label: 'Sandy Shores', color: '#ffd166', polygon: [] },
  { key: 'east', label: 'East Los Santos', color: '#ff6f91', polygon: [] },
  { key: 'otros', label: 'Otros', color: '#9aa4b2', polygon: [] },
];

export const DEFAULT_SETTINGS: Settings = {
  serverName: 'ENVY Community',
  logoUrl: '',
  discordUrl: 'https://discord.gg/',
  tebexUrl: '',
  connectLabel: 'Conectar',
  nav: [
    { label: 'Inicio', href: '#/' },
    { label: 'Normativas', href: '#/normativas' },
    { label: 'Casas', href: '#/casas' },
    { label: 'Facciones', href: 'https://discord.gg/' },
    { label: 'Comunidad', href: 'https://discord.gg/' },
    { label: 'Soporte', href: 'https://discord.gg/' },
  ],
  socials: [
    { label: 'Discord', href: 'https://discord.gg/' },
    { label: 'Tienda', href: '' },
  ],
  colors: { primary: '#E6E6FA', accent: '#3ba9ff' },
  map: {
    mode: 'image',
    imageUrl: '/lsrp/mapa-satelite.jpg',
    imageW: 4096, imageH: 4096,
    tileBaseUrl: '',
    defaultStyle: 'atlas',
    minZoom: 1, maxZoom: 5,
  },
  zonas: DEFAULT_ZONAS,
  seo: {
    title: 'ENVY Community',
    description: 'Una ciudad viva, realista y llena de oportunidades. Normativas, sistema de casas por zonas con mapa interactivo y comunidad.',
  },
};

export const DEFAULT_LANDING: Landing = {
  hero: {
    eyebrow: 'ENVY COMMUNITY',
    title: 'TU HISTORIA\nEMPIEZA AQUÍ',
    subtitle: 'Una ciudad viva, realista y llena de oportunidades. Únete a una comunidad que lleva el roleplay al siguiente nivel.',
    bg: '',
    ctaPrimary: { label: 'Unirse al servidor', href: 'https://discord.gg/' },
    ctaSecondary: { label: 'Ver normativas', href: '#/normativas' },
  },
  stats: [
    { icon: 'discord', value: '+2.500', label: 'Miembros' },
    { icon: 'user', value: '+120', label: 'Roleplayers activos' },
    { icon: 'gear', value: '+10', label: 'Facciones oficiales' },
    { icon: 'headset', value: '24/7', label: 'Servidor online' },
  ],
  featuresEyebrow: 'EXPLORA LA CIUDAD',
  featuresTitle: 'TODO LO QUE NECESITAS\nEN UN SOLO LUGAR',
  featuresSubtitle: 'Accede a la información más importante del servidor y empieza tu nueva vida.',
  features: [
    { icon: 'book', title: 'Normativas', text: 'Conoce las reglas del servidor y evita sanciones.', link: { label: 'Ver normativas', href: '#/normativas' } },
    { icon: 'house', title: 'Sistema de Casas', text: 'Explora las zonas y sus mapeados interiores disponibles.', link: { label: 'Explorar mapa', href: '#/casas' } },
    { icon: 'users', title: 'Facciones', text: 'Únete a una facción y forma parte de la ciudad.', link: { label: 'Ver facciones', href: 'https://discord.gg/' } },
    { icon: 'headset', title: 'Soporte', text: '¿Tienes una duda? Estamos aquí para ayudarte.', link: { label: 'Abrir ticket', href: 'https://discord.gg/' } },
  ],
  banner: {
    title: 'UNA CIUDAD,\nINFINITAS HISTORIAS',
    text: 'Respeto, realismo y comunidad. Esto es más que un servidor, es una forma de vivir.',
    bg: '',
  },
};

export const DEFAULT_MAPEADOS: Mapeado[] = [
  { id: 'm-vw-1', zona: 'vinewood', nombre: 'Mansión moderna', imgs: [], precio: 550000, descripcion: 'Vistas panorámicas, piscina y garaje doble.', destacado: true, orden: 1 },
  { id: 'm-vw-2', zona: 'vinewood', nombre: 'Loft minimalista', imgs: [], precio: 480000, descripcion: 'Diseño abierto y luminoso en las colinas.', destacado: false, orden: 2 },
  { id: 'm-rich-1', zona: 'richman', nombre: 'Mansión VIP', imgs: [], precio: 1250000, descripcion: 'Máxima exclusividad y seguridad.', destacado: true, orden: 1 },
  { id: 'm-dp-1', zona: 'delperro', nombre: 'Apartamento playa', imgs: [], precio: 320000, descripcion: 'A pie de playa, ideal para empezar.', destacado: false, orden: 1 },
  { id: 'm-ves-1', zona: 'vespucci', nombre: 'Casa canal', imgs: [], precio: 285000, descripcion: 'Junto a los canales de Vespucci.', destacado: false, orden: 1 },
  { id: 'm-south-1', zona: 'south', nombre: 'Piso básico', imgs: [], precio: 95000, descripcion: 'Económico y bien comunicado.', destacado: false, orden: 1 },
  { id: 'm-paleto-1', zona: 'paleto', nombre: 'Cabaña rural', imgs: [], precio: 120000, descripcion: 'Tranquilidad en el norte del mapa.', destacado: false, orden: 1 },
];

export const DEFAULT_NORMATIVAS: Normativas = {
  intro: 'El respeto y el buen roleplay hacen grande esta ciudad. Lee y comprende las normativas antes de jugar.',
  secciones: [
    {
      id: 'introduccion', icon: 'info', title: 'Introducción',
      articulos: [
        { id: 'i1', title: '1. Introducción', html: '<p>Estas normativas existen para asegurar una experiencia de juego justa, realista y divertida para todos los miembros de la comunidad. El desconocimiento de las normas no exime de su cumplimiento.</p><div class="callout"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><div><em>&ldquo;El roleplay es libertad, pero con respeto.&rdquo;</em></div></div>' },
        { id: 'i2', title: '1.1. Objetivo del servidor', html: '<p>Nuestro objetivo es ofrecer una ciudad viva, realista y coherente, donde cada jugador pueda desarrollar su historia dentro de un entorno serio y de calidad.</p><ul><li>Fomentar el roleplay realista.</li><li>Crear una comunidad sana y madura.</li><li>Mantener un entorno de juego estable y libre de toxicidad.</li><li>Ofrecer una experiencia única y duradera.</li></ul>' },
      ],
    },
    { id: 'generales', icon: 'shield', title: 'Normas Generales', articulos: [{ id: 'g1', title: '2. Comportamiento', html: '<p>Trata a todos con respeto, dentro y fuera del rol. No se tolera el racismo, la discriminación ni la toxicidad.</p><ul><li>Prohibido el insulto grave.</li><li>Prohibido el contenido ofensivo en nombres o negocios.</li><li>El staff tiene la última palabra en una incidencia.</li></ul>' }] },
    { id: 'roleplay', icon: 'users', title: 'Roleplay (IC / OOC)', articulos: [{ id: 'r1', title: '3. IC y OOC', html: '<p><strong>IC:</strong> lo que ocurre dentro del personaje. <strong>OOC:</strong> información de la vida real.</p><ul><li>Prohibido el Metagaming.</li><li>Prohibido el Powergaming.</li></ul>' }] },
    { id: 'personajes', icon: 'user', title: 'Personajes', articulos: [{ id: 'p1', title: '4. Tu personaje', html: '<p>Desarrolla una historia coherente. Las muertes en rol tienen consecuencias sobre la memoria del personaje.</p>' }] },
    { id: 'facciones', icon: 'flag', title: 'Facciones', articulos: [{ id: 'f1', title: '5. Facciones', html: '<p>Organizaciones legales o ilegales reconocidas por el staff, con jerarquía y narrativa coherente.</p>' }] },
    { id: 'economia', icon: 'coin', title: 'Economía', articulos: [{ id: 'e1', title: '6. Economía', html: '<p>Economía cerrada y realista. Prohibido el uso de bugs económicos.</p>' }] },
    { id: 'sanciones', icon: 'gavel', title: 'Sanciones', articulos: [{ id: 's1', title: '7. Sanciones', html: '<p>El incumplimiento conlleva sanciones que van del aviso al baneo permanente según gravedad y reincidencia.</p>' }] },
    { id: 'casas', icon: 'house', title: 'Sistema de Casas', articulos: [{ id: 'c1', title: '8. Casas y propiedades', html: '<p>Explora el mapa por zonas y consulta los mapeados interiores disponibles en cada una.</p>' }] },
    { id: 'vehiculos', icon: 'car', title: 'Vehículos', articulos: [{ id: 'v1', title: '9. Vehículos', html: '<p>Conduce de forma realista. El VDM está sancionado.</p>' }] },
    { id: 'streams', icon: 'video', title: 'Streams y Contenido', articulos: [{ id: 'st1', title: '10. Creadores de contenido', html: '<p>Indica siempre el servidor. Prohibido el stream sniping.</p>' }] },
    { id: 'discord', icon: 'discord', title: 'Discord', articulos: [{ id: 'd1', title: '11. Normas de Discord', html: '<p>El Discord es la vía oficial de comunicación. Respeta los canales.</p>' }] },
    { id: 'terminos', icon: 'book', title: 'Términos Finales', articulos: [{ id: 't1', title: '12. Términos finales', html: '<p>Estas normativas pueden actualizarse en cualquier momento. Mantente informado.</p>' }] },
  ],
};
