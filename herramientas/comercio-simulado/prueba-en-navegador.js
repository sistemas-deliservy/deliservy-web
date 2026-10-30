#!/usr/bin/env node
/*
 * LA PRUEBA EN EL NAVEGADOR DEL PANEL DEL COMERCIO (24-oct-2026). NO se despliega (`herramientas/` no va a Ferozo).
 *
 * Abre Chrome (el instalado en el Mac, con playwright-core) contra la API simulada y recorre TODO el panel con clics de
 * verdad: entrar (número sin tienda, código malo), cada sección, el pedido nuevo (sonido, título, «Nuevo»), «No puedo
 * preparar» en dos pasos, «Listo para recoger», exportar, fotos (recorte a 2000 px y el fallo), el 409 del grupo,
 * vendedores externos, el retiro con código, la flota (pagar, pedir con botones y con Alisa, el motorizado en vivo),
 * «Mostrar en la app» (falta algo / todo bien), el horario, trabajadores, el cajero y la sesión vencida. En teléfono
 * (390 × 844) y computadora (1366 × 900), en claro, en oscuro y en inglés. Falla si hay un error en la consola, una
 * violación de la CSP o la página se sale de ancho.
 *
 * El rediseño (30-oct-2026, C2 · C3 · C5 · C7) tiene su pasada: afiliar por la web (el dueño y el encargado), la tabla
 * de promotores (dos filas cambiadas, un solo «Guardar cambios», el error de una fila), los grupos plegables y los
 * filtros de Productos, y «Activa tu tienda» con la bodega nueva de Carmen (0412-555-0103). Sus capturas finales van
 * a FINALES=/carpeta (si se da), como com-*.png en teléfono (390 × 844) y computadora (1366 × 860).
 *
 *   node herramientas/comercio-simulado/servidor.js &          # la API simulada (puerto 8787)
 *   node herramientas/comercio-simulado/prueba-en-navegador.js  # la prueba (deja las capturas)
 *
 *   CAPTURAS=/otra/carpeta  VER=1 (con ventana)  PLAYWRIGHT_CORE=/ruta/a/playwright-core
 *
 * La única petición de fuera es la del mapa (www.deliservy.website): si no llega, el recuadro dice que no cargó.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function cargarPlaywright() {
  const candidatos = [process.env.PLAYWRIGHT_CORE, 'playwright-core', 'playwright',
    path.resolve(__dirname, '../../../deliservy-server/test/paqueteria/node_modules/playwright-core'),
    '/Users/gilberthroca/Documents/Deliservy - Código y Fuentes/Fuentes Deliservy App/deliservy-server/test/paqueteria/node_modules/playwright-core'];
  for (const c of candidatos) {
    if (!c) continue;
    try { return require(c); } catch (_) { /* el siguiente */ }
  }
  console.error('No encontré playwright-core. Ponlo en PLAYWRIGHT_CORE=/ruta/a/node_modules/playwright-core');
  process.exit(2);
}
const { chromium } = cargarPlaywright();

const BASE = process.env.BASE || 'http://localhost:8787';
const CAPTURAS = process.env.CAPTURAS || '/Users/gilberthroca/Documents/Deliservy - Panel del comercio (propuesta 24-oct-2026)/capturas-web';
const TEL = { dueno: '0412-555-0101', cajero: '0412-555-0102', nueva: '0412-555-0103', sinTienda: '0412-555-0199' };
const FINALES = process.env.FINALES || '';
const COMPU_FINAL = { width: 1366, height: 860 };
const TELEFONO = { width: 390, height: 844 };
const COMPUTADORA = { width: 1366, height: 900 };

let ok = 0, mal = 0;
const fallos = [];
function check(nombre, cond, detalle) {
  if (cond) { ok++; console.log('   ✅ ' + nombre + (detalle ? ' · ' + detalle : '')); }
  else { mal++; fallos.push(nombre + (detalle ? ' · ' + detalle : '')); console.log('   ❌ ' + nombre + (detalle ? ' · ' + detalle : '')); }
}
function titulo(t) { console.log('\n\x1b[1m' + t + '\x1b[0m'); }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function simulado(ruta, metodo) {
  const r = await fetch(BASE + ruta, { method: metodo || 'POST' });
  return r.json();
}

// ── Una foto de prueba: un PNG de 2400 × 1600 (se tiene que recortar a 1600 cuadrado y achicar… a 1600, que es < 2000;
//    por eso la de producto se hace de 3000 × 2400 → cuadrado 2400 → 2000). ──
function png(ancho, alto) {
  const crcTabla = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (buf) => { let c = -1; for (const b of buf) c = crcTabla[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const trozo = (tipo, datos) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
    const td = Buffer.concat([Buffer.from(tipo), datos]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const fila = 1 + ancho * 3;
  const crudo = Buffer.alloc(fila * alto);
  for (let y = 0; y < alto; y++) {
    crudo[y * fila] = 0;
    for (let x = 0; x < ancho; x++) {
      const i = y * fila + 1 + x * 3;
      crudo[i] = 228 - Math.round((x / ancho) * 60); crudo[i + 1] = 40 + Math.round((y / alto) * 120); crudo[i + 2] = 40;
      if (Math.hypot(x - ancho / 2, y - alto / 2) < Math.min(ancho, alto) / 4) { crudo[i] = 250; crudo[i + 1] = 210; crudo[i + 2] = 120; }
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), trozo('IHDR', ihdr), trozo('IDAT', zlib.deflateSync(crudo)), trozo('IEND', Buffer.alloc(0))]);
}

// ── El navegador ─────────────────────────────────────────────────────────────

async function abrir(browser, o) {
  o = o || {};
  const ctx = await browser.newContext({
    viewport: o.viewport || TELEFONO, deviceScaleFactor: o.viewport && o.viewport.width > 1000 ? 1 : 2, locale: 'es-VE',
    timezoneId: 'America/Caracas', colorScheme: o.oscuro ? 'dark' : 'light', acceptDownloads: true,
    geolocation: o.geo || undefined, permissions: o.geo ? ['geolocation'] : [],
  });
  await ctx.addInitScript((ingles) => {
    try { localStorage.setItem('deliservy_idioma', ingles ? 'en' : 'es'); } catch (_) { /* nada */ }
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => { window.__csp.push(e.violatedDirective + ' ' + e.blockedURI); console.error('CSP ' + e.violatedDirective + ' ' + e.blockedURI); });
    // El sonido y el aviso del navegador, contados (la página no cambia: solo se mira).
    window.__sonidos = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { if (!this.muted) window.__sonidos++; return play.call(this).catch(() => {}); };
    window.__avisos = [];
    window.__permiso = 'default';
    function Aviso(t, op) { window.__avisos.push({ titulo: t, cuerpo: op && op.body }); this.close = function () {}; }
    Object.defineProperty(Aviso, 'permission', { get: () => window.__permiso });
    Aviso.requestPermission = () => Promise.resolve(window.__permiso = 'granted');
    window.Notification = Aviso;
  }, !!o.ingles);
  const page = await ctx.newPage();
  const errores = [];
  // Una respuesta 4xx/5xx de la API que la prueba provoca a propósito (número sin tienda, código malo, lo ajeno, la
  // foto que falla, los 409, la sesión vencida) la anota el navegador como «Failed to load resource»: esas se miran
  // aparte, una por una, con `esperadas`. Cualquier otra (un archivo que falta, una ruta rota) es un error.
  page.malas = [];
  page.on('response', (r) => {
    if (r.status() < 400) return;
    const u = new URL(r.url());
    page.malas.push(r.request().method() + ' ' + u.pathname + ' ' + r.status());
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/^Failed to load resource: the server responded with a status of \d{3}/.test(m.text())) return;
    // El mapa (estilos y teselas de www.deliservy.website): si no llega, el recuadro lo dice (como en `requestfailed`).
    if (/^Failed to load resource: net::/.test(m.text()) && /deliservy\.website/.test((m.location() || {}).url || '')) return;
    errores.push(m.text());
  });
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/deliservy\.website/.test(u)) return; // el mapa: si no llega, el recuadro lo dice
    if (/\.mp3(\?|$)/.test(u) && /ERR_ABORTED/.test((r.failure() || {}).errorText || '')) return; // el navegador corta el audio al pausarlo
    errores.push('requestfailed: ' + u + ' ' + ((r.failure() || {}).errorText || ''));
  });
  return { ctx, page, errores };
}

