-- ═══════════════════════════════════════════════════════════════════
--  ENVY Community — esquema de la base de datos (Cloudflare D1)
--  SOLO las tablas de esta web. NO contiene nada de ReXyo.
--
--  Las tablas se crean solas en la primera petición (el worker hace
--  CREATE TABLE IF NOT EXISTS), así que este fichero es de referencia /
--  para montar una D1 nueva vacía sin arrancar aún el worker.
-- ═══════════════════════════════════════════════════════════════════

-- Estado y contenido (JSON): 'settings', 'landing', 'normativas', 'admin_pass'.
CREATE TABLE IF NOT EXISTS lsrp_state (
  k TEXT PRIMARY KEY,
  v TEXT
);

-- Mapeados (interiores): una fila por mapeado, el contenido va en json.
CREATE TABLE IF NOT EXISTS lsrp_mapeados (
  id    TEXT PRIMARY KEY,
  orden INTEGER DEFAULT 0,
  json  TEXT
);
