import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapConfig, Zona } from '../types';

/* ── Mapa por ZONAS (áreas dibujadas) ─────────────────────────────────────────
   Base del mapa igual que gta-v-map-leaflet (RiceaRaul): CRS de GTA V + tiles
   styleSatelite/styleAtlas/styleGrid, o una imagen única (placeholder) sobre
   CRS.Simple. Encima se dibujan los polígonos de cada zona; al pulsar uno se
   selecciona. En el panel, una zona puede editarse (añadir/mover vértices). */

const GTA = { centerX: 117.3, centerY: 172.8, scaleX: 0.02072, scaleY: 0.0205 };
const WATER_COLOR = '#1a3a4a';
const WATER_TILE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQsvICAAEQAJ+lYp46AAAAAElFTkSuQmCC';
const GTA_BOUNDS: L.LatLngBoundsExpression = [[-4000, -5500], [8000, 6000]];

type Style = 'satellite' | 'atlas' | 'grid';
const TILE_CONFIGS: Record<Style, { minZoom: number; maxZoom: number; ext: string; folder: string }> = {
  satellite: { minZoom: 0, maxZoom: 8, ext: 'jpg', folder: 'styleSatelite' },
  atlas: { minZoom: 0, maxZoom: 5, ext: 'jpg', folder: 'styleAtlas' },
  grid: { minZoom: 0, maxZoom: 5, ext: 'png', folder: 'styleGrid' },
};
const STYLE_LABELS: Record<Style, string> = { satellite: 'Satélite', atlas: 'Atlas', grid: 'Grid' };
const STYLES: Style[] = ['satellite', 'atlas', 'grid'];

function createGtaCRS(): L.CRS {
  return Object.assign({}, L.CRS.Simple, {
    projection: L.Projection.LonLat,
    scale: (zoom: number) => Math.pow(2, zoom),
    zoom: (sc: number) => Math.log(sc) / Math.LN2,
    distance: (a: L.LatLng, b: L.LatLng) => Math.hypot(b.lng - a.lng, b.lat - a.lat),
    transformation: new L.Transformation(GTA.scaleX, GTA.centerX, -GTA.scaleY, GTA.centerY),
    infinite: true,
  }) as unknown as L.CRS;
}

const centroid = (poly: [number, number][]): [number, number] => {
  const n = poly.length || 1;
  const s = poly.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
  return [s[0] / n, s[1] / n];
};

export interface ZoneMapProps {
  map: MapConfig;
  zonas: Zona[];
  selectedZona?: string | null;
  onZonaClick?: (key: string) => void;
  // Edición (panel): una zona editable con sus vértices.
  editKey?: string | null;
  editPolygon?: [number, number][];
  onEditPolygon?: (poly: [number, number][]) => void;
  editColor?: string;
  height?: string;
  showStyles?: boolean;
}