/** «grupo-NN-nombre» (cada grupo con su cuenta): las capturas de una misma pasada quedan juntas y en orden. */
const cuentas = {};
function enGrupo(grupo, nombre) { cuentas[grupo] = (cuentas[grupo] || 0) + 1; return grupo + '-' + String(cuentas[grupo]).padStart(2, '0') + '-' + nombre; }
async function foto(page, nombre, completa) {
  await page.mouse.move(2, 2);
  await esperar(400);
  const ruta = path.join(CAPTURAS, nombre + '.png');
  if (!completa) { await page.screenshot({ path: ruta }); return; }
  // La página entera, con la barra de abajo en su sitio: la ventana tan alta como la página.
  const vp = page.viewportSize();
  const alto = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  await page.setViewportSize({ width: vp.width, height: Math.min(alto, 7000) });
  await esperar(350);
  await page.screenshot({ path: ruta });
  await page.setViewportSize(vp);
  await esperar(150);
}
async function ir(page, hash, ms) {
  await page.evaluate((h) => { if (location.hash === h) location.hash = '#hoy'; }, hash);
  await page.evaluate((h) => { location.hash = h; }, hash);
  await esperar(250);
  await page.waitForFunction(() => !document.querySelector('#contenido .cargando'), null, { timeout: 10000 }).catch(() => {});
  await esperar(ms || 500);
}
async function sinAnchoDeMas(page, donde) {
  const a = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
  check('sin scroll horizontal · ' + donde, a.sw <= a.w, a.sw + ' ≤ ' + a.w);
}
async function entrar(page, tel) {
  await page.goto(BASE + '/comercio/');
  await page.waitForSelector('#telefono');
  await page.fill('#telefono', tel);
  await page.click('form button[type=submit]');
  await page.waitForSelector('#codigo');
  await page.type('#codigo', '123456');
  await page.waitForSelector('.cab-seccion h1', { timeout: 10000 });
  await esperar(500);
}
async function textoDe(page, sel) { return (await page.textContent(sel).catch(() => '')) || ''; }
async function elegirTienda(page, storeId, computadora) {
  await page.selectOption(computadora ? '.lateral .selector-tienda' : '.cabecera-tel .selector-tienda', String(storeId));
  await esperar(1200);
}
function revisarErrores(nombre, errores, page, esperadas) {
  check('sin errores en la consola · ' + nombre, errores.length === 0, errores.slice(0, 4).join(' | '));
  if (!page) return;
  const raras = page.malas.filter((m) => !(esperadas || []).some((re) => re.test(m)));
  check('solo las respuestas de error que la prueba provoca · ' + nombre, raras.length === 0, raras.slice(0, 6).join(' | ') || (page.malas.length + ' esperadas'));
}
const ERRORES_ESPERADOS = [
  /^POST \/api\/comercio\/codigo 404$/, /^POST \/api\/comercio\/entrar 400$/, /^GET \/api\/comercio\/pedidos\/999999 404$/,
  /^POST \/api\/comercio\/fotos 500$/, /^DELETE \/api\/comercio\/grupos\/\d+ 409$/, /^POST \/api\/comercio\/tienda\/\d+\/mostrar-en-app 409$/,
  /^GET \/api\/comercio\/[\w/-]+ 401$/, /^POST \/api\/comercio\/plan\/pagar 402$/,
];
/** Las del rediseño: el código malo al afiliar, la fila de promotores que falla a propósito. */
const ERRORES_REDISENO = [/^POST \/api\/comercio\/afiliacion 400$/, /^PUT \/api\/comercio\/vendedores-externos\/productos\/9003 409$/];

// ── Las pruebas ──────────────────────────────────────────────────────────────

