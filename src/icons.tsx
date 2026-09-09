// Iconos de línea (outline) coherentes con el diseño. Un único componente
// <Icon name=… /> para que el contenido editable pueda referirse a ellos por
// nombre (features, secciones de normativas, stats…).
import type { CSSProperties } from 'react';

const P: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13',
  house: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5',
  users: 'M17 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 20v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11',
  headset: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2ZM20 14a2 2 0 0 0-2 2h-1v-5h1a2 2 0 0 1 2 2ZM18 16v1a4 4 0 0 1-4 4h-2',
  discord: 'M8 12a1 1 0 1 0 0 .01M16 12a1 1 0 1 0 0 .01M7 8c3-1 7-1 10 0M7 16c3 1 7 1 10 0M5.5 8 4 18c2 1.5 4 2 4 2l1-2M18.5 8 20 18c-2 1.5-4 2-4 2l-1-2',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  heart: 'M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20Z',
  car: 'M5 16v2M19 16v2M4 16h16v-4l-1.5-4.5A2 2 0 0 0 16.6 6H7.4a2 2 0 0 0-1.9 1.5L4 12v4ZM4 12h16M7.5 16h.01M16.5 16h.01',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  check: 'M20 6 9 17l-5-5',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12l2.5 2.5L16 9',
  shield: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z',
  scale: 'M12 3v18M7 7l-3 6h6l-3-6ZM17 7l-3 6h6l-3-6ZM4 21h16M8 7h8M12 5l5 2M12 5 7 7',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v10M9.5 9.5a2.2 2.2 0 0 1 2.5-1.5c1.4 0 2.2.9 2.2 1.8 0 2.2-4.7 1.4-4.7 3.6 0 1 .9 1.8 2.5 1.8a2.4 2.4 0 0 0 2.3-1.4',
  gavel: 'M14 6 8 12M12 4l4 4M10 6l4 4M9 13l-5 5 1 1 5-5M13 21h8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  video: 'M3 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM16 10l5-3v10l-5-3',
  flag: 'M5 21V4M5 4c3-1.5 6 1.5 9 0v9c-3 1.5-6-1.5-9 0',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  building: 'M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 21V9h4a1 1 0 0 1 1 1v11M4 21h17M8 7h3M8 11h3M8 15h3',
  garage: 'M4 21V8l8-4 8 4v13M4 21h16M7 21v-7h10v7M7 14h10',
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6 6 18',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z',
  image: 'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1ZM4 16l4-4 4 4 3-3 5 5M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  key: 'M14 7a4 4 0 1 1-3.5 6l-5.5 5.5V21H2v-3l6.5-6.5A4 4 0 0 1 14 7Z',
  star: 'M12 3l2.9 6 6.1.9-4.5 4.3 1.1 6.3L12 17.8 6.4 20.5l1.1-6.3L3 9.9 9.1 9 12 3Z',
  drag: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
};

export type IconName = keyof typeof P;
export const ICON_NAMES = Object.keys(P) as IconName[];

export function Icon({ name, size = 20, style, className, strokeWidth = 1.7 }: {
  name: string; size?: number; style?: CSSProperties; className?: string; strokeWidth?: number;
}) {
  const d = P[name] || P.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}
