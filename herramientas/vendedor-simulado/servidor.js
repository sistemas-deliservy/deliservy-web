#!/usr/bin/env node
/*
 * LA API DE LOS PROMOTORES, SIMULADA (30-oct-2026). Solo para probar `vendedor/` en este computador.
 *
 * ⚠️ NO se despliega (`herramientas/` nunca va a Ferozo) y no habla con nada de fuera: todo vive en memoria y se borra
 * al cerrarlo. Sirve la web en https://localhost:<puerto>/vendedor/ (con un certificado propio, hecho con `openssl` al
 * arrancar: así las fotos de los productos son `https://` como las del almacén de verdad) y contesta, bajo
 * /api/vendedor/*, las rutas que usa la página con las formas de CONTRATO-rediseno.md §1–3:
 *
 *   POST acceso/codigo · acceso/verificar · acceso/salir · registro/codigo · registro (cuerpo corto, §3)
 *   GET  yo · inicio · catalogo/tiendas (§1) · catalogo (orden, pagina de 40, total, hayMas, ganasHasta, vendidos30)
 *   GET  enlaces · ventas · cobros        POST enlaces · datos · cuenta
 *
 *   node herramientas/vendedor-simulado/servidor.js            # https, puerto 8797
 *   PUERTO=9100 HTTP=1 node herramientas/vendedor-simulado/servidor.js   # sin https (las fotos salen con su inicial)
 *
 * La página se sirve con su capa de idioma armada al vuelo con los diccionarios de ahora (sin tocar el archivo:
 * `aplicar.py` se corre aparte, antes del commit); `IDIOMA_DEL_ARCHIVO=1` la sirve tal cual está en el disco.
 *
 * 10 tiendas y 94 productos (una tienda, el Mercadito, con 42: así sale «Ver más» dentro de ella).
 *
 * Quién entra (el código es siempre 123456):
 *   0412-555-0201  Carla Méndez, promotora ACTIVA (con enlaces, visitas, ventas, cuenta bancaria y datos completos).
 *   0412-555-0202  Pedro Gil, promotor PENDIENTE (en revisión, sin datos fiscales: Ventas y Cobros dan 403, §2).
 *   0412-555-0203  Luisa, ACTIVA sin ventas, sin cuenta y sin cédula ni dirección (Cobros: primero sus datos). También
 *                  sirve para «Ese número ya está registrado» en el registro.
 *   Cualquier otro número: se puede registrar (queda `pendiente`, como Pedro, y entra de una vez).
 *
 * Para las pruebas (no existen en la API de verdad):
 *   POST /__simulado/reiniciar   vuelve a los datos del principio
 *   GET  /__simulado/ultimo      el último cuerpo que llegó a `POST registro` y la última consulta de `GET catalogo`
 *   GET  /__simulado/foto/<n>.svg  las fotos (dibujos simples), servidas desde https://127.0.0.1 (otro origen, como el
 *        almacén) con CORS; /__simulado/foto-sin-cors/<n>.svg, sin él (la del producto 5003, «Arepa dominó»: su imagen
 *        para historia sale con el bloque de color y la inicial)
 */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const PUERTO = Number(process.env.PUERTO || 8797);
const SIN_HTTPS = process.env.HTTP === '1';
const RAIZ_WEB = path.resolve(__dirname, '..', '..');
const CODIGO = '123456';
const TASA = 214.37;
const POR_PAGINA = 40;
const DIA = 24 * 3600 * 1000;

// ── Utilidades ───────────────────────────────────────────────────────────────