async function telefonoClaro(browser) {
  titulo('Teléfono, claro: el dueño (Ana) de punta a punta');
  await simulado('/__simulado/reiniciar');
  const { ctx, page, errores } = await abrir(browser);

  // Entrar
  await page.goto(BASE + '/comercio/');
  await page.waitForSelector('#telefono');
  await foto(page, '01-entrar-telefono');
  await page.fill('#telefono', TEL.sinTienda);
  await page.click('form button[type=submit]');
  await page.waitForSelector('.error');
  check('número sin tienda: la frase de la API', /no tiene una tienda/.test(await textoDe(page, '.error')));
  await foto(page, '02-entrar-numero-sin-tienda');
  await page.fill('#telefono', TEL.dueno);
  await page.click('form button[type=submit]');
  await page.waitForSelector('#codigo');
  await foto(page, '03-entrar-codigo');
  await page.type('#codigo', '000000');
  await page.waitForSelector('.error');
  check('código malo: la frase de la API', /no es correcto/.test(await textoDe(page, '.error')));
  await foto(page, '04-entrar-codigo-incorrecto');
  await page.fill('#codigo', '');
  await page.type('#codigo', '123456');
  await page.waitForSelector('.cab-seccion h1');
  await esperar(600);
  check('entra a «Hoy»', /Hola/.test(await textoDe(page, '.cab-seccion h1')));
  const token = await page.evaluate(() => localStorage.getItem('deliservy_comercio_sesion'));
  check('el token queda en localStorage (43 letras)', /^[A-Za-z0-9_-]{43}$/.test(token || ''));
  check('barra de abajo con «Más»', await page.isVisible('.barra-abajo button'));
  await foto(page, '05-hoy', true);
  await sinAnchoDeMas(page, 'hoy');

  // Pedido nuevo: sonido, aviso, título y «Nuevo»
  await page.evaluate(() => { window.__permiso = 'granted'; });
  const antes = await page.evaluate(() => window.__sonidos);
  const nuevo = await simulado('/__simulado/pedido-nuevo');
  await page.waitForFunction((id) => document.querySelector('a[href="#pedidos/' + id + '"]'), nuevo.id, { timeout: 15000 }).catch(() => {});
  await esperar(800);
  const despues = await page.evaluate(() => ({ sonidos: window.__sonidos, avisos: window.__avisos, titulo: document.title }));
  check('pedido nuevo: suena', despues.sonidos > antes, despues.sonidos + ' > ' + antes);
  check('pedido nuevo: aviso del navegador', despues.avisos.some((a) => a.titulo.indexOf('#' + nuevo.id) >= 0), JSON.stringify(despues.avisos.slice(-1)));
  check('pedido nuevo: el título de la pestaña parpadea', /^\(1\)/.test(despues.titulo), despues.titulo);
  check('pedido nuevo: sale en «Hoy» con «Nuevo»', /Nuevo/.test(await textoDe(page, 'a[href="#pedidos/' + nuevo.id + '"]')));
  await foto(page, '06-hoy-pedido-nuevo');

  // Pedidos
  await ir(page, '#pedidos', 600);
  check('en curso: la devolución con su código', /4821/.test(await textoDe(page, '.devoluciones')));
  await foto(page, '07-pedidos-en-curso', true);
  await ir(page, '#pedidos/historial', 600);
  await page.click('.segmentos button[data-valor="semana"]');
  await esperar(900);
  check('historial por semana: con totales', /Entregados/.test(await textoDe(page, '.cifras')));
  await foto(page, '08-pedidos-historial-semana', true);
  const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('.filtros-dcha .btn')]);
  const archivo = await descarga.path();
  const csv = fs.readFileSync(archivo);
  check('exportar: CSV con BOM, «;» y coma decimal', csv[0] === 0xEF && csv[1] === 0xBB && /;/.test(csv.toString()) && /\d,\d{1,2}(;|\r)/.test(csv.toString()), descarga.suggestedFilename());
  await ir(page, '#pedidos/calendario', 600);
  check('calendario del mes', (await page.$$('.cal-dia:not(.vacio)')).length >= 28);
  await foto(page, '09-pedidos-calendario');
  await ir(page, '#pedidos/2603', 3500);
  check('detalle: datos para la factura', /Deliservyapp/.test(await textoDe(page, '.datos-lista')));
  check('detalle: la ganancia de verdad, con «Promotor» (nunca «vendedor»)', /Promotor/.test(await textoDe(page, '.ganancia')) && !/vendedor/i.test(await textoDe(page, '.ganancia')));
  check('detalle: lo que se descontó (por producto, Premium)', /Deliservy se quedó/.test(await textoDe(page, '.descontado')) && /Premium/.test(await textoDe(page, '.descontado')));
  check('detalle: el repartidor en el mapa', await page.isVisible('.pin-moto').catch(() => false) || await page.isVisible('.cargando-mapa.fallo').catch(() => false));
  await foto(page, '10-pedido-detalle', true);
  await ir(page, '#pedidos/2601', 600);
  await page.click('.acciones-pedido .btn.borde');
  await page.waitForSelector('.costo-cancelar');
  check('no puedo preparar: paso 1 con lo que cuesta', /1,70/.test(await textoDe(page, '.costo-cancelar')));
  await foto(page, '11-pedido-no-puedo-preparar-paso-1');
  await page.click('.dialogo-pie .btn.peligro');
  await page.waitForSelector('.opciones-lista');
  await page.check('input[name="motivo"][value="otro"]');
  await page.click('.dialogo-pie .btn.peligro');
  await esperar(400);
  check('no puedo preparar: «otro» pide el detalle', /qué pasó/.test(await textoDe(page, '.dialogo .error')));
  await page.fill('#cancel-detalle', 'Se nos acabó el queso');
  await foto(page, '12-pedido-no-puedo-preparar-paso-2');
  await page.click('.dialogo-pie .btn.peligro');
  await esperar(1200);
  check('cancelado: el pedido queda «Cancelado»', /Cancelado/.test(await textoDe(page, '.cab-pedido')));
  await ir(page, '#pedidos/2602', 600);
  await page.click('.acciones-pedido .btn:not(.borde)');
  await page.waitForSelector('.dialogo');
  await foto(page, '13-pedido-listo-para-recoger');
  await page.click('.dialogo-pie .btn:not(.borde)');
  await esperar(1200);
  check('listo para recoger: cambia el estado', /Listo para recoger/.test(await textoDe(page, '.cab-pedido')));
  await ir(page, '#pedidos/999999', 400);
  check('pedido ajeno: «No encontramos ese pedido»', /No encontramos/.test(await textoDe(page, '#contenido')));

  // Productos
  await ir(page, '#productos', 700);
  check('productos por grupo', (await page.$$('.grupo-productos')).length >= 3);
  check('productos: sin la pastilla de cobro en las filas, una línea a «Mi plan»', !/por venta/.test(await textoDe(page, '.productos-lista')) && await page.isVisible('.linea-plan a[href="#plan"]'));
  await foto(page, '14-productos', true);
  await page.fill('#buscar-producto', 'pepiada reina');
  await esperar(900);
  check('buscar a medias y en otro orden', (await page.$$('.fila-producto')).length === 1);
  await ir(page, '#productos/9001', 900);
  check('editor: opciones de la app', (await page.$$('.grupo-opciones')).length === 2);
  await foto(page, '15-producto-editar', true);
  const imagen = png(3000, 2400);
  await page.setInputFiles('.fotos-producto .foto-variante:nth-child(2) input[type=file]', { name: 'foto-grande.png', mimeType: 'image/png', buffer: imagen });
  await page.waitForFunction(() => { const z = document.querySelectorAll('.fotos-producto .zona-foto')[1]; return z && z.classList.contains('con-foto') && !z.classList.contains('subiendo'); }, null, { timeout: 20000 }).catch(() => {});
  const subida = await (await fetch(BASE + '/__simulado/ultima-foto')).json();
  check('foto: llegó un JPEG cuadrado de 2000 px', subida.tipo === 'producto' && subida.medidas && subida.medidas.ancho === 2000 && subida.medidas.alto === 2000, JSON.stringify(subida.medidas) + ' ' + subida.bytes + ' bytes');
  await foto(page, '16-producto-foto-subida');
  await simulado('/__simulado/fallar-fotos');
  await page.setInputFiles('.fotos-producto .foto-variante:nth-child(3) input[type=file]', { name: 'otra.png', mimeType: 'image/png', buffer: png(900, 900) });
  await page.waitForSelector('.fotos-producto .foto-variante:nth-child(3) .error-campo:not([hidden])', { timeout: 15000 }).catch(() => {});
  check('foto: si falla, lo dice claro', /No se pudo guardar la foto/.test(await textoDe(page, '.fotos-producto .foto-variante:nth-child(3) .error-campo')));
  await foto(page, '17-producto-foto-error');
  await page.click('.pie-fijo .btn:not(.borde)');
  await page.waitForFunction(() => location.hash === '#productos', null, { timeout: 15000 }).catch(() => {});
  check('guardar producto con la foto nueva', (await page.evaluate(() => location.hash)) === '#productos');
  await esperar(800);
  await page.click('.cab-seccion .acciones .btn.borde');
  await page.waitForSelector('.fila-grupo');
  await page.click('.fila-grupo .boton-icono.peligro');
  await esperar(900);
  check('grupo con productos: el 409 de la API', /Mueve o borra sus productos primero/.test(await textoDe(page, '.grupos-tienda')));
  await foto(page, '18-grupos-no-se-borra');
  await page.keyboard.press('Escape');
  await ir(page, '#productos/nuevo', 600);
  await page.fill('#p-nombre', 'Arepa de pernil');
  await page.fill('#p-precio', '0');
  await esperar(200);
  check('precio 0: avisa que no se vende', await page.isVisible('.ayuda.ambar'));
  await page.fill('#p-precio', '5,5');
  await page.selectOption('#p-grupo', '401');
  await page.click('.pie-fijo .btn:not(.borde)');
  await page.waitForFunction(() => location.hash === '#productos', null, { timeout: 15000 }).catch(() => {});
  await esperar(900);
  check('producto nuevo creado', /Arepa de pernil/.test(await textoDe(page, '.productos-lista')));

  // Promotores (antes «Vendedores externos»): lo de siempre, ahora en la tabla (el resto, en `rediseno`)
  await ir(page, '#vendedores', 800);
  check('promotores: nunca dice «Compra-Ventas»', !/Compra-Ventas/i.test(await page.textContent('body')));
  check('producto pausado por Deliservy: sin cambiar', await page.isDisabled('.tp-fila.pausado input >> nth=0'));
  await foto(page, '19-promotores', true);
  await page.fill('#cv-pct-tienda', '60');
  await page.click('.pct-todos .btn');
  await esperar(300);
  check('% para todos: tope 50', /0 a 50/.test(await textoDe(page, '.pct-todos .error-campo')));
  await foto(page, '20-promotores-error');
  const filaArepa = page.locator('.tp-fila', { hasText: 'Arepa pabellón' });
  await filaArepa.locator('.tp-redes input').fill('9,99');
  await page.click('.barra-cambios .btn:not(.borde-blanco)');
  await esperar(400);
  check('precio de redes mayor que el de la app: no', /no puede ser mayor/.test(await filaArepa.locator('.error-campo').textContent()));
  await page.click('.barra-cambios .btn.borde-blanco');

  // Billetera
  await ir(page, '#billetera', 900);
  check('billetera: cuenta enmascarada, sin forma de cambiarla', /3456/.test(await textoDe(page, '.cuenta-banco')) && !(await page.$('#c-numero')));
  await foto(page, '21-billetera', true);
  const [descarga2] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('.etq-fila .btn')]);
  check('billetera: exportar a Excel', /\.csv$/.test(descarga2.suggestedFilename()));
  await page.click('.saldo .btn.blanco');
  await page.waitForSelector('.dialogo');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('#codigo-retiro');
  await foto(page, '22-billetera-retirar-codigo');
  await page.type('#codigo-retiro', '123456');
  await page.waitForSelector('.resultado-bien', { timeout: 10000 });
  check('retiro con código: listo', /te enviamos/.test(await textoDe(page, '.resultado-bien')));
  await foto(page, '23-billetera-retiro-listo');
  await page.click('.dialogo-pie .btn');
  await esperar(900);

  // Flota (una tienda de la app sin flota) y estadísticas
  await ir(page, '#flota', 600);
  check('tienda sin flota: la invitación', /Pide motorizados/.test(await textoDe(page, '#contenido')));
  await foto(page, '24-flota-invitacion');
  await ir(page, '#estadisticas', 1500);
  check('estadísticas: barras dibujadas', (await page.$$('.g-barra')).length > 5);
  await foto(page, '25-estadisticas', true);
  await page.locator('.opinion button', { hasText: 'Responder' }).first().click();
  await page.fill('.op-responder textarea', '¡Gracias por tu opinión! Te esperamos pronto.');
  await page.locator('.op-responder .btn', { hasText: 'Enviar' }).click();
  await esperar(900);
  check('responder una opinión', /Te esperamos pronto/.test(await textoDe(page, '.opiniones-lista')));
  await foto(page, '26-estadisticas-opinion-respondida');

  // Mi tienda
  await ir(page, '#tienda', 2500);
  check('mi tienda: la comisión de la app y el enlace a «Mi plan»', /10/.test(await textoDe(page, '.comision')) && /Mi plan/.test(await textoDe(page, '.comision')));
  await foto(page, '27-mi-tienda-datos', true);
  await ir(page, '#tienda/horario', 700);
  await page.fill('.fila-horario:nth-child(1) input[type=time] >> nth=1', '07:00');
  await page.click('.horario ~ .botones .btn');
  await esperar(500);
  check('horario: nunca abrir = cerrar en un día abierto', /misma hora/.test(await textoDe(page, '.fila-horario:nth-child(1) .error-campo')));
  await foto(page, '28-mi-tienda-horario-error', true);
  await page.fill('.fila-horario:nth-child(1) input[type=time] >> nth=1', '22:00');
  await page.click('.horario ~ .botones .btn');
  await esperar(900);
  check('horario guardado', !(await page.isVisible('.horario ~ .error')));
  await ir(page, '#tienda/imagenes', 700);
  await foto(page, '29-mi-tienda-imagenes', true);
  await ir(page, '#tienda/trabajadores', 700);
  await foto(page, '30-mi-tienda-trabajadores');
  await page.click('.cab-tarjeta .btn');
  await page.fill('#w-nombre', 'Gabriela Torres');
  await page.fill('#w-telefono', '0414-555-0191');
  await page.check('#perm-productos');
  await foto(page, '31-trabajador-nuevo');
  await page.click('.dialogo-pie .btn');
  await esperar(900);
  check('trabajador agregado', /Gabriela Torres/.test(await textoDe(page, '#contenido')));

  // Mi plan (§7): el cobro por producto, «Quiero…» y pagar la membresía con las cuatro formas de la plataforma
  await ir(page, '#plan', 900);
  check('mi plan: Premium activa', /Premium/.test(await textoDe(page, '.plan-actual')) && /Activa/.test(await textoDe(page, '.plan-actual')));
  check('mi plan: la regla de Premium (la mitad, 0,10 a 0,50)', /La mitad/.test(await textoDe(page, '.regla')) && /0,50/.test(await textoDe(page, '.ejemplos')));
  await foto(page, '48-mi-plan', true);
  await page.locator('.plan .btn', { hasText: 'Quiero Deluxe' }).click();
  await page.waitForSelector('.dialogo');
  await page.click('.dialogo-pie .btn:not(.borde)');
  await page.waitForSelector('.banda.info >> text=Pediste', { timeout: 10000 }).catch(() => {});
  check('«Quiero Deluxe»: queda pedido y le avisan al admin', /Pediste/.test(await textoDe(page, '#contenido')) && /Ya lo pediste/.test(await textoDe(page, '.planes')));
  await foto(page, '49-mi-plan-deluxe-pedido');
  const pagosAntes = (await page.$$('.lista .renglon')).length;
  const abrirPago = async (metodo) => {
    await page.click('.plan-actual .btn');
    await page.waitForSelector('.metodos');
    await page.locator('.metodo', { hasText: metodo }).click();
    await esperar(400);
  };
  await page.click('.plan-actual .btn');
  await page.waitForSelector('.metodos');
  check('pagar membresía: las cuatro formas (sin efectivo)', (await page.$$('.metodo')).length === 4 && !/efectivo/i.test(await textoDe(page, '.metodos')));
  await foto(page, '50-pagar-membresia-formas');
  await page.locator('.metodo', { hasText: 'Pago móvil' }).click();
  await page.waitForSelector('#tel-pago');
  await page.fill('#tel-pago', '0414-000-0000');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('.dialogo .error:not([hidden])');
  check('pago móvil: «aún no aparece»', /Aún no aparece/.test(await textoDe(page, '.dialogo .error')));
  await page.fill('#tel-pago', '0412-555-0101');
  await foto(page, '51-pagar-membresia-pago-movil');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('.resultado-bien', { timeout: 10000 });
  check('pago móvil: membresía pagada', /va hasta el/.test(await textoDe(page, '.resultado-bien')));
  await foto(page, '52-membresia-pagada');
  await page.click('.dialogo-pie .btn');
  await esperar(1200);
  await abrirPago('Transferencia');
  await page.selectOption('#ced-letra', 'V');
  await page.fill('#ced-pago', '12345678');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('.resultado-bien', { timeout: 10000 });
  check('transferencia (con la cédula): pagada', /va hasta el/.test(await textoDe(page, '.resultado-bien')));
  await page.click('.dialogo-pie .btn');
  await esperar(1200);
  await abrirPago('Tarjeta de débito');
  await page.fill('#t-titular', 'Ana Rodriguez');
  await page.fill('#t-numero', '5555555555554444');
  await page.type('#t-vence', '1228');
  await page.fill('#t-cvv', '123');
  await page.fill('#t-cedula', '12345678');
  await page.fill('#t-pin', '1234');
  check('débito: la tarjeta dibujada con su marca', /Mastercard/.test(await textoDe(page, '.tarjeta-viva')));
  await foto(page, '53-pagar-membresia-debito');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('.resultado-bien', { timeout: 10000 });
  check('débito: pagada', /va hasta el/.test(await textoDe(page, '.resultado-bien')));
  await page.click('.dialogo-pie .btn');
  await esperar(1200);
  await abrirPago('Tarjeta de crédito');
  await page.fill('#t-titular', 'Ana Rodriguez');
  await page.fill('#t-numero', '4000000000000002');
  await page.type('#t-vence', '1228');
  await page.fill('#t-cvv', '123');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('.dialogo .error:not([hidden])', { timeout: 10000 });
  check('crédito: el rechazo del banco, claro', /rechazó/.test(await textoDe(page, '.dialogo .error')));
  await foto(page, '54-pagar-membresia-credito-rechazada');
  await page.fill('#t-numero', '4111111111111111');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('.resultado-bien', { timeout: 10000 });
  check('crédito: pagada', /va hasta el/.test(await textoDe(page, '.resultado-bien')));
  await page.click('.dialogo-pie .btn');
  await esperar(1400);
  const pagosDespues = (await page.$$('.lista .renglon')).length;
  check('mi plan: los cuatro pagos nuevos en la lista', pagosDespues === pagosAntes + 4, pagosAntes + ' → ' + pagosDespues);
  check('la tarjeta no queda guardada en el navegador', !(await page.evaluate(() => JSON.stringify(localStorage)).then((x) => /4111|5555|1234/.test(x))));
  await foto(page, '55-mi-plan-pagos', true);

  // La tienda de solo flota
  await elegirTienda(page, 58);
  await ir(page, '#hoy', 800);
  check('solo flota: sin «Pedidos» ni «Billetera»', !(await page.$('.barra-abajo a[href="#pedidos"]')) && !(await page.$('.barra-abajo a[href="#billetera"]')));
  check('solo flota: «Hoy» dice lo que debe', /Debes/.test(await textoDe(page, '.deuda')));
  await foto(page, '32-hoy-flota', true);
  await ir(page, '#plan', 900);
  check('mi plan (promo 0 %): no te cobramos nada hasta el 28', /no te cobramos nada/.test(await textoDe(page, '#contenido')) && /Básica/.test(await textoDe(page, '.plan-actual')));
  await foto(page, '56-mi-plan-basica-con-promocion', true);
  await ir(page, '#flota', 1200);
  await foto(page, '33-flota', true);
  await ir(page, '#flota/pagar', 1000);
  await foto(page, '34-flota-pagar-paso-1');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('#pagador');
  check('pagar: a dónde y el monto en Bs', /Bs/.test(await textoDe(page, '.monto-retiro')) && /J-504754129/.test(await textoDe(page, '.datos-pago')));
  await foto(page, '35-flota-pagar-paso-2');
  await page.fill('#pagador', '0414-000-0000');
  await page.click('.dialogo-pie .btn');
  await esperar(900);
  check('pagar: «aún no aparece» si el banco no lo tiene', /Aún no aparece/.test(await textoDe(page, '.dialogo .error')));
  await page.fill('#pagador', '0412-555-0101');
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('.resultado-bien', { timeout: 10000 });
  await foto(page, '36-flota-pago-recibido');
  await page.click('.dialogo-pie .btn');
  await esperar(1000);
  await ir(page, '#flota/pedir', 3500);
  check('pedir: contra efectivo activado, exclusivo no', /Contra efectivo/.test(await textoDe(page, '.tipos-servicio')) && !/Exclusivo/.test(await textoDe(page, '.tipos-servicio')));
  await foto(page, '37-pedir-motorizado');
  await page.fill('#buscar-dir', 'sambil');
  await page.waitForSelector('.resultados-dir button');
  await page.click('.resultados-dir button');
  await page.fill('#recibe-nombre', 'Carolina Pérez');
  await page.fill('#recibe-telefono', '0414-555-1234');
  await page.fill('#nota-flota', 'Llamar al llegar');
  await page.click('.col-form > .botones .btn');
  await page.waitForSelector('.resultado-cotizacion:not([hidden])');
  await esperar(2500);
  check('cotizar: precio, minutos y distancia', /\$/.test(await textoDe(page, '.cot-precio')) && /min/.test(await textoDe(page, '.resultado-cotizacion')));
  await foto(page, '38-pedir-motorizado-cotizado', true);
  await page.click('.resultado-cotizacion .botones .btn:last-child');
  await page.waitForSelector('.codigo-entrega');
  check('pedir: orden y código para quien recibe', /\d{4}/.test(await textoDe(page, '.codigo-entrega b')));
  await foto(page, '39-motorizado-pedido');
  await page.keyboard.press('Escape');
  await ir(page, '#flota/pedir/alisa', 1500);
  await page.fill('#mensaje-alisa', 'un motorizado a Av. Bolívar Norte');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.tarjeta-cotizacion .botones');
  await esperar(3000);
  check('Alisa: la tarjeta con el mapa y «Sí, pídelo»', /Sí, pídelo/.test(await textoDe(page, '.tarjeta-cotizacion')));
  await foto(page, '40-pedir-con-alisa');
  await page.locator('.tarjeta-cotizacion .btn', { hasText: 'Sí, pídelo' }).click();
  await page.waitForSelector('.ver-orden', { timeout: 10000 });
  check('Alisa: «sí» crea la orden', /Ver orden/.test(await textoDe(page, '.ver-orden')));
  await foto(page, '41-alisa-pedido-hecho');
  await ir(page, '#flota/pedido/3199', 4000);
  check('pedido de flota: el código a la vista', /5307/.test(await textoDe(page, '.codigo-entrega')));
  await foto(page, '42-flota-pedido-en-vivo', true);

  // «Mostrar en la app»: falta algo → agregar el 3.er producto con foto → sí
  await ir(page, '#tienda', 2500);
  await page.click('label[for="mostrar-app"]');
  await page.waitForSelector('.faltan:not([hidden])');
  check('mostrar en la app: el 409 dice qué falta', /producto con foto y precio/.test(await textoDe(page, '.faltan')));
  await foto(page, '43-mostrar-en-la-app-falta', true);
  await ir(page, '#productos/9023', 900);
  await page.setInputFiles('.fotos-producto .foto-variante:nth-child(1) input[type=file]', { name: 'correa.png', mimeType: 'image/png', buffer: png(1200, 1200) });
  await page.waitForFunction(() => { const z = document.querySelector('.fotos-producto .zona-foto'); return z && z.classList.contains('con-foto') && !z.classList.contains('subiendo'); }, null, { timeout: 20000 });
  await page.click('.pie-fijo .btn:not(.borde)');
  await page.waitForFunction(() => location.hash === '#productos', null, { timeout: 15000 });
  await ir(page, '#tienda', 2500);
  await page.click('label[for="mostrar-app"]');
  await page.waitForSelector('.mostrar-app.encendido', { timeout: 10000 }).catch(() => {});
  await esperar(1500);
  check('mostrar en la app: ahora sí, y aparecen «Pedidos» y «Billetera»', await page.isVisible('.mostrar-app.encendido') && !!(await page.$('[data-seccion="pedidos"]')));
  await foto(page, '44-mostrar-en-la-app-listo', true);
  await page.click('.cabecera-tel .boton-icono');
  await page.waitForSelector('.lista-mas');
  await foto(page, '45-tu-cuenta-y-secciones');
  await page.keyboard.press('Escape');

  // La sesión vencida
  await simulado('/__simulado/vencer-sesiones');
  await ir(page, '#hoy', 600);
  await page.waitForSelector('#telefono', { timeout: 10000 }).catch(() => {});
  check('sesión vencida: de vuelta a entrar, con la frase', /venció/.test(await textoDe(page, '.aviso-entrar')));
  check('sesión vencida: el token se borra', !(await page.evaluate(() => localStorage.getItem('deliservy_comercio_sesion'))));
  await foto(page, '47-sesion-vencida');
  const csp = await page.evaluate(() => window.__csp.length);
  check('sin violaciones de la CSP', csp === 0, String(csp));
  revisarErrores('teléfono claro', errores, page, ERRORES_ESPERADOS);
  await ctx.close();
}

