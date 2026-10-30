#!/usr/bin/env node
/*
 * LA PRUEBA EN EL NAVEGADOR DE LA PÁGINA DE LOS PROMOTORES (rediseño 30-oct-2026). NO se despliega (`herramientas/` no
 * va a Ferozo).
 *
 * Abre Chromium (Playwright) contra la API simulada y recorre con clics de verdad: el registro en 2 pasos (número ya
 * registrado, nombre que falta, «Crear mi cuenta» con el cuerpo corto del contrato §3), la cuenta en revisión (aviso
 * amarillo, Inicio/Catálogo/Enlaces abiertos, Ventas y Cobros cerrados, «Empieza a ganar · n de 4», crear un enlace),
 * el catálogo por tiendas (rubros, búsqueda, pestaña «Productos», «Ver más»), la tienda abierta (ordenar, «Ver más»,
 * «Enlace de toda la tienda»), compartir (la imagen para historia se DESCARGA y es 1080 × 1920; con una foto sin CORS
 * también; «Copiar texto con enlace»; el QR) y Cobros pidiendo los datos antes de la cuenta bancaria. En teléfono
 * (390 × 844) y computadora (1366 × 860), en claro y en oscuro, y una pasada en inglés. Falla con un error de consola,
 * una violación de la CSP, un texto con «vendedor»/«Compra-Ventas» a la vista o desplazamiento horizontal.
 *
 *   node herramientas/vendedor-simulado/servidor.js &          # la API simulada (https, puerto 8797)
 *   node herramientas/vendedor-simulado/prueba-en-navegador.js  # la prueba (deja las capturas)
 *
 *   BASE=https://localhost:8797  CAPTURAS=/otra/carpeta  PLAYWRIGHT=/ruta/a/playwright  VER=1 (con ventana)
 */
'use strict';

const fs = require('fs');
const path = require('path');

function cargarPlaywright() {
  for (const c of [process.env.PLAYWRIGHT, 'playwright', 'playwright-core', '/opt/npm-tools/node_modules/playwright']) {
    if (!c) continue;
    try { return require(c); } catch (_) { /* el siguiente */ }
  }
  console.error('No encontré playwright. Ponlo en PLAYWRIGHT=/ruta/a/node_modules/playwright');
  process.exit(2);
}
const { chromium } = cargarPlaywright();

const BASE = process.env.BASE || 'https://localhost:8797';
const CAPTURAS = process.env.CAPTURAS || path.join(__dirname, 'capturas');
const TEL = { activa: '0412-555-0201', pendiente: '0412-555-0202', sinDatos: '0412-555-0203' };
const TELEFONO = { width: 390, height: 844 };
const COMPUTADORA = { width: 1366, height: 860 };
fs.mkdirSync(CAPTURAS, { recursive: true });

let ok = 0, mal = 0;
const fallos = [];
function check(nombre, cond, detalle) {
  if (cond) { ok++; console.log('   ✅ ' + nombre + (detalle ? ' · ' + detalle : '')); }
  else { mal++; fallos.push(nombre + (detalle ? ' · ' + detalle : '')); console.log('   ❌ ' + nombre + (detalle ? ' · ' + detalle : '')); }
}
function titulo(t) { console.log('\n\x1b[1m' + t + '\x1b[0m'); }
async function simulado(ruta, metodo) {
  // (El certificado del simulado es propio: solo para esta prueba en este computador.)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const r = await fetch(BASE + ruta, { method: metodo || 'GET' });
  return r.json();
}