function redondo(n) { return Math.round(Number(n) * 100) / 100; }
function aleatorioCon(semilla) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function sinTildes(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function telefonoNormal(t) {
  let d = String(t || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('58')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.length === 10 && d.startsWith('4') ? '58' + d : null;
}
function telefonoParaVer(t) { const d = '0' + String(t).slice(2); return d.slice(0, 4) + '-' + d.slice(4, 7) + '-' + d.slice(7); }
function error(status, message, extra) { const e = new Error(message); e.status = status; e.extra = extra || null; return e; }
/** Lo que gana por unidad: venta × % − 16 % (como `gananciaPorUnidad`). */
function ganancia(venta, pct) { const c = venta * pct / 100; return redondo(c - c * 0.16); }

// ── Los datos ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { id: 12, nombre: 'Comida venezolana' }, { id: 13, nombre: 'Hamburguesas' }, { id: 14, nombre: 'Pizzas' },
  { id: 15, nombre: 'Farmacia' }, { id: 16, nombre: 'Supermercado' }, { id: 17, nombre: 'Postres' },
];
const TIENDAS = [
  [107, 'Arepera El Budare', 12, 10, ['Arepa reina pepiada', 'Arepa pabellón', 'Arepa dominó', 'Cachapa con queso', 'Empanada de carne', 'Tequeños (6)', 'Jugo de parchita', 'Arepa de pernil']],
  [108, 'Burger Valencia', 13, 12, ['Hamburguesa clásica', 'Hamburguesa doble con tocineta', 'Papas grandes', 'Perro caliente especial', 'Malteada de fresa', 'Combo familiar']],
  [109, 'Pizzería Don Mario', 14, 8, ['Pizza margarita mediana', 'Pizza pepperoni familiar', 'Calzone de jamón', 'Pan de ajo', 'Pizza cuatro quesos', 'Lasaña de carne']],
  [110, 'Farmacia La Granja', 15, 6, ['Acetaminofén 500 mg', 'Vitamina C efervescente', 'Alcohol isopropílico 1 L', 'Protector solar FPS 50', 'Pañales talla M (40)', 'Termómetro digital']],
  [111, 'Mercadito San Diego', 16, 5, ['Harina de maíz 1 kg', 'Café molido 500 g', 'Queso blanco 1 kg', 'Huevos (30)', 'Aceite vegetal 1 L', 'Arroz 1 kg', 'Pasta larga 1 kg']],
  [112, 'Dulcería Mamá Rosa', 17, 15, ['Torta tres leches', 'Quesillo entero', 'Marquesa de chocolate', 'Golfeados (4)', 'Brownies (6)']],
  [113, 'Pepitos Express', 12, 9, ['Pepito de carne', 'Pepito mixto', 'Patacón con pollo', 'Salchipapa grande', 'Refresco 1,5 L']],
  [114, 'Sushi Naguanagua', 12, 11, ['Roll California (10)', 'Roll tempura (10)', 'Combo 30 piezas', 'Gyozas (6)', 'Edamame']],
  [115, 'Burger Patio', 13, 7, ['Smash burger', 'Hamburguesa de pollo crispy', 'Aros de cebolla', 'Combo pareja', 'Limonada frappé']],
  [116, 'Farmacia Prebo', 15, 4, ['Ibuprofeno 400 mg', 'Suero oral', 'Gel antibacterial', 'Curitas (40)', 'Jarabe para la tos', 'Mascarillas (10)']],
];

function datosNuevos() {
  const azar = aleatorioCon(20261030);
  const productos = [];
  let pid = 5000;
  for (const [id, nombre, cat, pct, lista] of TIENDAS) {
    lista.forEach((n, i) => {
      pid += 1;
      const venta = redondo(1.5 + azar() * 22);
      const conTamanos = i === 1 && id % 2 === 1;
      const tamanos = conTamanos ? [{ titulo: 'Pequeña', venta }, { titulo: 'Grande', venta: redondo(venta * 1.6) }] : [];
      productos.push({
        id: pid, nombre: n, companyId: id, tienda: nombre, categoriaId: cat, pct, venta, tamanos,
        // Unas con foto https (sí deja dibujarla), una sin CORS (la imagen sale con su inicial) y otras sin foto.
        foto: i % 5 === 4 ? '' : (pid === 5003 ? 'sin-cors:' + pid : 'foto:' + pid),
        disponible: !(i === 3 && id % 3 === 0),
        vendidos30: Math.round(azar() * 60),
      });
    });
  }
  // Una tienda con más de 40 productos (para «Ver más» dentro de la tienda: 40 por página): 59 + 35 = 94 en total.
  for (let k = 0; k < 35; k++) {
    pid += 1;
    productos.push({ id: pid, nombre: 'Producto de despensa ' + (k + 1), companyId: 111, tienda: 'Mercadito San Diego', categoriaId: 16, pct: 5, venta: redondo(1 + k * 0.7), tamanos: [], foto: k % 3 ? 'foto:' + pid : '', disponible: true, vendidos30: k * 2 });
  }
  const promotores = {
    '584125550201': {
      id: 1, nombre: 'Carla Méndez', estado: 'activo', telefono: '584125550201', redes: { instagram: '@carla.valencia' }, comercio: null,
      tipoDocumento: 'V', documento: 'V18765432', razonSocial: null, correo: 'carla@correo.com', direccion: 'Av. Bolívar Norte, Torre Banaven, Valencia',
      cuenta: { banco: '0102', tipo: 'CNTA', titular: 'Carla Méndez', cedula: 'V18765432', numero: '0102****************1234' },
      cupon: { code: 'CARLA10', activo: true, texto: '10 % en los productos, hasta 5,00 $', configurado: true },
    },
    '584125550202': {
      id: 2, nombre: 'Pedro Gil', estado: 'pendiente', telefono: '584125550202', redes: { tiktok: '@pedrogil' }, comercio: null,
      tipoDocumento: null, documento: null, razonSocial: null, correo: null, direccion: null, cuenta: null,
      cupon: { code: 'PEDRO5', activo: false, texto: '', configurado: false },
    },
    '584125550203': {
      id: 3, nombre: 'Luisa Ya Registrada', estado: 'activo', telefono: '584125550203', redes: {}, comercio: null,
      // Activa, sin ventas, sin cuenta bancaria y sin cédula ni dirección: en Cobros se le piden sus datos ANTES que la cuenta.
      tipoDocumento: null, documento: null, razonSocial: null, correo: 'luisa@correo.com', direccion: null, cuenta: null,
      cupon: null,
    },
  };
  const enlaces = [
    { id: 1, vendedor: 1, tipo: 'p', productId: 5001, companyId: 107, codigo: 'k7h2m9qa', activo: true, visitas: 41, redes: { instagram: 30, whatsapp: 11 }, ventas: 3, netoUsd: 1.38, createdAt: Date.now() - 9 * DIA },
    { id: 2, vendedor: 1, tipo: 't', productId: null, companyId: 112, codigo: 'mamarosa7', activo: true, visitas: 12, redes: { tiktok: 12 }, ventas: 1, netoUsd: 0.9, createdAt: Date.now() - 4 * DIA },
  ];
  const ventas = [];
  for (let k = 0; k < 6; k++) {
    ventas.push({ id: 900 + k, vendedor: 1, orderId: 74100 + k, fecha: new Date(Date.now() - k * 1.7 * DIA).toISOString(), tienda: 'Arepera El Budare', via: k === 2 ? 'cupon' : 'enlace', red: k % 2 ? 'Instagram' : 'WhatsApp', productos: 'Arepa reina pepiada ×' + (1 + k % 3), comisionUsd: 0.55, ivaUsd: 0.09, netoUsd: 0.46, estado: k === 0 ? 'pendiente' : 'acreditada' });
  }
  return { productos, promotores, enlaces, ventas, sesiones: {}, codigosRegistro: {}, sigId: 10, sigEnlace: 10, ultimo: {} };
}
let D = datosNuevos();

// ── Las piezas de las respuestas ───────────────────────────────────────────

let BASE_FOTOS = '';
function fotoDe(p) {
  if (!p.foto) return '';
  const [tipo, n] = p.foto.split(':');
  return BASE_FOTOS + (tipo === 'sin-cors' ? '/__simulado/foto-sin-cors/' : '/__simulado/foto/') + n + '.svg';
}
function logoDe(companyId) { return companyId % 4 === 0 ? '' : BASE_FOTOS + '/__simulado/logo/' + companyId + '.svg'; }
function categoriaDe(id) { const c = CATEGORIAS.find((x) => x.id === id); return c ? c.nombre : ''; }
function urlDelEnlace(c) { return 'https://www.deliservy.com/v/' + c; }
function codigosDe(v) {
  const m = {};
  for (const e of D.enlaces) if (e.vendedor === v.id) m[e.tipo + ':' + (e.tipo === 'p' ? e.productId : e.companyId)] = e.codigo;
  return m;
}
function productoParaElPromotor(p, codigos) {
  const vs = p.tamanos.length ? p.tamanos.map((t) => t.venta) : [p.venta];
  const netos = vs.map((x) => ganancia(x, p.pct));
  const codigo = codigos['p:' + p.id] || null;
  return {
    id: p.id, nombre: p.nombre, foto: fotoDe(p), tienda: p.tienda, companyId: p.companyId, logo: logoDe(p.companyId), disponible: p.disponible,
    pct: p.pct, venta: Math.min(...vs), desde: vs.length > 1, ganas: Math.min(...netos), ganasHasta: Math.max(...netos),
    tamanos: p.tamanos.length ? p.tamanos.map((t) => ({ titulo: t.titulo, venta: t.venta, ganas: ganancia(t.venta, p.pct) })) : [],
    codigo, url: codigo ? urlDelEnlace(codigo) : null, vendidos30: p.vendidos30,
  };
}
function filtrar(lista, q, categoria) {
  const t = sinTildes(q).trim();
  const cat = Number(categoria) || 0;
  return lista.filter((p) => (!cat || p.categoriaId === cat) && (!t || sinTildes(p.nombre).includes(t) || sinTildes(p.tienda).includes(t)));
}
function datosParaVer(v) {
  const ver = v.documento ? (v.documento.startsWith('P') ? 'Pasaporte ' + v.documento.slice(1) : v.documento[0] + '-' + v.documento.slice(1)) : null;
  return { nombre: v.nombre, razonSocial: v.razonSocial, tipoDocumento: v.tipoDocumento, documento: v.documento, documentoParaVer: ver, correo: v.correo, telefonoParaVer: telefonoParaVer(v.telefono), direccion: v.direccion };
}
function faltan(v) {
  const f = [];
  if (!v.tipoDocumento || !v.documento) f.push('cédula o RIF');
  if (!v.direccion) f.push('dirección');
  if (!v.correo) f.push('correo');
  if ((v.tipoDocumento === 'J' || v.tipoDocumento === 'G') && !v.razonSocial) f.push('razón social');
  return f;
}
function resumen(v) {
  const mias = D.ventas.filter((x) => x.vendedor === v.id);
  const cuenta = mias.filter((x) => x.estado === 'acreditada' || x.estado === 'pendiente');
  return {
    ventasMes: cuenta.length, netoMes: redondo(cuenta.reduce((a, x) => a + x.netoUsd, 0)),
    pendienteUsd: redondo(mias.filter((x) => x.estado === 'pendiente').reduce((a, x) => a + x.netoUsd, 0)),
    ganadoUsd: redondo(cuenta.reduce((a, x) => a + x.netoUsd, 0)), ventas: cuenta.length,
  };
}
function ventaParaVer(x) {
  return {
    id: x.id, orderId: x.orderId, fecha: x.fecha, tienda: x.tienda, via: x.via, red: x.red, productos: x.productos,
    baseUsd: 5.5, comisionUsd: x.comisionUsd, ivaUsd: x.ivaUsd, netoUsd: x.netoUsd, netoBs: redondo(x.netoUsd * TASA),
    texto: 'Comisión 0,55 $ − 16 % (0,09 $) = 0,46 $', estado: x.estado, estadoTexto: x.estado === 'pendiente' ? 'En revisión' : 'Ganada',
    tono: x.estado === 'pendiente' ? 'ambar' : 'verde', credito: false, liberaEn: null,
  };
}
function saldoDe(v) {
  const total = v.estado === 'activo' ? redondo(resumen(v).netoMes * TASA) : 0;
  return { disponibleBs: total, retenidoBs: 0, totalBs: total, avisoRetencion: null, cuenta: v.cuenta, retiros: v.id === 1 ? [{ fecha: new Date(Date.now() - 2 * DIA).toISOString(), montoBs: 418.2, estado: 'COMPLETED' }] : [] };
}
const NOMBRE_DE_RED = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook', whatsapp: 'WhatsApp' };

// ── Las rutas ────────────────────────────────────────────────────────────────

const EN_REVISION = 'Tu cuenta está en revisión. Te avisaremos por WhatsApp cuando esté lista.';
const PERMITE_PENDIENTE = new Set(['GET yo', 'POST datos', 'GET inicio', 'GET catalogo', 'GET catalogo/tiendas', 'GET enlaces', 'POST enlaces', 'POST acceso/salir']);

function sesionDe(req) {
  const m = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization || '');
  const tel = m && D.sesiones[m[1]];
  const v = tel && D.promotores[tel];
  if (!v) throw error(401, 'Tu sesión terminó. Entra otra vez con tu WhatsApp.');
  return v;
}
function abrirSesion(tel) { const t = crypto.randomBytes(32).toString('base64url'); D.sesiones[t] = tel; return t; }