async function cajero(browser) {
  titulo('El cajero (Luis): solo lo que le marcaron');
  await simulado('/__simulado/reiniciar');
  const { ctx, page, errores } = await abrir(browser);
  await entrar(page, TEL.cajero);
  const secciones = await page.$$eval('.barra-abajo [data-seccion]', (as) => as.map((a) => a.getAttribute('data-seccion')));
  check('cajero: Hoy y Pedidos, nada de dinero ni Mi tienda', secciones.join(',') === 'hoy,pedidos', secciones.join(','));
  check('cajero: «Hoy» sin el saldo', !(await page.$('.saldo-hoy')));
  check('cajero: sin «Activa tu tienda» (solo el dueño)', !(await page.$('#activacion')));
  await foto(page, '46-cajero-hoy', true);
  await ir(page, '#billetera', 500);
  check('cajero: escribir #billetera no la abre', (await page.evaluate(() => location.hash)) === '#billetera' && !(await page.$('.saldo')));
  await ir(page, '#pedidos/2601', 700);
  check('cajero con «marcar y cancelar»: ve la acción', await page.isVisible('.acciones-pedido .btn'));
  revisarErrores('cajero', errores, page, []);
  await ctx.close();
}

async function computadora(browser, oscuro) {
  const suf = oscuro ? '-computadora-oscuro' : '-computadora';
  const grupo = oscuro ? 'computadora-oscuro' : 'computadora';
  titulo('Computadora ' + (oscuro ? 'oscura' : 'clara') + ' (1366 × 900)');
  await simulado('/__simulado/reiniciar');
  const { ctx, page, errores } = await abrir(browser, { viewport: COMPUTADORA, oscuro });
  await entrar(page, TEL.dueno);
  check('barra lateral', await page.isVisible('.lateral'));
  const rutas = oscuro
    ? [['#hoy', 'hoy'], ['#pedidos/2603', 'pedido-detalle'], ['#estadisticas', 'estadisticas'], ['#plan', 'mi-plan']]
    : [['#hoy', 'hoy'], ['#pedidos', 'pedidos-en-curso'], ['#pedidos/calendario', 'pedidos-calendario'], ['#pedidos/2603', 'pedido-detalle'], ['#productos', 'productos'], ['#productos/9013', 'producto-editar'], ['#vendedores', 'promotores'], ['#billetera', 'billetera'], ['#estadisticas', 'estadisticas'], ['#plan', 'mi-plan'], ['#tienda', 'mi-tienda'], ['#tienda/horario', 'mi-tienda-horario']];
  for (const [h, n] of rutas) {
    await ir(page, h, h.indexOf('2603') > 0 || h === '#tienda' ? 3500 : 900);
    await foto(page, enGrupo(grupo, n));
    await sinAnchoDeMas(page, n + suf);
  }
  await elegirTienda(page, 58, true);
  const rutas2 = oscuro ? [['#flota/pedir', 'pedir-motorizado'], ['#flota/pedir/alisa', 'pedir-con-alisa']]
    : [['#flota', 'flota'], ['#flota/pedir', 'pedir-motorizado'], ['#flota/pedir/alisa', 'pedir-con-alisa'], ['#flota/pedido/3199', 'flota-pedido-en-vivo'], ['#tienda', 'mi-tienda-flota']];
  for (const [h, n] of rutas2) {
    await ir(page, h, 3500);
    if (n === 'pedir-motorizado') {
      await page.fill('#buscar-dir', 'trigal');
      await page.waitForSelector('.resultados-dir button');
      await page.click('.resultados-dir button');
      await page.fill('#recibe-nombre', 'José Rojas');
      await page.fill('#recibe-telefono', '0424-555-8899');
      await page.click('.col-form > .botones .btn');
      await page.waitForSelector('.resultado-cotizacion:not([hidden])');
      await esperar(2500);
    }
    if (n === 'pedir-con-alisa') {
      await page.fill('#mensaje-alisa', 'un motorizado a Urb. Prebo');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.tarjeta-cotizacion');
      await esperar(3000);
    }
    await foto(page, enGrupo(grupo, n));
    await sinAnchoDeMas(page, n + suf);
  }
  if (!oscuro) {
    await ir(page, '#flota/pagar', 1200);
    await foto(page, enGrupo(grupo, 'flota-pagar'));
  }
  const csp = await page.evaluate(() => window.__csp.length);
  check('sin violaciones de la CSP · ' + suf, csp === 0, String(csp));
  revisarErrores('computadora' + suf, errores, page, []);
  await ctx.close();
}