export function ZoneMap(props: ZoneMapProps) {
  const { map: cfg, zonas, selectedZona, onZonaClick, editKey, editPolygon, onEditPolygon } = props;
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const editRef = useRef<[number, number][]>(editPolygon || []);
  editRef.current = editPolygon || [];
  const onEditRef = useRef(onEditPolygon); onEditRef.current = onEditPolygon;
  const onClickRef = useRef(onZonaClick); onClickRef.current = onZonaClick;
  const editKeyRef = useRef(editKey); editKeyRef.current = editKey;
  const fitRef = useRef<L.LatLngBounds | null>(null);   // bounds a los que reajustar (modo imagen)
  const interactedRef = useRef(false);                  // el usuario ya movió/zoomó

  const gta = cfg.mode === 'gta';
  const [style, setStyle] = useState<Style>((cfg.defaultStyle as Style) || 'atlas');
  const [ver, setVer] = useState(0);

  // ── (Re)crear el mapa + capa base ──
  useEffect(() => {
    if (!elRef.current) return;
    interactedRef.current = false;
    const opts: L.MapOptions = { preferCanvas: false, attributionControl: false, zoomControl: true, zoomSnap: 0.25 };
    if (gta) {
      opts.crs = createGtaCRS();
      opts.minZoom = cfg.minZoom ?? 1; opts.maxZoom = cfg.maxZoom ?? 5;
      opts.center = [0, 0]; opts.zoom = Math.max(cfg.minZoom ?? 1, 2);
      opts.maxBounds = GTA_BOUNDS; opts.maxBoundsViscosity = 1;
    } else {
      opts.crs = L.CRS.Simple; opts.minZoom = -4; opts.maxZoom = cfg.maxZoom || 5;
    }
    const m = L.map(elRef.current, opts);
    m.getContainer().style.background = gta ? WATER_COLOR : '#0b0f14';

    if (gta && cfg.tileBaseUrl) {
      const c = TILE_CONFIGS[style];
      L.tileLayer(`${cfg.tileBaseUrl}/${c.folder}/{z}/{x}/{y}.${c.ext}`, {
        minZoom: c.minZoom, maxZoom: c.maxZoom, noWrap: true, errorTileUrl: WATER_TILE,
      }).on('tileerror', (e) => { (e.tile as HTMLImageElement).src = WATER_TILE; }).addTo(m);
    } else if (!gta && cfg.imageUrl) {
      const W = cfg.imageW || 2048, H = cfg.imageH || 2048;
      const bounds = L.latLngBounds([0, 0], [H, W]);
      fitRef.current = bounds;
      const ov = L.imageOverlay(cfg.imageUrl, bounds).addTo(m);
      m.setMaxBounds(bounds.pad(0.25)); m.fitBounds(bounds, { animate: false }); m.setMinZoom(m.getZoom() - 1);
      // Al terminar de cargar la imagen, recolocar (evita el "salto" al cargar).
      ov.on('load', () => { m.invalidateSize({ animate: false }); if (!interactedRef.current) m.fitBounds(bounds, { animate: false }); });
    } else {
      m.setView([0, 0], gta ? 2 : -2);
    }

    overlayRef.current = L.layerGroup().addTo(m);

    // Clic en el mapa: en modo edición añade un vértice al polígono.
    m.on('click', (e: L.LeafletMouseEvent) => {
      if (!editKeyRef.current || !onEditRef.current) return;
      const p: [number, number] = [+e.latlng.lat.toFixed(1), +e.latlng.lng.toFixed(1)];
      onEditRef.current([...editRef.current, p]);
    });
    // En cuanto el usuario mueve o hace zoom, dejamos de reajustar solos.
    m.on('zoomstart movestart', () => { interactedRef.current = true; });

    mapRef.current = m;
    setVer((v) => v + 1);

    // Reajuste robusto: el contenedor puede medir 0 al montar (grid/flex) y el
    // mapa se ve descuadrado hasta que recalcula. Un ResizeObserver lo corrige
    // en cuanto el contenedor tiene tamaño real, sin el parpadeo/salto.
    let raf = 0;
    const refit = () => {
      m.invalidateSize({ animate: false });
      if (!gta && fitRef.current && !interactedRef.current) m.fitBounds(fitRef.current, { animate: false });
    };
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(refit); });
    ro.observe(elRef.current);
    requestAnimationFrame(refit);

    return () => { ro.disconnect(); cancelAnimationFrame(raf); m.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.mode, cfg.tileBaseUrl, cfg.imageUrl, cfg.imageW, cfg.imageH, cfg.minZoom, cfg.maxZoom, style]);

  // ── Redibujar polígonos de zonas + edición ──
  useEffect(() => {
    const m = mapRef.current, g = overlayRef.current; if (!m || !g) return;
    g.clearLayers();

    zonas.forEach((z) => {
      if (editKey && z.key === editKey) return;          // la que se edita va aparte
      if (!z.polygon || z.polygon.length < 3) return;
      const sel = selectedZona === z.key;
      const editing = !!editKey;
      const poly = L.polygon(z.polygon as L.LatLngExpression[], {
        color: z.color || '#3ba9ff',
        weight: sel ? 3 : 2,
        opacity: editing ? 0.35 : 0.9,
        fillColor: z.color || '#3ba9ff',
        fillOpacity: editing ? 0.06 : (sel ? 0.35 : 0.16),
      });
      if (onClickRef.current) {
        poly.on('click', () => onClickRef.current!(z.key));
        poly.on('mouseover', () => poly.setStyle({ fillOpacity: 0.3 }));
        poly.on('mouseout', () => poly.setStyle({ fillOpacity: sel ? 0.35 : 0.16 }));
      }
      poly.addTo(g);
      const c = centroid(z.polygon);
      L.marker(c as L.LatLngExpression, {
        interactive: false,
        icon: L.divIcon({ className: 'zone-label-wrap', html: `<span class="zone-label">${z.label}</span>`, iconSize: [0, 0] }),
      }).addTo(g);
    });

    // ── Zona en edición: polígono + vértices arrastrables ──
    if (editKey && onEditPolygon) {
      const pts = editPolygon || [];
      const col = props.editColor || '#3ba9ff';
      if (pts.length >= 2) {
        L.polygon(pts as L.LatLngExpression[], { color: col, weight: 2.5, fillColor: col, fillOpacity: 0.25, dashArray: '6 4' }).addTo(g);
      }
      pts.forEach((p, i) => {
        const vtx = L.circleMarker(p as L.LatLngExpression, {
          radius: 6, color: '#fff', weight: 2, fillColor: col, fillOpacity: 1,
        });
        (vtx as any).options.draggable = true;
        vtx.addTo(g);
        // arrastre manual del vértice
        vtx.on('mousedown', () => {
          m.dragging.disable();
          const move = (ev: L.LeafletMouseEvent) => {
            const np = pts.slice() as [number, number][];
            np[i] = [+ev.latlng.lat.toFixed(1), +ev.latlng.lng.toFixed(1)];
            onEditRef.current?.(np);
          };
          const up = () => { m.off('mousemove', move); m.off('mouseup', up); m.dragging.enable(); };
          m.on('mousemove', move); m.on('mouseup', up);
        });
        // clic derecho / doble clic elimina el vértice
        vtx.on('dblclick', (ev) => {
          L.DomEvent.stop(ev);
          onEditRef.current?.(pts.filter((_, j) => j !== i) as [number, number][]);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonas, selectedZona, editKey, editPolygon, props.editColor, ver]);

  const showStyles = props.showStyles !== false && gta && !!cfg.tileBaseUrl;

  return (
    <div className="map-shell" style={props.height ? { height: props.height } : undefined}>
      <div ref={elRef} className="map-el" />
      {showStyles && (
        <div className="map-styleswitch">
          {STYLES.map((s) => (
            <button key={s} className={s === style ? 'active' : ''} onClick={() => setStyle(s)}>{STYLE_LABELS[s]}</button>
          ))}
        </div>
      )}
      {editKey && (
        <div className="map-hint">Pulsa en el mapa para añadir puntos · arrastra para mover · doble clic en un punto para borrarlo</div>
      )}
      {((gta && !cfg.tileBaseUrl) || (!gta && !cfg.imageUrl)) && (
        <div className="map-empty">
          <div><strong>Mapa sin configurar.</strong><br />
            {gta ? 'Indica la URL base de los tiles en el panel → Ajustes → Mapa.' : 'Sube la imagen del mapa (o activa tiles GTA V) en Ajustes → Mapa.'}
          </div>
        </div>
      )}
    </div>
  );
}