async function api(req, ruta, q, b) {
  const clave = req.method + ' ' + ruta;
  // Sin sesión
  if (clave === 'POST acceso/codigo') {
    if (!telefonoNormal(b.telefono)) throw error(400, 'Escribe tu número de WhatsApp, por ejemplo 0412-555-0198.');
    return { ok: true, mensaje: 'Si ese número es de un vendedor, te llegó un código por WhatsApp.' };
  }
  if (clave === 'POST acceso/verificar') {
    const tel = telefonoNormal(b.telefono);
    if (String(b.codigo) !== CODIGO || !tel || !D.promotores[tel]) throw error(400, 'Ese código no es correcto o ya venció.');
    return { ok: true, token: abrirSesion(tel) };
  }
  if (clave === 'POST registro/codigo') {
    const tel = telefonoNormal(b.telefono);
    if (!tel) throw error(400, 'Escribe tu número de WhatsApp, por ejemplo 0412-555-0198.');
    if (D.promotores[tel]) return { ok: true, yaEsVendedor: true, mensaje: 'Ese número ya está registrado. Entra con tu WhatsApp.' };
    return { ok: true, mensaje: 'Te enviamos un código por WhatsApp.' };
  }
  if (clave === 'POST registro') {
    D.ultimo.registro = b;
    const tel = telefonoNormal(b.telefono);
    if (!tel) throw error(400, 'Escribe tu número de WhatsApp, por ejemplo 0412-555-0198.');
    if (!/^\d{6}$/.test(String(b.codigo || ''))) throw error(400, 'El código tiene 6 números.', { campo: 'codigo' });
    const nombre = String(b.nombre || '').trim();
    if (nombre.length < 2) throw error(400, 'Escribe tu nombre y apellido.', { campo: 'nombre' });
    if (b.red === undefined) throw error(400, 'Esta API simulada solo acepta el cuerpo corto (§3).');
    if (!['instagram', 'tiktok', 'youtube', 'facebook'].includes(b.red && b.red.tipo)) throw error(400, 'Elige tu red: Instagram, TikTok, YouTube o Facebook.', { campo: 'red' });
    const usuario = String((b.red && b.red.usuario) || '').trim();
    if (usuario.length < 2) throw error(400, 'Escribe tu usuario de esa red, por ejemplo @tuusuario.', { campo: 'red' });
    if (D.promotores[tel]) throw error(409, 'Ese número ya está registrado. Entra con tu WhatsApp.', { yaEsVendedor: true });
    if (String(b.codigo) !== CODIGO) throw error(400, 'Ese código no es correcto o ya venció.', { campo: 'codigo' });
    D.promotores[tel] = {
      id: ++D.sigId, nombre, estado: 'pendiente', telefono: tel, redes: { [b.red.tipo]: usuario }, comercio: null,
      tipoDocumento: null, documento: null, razonSocial: null, correo: null, direccion: null, cuenta: null, cupon: null,
    };
    return { ok: true, token: abrirSesion(tel), estado: 'pendiente', venceEn: new Date(Date.now() + 30 * DIA).toISOString() };
  }

  // Con sesión
  const v = sesionDe(req);
  if (v.estado === 'pendiente' && !PERMITE_PENDIENTE.has(clave)) throw error(403, EN_REVISION);
  const codigos = codigosDe(v);

  if (clave === 'POST acceso/salir') { for (const k in D.sesiones) if (D.sesiones[k] === v.telefono) delete D.sesiones[k]; return { ok: true }; }
  if (clave === 'GET yo') {
    return {
      vendedor: { nombre: v.nombre, estado: v.estado, telefono: telefonoParaVer(v.telefono), redes: v.redes, comercio: v.comercio },
      cupon: v.cupon, datos: datosParaVer(v), faltanDatos: faltan(v),
    };
  }
  if (clave === 'POST datos') {
    if (b.correo !== undefined) v.correo = b.correo;
    if (b.direccion !== undefined) v.direccion = b.direccion;
    if (b.razonSocial !== undefined) v.razonSocial = b.razonSocial;
    if (b.tipoDocumento && b.documento) { v.tipoDocumento = b.tipoDocumento; v.documento = b.tipoDocumento + b.documento; }
    return { ok: true, datos: datosParaVer(v), faltanDatos: faltan(v) };
  }
  if (clave === 'GET inicio') {
    const mias = D.ventas.filter((x) => x.vendedor === v.id);
    const visitas = {};
    for (const e of D.enlaces) if (e.vendedor === v.id) for (const r in e.redes) visitas[r] = (visitas[r] || 0) + e.redes[r];
    return {
      vendedor: { nombre: v.nombre }, cupon: v.cupon, saldo: saldoDe(v), avisoSaldo: null,
      ventas: mias.slice(0, 5).map(ventaParaVer),
      visitas: Object.keys(visitas).map((r) => ({ red: r, nombre: NOMBRE_DE_RED[r] || r, visitas: visitas[r] })).sort((a, c) => c.visitas - a.visitas),
      resumen: resumen(v),
    };
  }
  if (clave === 'GET catalogo/tiendas') {
    const lista = filtrar(D.productos, q.get('q'), q.get('categoria'));
    const porTienda = new Map();
    for (const p of lista) {
      const x = productoParaElPromotor(p, codigos);
      const t = porTienda.get(p.companyId) || { id: p.companyId, nombre: p.tienda, logo: logoDe(p.companyId), categoria: categoriaDe(p.categoriaId), productos: 0, ganasHasta: 0 };
      t.productos += 1; t.ganasHasta = Math.max(t.ganasHasta, x.ganasHasta);
      porTienda.set(p.companyId, t);
    }
    const tiendas = [...porTienda.values()].map((t) => {
      const codigo = codigos['t:' + t.id] || null;
      return Object.assign(t, { ganasHasta: redondo(t.ganasHasta), codigo, url: codigo ? urlDelEnlace(codigo) : null });
    }).sort((a, c) => c.ganasHasta - a.ganasHasta || a.nombre.localeCompare(c.nombre, 'es'));
    const top = D.productos.filter((p) => p.disponible).map((p) => productoParaElPromotor(p, codigos)).sort((a, c) => c.ganasHasta - a.ganasHasta).slice(0, 6);
    const usadas = new Set(D.productos.map((p) => p.categoriaId));
    return { tiendas, categorias: CATEGORIAS.filter((c) => usadas.has(c.id)), top };
  }
  if (clave === 'GET catalogo') {
    D.ultimo.catalogo = q.toString();
    let lista = filtrar(D.productos, q.get('q'), q.get('categoria'));
    const tienda = Number(q.get('tienda')) || 0;
    if (tienda) lista = lista.filter((p) => p.companyId === tienda);
    let salida = lista.map((p) => productoParaElPromotor(p, codigos));
    const orden = q.get('orden');
    // (Como `ordenarCatalogo` del servidor: por `ganasHasta`; «vendidos» desempata por ganancia.)
    if (orden === 'ganancia') salida.sort((a, c) => c.ganasHasta - a.ganasHasta || a.nombre.localeCompare(c.nombre, 'es'));
    else if (orden === 'vendidos') salida.sort((a, c) => c.vendidos30 - a.vendidos30 || c.ganasHasta - a.ganasHasta || a.nombre.localeCompare(c.nombre, 'es'));
    else if (orden === 'precio') salida.sort((a, c) => a.venta - c.venta || a.nombre.localeCompare(c.nombre, 'es'));
    else if (orden === 'nombre') salida.sort((a, c) => a.nombre.localeCompare(c.nombre, 'es'));
    else salida.sort((a, c) => a.tienda.localeCompare(c.tienda, 'es') || a.nombre.localeCompare(c.nombre, 'es'));
    const pagina = Math.max(1, Math.min(1000, Number(q.get('pagina')) || 1));
    const total = salida.length;
    const trozo = salida.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
    const tiendasF = [...new Map(D.productos.map((p) => [p.companyId, { id: p.companyId, nombre: p.tienda, logo: logoDe(p.companyId) }])).values()]
      .map((t) => { const c = codigos['t:' + t.id] || null; return Object.assign(t, { codigo: c, url: c ? urlDelEnlace(c) : null }); });
    return { productos: trozo, tiendas: tiendasF, categorias: CATEGORIAS, total, pagina, hayMas: pagina * POR_PAGINA < total };
  }
  if (clave === 'GET enlaces') {
    return {
      enlaces: D.enlaces.filter((e) => e.vendedor === v.id).map((e) => {
        const p = e.tipo === 'p' ? D.productos.find((x) => x.id === e.productId) : null;
        const t = D.productos.find((x) => x.companyId === e.companyId);
        return {
          id: e.id, tipo: e.tipo, codigo: e.codigo, url: urlDelEnlace(e.codigo), activo: e.activo, producto: p ? p.nombre : null, foto: p ? fotoDe(p) : null,
          tienda: t ? t.tienda : '', logo: logoDe(e.companyId), visitas: e.visitas, ventas: e.ventas, netoUsd: e.netoUsd, createdAt: new Date(e.createdAt).toISOString(),
          redes: Object.entries(e.redes).map(([red, n]) => ({ red, nombre: NOMBRE_DE_RED[red] || red, visitas: n })).sort((a, c) => c.visitas - a.visitas),
        };
      }),
    };
  }
  if (clave === 'POST enlaces') {
    const tipo = b.tipo === 'p' ? 'p' : b.tipo === 't' ? 't' : null;
    if (!tipo) throw error(400, 'Elige un producto o una tienda.');
    let productId = null;
    let companyId = Number(b.companyId) || 0;
    if (tipo === 'p') {
      const p = D.productos.find((x) => x.id === Number(b.productId));
      if (!p) throw error(400, 'Ese producto ya no está en el programa.');
      productId = p.id; companyId = p.companyId;
    } else if (!D.productos.some((x) => x.companyId === companyId)) throw error(400, 'Esa tienda ya no está en el programa.');
    let e = D.enlaces.find((x) => x.vendedor === v.id && x.tipo === tipo && (tipo === 'p' ? x.productId === productId : x.companyId === companyId));
    const nuevo = !e;
    if (!e) {
      e = { id: ++D.sigEnlace, vendedor: v.id, tipo, productId, companyId, codigo: crypto.randomBytes(6).toString('hex').replace(/[^a-z0-9]/g, '').slice(0, 8).padEnd(8, 'x'), activo: true, visitas: 0, redes: {}, ventas: 0, netoUsd: 0, createdAt: Date.now() };
      D.enlaces.push(e);
    }
    return { enlace: { codigo: e.codigo, url: urlDelEnlace(e.codigo), tipo, productId, companyId, activo: true, nuevo } };
  }
  if (clave === 'GET ventas') {
    const mias = D.ventas.filter((x) => x.vendedor === v.id);
    return { ventas: mias.map(ventaParaVer), hayMas: false, pagina: 1, resumen: resumen(v) };
  }
  if (clave === 'GET cobros') {
    return { saldo: saldoDe(v), avisoSaldo: null, bancos: [{ codigo: '0102', nombre: 'Banco de Venezuela' }, { codigo: '0105', nombre: 'Mercantil' }, { codigo: '0134', nombre: 'Banesco' }] };
  }
  if (clave === 'POST cuenta') {
    v.cuenta = { banco: b.creditorBank, tipo: b.creditorAccType, titular: b.creditorName, cedula: b.creditorID, numero: String(b.creditorAccount).replace(/\d(?=\d{4})/g, '*') };
    return { ok: true };
  }
  throw error(404, 'No existe esa ruta.');
}