async function telefonoOscuro(browser) {
  titulo('Teléfono, oscuro');
  await simulado('/__simulado/reiniciar');
  const { ctx, page, errores } = await abrir(browser, { oscuro: true });
  await page.goto(BASE + '/comercio/');
  await page.waitForSelector('#telefono');
  await foto(page, enGrupo('oscuro', 'entrar-telefono'));
  await entrar(page, TEL.dueno);
  for (const [h, n] of [['#hoy', 'hoy'], ['#pedidos', 'pedidos-en-curso'], ['#pedidos/2603', 'pedido-detalle'], ['#productos', 'productos'], ['#productos/9001', 'producto-editar'], ['#vendedores', 'promotores'], ['#billetera', 'billetera'], ['#estadisticas', 'estadisticas'], ['#plan', 'mi-plan'], ['#tienda', 'mi-tienda'], ['#tienda/horario', 'mi-tienda-horario']]) {
    await ir(page, h, h.indexOf('2603') > 0 || h === '#tienda' ? 3500 : 900);
    await foto(page, enGrupo('oscuro', n), true);
    await sinAnchoDeMas(page, n + '-oscuro');
  }
  await elegirTienda(page, 58);
  for (const [h, n] of [['#flota', 'flota'], ['#flota/pedir', 'pedir-motorizado'], ['#flota/pedir/alisa', 'pedir-con-alisa']]) {
    await ir(page, h, 3500);
    if (n === 'pedir-con-alisa') {
      await page.fill('#mensaje-alisa', 'un motorizado a Naguanagua');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.tarjeta-cotizacion');
      await esperar(3000);
    }
    await foto(page, enGrupo('oscuro', n), n !== 'pedir-con-alisa');
  }
  await ir(page, '#flota/pagar', 1200);
  await page.click('.dialogo-pie .btn');
  await page.waitForSelector('#pagador');
  await foto(page, enGrupo('oscuro', 'flota-pagar-paso-2'));
  const csp = await page.evaluate(() => window.__csp.length);
  check('sin violaciones de la CSP · oscuro', csp === 0, String(csp));
  revisarErrores('teléfono oscuro', errores, page, []);
  await ctx.close();
}

async function ingles(browser) {
  titulo('En inglés (teléfono y computadora)');
  await simulado('/__simulado/reiniciar');
  const faltan = new Set();
  for (const vp of [TELEFONO, COMPUTADORA]) {
    const suf = vp === COMPUTADORA ? '-computadora-ingles' : '-ingles';
    const grupo = vp === COMPUTADORA ? 'ingles-computadora' : 'ingles';
    const { ctx, page, errores } = await abrir(browser, { viewport: vp, ingles: true });
    await page.goto(BASE + '/comercio/');
    await page.waitForSelector('#telefono');
    check('inglés: la entrada traducida' + suf, /Merchant panel/.test(await textoDe(page, 'h1')));
    if (vp === TELEFONO) await foto(page, enGrupo(grupo, 'entrar-telefono'));
    const juntar = async () => (await page.evaluate(() => (window.idiomaFaltantes ? window.idiomaFaltantes() : []))).forEach((x) => faltan.add(x));
    // El rediseño: afiliar (vacío, con errores, el encargado y el código) y la tienda nueva con «Activa tu tienda».
    await page.click('#ir-afiliar');
    await page.waitForSelector('#af-form');
    check('inglés: afiliar traducido' + suf, /Sign up your business/.test(await textoDe(page, 'h1')), await textoDe(page, 'h1'));
    await page.click('#af-enviar');
    await page.click('.form-afiliar [role="radio"][data-valor="encargado"]');
    await esperar(300);
    await juntar();
    if (vp === TELEFONO) await foto(page, enGrupo(grupo, 'afiliar'), true);
    await page.fill('#af-nombre', 'Bodega Sol');
    await page.click('#af-rubro .chip[data-rubro="otro"]');
    await page.fill('#af-buscar', 'sambil');
    await page.waitForSelector('.resultados-dir button');
    await page.click('.resultados-dir button');
    await page.fill('#af-tel-dueno', vp === TELEFONO ? '0414-555-0444' : '0414-555-0446');
    await page.fill('#af-tel-mio', vp === TELEFONO ? '0414-555-0445' : '0414-555-0447');
    await page.click('#af-enviar');
    await page.waitForSelector('#af-codigo');
    await juntar();
    await page.type('#af-codigo', '123456');
    await page.waitForSelector('#af-gracias');
    await juntar();
    if (vp === TELEFONO) await foto(page, enGrupo(grupo, 'afiliar-gracias'));
    await entrar(page, TEL.nueva);
    await page.waitForSelector('#activacion', { timeout: 8000 }).catch(() => {});
    await juntar();
    check('inglés: «Activa tu tienda» traducida' + suf, /Activate your store in the app/.test(await textoDe(page, '#activacion')));
    await foto(page, enGrupo(grupo, 'hoy-activacion'), vp === TELEFONO);
    await ir(page, '#productos', 900);
    await juntar();
    await page.evaluate(() => localStorage.removeItem('deliservy_comercio_sesion'));
    await entrar(page, TEL.dueno);
    const lista = vp === TELEFONO
      ? [['#hoy', 'hoy'], ['#pedidos', 'pedidos-en-curso'], ['#pedidos/2603', 'pedido-detalle'], ['#productos', 'productos'], ['#productos/9001', 'producto-editar'], ['#vendedores', 'promotores'], ['#billetera', 'billetera'], ['#estadisticas', 'estadisticas'], ['#plan', 'mi-plan'], ['#tienda', 'mi-tienda'], ['#tienda/horario', 'mi-tienda-horario'], ['#tienda/trabajadores', 'mi-tienda-trabajadores']]
      : [['#hoy', 'hoy'], ['#pedidos/2603', 'pedido-detalle'], ['#productos/9013', 'producto-editar'], ['#estadisticas', 'estadisticas'], ['#plan', 'mi-plan']];
    for (const [h, n] of lista) {
      await ir(page, h, h.indexOf('2603') > 0 || h === '#tienda' ? 3500 : 900);
      if (h === '#vendedores') {
        await page.fill('.tp-fila[data-producto="9001"] .tp-pct input', '11');
        await page.fill('.tp-fila[data-producto="9002"] .tp-redes input', '9,99');
        await page.click('.barra-cambios .btn:not(.borde-blanco)');
        await esperar(500);
        await juntar();
        check('inglés: la barra de cambios traducida' + suf, /unsaved change/.test(await textoDe(page, '.barra-cambios')));
        await page.click('.barra-cambios .btn.borde-blanco');
        await page.click('.segmentos button[data-valor="ventas"]');
        await juntar();
        await page.click('.segmentos button[data-valor="productos"]');
      }
      await juntar();
      await foto(page, enGrupo(grupo, n), vp === TELEFONO);
    }
    await elegirTienda(page, 58, vp === COMPUTADORA);
    for (const [h, n] of [['#flota', 'flota'], ['#flota/pedir', 'pedir-motorizado'], ['#flota/pedir/alisa', 'pedir-con-alisa']]) {
      await ir(page, h, 3500);
      if (n === 'pedir-con-alisa') {
        await page.fill('#mensaje-alisa', 'un motorizado a Sambil');
        await page.keyboard.press('Enter');
        await page.waitForSelector('.tarjeta-cotizacion');
        await esperar(3000);
      }
      await juntar();
      await foto(page, enGrupo(grupo, n), vp === TELEFONO && n !== 'pedir-con-alisa');
    }
    await ir(page, '#flota/pagar', 1200);
    await page.click('.dialogo-pie .btn');
    await page.waitForSelector('#pagador');
    await juntar();
    if (vp === TELEFONO) await foto(page, enGrupo(grupo, 'flota-pagar-paso-2'));
    await page.keyboard.press('Escape');
    await elegirTienda(page, 31, vp === COMPUTADORA);
    await ir(page, '#plan', 900);
    await page.click('.plan-actual .btn');
    await page.waitForSelector('.metodos');
    await page.locator('.metodo').nth(0).click();
    await page.waitForSelector('.tarjeta-viva');
    await juntar();
    await foto(page, enGrupo(grupo, 'pagar-membresia-debito'));
    const csp = await page.evaluate(() => window.__csp.length);
    check('sin violaciones de la CSP' + suf, csp === 0, String(csp));
    revisarErrores('inglés' + suf, errores, page, []);
    await ctx.close();
  }
  // Lo que queda en español en inglés: solo datos (nombres de productos y personas).
  const sinTraducir = [...faltan].filter((t) => !/^(Save|Social media price for) /.test(t));
  check('inglés: nada de la página queda en español', sinTraducir.length === 0, sinTraducir.slice(0, 8).join(' | '));
}


