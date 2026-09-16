# ENVY Community — web

Frontend de la web del servidor de rol (landing + normativas PDF + sistema de casas
por **zonas** con mapa interactivo) y su **panel de gestión**.

- **Repo independiente** (solo frontend). El backend sigue siendo el de ReXyo:
  la API cuelga de `/lsrp/api` (mismo origen cuando se sirve bajo `rexyoes.com/lsrp`).
- **Vite + React 19 + TypeScript**. `base: '/lsrp/'`, build en `dist/`.
- Mapa Leaflet con CRS de GTA V (inspirado en RiceaRaul/gta-v-map-leaflet):
  estilos Satélite/Atlas/Grid y tiles `styleSatelite|styleAtlas|styleGrid`.

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
Los tiles no van en el repo. Descárgalos y colócalos en `public/mapStyles/` con
la estructura `styleSatelite/ styleAtlas/ styleGrid/`. Luego, en el panel →
Ajustes → Mapa, elige «Tiles de GTA V» y pon la URL base `/lsrp/mapStyles`.
Sin tiles, el mapa usa la imagen `mapa-satelite.jpg`.

## Modelo
- **Zonas**: áreas (polígonos) dibujadas sobre el mapa, con nombre y color.
- **Mapeados**: interiores disponibles (foto + nombre + precio opcional), cada
  uno asignado a una zona. En la web, al elegir una zona se listan sus mapeados.
- **Normativas**: uno o varios PDFs subidos desde el panel, con lector integrado.

## Estructura
- `src/pages` — Inicio, Normativas, Casas (zonas + mapeados).
- `src/components/ZoneMap.tsx` — mapa Leaflet (zonas + editor de polígonos).
- `src/admin` — panel: Zonas y mapa, Mapeados, Normativas, Landing, Ajustes, Cuenta.