async function abrir(browser, o) {
  o = o || {};
  const ctx = await browser.newContext({
    viewport: o.viewport || TELEFONO, deviceScaleFactor: o.viewport === COMPUTADORA ? 1 : 2, locale: o.ingles ? 'en-US' : 'es-VE',
    timezoneId: 'America/Caracas', colorScheme: o.oscuro ? 'dark' : 'light', acceptDownloads: true, ignoreHTTPSErrors: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  await ctx.addInitScript((ingles) => {
    try { localStorage.setItem('deliservy_idioma', ingles ? 'en' : 'es'); } catch (_) { /* nada */ }
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => { window.__csp.push(e.violatedDirective + ' ' + e.blockedURI); console.error('CSP ' + e.violatedDirective + ' ' + e.blockedURI); });
  }, !!o.ingles);
  const page = await ctx.newPage();
  page.errores = [];
  page.malas = [];
  page.on('response', (r) => { if (r.status() >= 400) page.malas.push(r.request().method() + ' ' + new URL(r.url()).pathname + ' ' + r.status()); });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Las respuestas 4xx que la prueba provoca a propósito se miran aparte, con `esperadas`.
    if (/^Failed to load resource: the server responded with a status of \d{3}/.test(m.text())) return;
    // La foto SIN CORS (a propósito, la del producto 5003): Chrome anota que no la deja leer para el lienzo, y la página
    // dibuja la historia con la inicial. Solo ESA foto se perdona; cualquier otra imagen bloqueada es un error.
    if (/foto-sin-cors\/5003\.svg' from origin .* blocked by CORS policy/.test(m.text())) { page.sinCors = (page.sinCors || 0) + 1; return; }
    if (/^Failed to load resource: net::ERR_FAILED$/.test(m.text()) && page.sinCors) { page.sinCors -= 1; return; }
    page.errores.push(m.text());
  });
  page.on('pageerror', (e) => page.errores.push('pageerror: ' + e.message));
  return { ctx, page };
}

/** Las 4xx/5xx de la API que no se esperaban son error. */
function esperadas(page, permitidas) {
  const otras = page.malas.filter((m) => !permitidas.some((p) => m.indexOf(p) === 0));
  page.malas = [];
  return otras;
}

async function limpio(page, donde) {
  const r = await page.evaluate(() => ({
    csp: window.__csp.slice(),
    ancho: document.documentElement.scrollWidth, vista: window.innerWidth,
    palabra: (document.body.innerText.match(/[^\n]*(vendedor|Vendedor|Compra-Ventas)[^\n]*/) || [null])[0],
  }));
  check(donde + ': sin errores de consola', page.errores.length === 0, page.errores.join(' | '));
  check(donde + ': sin violaciones de la CSP', r.csp.length === 0, r.csp.join(' | '));
  check(donde + ': sin desplazamiento horizontal', r.ancho <= r.vista, r.ancho + ' > ' + r.vista);
  check(donde + ': nunca dice «vendedor» ni «Compra-Ventas»', !r.palabra, r.palabra || '');
  page.errores = [];
}

async function captura(page, nombre, completa) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(CAPTURAS, 'ven-' + nombre + '.png'), fullPage: !!completa });
}

async function entrar(page, telefono) {
  await page.goto(BASE + '/vendedor/');
  await page.fill('#telefono', telefono);
  await page.click('form button[type=submit]');
  await page.waitForSelector('#codigo');
  await page.fill('#codigo', '123456'); // (`fill` ya dispara `input`: al sexto número se manda solo)
  await page.waitForSelector('#contenido h1.saludo');
}

async function ir(page, hash, selector) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.waitForSelector(selector);
  await page.waitForTimeout(200);
}

/** La imagen descargada: PNG de 1080 × 1920 (lee el encabezado IHDR). */
function medidasDePng(archivo) {
  const b = fs.readFileSync(archivo);
  if (b.readUInt32BE(0) !== 0x89504E47) return null;
  return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20), bytes: b.length };
}

async function descargarHistoria(page, donde) {
  const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#descargar-historia')]);
  const archivo = path.join(CAPTURAS, '..', 'descarga-' + Date.now() + '.png');
  await descarga.saveAs(archivo);
  const m = medidasDePng(archivo);
  check(donde + ': la imagen para historia se descarga (' + descarga.suggestedFilename() + ')', !!m && m.ancho === 1080 && m.alto === 1920, m ? m.ancho + '×' + m.alto + ', ' + m.bytes + ' bytes' : 'no es PNG');
  fs.rmSync(archivo, { force: true });
}

// ── Las pasadas ───────────────────────────────────────────────────────────────