// ── El rediseño (30-oct-2026): afiliar (C2), «Activa tu tienda» (C3), promotores (C5) y productos (C7) ─────────────

/** Una captura final (com-*.png) del tamaño de la ventana, con `sel` arriba (bajo la cabecera del teléfono). */
async function final(page, nombre, sel) {
  if (!FINALES) return;
  if (sel) {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return;
      el.scrollIntoView({ block: 'start' });
      const cab = document.querySelector('.cabecera-tel');
      window.scrollBy(0, -((cab && cab.offsetHeight) || 0) - 12);
    }, sel);
  }
  await page.mouse.move(2, 2);
  await esperar(450);
  await page.screenshot({ path: path.join(FINALES, 'com-' + nombre + '.png') });
}
async function solicitudes() { return (await fetch(BASE + '/__simulado/solicitudes')).json(); }
async function bitacora() { return (await fetch(BASE + '/__simulado/bitacora')).json(); }
async function visibles(page, sel) { return page.$$eval(sel, (xs) => xs.filter((x) => x.offsetParent !== null).length); }
async function quitarAvisos(page) { await page.evaluate(() => document.querySelectorAll('.aviso').forEach((x) => x.remove())); }

async function afiliarDuenoCon(page, sufijo, fin) {
  const final = (p, cual, sel) => fin(p, cual.replace(sufijo, ''), sel);
  await page.goto(BASE + '/comercio/');
  await page.waitForSelector('#telefono');
  check('entrar: «¿Aún no vendes con Deliservy? Afilia tu comercio»' + sufijo, /Afilia tu comercio/.test(await textoDe(page, '.pie-entrar')));
  await page.click('#ir-afiliar');
  await page.waitForSelector('#af-form');
  check('afiliar: título y la frase de la propuesta' + sufijo, /Afilia tu comercio/.test(await textoDe(page, 'h1')) && /cargamos tu catálogo contigo, sin costo/.test(await textoDe(page, '.intro-afiliar')));
  check('afiliar: el dueño no ve «Tu WhatsApp»' + sufijo, !(await page.isVisible('#af-tel-mio')));
  check('afiliar: los 5 rubros' + sufijo, (await page.$$('#af-rubro .chip')).length === 5);
  await final(page, 'afiliar' + sufijo);
  await page.click('#af-enviar');
  await esperar(300);
  check('afiliar vacío: dice qué falta (nombre, rubro, ubicación, dirección, WhatsApp)' + sufijo, (await visibles(page, '.form-afiliar .error-campo')) >= 5, String(await visibles(page, '.form-afiliar .error-campo')));
  await page.fill('#af-nombre', 'Panadería La Espiga');
  await page.click('#af-rubro .chip[data-rubro="restaurante"]');
  await page.click('#af-usar-ubicacion');
  await page.waitForFunction(() => document.getElementById('af-direccion').value.length > 8, null, { timeout: 8000 }).catch(() => {});
  check('«Usar mi ubicación»: marca el punto y llena la dirección' + sufijo, /Sambil/.test(await page.inputValue('#af-direccion')), await page.inputValue('#af-direccion'));
  await page.fill('#af-tel-dueno', '0414-555-0111');
  await page.click('#af-enviar');
  await page.waitForSelector('#af-codigo', { timeout: 8000 });
  check('afiliar: el código va al WhatsApp del dueño' + sufijo, /0414-555-0111/.test(await textoDe(page, '#af-codigo-caja')));
  await final(page, 'afiliar-codigo' + sufijo);
  await page.type('#af-codigo', '000000');
  await page.waitForSelector('#af-codigo-caja .error:not([hidden])');
  check('afiliar: código malo, la frase de la API' + sufijo, /no es correcto/.test(await textoDe(page, '#af-codigo-caja .error')));
  await page.type('#af-codigo', '123456');
  await page.waitForSelector('#af-gracias', { timeout: 8000 });
  check('afiliar: «¡Gracias!» con la frase de la API' + sufijo, /Gracias/.test(await textoDe(page, '#af-gracias')) && /Panadería La Espiga/.test(await textoDe(page, '#af-gracias')) && /Nuestro equipo te escribirá por WhatsApp/.test(await textoDe(page, '#af-gracias')));
  check('afiliar: nada promete un WhatsApp al dueño' + sufijo, !/le llega un WhatsApp|para que confirme/.test(await page.textContent('body')));
  const s = (await solicitudes()).slice(-1)[0] || {};
  check('afiliar: llega la solicitud del dueño con su ubicación' + sufijo, s.quien === 'dueno' && s.rubro === 'restaurante' && s.telefono === '584145550111' && s.telefonoDueno === '584145550111' && Math.abs(s.lat - 10.2001) < 0.001, JSON.stringify(s));
  await final(page, 'afiliar-gracias' + sufijo);
  await sinAnchoDeMas(page, 'afiliar' + sufijo);
}

