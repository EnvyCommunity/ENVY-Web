// ═══════════════════════════════════════════════════════════════════════════
//  ENVY Community — Worker independiente (Cloudflare)
//  Sirve la web compilada (binding ASSETS) y su API en /lsrp/api/* sobre D1
//  (binding DB) + R2 (binding BUCKET). NO contiene nada de ReXyo.
//  Requiere un secreto de sesión: `wrangler secret put SESSION_SECRET`.
// ═══════════════════════════════════════════════════════════════════════════

const PBKDF2_ITER = 100000;
const FALLBACK_SECRET = 'rx_setup_pending_define_SESSION_SECRET_env_var';
let ACTIVE_SECRET = FALLBACK_SECRET;
function setSecret(env) { ACTIVE_SECRET = (env && env.SESSION_SECRET) || FALLBACK_SECRET; }
const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const enc = new TextEncoder();
function ctEqual(a, b) { // comparación en tiempo constante
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const toHex = (u8) => Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join('');
function fromHex(h) { const u = new Uint8Array(h.length / 2); for (let i = 0; i < u.length; i++) u[i] = parseInt(h.substr(i * 2, 2), 16); return u; }
function sanitizeHeader(s) { return String(s == null ? '' : s).replace(/[\r\n\x00-\x1f"\\]/g, '').slice(0, 200) || 'archivo'; }
async function pbkdf2(pass, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pass)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256);
  return new Uint8Array(bits);
}
async function hashPassword(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const h = await pbkdf2(pass, salt, PBKDF2_ITER);
  return `pbkdf2:${PBKDF2_ITER}:${toHex(salt)}:${toHex(h)}`;
}
async function verifyPassword(pass, stored) {
  if (!stored) return false;
  const p = String(stored).split(':');
  if (p[0] === 'pbkdf2') {
    const got = toHex(await pbkdf2(pass, fromHex(p[2]), Number(p[1]) || PBKDF2_ITER));
    return ctEqual(got, p[3] || '');
  }
  return ctEqual(String(pass), String(stored)); // compatibilidad con datos antiguos (se migran a hash)
}
// ── Firma de sesión (HMAC-SHA256) ──
async function hmac(data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(ACTIVE_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function getCookie(request, name) {
  const c = request.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}
// ── Rate limiting básico (por IP) apoyado en D1 ──
async function rateLimit(env, key, max, windowSec) {
  try {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS sec_rl (k TEXT PRIMARY KEY, n INTEGER, exp INTEGER)').run();
    const row = await env.DB.prepare('SELECT n, exp FROM sec_rl WHERE k=?1').bind(key).first();
    if (row && row.exp > now) {
      if (row.n >= max) return false;
      await env.DB.prepare('UPDATE sec_rl SET n = n + 1 WHERE k=?1').bind(key).run();
      return true;
    }
    await env.DB.prepare('INSERT INTO sec_rl (k, n, exp) VALUES (?1, 1, ?2) ON CONFLICT(k) DO UPDATE SET n=1, exp=?2').bind(key, now + windowSec).run();
    return true;
  } catch (e) { return true; } // ante fallo del limitador, no bloquear el servicio
}
const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'anon';

const LSRP_COOKIE = 'lsrp_admin';
const lsrpCookie = (t) => `${LSRP_COOKIE}=${t}; HttpOnly; Secure; SameSite=Lax; Path=/lsrp; Max-Age=604800`;
const lsrpClearCookie = () => `${LSRP_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/lsrp; Max-Age=0`;

async function lsrpMakeToken() {
  const exp = Date.now() + 604800000; // 7 días
  const payload = 'lsrp.admin.' + exp;
  return payload + '.' + (await hmac(payload));
}
async function lsrpAuthed(request) {
  const t = getCookie(request, LSRP_COOKIE);
  if (!t) return false;
  const i = t.lastIndexOf('.');
  if (i < 1) return false;
  const p = t.slice(0, i), sig = t.slice(i + 1);
  if (!ctEqual(await hmac(p), sig)) return false;
  const exp = Number(p.split('.')[2] || 0);
  return Date.now() < exp;
}

async function lsrpTables(env) {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS lsrp_state (k TEXT PRIMARY KEY, v TEXT)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS lsrp_mapeados (id TEXT PRIMARY KEY, orden INTEGER DEFAULT 0, json TEXT)').run();
}
async function lsrpGet(env, k) {
  const r = await env.DB.prepare('SELECT v FROM lsrp_state WHERE k=?1').bind(k).first();
  if (!r) return null;
  try { return JSON.parse(r.v); } catch (e) { return null; }
}
async function lsrpSet(env, k, v) {
  await env.DB.prepare('INSERT INTO lsrp_state (k,v) VALUES (?1,?2) ON CONFLICT(k) DO UPDATE SET v=?2')
    .bind(k, JSON.stringify(v)).run();
}

// ── Siembra por defecto (contenido inicial que se ve nada más desplegar) ──
const LSRP_SEED = {
  settings: {
    serverName: 'ENVY Community', logoUrl: '', discordUrl: 'https://discord.gg/', tebexUrl: '',
    connectLabel: 'Conectar',
    nav: [
      { label: 'Inicio', href: '#/' }, { label: 'Normativas', href: '#/normativas' }, { label: 'Casas', href: '#/casas' },
      { label: 'Facciones', href: 'https://discord.gg/' }, { label: 'Comunidad', href: 'https://discord.gg/' }, { label: 'Soporte', href: 'https://discord.gg/' },
    ],
    socials: [{ label: 'Discord', href: 'https://discord.gg/' }, { label: 'Tienda', href: '' }],
    colors: { primary: '#E6E6FA', accent: '#3ba9ff' },
    map: { mode: 'image', imageUrl: '/lsrp/mapa-satelite.jpg', imageW: 4096, imageH: 4096, tileBaseUrl: '', defaultStyle: 'atlas', minZoom: 1, maxZoom: 5 },
    zonas: [
      { key: 'vinewood', label: 'Vinewood', color: '#f5b510', polygon: [[1220, 980], [1220, 1380], [1620, 1380], [1620, 980]] },
      { key: 'richman', label: 'Richman', color: '#c874ff', polygon: [[1330, 710], [1330, 1090], [1710, 1090], [1710, 710]] },
      { key: 'delperro', label: 'Del Perro', color: '#3ba9ff', polygon: [[800, 340], [800, 700], [1160, 700], [1160, 340]] },
      { key: 'vespucci', label: 'Vespucci', color: '#37d399', polygon: [[950, 570], [950, 910], [1290, 910], [1290, 570]] },
      { key: 'centro', label: 'Centro (Downtown)', color: '#ff8a5a', polygon: [[990, 890], [990, 1210], [1310, 1210], [1310, 890]] },
      { key: 'south', label: 'South Los Santos', color: '#8ad0ff', polygon: [[570, 890], [570, 1270], [950, 1270], [950, 890]] },
      { key: 'paleto', label: 'Paleto Bay', color: '#7cffb0', polygon: [[1680, 920], [1680, 1320], [2080, 1320], [2080, 920]] },
      { key: 'sandy', label: 'Sandy Shores', color: '#ffd166', polygon: [] },
      { key: 'east', label: 'East Los Santos', color: '#ff6f91', polygon: [] },
      { key: 'otros', label: 'Otros', color: '#9aa4b2', polygon: [] },
    ],
    seo: { title: 'ENVY Community', description: 'Una ciudad viva, realista y llena de oportunidades. Normativas, sistema de casas por zonas con mapa interactivo y comunidad.' },
  },
  landing: {
    hero: { eyebrow: 'ENVY COMMUNITY', title: 'TU HISTORIA\nEMPIEZA AQUÍ', subtitle: 'Una ciudad viva, realista y llena de oportunidades. Únete a una comunidad que lleva el roleplay al siguiente nivel.', bg: '', ctaPrimary: { label: 'Unirse al servidor', href: 'https://discord.gg/' }, ctaSecondary: { label: 'Ver normativas', href: '#/normativas' } },
    stats: [
      { icon: 'discord', value: '+2.500', label: 'Miembros' }, { icon: 'user', value: '+120', label: 'Roleplayers activos' },
      { icon: 'gear', value: '+10', label: 'Facciones oficiales' }, { icon: 'headset', value: '24/7', label: 'Servidor online' },
    ],
    featuresEyebrow: 'EXPLORA LA CIUDAD', featuresTitle: 'TODO LO QUE NECESITAS\nEN UN SOLO LUGAR', featuresSubtitle: 'Accede a la información más importante del servidor y empieza tu nueva vida.',
    features: [
      { icon: 'book', title: 'Normativas', text: 'Conoce las reglas del servidor y evita sanciones.', link: { label: 'Ver normativas', href: '#/normativas' } },
      { icon: 'house', title: 'Sistema de Casas', text: 'Explora las zonas y sus mapeados interiores disponibles.', link: { label: 'Explorar mapa', href: '#/casas' } },
      { icon: 'users', title: 'Facciones', text: 'Únete a una facción y forma parte de la ciudad.', link: { label: 'Ver facciones', href: 'https://discord.gg/' } },
      { icon: 'headset', title: 'Soporte', text: '¿Tienes una duda? Estamos aquí para ayudarte.', link: { label: 'Abrir ticket', href: 'https://discord.gg/' } },
    ],
    banner: { title: 'UNA CIUDAD,\nINFINITAS HISTORIAS', text: 'Respeto, realismo y comunidad. Esto es más que un servidor, es una forma de vivir.', bg: '' },
  },
  normativas: {
    intro: 'El respeto y el buen roleplay hacen grande esta ciudad. Lee y comprende las normativas antes de jugar.',
    secciones: [
      {
        id: 'introduccion', icon: 'info', title: 'Introducción', articulos: [
          { id: 'i1', title: '1. Introducción', html: '<p>Estas normativas existen para asegurar una experiencia de juego justa, realista y divertida para todos los miembros de la comunidad. El desconocimiento de las normas no exime de su cumplimiento.</p><div class="callout"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><div><em>&ldquo;El roleplay es libertad, pero con respeto.&rdquo;</em></div></div>' },
          { id: 'i2', title: '1.1. Objetivo del servidor', html: '<p>Nuestro objetivo es ofrecer una ciudad de Los Santos viva, realista y coherente.</p><ul><li>Fomentar el roleplay realista.</li><li>Crear una comunidad sana y madura.</li><li>Mantener un entorno estable y libre de toxicidad.</li><li>Ofrecer una experiencia única y duradera.</li></ul>' },
        ]
      },
      { id: 'generales', icon: 'shield', title: 'Normas Generales', articulos: [{ id: 'g1', title: '2. Comportamiento', html: '<p>Trata a todos con respeto, dentro y fuera del rol. No se tolera el racismo, la discriminación ni la toxicidad.</p><ul><li>Prohibido el insulto grave.</li><li>Prohibido el contenido ofensivo en nombres o negocios.</li><li>El staff tiene la última palabra en una incidencia.</li></ul>' }] },
      { id: 'roleplay', icon: 'users', title: 'Roleplay (IC / OOC)', articulos: [{ id: 'r1', title: '3. IC y OOC', html: '<p><strong>IC:</strong> lo que ocurre dentro del personaje. <strong>OOC:</strong> información de la vida real.</p><ul><li>Prohibido el Metagaming.</li><li>Prohibido el Powergaming.</li></ul>' }] },
      { id: 'personajes', icon: 'user', title: 'Personajes', articulos: [{ id: 'p1', title: '4. Tu personaje', html: '<p>Desarrolla una historia coherente. Las muertes en rol tienen consecuencias sobre la memoria del personaje.</p>' }] },
      { id: 'facciones', icon: 'flag', title: 'Facciones', articulos: [{ id: 'f1', title: '5. Facciones', html: '<p>Organizaciones legales o ilegales reconocidas por el staff, con jerarquía y narrativa coherente.</p>' }] },
      { id: 'economia', icon: 'coin', title: 'Economía', articulos: [{ id: 'e1', title: '6. Economía', html: '<p>Economía cerrada y realista. Prohibido el uso de bugs económicos.</p>' }] },
      { id: 'sanciones', icon: 'gavel', title: 'Sanciones', articulos: [{ id: 's1', title: '7. Sanciones', html: '<p>El incumplimiento conlleva sanciones que van del aviso al baneo permanente según gravedad y reincidencia.</p>' }] },
      { id: 'casas', icon: 'house', title: 'Sistema de Casas', articulos: [{ id: 'c1', title: '8. Casas y propiedades', html: '<p>Compra o alquila propiedades según tu clase económica. Consulta el mapa de casas.</p>' }] },
      { id: 'vehiculos', icon: 'car', title: 'Vehículos', articulos: [{ id: 'v1', title: '9. Vehículos', html: '<p>Conduce de forma realista. El VDM está sancionado.</p>' }] },
      { id: 'streams', icon: 'video', title: 'Streams y Contenido', articulos: [{ id: 'st1', title: '10. Creadores de contenido', html: '<p>Indica siempre el servidor. Prohibido el stream sniping.</p>' }] },
      { id: 'discord', icon: 'discord', title: 'Discord', articulos: [{ id: 'd1', title: '11. Normas de Discord', html: '<p>El Discord es la vía oficial de comunicación. Respeta los canales.</p>' }] },
      { id: 'terminos', icon: 'book', title: 'Términos Finales', articulos: [{ id: 't1', title: '12. Términos finales', html: '<p>Estas normativas pueden actualizarse en cualquier momento. Mantente informado.</p>' }] },
    ],
  },
  mapeados: [
    { id: 'm-vw-1', zonas: ['vinewood'], nombre: 'Mansión moderna', imgs: [], precio: 550000, descripcion: 'Vistas panorámicas, piscina y garaje doble.', destacado: true, orden: 1 },
    { id: 'm-vw-2', zonas: ['vinewood'], nombre: 'Loft minimalista', imgs: [], precio: 480000, descripcion: 'Diseño abierto y luminoso en las colinas.', destacado: false, orden: 2 },
    { id: 'm-rich-1', zonas: ['richman'], nombre: 'Mansión VIP', imgs: [], precio: 1250000, descripcion: 'Máxima exclusividad y seguridad.', destacado: true, orden: 1 },
    { id: 'm-dp-1', zonas: ['delperro'], nombre: 'Apartamento playa', imgs: [], precio: 320000, descripcion: 'A pie de playa, ideal para empezar.', destacado: false, orden: 1 },
    { id: 'm-ves-1', zonas: ['vespucci'], nombre: 'Casa canal', imgs: [], precio: 285000, descripcion: 'Junto a los canales de Vespucci.', destacado: false, orden: 1 },
    { id: 'm-south-1', zonas: ['south'], nombre: 'Piso básico', imgs: [], precio: 95000, descripcion: 'Económico y bien comunicado.', destacado: false, orden: 1 },
    { id: 'm-paleto-1', zonas: ['paleto'], nombre: 'Cabaña rural', imgs: [], precio: 120000, descripcion: 'Tranquilidad en el norte del mapa.', destacado: false, orden: 1 },
  ],
};

async function lsrpEnsureSeed(env) {
  await lsrpTables(env);
  if (!(await lsrpGet(env, 'settings'))) await lsrpSet(env, 'settings', LSRP_SEED.settings);
  if (!(await lsrpGet(env, 'landing'))) await lsrpSet(env, 'landing', LSRP_SEED.landing);
  if (!(await lsrpGet(env, 'normativas'))) await lsrpSet(env, 'normativas', LSRP_SEED.normativas);

  // Migración: las zonas antiguas no tenían color/polígono, y ya no hay
  // categorías. Se actualizan a la nueva forma (los datos de prod solo tenían
  // los valores por defecto, así que no se pierde personalización).
  const st = await lsrpGet(env, 'settings');
  if (st) {
    let changed = false;
    if (!Array.isArray(st.zonas) || st.zonas.some((z) => !z.color || !Array.isArray(z.polygon))) {
      st.zonas = LSRP_SEED.settings.zonas; changed = true;
    }
    if (st.categorias) { delete st.categorias; changed = true; }
    // Si el mapa aún apunta al placeholder (o está vacío), pásalo al satélite
    // servido. No pisa una imagen que ya se haya configurado a mano.
    if (st.map && (!st.map.imageUrl || /map-placeholder/.test(st.map.imageUrl))) {
      st.map.imageUrl = '/lsrp/mapa-satelite.jpg'; st.map.imageW = 4096; st.map.imageH = 4096; changed = true;
    }
    if (changed) await lsrpSet(env, 'settings', st);
  }

  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM lsrp_mapeados').first();
  if (!n || !n.n) {
    for (const m of LSRP_SEED.mapeados) {
      await env.DB.prepare('INSERT OR IGNORE INTO lsrp_mapeados (id, orden, json) VALUES (?1,?2,?3)')
        .bind(m.id, m.orden || 0, JSON.stringify(m)).run();
    }
  }
}
async function lsrpMapeados(env) {
  const r = await env.DB.prepare('SELECT json FROM lsrp_mapeados ORDER BY orden ASC, id ASC').all();
  return (r.results || []).map((row) => { try { return JSON.parse(row.json); } catch (e) { return null; } }).filter(Boolean);
}

async function handleLsrp(request, env, url, ctx) {
  await lsrpEnsureSeed(env);
  const path = url.pathname.replace(/^\/lsrp\/api\/?/, '');
  const method = request.method;

  // ── Público ──
  if (path === 'public' && method === 'GET') {
    return json({ settings: await lsrpGet(env, 'settings'), landing: await lsrpGet(env, 'landing') },
      200, { 'cache-control': 'public, max-age=30' });
  }
  if (path === 'normativas' && method === 'GET') {
    return json(await lsrpGet(env, 'normativas'), 200, { 'cache-control': 'public, max-age=30' });
  }
  if (path === 'mapeados' && method === 'GET') {
    return json({ mapeados: await lsrpMapeados(env) }, 200, { 'cache-control': 'public, max-age=30' });
  }
  // Servir una imagen de R2 (pública, cacheable): /lsrp/api/media?k=…
  if (path === 'media' && method === 'GET') {
    if (!env.BUCKET) return json({ error: 'r2_not_configured' }, 503);
    const key = url.searchParams.get('k') || '';
    if (!key.startsWith('lsrp/')) return json({ error: 'bad_key' }, 400);
    const obj = await env.BUCKET.get(key);
    if (!obj) return json({ error: 'not_found' }, 404);
    const h = new Headers();
    obj.writeHttpMetadata(h);
    h.set('cache-control', 'public, max-age=31536000, immutable');
    return new Response(obj.body, { headers: h });
  }

  // ── Sesión del panel ──
  if (path === 'admin/me' && method === 'GET') {
    const hasPass = !!(await lsrpGet(env, 'admin_pass'));
    return json({ ok: await lsrpAuthed(request), needsSetup: !hasPass });
  }
  if (path === 'admin/setup' && method === 'POST') {
    if (await lsrpGet(env, 'admin_pass')) return json({ error: 'already_setup' }, 409);
    const b = await request.json().catch(() => ({}));
    const pass = String(b.password || '');
    if (pass.length < 8) return json({ error: 'weak' }, 400);
    await lsrpSet(env, 'admin_pass', await hashPassword(pass));
    return json({ ok: true }, 200, { 'set-cookie': lsrpCookie(await lsrpMakeToken()) });
  }
  if (path === 'admin/login' && method === 'POST') {
    if (!(await rateLimit(env, 'lsrp_login:' + clientIp(request), 8, 300))) return json({ error: 'too_many' }, 429);
    const b = await request.json().catch(() => ({}));
    const stored = await lsrpGet(env, 'admin_pass');
    if (!stored || !(await verifyPassword(String(b.password || ''), stored))) return json({ error: 'bad_credentials' }, 401);
    return json({ ok: true }, 200, { 'set-cookie': lsrpCookie(await lsrpMakeToken()) });
  }
  if (path === 'admin/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': lsrpClearCookie() });
  }

  // ── A partir de aquí, todo requiere sesión ──
  if (path.startsWith('admin/')) {
    if (!(await lsrpAuthed(request))) return json({ error: 'unauthorized' }, 401);
  } else {
    return json({ error: 'not_found' }, 404);
  }

  if (path === 'admin/password' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const stored = await lsrpGet(env, 'admin_pass');
    if (!stored || !(await verifyPassword(String(b.actual || ''), stored))) return json({ error: 'bad_credentials' }, 401);
    if (String(b.nueva || '').length < 8) return json({ error: 'weak' }, 400);
    await lsrpSet(env, 'admin_pass', await hashPassword(String(b.nueva)));
    return json({ ok: true });
  }

  if (path === 'admin/settings' && method === 'POST') {
    const b = await request.json().catch(() => null);
    if (!b || typeof b !== 'object') return json({ error: 'bad_body' }, 400);
    await lsrpSet(env, 'settings', b);
    return json({ ok: true });
  }
  if (path === 'admin/landing' && method === 'POST') {
    const b = await request.json().catch(() => null);
    if (!b || typeof b !== 'object') return json({ error: 'bad_body' }, 400);
    await lsrpSet(env, 'landing', b);
    return json({ ok: true });
  }
  if (path === 'admin/normativas' && method === 'POST') {
    const b = await request.json().catch(() => null);
    if (!b || typeof b !== 'object') return json({ error: 'bad_body' }, 400);
    await lsrpSet(env, 'normativas', b);
    return json({ ok: true });
  }

  if (path === 'admin/mapeados' && method === 'GET') {
    return json({ mapeados: await lsrpMapeados(env) });
  }
  if (path === 'admin/mapeados' && method === 'POST') {
    const m = await request.json().catch(() => null);
    if (!m || typeof m !== 'object') return json({ error: 'bad_body' }, 400);
    if (!m.id) m.id = 'm-' + crypto.randomUUID().slice(0, 8);
    await env.DB.prepare('INSERT INTO lsrp_mapeados (id, orden, json) VALUES (?1,?2,?3) ON CONFLICT(id) DO UPDATE SET orden=?2, json=?3')
      .bind(m.id, Number(m.orden) || 0, JSON.stringify(m)).run();
    return json({ ok: true, mapeado: m });
  }
  if (path.startsWith('admin/mapeados/') && method === 'DELETE') {
    const id = decodeURIComponent(path.slice('admin/mapeados/'.length));
    await env.DB.prepare('DELETE FROM lsrp_mapeados WHERE id=?1').bind(id).run();
    return json({ ok: true });
  }

  // Subida de imágenes a R2: PUT /lsrp/api/admin/media?name=archivo.jpg
  if (path === 'admin/media' && method === 'PUT') {
    if (!env.BUCKET) return json({ error: 'r2_not_configured' }, 503);
    const name = sanitizeHeader(url.searchParams.get('name') || 'img');
    const ext = (name.match(/\.([a-z0-9]{2,5})$/i) || [, 'bin'])[1].toLowerCase();
    const key = 'lsrp/media/' + crypto.randomUUID() + '.' + ext;
    await env.BUCKET.put(key, request.body, {
      httpMetadata: { contentType: request.headers.get('content-type') || 'application/octet-stream' },
      customMetadata: { name },
    });
    return json({ ok: true, key, url: '/lsrp/api/media?k=' + encodeURIComponent(key) });
  }

  return json({ error: 'not_found' }, 404);
}


export default {
  async fetch(request, env, ctx) {
    setSecret(env);
    const url = new URL(request.url);
    if (url.pathname.startsWith('/lsrp/api/')) {
      try { return await handleLsrp(request, env, url, ctx); }
      catch (e) { return json({ error: 'server_error' }, 500); }
    }
    // La web vive bajo /lsrp: la raíz redirige ahí.
    if (url.pathname === '/' || url.pathname === '') {
      return Response.redirect(url.origin + '/lsrp/', 302);
    }
    // La web compilada está en dist/, pero se publica bajo /lsrp/
    if (url.pathname === '/lsrp' || url.pathname === '/lsrp/') {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = '/';
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    if (url.pathname.startsWith('/lsrp/')) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = url.pathname.slice('/lsrp'.length) || '/';
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    // Cualquier otra ruta.
    return env.ASSETS.fetch(request);
  }
}