async function registroYRevision(browser, viewport, sufijo, oscuro) {
  titulo('Registro en 2 pasos y cuenta en revisión · ' + sufijo);
  await simulado('/__simulado/reiniciar', 'POST');
  const { ctx, page } = await abrir(browser, { viewport, oscuro });
  await page.goto(BASE + '/vendedor/#registro');
  await page.waitForSelector('#r-telefono');
  const portada = await page.evaluate(() => document.body.innerText);
  check('portada: «Promotores Deliservy» y «Gana en cada venta con tus enlaces»', /Promotores Deliservy/.test(portada) && /Gana en cada venta con tus enlaces/.test(portada));
  check('portada: los tres recuadros', ['Sin inventario ni inversión', 'Cobro automático cada noche', 'Enlaces que no vencen'].every((t) => portada.includes(t)));
  check('portada: el logo real (no la «D»)', await page.evaluate(() => { const i = document.querySelector('.marca img.logo-marca'); return !!i && i.complete && i.naturalWidth > 0 && /logo-icon\.png$/.test(i.getAttribute('src')); }));
  await captura(page, 'registro-portada-' + sufijo);

  // Un número que ya es promotor.
  await page.fill('#r-telefono', TEL.sinDatos);
  await page.click('form button[type=submit]');
  await page.waitForSelector('.ya-registrado');
  check('registro: «Ese número ya está registrado»', true);
  await page.goto(BASE + '/vendedor/#registro');
  await page.reload();
  await page.waitForSelector('#r-telefono');

  // Paso 1: WhatsApp y código.
  await page.fill('#r-telefono', '0414-777-1234');
  await page.click('form button[type=submit]');
  await page.waitForSelector('#r-codigo');
  check('paso 1 de 2: el código por WhatsApp', /Paso 1 de 2/.test(await page.textContent('.tarjeta')));
  await page.fill('#r-codigo', '123456');
  await page.waitForSelector('#r-nombre');
  // Paso 2: sin nombre → error en su casilla.
  await page.fill('#r-usuario', '@prueba.valencia');
  await page.click('form button[type=submit]');
  await page.waitForSelector('.error-campo');
  check('paso 2: sin nombre, el error en su casilla', /nombre y apellido/.test(await page.innerText('.error-campo')));
  const texto2 = await page.textContent('.tarjeta');
  check('paso 2 de 2: nombre, «Tu red principal» y la nota de los datos al cobrar', /Paso 2 de 2/.test(texto2) && /Tu red principal/.test(texto2) && /se piden al cobrar por primera vez/.test(texto2));
  await page.fill('#r-nombre', 'Mariana Prueba');
  await page.selectOption('#r-red', 'tiktok');
  await captura(page, 'registro-paso2-' + sufijo);
  await page.click('form button[type=submit]');
  await page.waitForSelector('#aviso-revision');
  await page.waitForSelector('.fila-tienda');
  const ultimo = await simulado('/__simulado/ultimo');
  const r = ultimo.registro || {};
  check('«Crear mi cuenta» manda el cuerpo corto (§3)', r.nombre === 'Mariana Prueba' && r.red && r.red.tipo === 'tiktok' && r.red.usuario === '@prueba.valencia' && r.codigo === '123456' && !('documento' in r) && !('correo' in r), JSON.stringify(r));
  check('después del registro, de una vez al catálogo', await page.evaluate(() => location.hash === '#catalogo'));
  check('aviso amarillo de revisión', /se activan cuando te aprobemos/.test(await page.innerText('#aviso-revision')));
  esperadas(page, ['POST /api/vendedor/registro/codigo']);
  await limpio(page, 'registro');
  await ctx.close();

  // Pedro (pendiente) entra: Inicio con «Empieza a ganar», Catálogo, Enlaces; Ventas y Cobros cerrados.
  const b = await abrir(browser, { viewport, oscuro });
  const p = b.page;
  await entrar(p, TEL.pendiente);
  await p.waitForSelector('#empieza');
  const emp = await p.innerText('#empieza');
  check('revisión: «Empieza a ganar · 1 de 4» con los cuatro pasos', /Empieza a ganar · 1 de 4/.test(emp) && ['Cuenta creada', 'Crea tu primer enlace', 'Compártelo', 'Agrega tus datos para cobrar'].every((t) => emp.includes(t)), emp.replace(/\n/g, ' / '));
  check('revisión: botón «Elegir mi primer producto»', await p.isVisible('#empieza a.btn:has-text("Elegir mi primer producto")'));
  check('revisión: aviso amarillo arriba', await p.isVisible('#aviso-revision'));
  await captura(p, 'revision-inicio-' + sufijo, true);
  await ir(p, '#ventas', '.vacio');
  check('revisión: Ventas se abre al aprobar', /se abren al aprobar/.test(await p.innerText('#contenido')));
  await ir(p, '#cobros', '.vacio');
  check('revisión: Cobros se abre al aprobar (con «Mis datos»)', /se abren al aprobar/.test(await p.innerText('#contenido')) && await p.isVisible('#mis-datos'));
  check('revisión: Ventas y Cobros con candado en la barra', (await p.locator('nav a.cerrada').count()) >= 2);
  // Prepara su primer enlace.
  await p.click('nav.navegacion a[href="#catalogo"], nav.pestanas a[href="#catalogo"] >> visible=true');
  await p.waitForSelector('.fila-tienda');
  await p.click('.fila-tienda >> nth=0');
  await p.waitForSelector('.fila-prod .btn-cuadro');
  await p.click('.fila-prod .btn-cuadro >> nth=0');
  await p.waitForSelector('.hoja');
  check('revisión: el enlace se crea y la hoja avisa que vende al aprobar', /cuando te aprobemos/.test(await p.innerText('.hoja')));
  await p.click('.hoja button:has-text("Listo")');
  check('revisión: la fila dice «✓ Enlace listo»', /Enlace listo/.test(await p.innerText('.fila-prod >> nth=0')));
  await ir(p, '#inicio', '#empieza');
  check('revisión: «Empieza a ganar · 2 de 4» tras crear el enlace', /2 de 4/.test(await p.innerText('#empieza h2')));
  await ir(p, '#enlaces', '#contenido .tarjeta');
  check('revisión: Enlaces abierto con su enlace', /Mis enlaces/.test(await p.innerText('#contenido')));
  esperadas(p, []);
  await limpio(p, 'revisión');
  await b.ctx.close();
}