async function afiliarEncargado(page, sufijo) {
  const final2 = (p, cual, sel) => final(p, cual + '-tel', sel);
  await page.click('#af-gracias a[href="#entrar"]');
  await page.waitForSelector('#telefono');
  check('«Volver a la entrada» después de la solicitud' + sufijo, await page.isVisible('#telefono'));
  await page.click('#ir-afiliar');
  await page.waitForSelector('#af-form');
  check('afiliar otra vez: el formulario vacío' + sufijo, (await page.inputValue('#af-nombre')) === '');
  await page.click('.form-afiliar [role="radio"][data-valor="encargado"]');
  check('encargado: pide también su WhatsApp' + sufijo, await page.isVisible('#af-tel-mio'));
  check('encargado: «Lo usamos para confirmar con el dueño» y la nota del equipo, sin prometer un WhatsApp' + sufijo,
    /Lo usamos para confirmar con el dueño/.test(await textoDe(page, '.form-afiliar')) && /el equipo de Deliservy confirma con el dueño antes de activar el comercio/.test(await textoDe(page, '.form-afiliar'))
    && !/le llega un WhatsApp|Le escribimos para que confirme/.test(await textoDe(page, '.form-afiliar')));
  await page.fill('#af-nombre', 'Farmacia Santa Ana');
  await page.click('#af-rubro .chip[data-rubro="farmacia"]');
  await page.fill('#af-buscar', 'metropolis');
  await page.waitForSelector('.resultados-dir button');
  await page.click('.resultados-dir button');
  check('el buscador de direcciones llena la dirección' + sufijo, /Metrópolis/.test(await page.inputValue('#af-direccion')));
  await page.fill('#af-tel-dueno', '0414-555-0222');
  await page.fill('#af-tel-mio', '0424-555-0333');
  await final2(page, 'afiliar-encargado', '#af-tel-dueno');
  await page.click('#af-enviar');
  await page.waitForSelector('#af-codigo', { timeout: 8000 });
  check('encargado: el código va a SU WhatsApp' + sufijo, /0424-555-0333/.test(await textoDe(page, '#af-codigo-caja')));
  // Un punto fuera de Venezuela (la página no lo deja, así que se cambia en el camino): la API contesta 400
  // `{ message, campo: 'ubicacion' }` y la frase sale debajo del mapa.
  const tocar = async (route) => {
    const b = JSON.parse(route.request().postData() || '{}');
    b.lat = 50;
    await route.continue({ postData: JSON.stringify(b) });
  };
  await page.route('**/api/comercio/afiliacion', tocar);
  await page.type('#af-codigo', '123456');
  await page.waitForSelector('#af-form:not([hidden]) .marco-mapa ~ .error-campo:not([hidden])', { timeout: 8000 }).catch(() => {});
  await page.unroute('**/api/comercio/afiliacion', tocar);
  check('error de la API con `campo: ubicacion`: debajo del mapa' + sufijo, /Marca en el mapa dónde queda el comercio/.test(await textoDe(page, '.marco-mapa ~ .error-campo')) && await page.$eval('#af-mapa', (x) => x.classList.contains('mal')));
  check('`campo: ubicacion` no gasta el código: ninguna solicitud' + sufijo, (await solicitudes()).length === 1);
  await page.click('#af-enviar');
  await page.waitForSelector('#af-codigo-caja:not([hidden])', { timeout: 8000 });
  await page.type('#af-codigo', '123456');
  await page.waitForSelector('#af-gracias', { timeout: 8000 });
  check('encargado: la misma respuesta de la API que el dueño' + sufijo, /Nuestro equipo te escribirá por WhatsApp para terminar la afiliación/.test(await textoDe(page, '#af-gracias')) && !/para que confirme/.test(await textoDe(page, '#af-gracias')));
  const s = (await solicitudes()).slice(-1)[0] || {};
  check('encargado: la solicitud con los dos números' + sufijo, s.quien === 'encargado' && s.rubro === 'farmacia' && s.telefono === '584245550333' && s.telefonoDueno === '584145550222', JSON.stringify(s));
  // La misma otra vez (mismo WhatsApp y mismo comercio): no es un error, es un «gracias» con `yaEnviada`.
  await page.click('#af-gracias a[href="#entrar"]');
  await page.waitForSelector('#telefono');
  await page.click('#ir-afiliar');
  await page.waitForSelector('#af-form');
  await page.click('.form-afiliar [role="radio"][data-valor="encargado"]');
  await page.fill('#af-nombre', 'farmacia  santa ana');
  await page.click('#af-rubro .chip[data-rubro="farmacia"]');
  await page.fill('#af-buscar', 'metropolis');
  await page.waitForSelector('.resultados-dir button');
  await page.click('.resultados-dir button');
  await page.fill('#af-tel-dueno', '0414-555-0222');
  await page.fill('#af-tel-mio', '0424-555-0333');
  await page.click('#af-enviar');
  await page.waitForSelector('#af-codigo', { timeout: 8000 });
  await page.type('#af-codigo', '123456');
  await page.waitForSelector('#af-gracias', { timeout: 8000 });
  check('solicitud repetida: «gracias» con la frase `yaEnviada`, sin otra solicitud' + sufijo, /Ya recibimos la solicitud de este comercio/.test(await textoDe(page, '#af-gracias')) && !(await page.$('#af-codigo-caja .error:not([hidden])')) && (await solicitudes()).length === 2);
  await final2(page, 'afiliar-ya-enviada', null);
}

async function activacionCon(page, sufijo, fin) {
  const final = (p, cual, sel) => fin(p, cual.replace(sufijo, ''), sel);
  await entrar(page, TEL.nueva);
  await page.waitForSelector('#activacion', { timeout: 8000 }).catch(() => {});
  check('Hoy (tienda nueva): «Activa tu tienda en la app · 2 de 6»' + sufijo, /Activa tu tienda en la app/.test(await textoDe(page, '#activacion')) && /2 de 6/.test(await textoDe(page, '#activacion .act-cab')));
  check('activación: «Llevas 2 de 5» y el % de promotores, opcional' + sufijo, /Llevas 2 de 5/.test(await textoDe(page, '#activacion')) && /Opcional/.test(await textoDe(page, '[data-paso="promotores"]')));
  check('activación: «Seguir: horario de atención»' + sufijo, /horario de atención/.test(await textoDe(page, '#act-seguir')));
  check('activación: «¿Prefieres que lo carguemos nosotros?» con WhatsApp' + sufijo, !!(await page.$('#activacion a[href^="https://wa.me/"]')));
  await final(page, 'hoy-activacion' + sufijo, '.cab-seccion');
  await sinAnchoDeMas(page, 'hoy-activacion' + sufijo);
  if (sufijo) return;
  await page.click('#act-seguir');
  await page.waitForSelector('.fila-horario');
  check('«Seguir» lleva al horario', (await page.evaluate(() => location.hash)) === '#tienda/horario');
  await page.click('label[for="abierto-1"]');
  await page.click('.horario ~ .botones .btn');
  await esperar(900);
  await ir(page, '#hoy', 1500);
  await page.waitForSelector('#activacion');
  check('activación: con el horario, 3 de 6 y sigue «5 productos con foto»', /3 de 6/.test(await textoDe(page, '#activacion .act-cab')) && /productos con foto/.test(await textoDe(page, '#act-seguir')));
  await ir(page, '#productos', 900);
  check('productos (tienda nueva): «Sin foto · 1»', /Sin foto · 1/.test(await textoDe(page, '.chips-filtro')));
  await page.click('.chips-filtro .chip[data-ver="sinFoto"]');
  await esperar(300);
  check('«Sin foto»: solo el producto sin foto', (await page.$$('.fila-producto')).length === 1 && /Refresco/.test(await textoDe(page, '.productos-lista')));
}

async function productosCon(page, sufijo, fin) {
  const final = (p, cual, sel) => fin(p, cual.replace(sufijo, ''), sel);
  await ir(page, '#productos', 900);
  const grupos = await page.$$eval('.gp-cab', (bs) => bs.map((b) => b.getAttribute('aria-expanded')));
  check('productos: grupos plegables, el primero abierto y los demás cerrados' + sufijo, grupos.length >= 4 && grupos[0] === 'true' && grupos.slice(1).every((x) => x === 'false'), grupos.join(','));
  check('productos: cada grupo cerrado con su número' + sufijo, /Bebidas\s*4/.test(await textoDe(page, '.grupo-productos:nth-child(2) .gp-cab')));
  check('productos: «Todos · 13», «Agotados · 1», «Sin foto · 0»' + sufijo, /Todos · 13/.test(await textoDe(page, '.chips-filtro')) && /Agotados · 1/.test(await textoDe(page, '.chips-filtro')) && /Sin foto · 0/.test(await textoDe(page, '.chips-filtro')));
  check('productos: sin pastilla de cobro en las filas' + sufijo, !(await page.$('.chips.cobro')) && !/por venta/.test(await textoDe(page, '.productos-lista')));
  check('productos: UNA línea a «Mi plan»' + sufijo, (await page.$$('.linea-plan')).length === 1 && !!(await page.$('.linea-plan a[href="#plan"]')));
  check('productos: el interruptor «Disponible» sigue en cada fila' + sufijo, (await visibles(page, '.fila-producto .interruptor')) === 6, String(await visibles(page, '.fila-producto .interruptor')));
  await final(page, 'productos' + sufijo);
  await sinAnchoDeMas(page, 'productos' + sufijo);
  if (sufijo) return;
  await page.click('.grupo-productos:nth-child(2) .gp-cab');
  check('abrir «Bebidas»: sus 4 productos a la vista', (await visibles(page, '.fila-producto')) === 10);
  await page.click('.grupo-productos:nth-child(1) .gp-cab');
  check('cerrar «Arepas»', (await visibles(page, '.fila-producto')) === 4);
  await page.click('.chips-filtro .chip[data-ver="agotados"]');
  await esperar(300);
  check('«Agotados»: solo la cachapa, con su grupo abierto', (await visibles(page, '.fila-producto')) === 1 && /Cachapa/.test(await textoDe(page, '.productos-lista')));
  await page.click('.chips-filtro .chip[data-ver="todos"]');
  await page.click('.grupo-productos:nth-child(1) .gp-cab');
  await page.click('label[for="disp-9003"]');
  await esperar(900);
  check('marcar agotado: «Agotados · 2» al momento', /Agotados · 2/.test(await textoDe(page, '.chips-filtro')));
  await page.click('label[for="disp-9003"]');
  await esperar(900);
  await page.click('.linea-plan a');
  await esperar(600);
  check('la línea lleva a «Mi plan»', (await page.evaluate(() => location.hash)) === '#plan');
}

