# ENVY Community — web

Frontend + Worker de la web del servidor de rol (landing + normativas PDF +
sistema de casas por **zonas** con mapa interactivo) y su **panel de gestión**.

- **Cloudflare Worker** propio: API en `/lsrp/api` (D1 + R2) y la web en `/lsrp/`.
- **Vite + React 19 + TypeScript**. `base: '/lsrp/'`, build en `dist/`.
- Mapa Leaflet con CRS de GTA V: estilos Satélite/Atlas/Grid.

## Desarrollo
```bash
npm install
npm run dev            # proxy de /lsrp/api → tu Worker en workers.dev
```

Para probar API+web juntos en local:
```bash
npm run build
npx wrangler dev
```

## Compilar y desplegar
```bash
npm run build
npx wrangler deploy
```

URL típica: `https://envy-community.<subdominio>.workers.dev/lsrp/`

La primera vez crea la contraseña del panel. Si usas secretos:
```bash
npx wrangler secret put SESSION_SECRET
```

## Modelo
- **Zonas**: áreas (polígonos) dibujadas sobre el mapa, con nombre y color.
- **Mapeados**: interiores disponibles (foto + nombre + precio opcional), cada
  uno asignado a una zona.
- **Normativas**: uno o varios PDFs subidos desde el panel, con lector integrado.

## Estructura
- `src/pages` — Inicio, Normativas, Casas.
- `src/components/ZoneMap.tsx` — mapa Leaflet.
- `src/admin` — panel de gestión.
- `worker.js` — API + servir `dist/`.
