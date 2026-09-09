# ENVY Community — web

Frontend de la web del servidor de rol (landing + normativas + sistema de casas
por **zonas** con mapa interactivo) y su **panel de gestión**.

- **Repo independiente** (solo frontend). El backend sigue siendo el de ReXyo:
  la API cuelga de `/lsrp/api` (mismo origen cuando se sirve bajo `rexyoes.com/lsrp`).
- **Vite + React 19 + TypeScript**. `base: '/lsrp/'`, build en `dist/`.
- Mapa basado en **RiceaRaul/gta-v-map-leaflet** (vendorizado en `vendor/`): CRS de
  GTA V, estilos Satélite/Atlas/Grid y tiles `styleSatelite|styleAtlas|styleGrid`.

## Desarrollo
```bash
npm install
npm run dev            # /lsrp/api se proxya a rexyoes.com
```

## Compilar
```bash
npm run build          # genera dist/
```

## Despliegue (por ahora, vía ReXyo)
El sitio se sirve en `rexyoes.com/lsrp`. Para publicar: copia el contenido de
`dist/` en `website/lsrp/` del repo de ReXyo y súbelo (Cloudflare despliega desde
`main`). Más adelante se puede montar su propio Worker/dominio.

## Mapa (tiles de GTA V)
El repo del mapa **no incluye los tiles** (se distribuyen aparte: enlace de MEGA
en `vendor/gta-v-map-leaflet/README.md`). Descarga la carpeta de tiles y colócala
en `public/mapStyles/` con la estructura `styleSatelite/ styleAtlas/ styleGrid/`.
Luego, en el panel → Ajustes → Mapa, elige «Tiles de GTA V» y pon la URL base
`/lsrp/mapStyles`. Mientras no haya tiles, el mapa usa una imagen placeholder.

## Modelo
- **Zonas**: áreas (polígonos) dibujadas sobre el mapa, con nombre y color.
- **Mapeados**: interiores disponibles (foto + nombre + precio opcional), cada
  uno asignado a una zona. En la web, al elegir una zona se listan sus mapeados.

## Estructura
- `src/pages` — Inicio, Normativas, Casas (zonas + mapeados).
- `src/components/ZoneMap.tsx` — mapa Leaflet (zonas + editor de polígonos).
- `src/admin` — panel: Zonas y mapa, Mapeados, Normativas, Landing, Ajustes, Cuenta.
- `vendor/gta-v-map-leaflet` — librería del mapa (referencia).