async function promotoresCon(page, sufijo, computadora, fin) {
  const final = (p, cual, sel) => fin(p, cual.replace(sufijo, ''), sel);
  await ir(page, '#vendedores', 1200);
  check('promotores: el título y el menú dicen «Promotores»' + sufijo, /^Promotores$/.test((await textoDe(page, '.cab-seccion h1')).trim()) && /Promotores/.test(await page.textContent(computadora ? '.lateral-nav' : 'body')));
  check('promotores: nada dice «vendedor» en la sección' + sufijo, !/vendedor/i.test(await textoDe(page, '#contenido')));
  check('promotores: pestañas «Productos · 13» y «Ventas · n»' + sufijo, /Productos · 13/.test(await textoDe(page, '.segmentos')) && /Ventas · \d+/.test(await textoDe(page, '.segmentos')));
  check('promotores: «% para todos los productos» con «Aplicar»' + sufijo, /% para todos los productos/.test(await textoDe(page, '.pct-todos')) && /Aplicar/.test(await textoDe(page, '.pct-todos .btn')));
  check('promotores: botones de grupos' + sufijo, /Arepas · 6/.test(await textoDe(page, '.panel-promotores .chips-filtro')));
  check('promotores: notas «En la app …», «Pausado por Deliservy» y «Apagado»' + sufijo, /En la app 4,50/.test(await textoDe(page, '.tp-fila[data-producto="9001"] .tp-nota')) && /Pausado por Deliservy/.test(await textoDe(page, '.tp-fila[data-producto="9004"] .tp-nota')) && /Apagado/.test(await textoDe(page, '.tp-fila[data-producto="9006"] .tp-nota')));
  if (computadora) check('promotores (computadora): más columnas («En la app» y «Estado»)', await page.isVisible('.tp-cab .tp-app') && await page.isVisible('.tp-cab .tp-col-estado'));
  else check('promotores (teléfono): tabla compacta, sin columnas de más', !(await page.isVisible('.tp-cab .tp-app')));
  check('promotores: sin «Guardar» por fila, la barra escondida' + sufijo, (await page.$$('.tp-fila .btn')).length === 0 && !(await page.isVisible('.barra-cambios')));
  await page.fill('.tp-fila[data-producto="9001"] .tp-pct input', '15');
  await page.fill('.tp-fila[data-producto="9003"] .tp-redes input', '3,50');
  check('dos filas cambiadas: en ámbar' + sufijo, (await page.$$('.tp-fila.cambiada')).length === 2);
  check('UNA barra: «2 cambios sin guardar · Guardar cambios»' + sufijo, /2 cambios sin guardar/.test(await textoDe(page, '.barra-cambios')) && /Guardar cambios/.test(await textoDe(page, '.barra-cambios')));
  await final(page, 'promotores-cambios' + sufijo, computadora ? '.cab-seccion' : '.tabla-promotores');
  await sinAnchoDeMas(page, 'promotores' + sufijo);
  if (sufijo) {
    await page.click('.barra-cambios .btn.borde-blanco');
    check('«Descartar»: vuelve a lo guardado' + sufijo, !(await page.isVisible('.barra-cambios')) && (await page.inputValue('.tp-fila[data-producto="9001"] .tp-pct input')) === '10');
    return;
  }
  await page.fill('.tp-fila[data-producto="9001"] .tp-pct input', '10');
  check('volver al valor guardado: ya no cuenta como cambio', /1 cambio sin guardar/.test(await textoDe(page, '.barra-cambios')));
  await page.fill('.tp-fila[data-producto="9001"] .tp-pct input', '15');
  await simulado('/__simulado/fallar-promotor?producto=9003');
  await page.click('.barra-cambios .btn:not(.borde-blanco)');
  await page.waitForSelector('.tp-fila.con-error', { timeout: 8000 });
  await esperar(300);
  const b1 = await bitacora();
  check('guardar: la fila buena se guarda (un PUT)', b1.some((x) => x.accion === 'cv_producto' && x.entidadId === '9001' && x.despues && x.despues.pct === 15));
  check('guardar: la fila que falla queda con su error y en ámbar', /cambió mientras/.test(await textoDe(page, '.tp-fila[data-producto="9003"] .tp-error')) && await page.$eval('.tp-fila[data-producto="9003"]', (x) => x.classList.contains('cambiada')));
  check('guardar: la buena ya no está en ámbar y queda «1 cambio sin guardar»', !(await page.$eval('.tp-fila[data-producto="9001"]', (x) => x.classList.contains('cambiada'))) && /1 cambio sin guardar/.test(await textoDe(page, '.barra-cambios')));
  await quitarAvisos(page);
  await final(page, 'promotores-error-fila', '.tp-fila[data-producto="9001"]');
  await page.click('.barra-cambios .btn:not(.borde-blanco)');
  await esperar(1200);
  const b2 = await bitacora();
  check('guardar otra vez: ahora sí, y la barra se va', !(await page.isVisible('.barra-cambios')) && b2.some((x) => x.accion === 'cv_producto' && x.entidadId === '9003' && x.despues && x.despues.precioRedes === 3.5));
  check('guardar: solo las filas cambiadas (2 PUT de productos)', b2.filter((x) => x.accion === 'cv_producto').length === 2, String(b2.filter((x) => x.accion === 'cv_producto').length));
  await page.fill('.tp-fila[data-producto="9002"] .tp-redes input', '9,99');
  await page.click('.barra-cambios .btn:not(.borde-blanco)');
  await esperar(400);
  check('la regla de siempre: precio de redes no mayor que el de la app', /no puede ser mayor/.test(await textoDe(page, '.tp-fila[data-producto="9002"] .tp-error')));
  check('la regla de siempre: el pausado no se edita', await page.isDisabled('.tp-fila[data-producto="9004"] .tp-pct input'));
  await page.click('.barra-cambios .btn.borde-blanco');
  await page.click('.panel-promotores .chip[data-grupo="g402"]');
  check('grupo «Bebidas»: sus 4 filas', (await visibles(page, '.tp-fila:not(.tp-cab)')) === 4);
  await page.click('.panel-promotores .chip[data-grupo=""]');
  await page.fill('#cv-pct-tienda', '12');
  await page.click('.pct-todos .btn');
  await page.waitForSelector('.dialogo');
  await page.click('.dialogo-pie .btn:not(.borde)');
  await esperar(1500);
  check('«Aplicar»: el % a todos los productos', (await page.inputValue('#cv-pct-tienda')) === '12' && (await page.inputValue('.tp-fila[data-producto="9001"] .tp-pct input')) === '12');
  await page.click('.segmentos button[data-valor="ventas"]');
  check('pestaña «Ventas»: «Promotor #N», nunca «Vendedor #N»', /Promotor #\d+/.test(await textoDe(page, '#pp-ventas')) && !/vendedor/i.test(await textoDe(page, '#pp-ventas')));
  await final(page, 'promotores-ventas', '.cab-seccion');
}

async function rediseno(browser) {
  titulo('Rediseño (30-oct-2026): afiliar, «Activa tu tienda», promotores y productos');
  if (FINALES) fs.mkdirSync(FINALES, { recursive: true });
  const geo = { latitude: 10.2001, longitude: -68.0050 };
  for (const [nombre, o] of [['tel', { geo }], ['pc', { viewport: COMPU_FINAL, geo }], ['tel-oscuro', { geo, oscuro: true }], ['pc-oscuro', { viewport: COMPU_FINAL, geo, oscuro: true }]]) {
    await simulado('/__simulado/reiniciar');
    const pc = /^pc/.test(nombre);
    const suf = nombre === 'tel' ? '' : ' · ' + nombre;
    const { ctx, page, errores } = await abrir(browser, o);
    // Las capturas: com-<lo-que-es>-<tel|pc>[-oscuro].png
    const etiqueta = '-' + nombre;
    const fin = async (p, cual, sel) => final(p, cual + etiqueta, sel);
    await afiliarDuenoCon(page, suf, fin);
    if (nombre === 'tel') await afiliarEncargado(page, '');
    const c2 = await abrir(browser, o);
    await activacionCon(c2.page, suf, fin);
    revisarErrores('rediseño, tienda nueva' + suf, c2.errores, c2.page, ERRORES_REDISENO);
    check('sin violaciones de la CSP · rediseño, tienda nueva' + suf, (await c2.page.evaluate(() => window.__csp.length)) === 0);
    await c2.ctx.close();
    await entrar(page, TEL.dueno);
    check('Hoy (tienda completa): sin «Activa tu tienda»' + suf, !(await page.$('#activacion')));
    await productosCon(page, suf, fin);
    await promotoresCon(page, suf, pc, fin);
    check('sin violaciones de la CSP · rediseño' + suf, (await page.evaluate(() => window.__csp.length)) === 0);
    revisarErrores('rediseño' + suf, errores, page, ERRORES_REDISENO);
    await ctx.close();
  }
}

(async () => {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  try { await fetch(BASE + '/comercio/'); } catch (_) {
    console.error('La API simulada no contesta en ' + BASE + '. Arráncala: node herramientas/comercio-simulado/servidor.js');
    process.exit(2);
  }
  // Chrome instalado (el Mac); si no está, el Chromium de playwright (CHROME=/ruta/al/chrome para otro).
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, headless: !process.env.VER } : { channel: 'chrome', headless: !process.env.VER })
    .catch(() => chromium.launch({ headless: !process.env.VER }));
  try {
    const solo = (process.env.SOLO || '').split(',').filter(Boolean);
    const quiere = (n) => !solo.length || solo.indexOf(n) >= 0;
    if (quiere('telefono')) await telefonoClaro(browser);
    if (quiere('cajero')) await cajero(browser);
    if (quiere('computadora')) { await computadora(browser, false); await computadora(browser, true); }
    if (quiere('oscuro')) await telefonoOscuro(browser);
    if (quiere('ingles')) await ingles(browser);
    if (quiere('rediseno')) await rediseno(browser);
  } catch (e) {
    mal++;
    fallos.push('se cortó: ' + (e && e.message ? e.message.split('\n')[0] : e));
    console.error(e);
  } finally {
    await browser.close();
  }
  console.log('\n' + ok + ' bien, ' + mal + ' mal' + (fallos.length ? '\n - ' + fallos.join('\n - ') : ''));
  console.log('Capturas en: ' + CAPTURAS);
  process.exit(mal ? 1 : 0);
})();