async function catalogoYCompartir(browser, viewport, sufijo, oscuro) {
  titulo('Catálogo, tienda, ordenar, ver más y compartir · ' + sufijo + (oscuro ? ' · oscuro' : ''));
  await simulado('/__simulado/reiniciar', 'POST');
  const { ctx, page } = await abrir(browser, { viewport, oscuro });
  await entrar(page, TEL.activa);
  check('activa: sin aviso de revisión ni «Empieza a ganar» (ya vende)', !(await page.isVisible('#aviso-revision')) && !(await page.isVisible('#empieza')));
  check('cabecera: «Promotores Deliservy» y el logo real', /Promotores Deliservy/.test(await page.innerText('.cabecera')) && await page.evaluate(() => { const i = document.querySelector('.cabecera img.logo-marca'); return !!i && i.naturalWidth > 0; }));
  await captura(page, 'inicio-' + sufijo + (oscuro ? '-oscuro' : ''));

  await ir(page, '#catalogo', '.fila-tienda');
  const n = await page.locator('.fila-tienda').count();
  check('catálogo: 10 tiendas en filas', n === 10, String(n));
  check('catálogo: «Ganan más esta semana» con 3 tarjetas', (await page.locator('.top-tarjeta').count()) === 3);
  const fila = await page.innerText('.fila-tienda >> nth=0');
  check('catálogo: la fila dice «n productos · rubro» y «hasta x $»', /\d+ productos · /.test(fila) && /hasta \d+,\d{2}\s\$/.test(fila), fila.replace(/\n/g, ' / '));
  check('catálogo: pestañas «Tiendas · 10» y «Productos · 94»', /Tiendas · 10/.test(await page.innerText('#pestana-tiendas')) && /Productos · 94/.test(await page.innerText('#pestana-productos')));
  check('catálogo: ya NO se abren todas las tiendas con sus productos', (await page.locator('.fila-prod').count()) === 0);
  await captura(page, 'catalogo-' + sufijo + (oscuro ? '-oscuro' : ''), !oscuro);

  // Rubro y búsqueda.
  await page.click('.rubro:has-text("Farmacia")');
  await page.waitForFunction(() => document.querySelectorAll('.fila-tienda').length === 2);
  check('rubro «Farmacia»: 2 tiendas', true);
  await page.click('.rubro:has-text("Todos")');
  await page.waitForFunction(() => document.querySelectorAll('.fila-tienda').length === 10);
  await page.fill('#buscar', 'sushi');
  await page.waitForFunction(() => document.querySelectorAll('.fila-tienda').length === 1);
  check('búsqueda «sushi»: 1 tienda', true);
  await page.fill('#buscar', '');
  await page.waitForFunction(() => document.querySelectorAll('.fila-tienda').length === 10);

  // Pestaña «Productos»: todo el catálogo en filas, «Ver más».
  await page.click('#pestana-productos');
  await page.waitForSelector('.fila-prod');
  check('pestaña Productos: 40 filas y «Ver más»', (await page.locator('.fila-prod').count()) === 40 && await page.isVisible('#ver-mas'));
  check('pestaña Productos: cada fila dice de qué tienda', (await page.locator('.fila-prod .de-tienda').count()) === 40);
  await page.click('#ver-mas');
  await page.waitForFunction(() => document.querySelectorAll('.fila-prod').length === 80);
  await page.click('#ver-mas');
  await page.waitForFunction(() => document.querySelectorAll('.fila-prod').length === 94);
  check('Ver más ×2: 94 productos y sin más', !(await page.isVisible('#ver-mas')));
  await page.click('#pestana-tiendas');
  await page.waitForSelector('.fila-tienda');

  // La tienda abierta: el Mercadito (42 productos).
  await page.click('.fila-tienda:has-text("Mercadito San Diego")');
  await page.waitForSelector('#productos-tienda .fila-prod');
  check('tienda: cabecera con volver, logo y nombre', await page.isVisible('.tienda-cab a.volver') && /Mercadito San Diego/.test(await page.innerText('.tienda-cab')));
  check('tienda: 40 filas y «Ver más»', (await page.locator('.fila-prod').count()) === 40 && await page.isVisible('#ver-mas'));
  const primera = await page.innerText('.fila-prod >> nth=0');
  check('tienda: la fila dice «precio · comisión %» y «Ganas x $»', /\d+,\d{2}\s\$ · comisión \d+\s%/.test(primera) && /Ganas \d+,\d{2}/.test(primera), primera.replace(/\n/g, ' / '));
  check('tienda: el botón de compartir es cuadrado de 44 px', await page.evaluate(() => { const r = document.querySelector('.btn-cuadro').getBoundingClientRect(); return Math.round(r.width) === 44 && Math.round(r.height) === 44; }));
  check('tienda: la foto de 60 px', await page.evaluate(() => { const r = document.querySelector('.foto-fila').getBoundingClientRect(); return Math.round(r.width) === 60; }));
  const ganancias = await page.$$eval('.fila-prod .gana', (xs) => xs.map((x) => parseFloat(x.textContent.replace(/[^\d,–]/g, '').split('–').pop().replace(',', '.'))));
  check('ordenar «Mayor ganancia» (de entrada): de mayor a menor', ganancias.every((g, i) => !i || ganancias[i - 1] >= g));
  await page.click('#ver-mas');
  await page.waitForFunction(() => document.querySelectorAll('.fila-prod').length === 42);
  check('tienda: Ver más → 42 y sin más', !(await page.isVisible('#ver-mas')));
  await page.selectOption('#orden-tienda', 'precio');
  await page.waitForFunction(() => document.querySelectorAll('.fila-prod').length === 40);
  const precios = await page.$$eval('.fila-prod small:not(.de-tienda)', (xs) => xs.map((x) => parseFloat(x.textContent.split('·')[0].replace(/[^\d,]/g, '').replace(',', '.'))));
  check('ordenar «Precio»: de menor a mayor', precios.every((v, i) => !i || precios[i - 1] <= v));
  check('ordenar manda `orden=precio&pagina=1`', /orden=precio/.test((await simulado('/__simulado/ultimo')).catalogo || '') && /pagina=1/.test((await simulado('/__simulado/ultimo')).catalogo || ''));
  await page.selectOption('#orden-tienda', 'nombre');
  await page.waitForTimeout(400);
  const nombres = await page.$$eval('.fila-prod .txt b', (xs) => xs.map((x) => x.textContent));
  check('ordenar «A–Z»', nombres.every((v, i) => !i || nombres[i - 1].localeCompare(v, 'es') <= 0));
  await captura(page, 'tienda-' + sufijo + (oscuro ? '-oscuro' : ''));

  // Compartir un producto: la hoja (P7).
  await page.click('.fila-prod .btn-cuadro >> nth=0');
  await page.waitForSelector('.hoja canvas.historia');
  const hoja = await page.innerText('.hoja');
  check('hoja: «Comparte y gana x $»', /Comparte y gana \d+,\d{2}\s\$/.test(hoja));
  check('hoja: botones de la imagen, el texto, la dirección, WhatsApp, QR y Más…', ['Descargar imagen para historia', 'Copiar texto con enlace', 'Copiar', 'WhatsApp', 'Código QR', 'Más…'].every((t) => hoja.includes(t)));
  check('hoja: nota de Instagram (sticker) y TikTok (QR y descripción)', /sticker de enlace/.test(hoja) && /TikTok/.test(hoja));
  await page.waitForTimeout(900);
  check('hoja: la vista previa es un lienzo 1080 × 1920', await page.evaluate(() => { const c = document.querySelector('.hoja canvas.historia'); return c.width === 1080 && c.height === 1920; }));
  await captura(page, 'compartir-' + sufijo + (oscuro ? '-oscuro' : ''));
  await descargarHistoria(page, 'producto con foto');
  await page.click('#copiar-texto');
  const copiado = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('«Copiar texto con enlace»: «<Producto> de <Tienda>, <precio>. Pídelo aquí: <enlace>»', /^.+ de Mercadito San Diego, \d+,\d{2}\s\$\. Pídelo aquí: https:\/\/www\.deliservy\.com\/v\/[a-z0-9]+$/.test(copiado), copiado);
  const wa = await page.getAttribute('.hoja .compartir a', 'href');
  check('WhatsApp: con el texto ya escrito', /^https:\/\/wa\.me\/\?text=.*P%C3%ADdelo%20aqu%C3%AD/.test(wa || ''));
  await page.click('.hoja .compartir button:has-text("Código QR")');
  await page.waitForSelector('#qr-caja canvas');
  check('Código QR: se dibuja aquí (oscuro y claro)', await page.evaluate(() => {
    const c = document.querySelector('#qr-caja canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let negros = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 60) negros++;
    return negros > 2000 && negros < (c.width * c.height) * 0.7;
  }));
  await page.click('.hoja button:has-text("Listo")');
  check('la fila queda «✓ Enlace listo · 0 visitas»', /Enlace listo · 0 visitas/.test(await page.innerText('.fila-prod >> nth=0')));

  // «Enlace de toda la tienda».
  await page.click('#enlace-tienda');
  await page.waitForSelector('.hoja');
  check('enlace de toda la tienda: hoja «Comparte y gana hasta…»', /Comparte y gana hasta/.test(await page.innerText('.hoja h2')));
  await page.click('.hoja button:has-text("Listo")');

  // Un producto con foto SIN CORS: la imagen se descarga igual (bloque de color e inicial).
  await page.click('.tienda-cab a.volver');
  await page.waitForSelector('.fila-tienda');
  await page.click('.fila-tienda:has-text("Arepera El Budare")');
  await page.waitForSelector('.fila-prod');
  await page.click('.fila-prod:has-text("Arepa dominó") .btn-cuadro');
  await page.waitForSelector('.hoja canvas.historia');
  await page.waitForTimeout(1200);
  await descargarHistoria(page, 'foto sin CORS');
  check('foto sin CORS: el lienzo se puede leer (salió con la inicial)', await page.evaluate(() => { try { document.querySelector('.hoja canvas.historia').getContext('2d').getImageData(0, 0, 1, 1); return true; } catch (_) { return false; } }));
  await page.click('.hoja button:has-text("Listo")');
  // «✓ Enlace listo · 41 visitas» de la arepa que ya tenía enlace.
  check('fila con enlace de antes: «✓ Enlace listo · 41 visitas»', /Enlace listo · 41 visitas/.test(await page.innerText('.fila-prod:has-text("Arepa reina pepiada")')));
  esperadas(page, []);
  await limpio(page, 'catálogo ' + sufijo);
  await ctx.close();
}

async function cobrosPrimeroDatos(browser, viewport, sufijo) {
  titulo('Cobros: los datos antes de la cuenta bancaria · ' + sufijo);
  await simulado('/__simulado/reiniciar', 'POST');
  const { ctx, page } = await abrir(browser, { viewport });
  await entrar(page, TEL.sinDatos);
  check('activa sin ventas: «Empieza a ganar»', await page.isVisible('#empieza'));
  await ir(page, '#cobros', '#mis-datos');
  check('Cobros: «Mis datos» abierto para llenar', await page.isVisible('#d-direccion'));
  check('Cobros: la cuenta bancaria espera los datos', /Antes de tu cuenta bancaria/.test(await page.innerText('#contenido')) && !(await page.isVisible('#c-numero')));
  await captura(page, 'cobros-datos-' + sufijo, true);
  await page.selectOption('#d-tipo', 'V');
  await page.fill('#d-documento', '14555666');
  await page.fill('#d-direccion', 'Urb. El Viñedo, calle 140, Valencia');
  await page.click('#mis-datos button[type=submit]');
  await page.waitForSelector('#c-numero');
  check('con los datos guardados, aparece la cuenta bancaria', await page.isVisible('#c-numero'));
  esperadas(page, []);
  await limpio(page, 'cobros');
  await ctx.close();
}

async function enIngles(browser) {
  titulo('En inglés (teléfono)');
  await simulado('/__simulado/reiniciar', 'POST');
  const { ctx, page } = await abrir(browser, { ingles: true });
  await page.goto(BASE + '/vendedor/#registro');
  await page.waitForSelector('#r-telefono');
  await page.waitForTimeout(300);
  const t = await page.innerText('body');
  check('inglés: la portada traducida', /Earn on every sale with your links/.test(t) && /No inventory or investment/.test(t), t.slice(0, 200).replace(/\n/g, ' / '));
  await entrar(page, TEL.activa);
  await ir(page, '#catalogo', '.fila-tienda');
  await page.waitForTimeout(300);
  const c = await page.textContent('#contenido');
  check('inglés: catálogo («Top earners this week», «Stores · 10»)', /Top earners this week/.test(c) && /Stores · 10/.test(c), c.slice(0, 300).replace(/\n/g, ' / '));
  await page.click('.fila-tienda >> nth=0');
  await page.waitForSelector('.fila-prod');
  await page.click('.fila-prod .btn-cuadro >> nth=0');
  await page.waitForSelector('.hoja');
  await page.waitForTimeout(300);
  check('inglés: la hoja («Share and earn»)', /Share and earn/.test(await page.innerText('.hoja')));
  const faltan = await page.evaluate(() => (window.idiomaFaltantes ? window.idiomaFaltantes() : []));
  check('inglés: sin textos sin traducir', faltan.length === 0, faltan.join(' | '));
  await captura(page, 'ingles-compartir');
  esperadas(page, []);
  await limpio(page, 'inglés');
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ headless: !process.env.VER });
  try {
    await registroYRevision(browser, TELEFONO, 'telefono');
    await registroYRevision(browser, COMPUTADORA, 'computadora');
    await catalogoYCompartir(browser, TELEFONO, 'telefono');
    await catalogoYCompartir(browser, COMPUTADORA, 'computadora');
    await catalogoYCompartir(browser, TELEFONO, 'telefono', true);
    await cobrosPrimeroDatos(browser, TELEFONO, 'telefono');
    await cobrosPrimeroDatos(browser, COMPUTADORA, 'computadora');
    if (!process.env.SIN_INGLES) await enIngles(browser);
  } catch (e) {
    mal++; fallos.push('se cortó: ' + (e && e.message ? e.message.split('\n')[0] : e));
    console.error(e);
  } finally {
    await browser.close();
  }
  console.log('\n' + ok + ' bien, ' + mal + ' mal' + (fallos.length ? ':\n - ' + fallos.join('\n - ') : ''));
  console.log('Capturas en ' + CAPTURAS);
  process.exit(mal ? 1 : 0);
})();