// ── Las fotos (dibujos simples, sin nada de fuera) ─────────────────────────

const COLORES = ['#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#8AB17D', '#B5838D', '#6D597A', '#457B9D'];
function svgFoto(n, logo) {
  const c = COLORES[n % COLORES.length], c2 = COLORES[(n + 3) % COLORES.length];
  if (logo) return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="${c}"/><circle cx="100" cy="100" r="58" fill="#fff" opacity=".9"/><circle cx="100" cy="100" r="30" fill="${c2}"/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><ellipse cx="300" cy="360" rx="210" ry="90" fill="#fff" opacity=".85"/><circle cx="300" cy="300" r="140" fill="#FFE8B0"/><circle cx="250" cy="270" r="26" fill="${c2}"/><circle cx="345" cy="320" r="20" fill="${c}"/></svg>`;
}

// ── El servidor ─────────────────────────────────────────────────────────────

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
};
const CABECERAS = { 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };

/**
 * `vendedor/index.html` con la capa de idioma armada AL VUELO con los diccionarios de ahora (las mismas funciones de
 * `herramientas/idioma/aplicar.py`, sin escribir ningún archivo): así la prueba en inglés ve los textos nuevos aunque
 * nadie haya corrido `aplicar.py` todavía. `IDIOMA_DEL_ARCHIVO=1`: la página tal cual está en el disco.
 */
const PITON_IDIOMA = `
import sys, os, json
sys.path.insert(0, os.path.join(sys.argv[1], 'herramientas', 'idioma'))
import aplicar
pag = [p for p in aplicar.PAGINAS if p['archivo'] == 'vendedor/index.html'][0]
raiz = sys.argv[1]
s = open(os.path.join(raiz, pag['archivo']), encoding='utf-8').read()
dic = {}
for d in pag['diccionarios']: dic.update(aplicar.leer_json(d))
siempre = frozenset(aplicar.leer_json(pag['siempre']))
extra = chr(10).join(open(os.path.join(raiz, t), encoding='utf-8').read() for t in pag['textos'])
motor = open(os.path.join(raiz, pag['motor_aparte']), encoding='utf-8').read()
nuevo, _, _ = aplicar.armar(aplicar.quitar(s), dic, motor, siempre, extra, '/' + pag['motor_aparte'] + '?v=al-vuelo')
sys.stdout.write(nuevo)
`;
function paginaConIdioma() {
  return execFileSync('python3', ['-I', '-B', '-c', PITON_IDIOMA, RAIZ_WEB], { encoding: 'utf-8', maxBuffer: 8 * 1024 * 1024 });
}

function servirArchivo(res, archivo) {
  if (archivo === path.join(RAIZ_WEB, 'vendedor', 'index.html') && process.env.IDIOMA_DEL_ARCHIVO !== '1') {
    let html;
    try { html = paginaConIdioma(); } catch (e) { console.error('[idioma al vuelo] ' + e.message); html = null; }
    if (html) {
      res.writeHead(200, Object.assign({ 'Content-Type': TIPOS['.html'], 'Cache-Control': 'no-cache' }, CABECERAS));
      res.end(html);
      return;
    }
  }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404, CABECERAS); res.end('No está'); return; }
    res.writeHead(200, Object.assign({ 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }, CABECERAS));
    res.end(datos);
  });
}
function responder(res, status, cuerpo) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, CABECERAS));
  res.end(JSON.stringify(cuerpo));
}
function leerCuerpo(req) {
  return new Promise((ok) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e6) req.destroy(); });
    req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (_) { ok({}); } });
  });
}

async function atender(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(url.pathname);
  try {
    if (p.startsWith('/api/vendedor/')) {
      await new Promise((ok) => setTimeout(ok, 40 + Math.random() * 80));
      const b = req.method === 'POST' ? await leerCuerpo(req) : {};
      try {
        responder(res, 200, await api(req, p.slice('/api/vendedor/'.length), url.searchParams, b));
      } catch (e) {
        if (!e.status) throw e;
        responder(res, e.status, Object.assign({ statusCode: e.status, message: e.message }, e.extra || {}));
      }
      return;
    }
    if (p === '/__simulado/reiniciar' && req.method === 'POST') { D = datosNuevos(); responder(res, 200, { ok: true }); return; }
    if (p === '/__simulado/ultimo') { responder(res, 200, D.ultimo); return; }
    let m = /^\/__simulado\/(foto|foto-sin-cors|logo)\/(\d+)\.svg$/.exec(p);
    if (m) {
      const cab = { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=3600', 'X-Content-Type-Options': 'nosniff' };
      // El almacén de verdad deja leer sus fotos desde otra página (CORS); la «sin-cors» no: la imagen sale con la inicial.
      if (m[1] !== 'foto-sin-cors') cab['Access-Control-Allow-Origin'] = '*';
      res.writeHead(200, cab);
      res.end(svgFoto(Number(m[2]), m[1] === 'logo'));
      return;
    }
    if (p === '/' || p === '/vendedor') { res.writeHead(302, { Location: '/vendedor/' }); res.end(); return; }
    let archivo = path.join(RAIZ_WEB, p.endsWith('/') ? p + 'index.html' : p);
    if (!archivo.startsWith(RAIZ_WEB + path.sep) || archivo.includes(path.sep + 'herramientas' + path.sep) || archivo.includes(path.sep + '.git')) {
      res.writeHead(404, CABECERAS); res.end('No está'); return;
    }
    servirArchivo(res, archivo);
  } catch (e) {
    console.error(e);
    responder(res, 500, { statusCode: 500, message: 'Algo salió mal en la API simulada.' });
  }
}

/** Un certificado propio para localhost (solo en memoria y en una carpeta temporal que se borra). */
function certificado() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vendedor-simulado-'));
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', '/CN=localhost',
      '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-keyout', path.join(dir, 'k.pem'), '-out', path.join(dir, 'c.pem')], { stdio: 'ignore' });
    return { key: fs.readFileSync(path.join(dir, 'k.pem')), cert: fs.readFileSync(path.join(dir, 'c.pem')) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const servidor = SIN_HTTPS ? http.createServer(atender) : https.createServer(certificado(), atender);
// Las fotos, desde OTRO origen (127.0.0.1 frente a localhost), como el almacén de verdad: así cuenta el CORS del lienzo.
BASE_FOTOS = SIN_HTTPS ? '' : 'https://127.0.0.1:' + PUERTO;
servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log('API de promotores simulada: ' + (SIN_HTTPS ? 'http' : 'https') + '://localhost:' + PUERTO + '/vendedor/  (código ' + CODIGO + ')');
});
