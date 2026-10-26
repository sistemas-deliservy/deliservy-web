#!/usr/bin/env node
/*
 * LA API DEL COMERCIO, SIMULADA (24-oct-2026). Solo para probar `comercio/` en este computador.
 *
 * ⚠️ NO se despliega (`herramientas/` nunca va a Ferozo) y no habla con nada de fuera: todo vive en memoria y se
 * borra al cerrarlo. Sirve la página en http://localhost:<puerto>/comercio/ y contesta las rutas del contrato
 * (`CONTRATO-panel-del-comercio.md` §3) bajo /api/comercio/*, más las dos del buscador de direcciones que usa la
 * tienda web (/api/client/address/autocomplete/… y /api/client/address/donde). En localhost la página habla en
 * relativo, así que no hace falta nada más.
 *
 *   node herramientas/comercio-simulado/servidor.js            # puerto 8787
 *   PUERTO=9000 node herramientas/comercio-simulado/servidor.js
 *
 * Quién entra (el código es siempre 123456):
 *   0412-555-0101  Ana Rodríguez, dueña de dos tiendas: «Arepera El Budare» (de la app, con pedidos, productos y
 *                  billetera) y «Boutique Valentina» (solo flota: debe, pedidos de flota y Alisa).
 *   0412-555-0102  Luis Pérez, cajero de Ana (ve pedidos y los marca listos; ve la flota).
 *   0412-555-0199  un número sin tienda → 404.
 *
 * Para las pruebas (no existen en la API de verdad):
 *   POST /__simulado/reiniciar         vuelve a los datos del principio
 *   POST /__simulado/pedido-nuevo      llega un pedido nuevo a la Arepera (para el sonido y el aviso)
 *   POST /__simulado/vencer-sesiones   todas las sesiones vencen (la próxima petición da 401)
 *   POST /__simulado/fallar-fotos      la próxima subida de foto falla (500)
 *   GET  /__simulado/ultima-foto       lo que llegó en la última foto (tipo, bytes, ancho y alto)
 *   GET  /__simulado/bitacora          lo último que se escribió (como `comercio_bitacora`)
 *
 * «Mi plan» (§7 del contrato, sin rutas en él: las de aquí son la propuesta de la web):
 *   GET  plan?storeId=               el plan que cuenta, la membresía, el cobro por producto, los ajustes y los pagos
 *   POST plan/solicitar              {companyId, plan:'premium'|'deluxe'} «Quiero…» (le avisa al admin)
 *   POST plan/pagar/cotizar          {companyId} → {pagoId, montoUsd, montoBs, tasa, periodo, pago:{banco, telefono, cuenta, rif, titular}}
 *   POST plan/pagar                  {pagoId, metodo, telefonoPago | cedulaTipo+cedulaNumero | tarjeta} (el cuerpo de la tienda web)
 *   Tarjetas de prueba: 4111 1111 1111 1111 sale bien; una que termine en 0002, el banco la rechaza. Pago móvil desde
 *   0414-000-0000 o transferencia con la cédula 1111111: «aún no aparece».
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUERTO = Number(process.env.PUERTO || 8787);
const RAIZ_WEB = path.resolve(__dirname, '..', '..');
const CODIGO = '123456';
const TASA = 214.37; // Bs por dólar (inventada)
const HORA_MS = 3600 * 1000;
const DIA_MS = 24 * HORA_MS;
const CARACAS_MS = -4 * HORA_MS; // Venezuela: UTC−4, sin horario de verano

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
/** 'AAAA-MM-DD' de un instante, en hora de Caracas. */
function diaCaracas(ms) { return new Date(ms + CARACAS_MS).toISOString().slice(0, 10); }
function horaCaracas(ms) { return new Date(ms + CARACAS_MS).getUTCHours(); }
/** El instante (UTC) de un 'AAAA-MM-DD' a las 00:00 de Caracas. */
function inicioDelDia(dia) { return Date.parse(dia + 'T00:00:00Z') - CARACAS_MS; }
function sinTildes(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function iso(ms) { return new Date(ms).toISOString(); }
function bs(n) {
  const p = redondo(n).toFixed(2).split('.');
  return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1] + ' Bs';
}
function usd(n) { return redondo(n).toFixed(2).replace('.', ',') + ' $'; }
function telefonoNormal(t) {
  let d = String(t || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('58')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? '58' + d : null;
}
function telefonoParaVer(t) {
  const d = String(t || '').replace(/\D/g, '');
  const local = d.startsWith('58') ? '0' + d.slice(2) : d;
  return /^04\d{9}$/.test(local) ? local.slice(0, 4) + '-' + local.slice(4, 7) + '-' + local.slice(7) : String(t || '');
}
function distanciaKm(a, b) {
  const r = (x) => (x * Math.PI) / 180;
  const d = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(d));
}
/** El próximo jueves a las 11:59 p. m. de Caracas (el día de pago de la flota). */
function proximoJueves(ahora) {
  const c = new Date(ahora + CARACAS_MS);
  let falta = (4 - c.getUTCDay() + 7) % 7;
  const dia = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate() + falta, 23, 59, 0));
  if (dia.getTime() - CARACAS_MS < ahora) dia.setUTCDate(dia.getUTCDate() + 7);
  return dia.getTime() - CARACAS_MS;
}

// ── El cobro de Deliservy por producto (§7 del contrato) ─────────────────────

const AJUSTES = { pct: 5, minimoUsd: 0.2, maximoUsd: 0.99, premiumUsd: 14.99, deluxeUsd: 25.99 };
/** Por UNIDAD: 5 % del precio, mínimo 0,20 y máximo 0,99 (la mitad hacia arriba); Premium la mitad (0,10–0,50); Deluxe 0. */
function cobroPorUnidad(precio, plan, promoViva, ajustes) {
  const a = ajustes || AJUSTES;
  if (promoViva || plan === 'deluxe') return 0;
  const cents = Math.round(Number(precio) * 100);
  let c = Math.floor((cents * a.pct + 50) / 100);
  c = Math.min(Math.round(a.maximoUsd * 100), Math.max(Math.round(a.minimoUsd * 100), c));
  if (plan === 'premium') c = Math.min(50, Math.max(10, Math.floor((c + 1) / 2)));
  return c / 100;
}

// ── Lugares de Valencia (para el buscador y para Alisa) ──────────────────────

const LUGARES = [
  { nombre: 'Centro Comercial Sambil Valencia', direccion: 'Av. Paseo Cabriales, Valencia', lat: 10.2001, lng: -68.0050 },
  { nombre: 'Av. Bolívar Norte', direccion: 'Altura de la Plaza de Toros, Valencia', lat: 10.2143, lng: -68.0055 },
  { nombre: 'Urb. El Viñedo', direccion: 'Calle 137, Valencia', lat: 10.2121, lng: -68.0110 },
  { nombre: 'C.C. Metrópolis', direccion: 'Autopista del Sur, Valencia', lat: 10.1525, lng: -67.9840 },
  { nombre: 'Naguanagua, Av. Universidad', direccion: 'Frente a la UC, Naguanagua', lat: 10.2706, lng: -68.0130 },
  { nombre: 'San Diego, C.C. Fin de Siglo', direccion: 'Av. Don Julio Centeno, San Diego', lat: 10.2470, lng: -67.9530 },
  { nombre: 'Urb. Prebo', direccion: 'Av. 106, Valencia', lat: 10.2228, lng: -68.0185 },
  { nombre: 'Urb. La Granja', direccion: 'Calle 143, Naguanagua', lat: 10.2386, lng: -68.0168 },
  { nombre: 'Los Guayos, Plaza Bolívar', direccion: 'Casco central, Los Guayos', lat: 10.1890, lng: -67.9380 },
  { nombre: 'Hospital Metropolitano del Norte', direccion: 'Av. Andrés Eloy Blanco, Valencia', lat: 10.2296, lng: -68.0082 },
  { nombre: 'Urb. Trigal Norte', direccion: 'Calle Mohedano, Valencia', lat: 10.2290, lng: -67.9960 },
  { nombre: 'Av. Cedeño', direccion: 'Centro, Valencia', lat: 10.1757, lng: -68.0012 },
];
function buscarLugares(q) {
  const palabras = sinTildes(q).split(/\s+/).filter(Boolean);
  if (!palabras.length) return [];
  return LUGARES.filter((l) => {
    const texto = sinTildes(l.nombre + ' ' + l.direccion);
    return palabras.every((p) => texto.includes(p));
  });
}
function lugarCercano(lat, lng) {
  let mejor = null, d = Infinity;
  for (const l of LUGARES) {
    const x = distanciaKm({ lat, lng }, l);
    if (x < d) { d = x; mejor = l; }
  }
  return d < 1.2 ? mejor.nombre + ', ' + mejor.direccion.split(',').pop().trim() : 'Cerca de ' + mejor.nombre;
}

// ── Las fotos inventadas (dibujos SVG servidos aquí mismo) ───────────────────

const FOTOS = {
  'arepa-reina': ['#F6C770', '#E8913A', '🫓'], 'arepa-pabellon': ['#F2B66D', '#B5532D', '🫓'],
  'arepa-domino': ['#EADBC8', '#5C4033', '🫓'], 'cachapa': ['#FBE29A', '#E2A93B', '🌽'],
  'tequenos': ['#F7D9A0', '#C9822F', '🧀'], 'empanada': ['#F4C27A', '#C66B2A', '🥟'],
  'papelon': ['#F7E3B5', '#8BAA3B', '🍋'], 'malta': ['#4A2C1D', '#1E120B', '🍺'],
  'jugo': ['#FFB36B', '#F2711C', '🧃'], 'quesillo': ['#FBE7B5', '#D99A2B', '🍮'],
  'tres-leches': ['#FFF4E0', '#E7C9A0', '🍰'], 'combo-2': ['#FFD6A5', '#E4572E', '🍽️'],
  'combo-4': ['#FFCAA0', '#D9480F', '🍽️'], 'combo-6': ['#FFB997', '#C2410C', '🍽️'],
  'cafe': ['#C8A27C', '#6F4E37', '☕'],
  'vestido': ['#F9C6D3', '#C2185B', '👗'], 'franela': ['#C7DDF7', '#1F5FC4', '👕'],
  'bolso': ['#E9D5B7', '#8D5524', '👜'], 'zapatos': ['#D7D7DD', '#44444E', '👟'],
  'logo-budare': ['#E41616', '#FF5A1F', '🫓'], 'banner-budare': ['#FFB36B', '#E41616', '🫓'],
  'marcador-budare': ['#E41616', '#B00F0F', '🫓'], 'logo-valentina': ['#C2185B', '#F06292', '👗'],
  'banner-valentina': ['#F8BBD0', '#C2185B', '👗'], 'marcador-valentina': ['#C2185B', '#880E4F', '👗'],
  'repartidor-carlos': ['#BBDEFB', '#1565C0', '🏍️'], 'repartidor-jose': ['#C8E6C9', '#2E7D32', '🏍️'],
};
function svgDeFoto(clave) {
  const f = FOTOS[clave] || ['#DDDDDD', '#999999', '📦'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${f[0]}"/><stop offset="1" stop-color="${f[1]}"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="215" r="132" fill="rgba(255,255,255,.22)"/>
<text x="200" y="262" font-size="150" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${f[2]}</text></svg>`;
}
const foto = (clave) => '/simulado/fotos/' + clave + '.svg';

// ── Los datos ────────────────────────────────────────────────────────────────

let D; // todo el estado
const SUBIDAS = new Map(); // id → Buffer (las fotos que subió la página)
let ULTIMA_FOTO = null;
let FALLAR_FOTOS = 0;
let PEDIR_FIRMA = false;
const promotorSimulado = { token: '', firmado: false };

function datosNuevos() {
  const azar = aleatorioCon(24102026);
  const ahora = Date.now();
  const d = {
    sesiones: new Map(), // sha256 → sesión
    frenos: new Map(), // teléfono → [instantes]
    codigos: new Map(), // teléfono → código pedido
    bitacora: [],
    firmadas: {},
    siguienteId: 5000,
    cuentas: {
      501: { userId: 501, nombre: 'Ana Rodríguez', telefono: '584125550101' },
    },
    trabajadores: [
      { id: 71, duenoUserId: 501, nombre: 'Luis Pérez', telefono: '584125550102', permisos: ['pedidos', 'pedidos_acciones', 'flota_ver'], activo: true, versionSesion: 1 },
      { id: 72, duenoUserId: 501, nombre: 'Daniela Suárez', telefono: '584245550177', permisos: ['pedidos', 'productos'], activo: true, versionSesion: 1 },
    ],
    tiendas: [
      {
        storeId: 31, companyId: 107, userId: 501, nombre: 'Arepera El Budare', tipo: 'comida', authorized: 1,
        logo: foto('logo-budare'), banner: foto('banner-budare'), marcador: foto('marcador-budare'),
        direccion: 'Av. Bolívar Norte, C.C. Camoruco, local 12, Valencia', telefono: '584145550123',
        correo: 'elbudare@gmail.com', rif: 'J501234560', lat: 10.2187, lng: -68.0071,
        categoria: { id: 12, nombre: 'Comida venezolana' },
        comisionPct: 10, comisionPromo: null, flota: null, cobroPorProducto: true,
        horarios: [
          { dia: 0, abre: '09:00', cierra: '15:00', cerrado: false }, { dia: 1, abre: '07:00', cierra: '22:00', cerrado: false },
          { dia: 2, abre: '07:00', cierra: '22:00', cerrado: false }, { dia: 3, abre: '07:00', cierra: '22:00', cerrado: false },
          { dia: 4, abre: '07:00', cierra: '22:00', cerrado: false }, { dia: 5, abre: '07:00', cierra: '01:00', cerrado: false },
          { dia: 6, abre: '08:00', cierra: '01:00', cerrado: false },
        ],
        pctTienda: 10,
      },
      {
        storeId: 58, companyId: 140, userId: 501, nombre: 'Boutique Valentina', tipo: 'tienda', authorized: 3,
        logo: foto('logo-valentina'), banner: foto('banner-valentina'), marcador: '',
        direccion: 'Calle 137, C.C. Paseo La Granja, local 4, Naguanagua', telefono: '584125550160',
        correo: 'boutiquevalentina@gmail.com', rif: 'J412345670', lat: 10.2372, lng: -68.0151,
        categoria: { id: 30, nombre: 'Ropa y calzado' },
        comisionPct: 0, comisionPromo: { pct: 0, hasta: '2026-11-29T03:59:59.000Z', luegoPct: 10 }, cobroPorProducto: true,
        flota: { comercioId: 22, activo: true, bloqueado: false },
        horarios: [
          { dia: 0, abre: '00:00', cierra: '00:00', cerrado: true }, { dia: 1, abre: '09:00', cierra: '18:00', cerrado: false },
          { dia: 2, abre: '09:00', cierra: '18:00', cerrado: false }, { dia: 3, abre: '09:00', cierra: '18:00', cerrado: false },
          { dia: 4, abre: '09:00', cierra: '18:00', cerrado: false }, { dia: 5, abre: '09:00', cierra: '18:00', cerrado: false },
          { dia: 6, abre: '10:00', cierra: '14:00', cerrado: false },
        ],
        pctTienda: 0,
      },
    ],
    categorias: [
      { id: 12, nombre: 'Comida venezolana' }, { id: 13, nombre: 'Pizzas' }, { id: 14, nombre: 'Hamburguesas' },
      { id: 15, nombre: 'Postres y café' }, { id: 30, nombre: 'Ropa y calzado' }, { id: 31, nombre: 'Tecnología' },
      { id: 32, nombre: 'Farmacia' },
    ],
    cuentaBancaria: { banco: 'Banco Nacional de Crédito (0191)', titular: 'Ana Rodríguez', cuentaParaVer: '0191 •••• •••• •••• 3456' },
    ajustesCobro: Object.assign({}, AJUSTES),
    planes: {
      // La Arepera: Premium activa (la pagó dos veces); la boutique: Básica.
      107: {
        membresia: { plan: 'premium', estado: 'activa', activaDesde: iso(ahora - 40 * DIA_MS), activaHasta: iso(ahora + 21 * DIA_MS), precioUsd: 14.99 },
        solicitud: null,
        pagos: [
          { id: 2, fecha: iso(ahora - 9 * DIA_MS), metodo: 'pago_movil', montoUsd: 14.99, montoBs: redondo(14.99 * 213.1), referencia: '004512', estado: 'aprobado', periodoDesde: iso(ahora - 9 * DIA_MS), periodoHasta: iso(ahora + 21 * DIA_MS) },
          { id: 1, fecha: iso(ahora - 40 * DIA_MS), metodo: 'debito', montoUsd: 14.99, montoBs: redondo(14.99 * 205.4), referencia: '771203', estado: 'aprobado', periodoDesde: iso(ahora - 40 * DIA_MS), periodoHasta: iso(ahora - 9 * DIA_MS) },
        ],
      },
      140: { membresia: null, solicitud: null, pagos: [] },
    },
    billetera: { disponibleBs: 18452.3, retenidoBs: 1204.5, liberaEn: iso(ahora + 9 * HORA_MS), retiroBloqueadoHasta: null },
    grupos: [
      { id: 401, companyId: 107, nombre: 'Arepas' }, { id: 402, companyId: 107, nombre: 'Bebidas' },
      { id: 403, companyId: 107, nombre: 'Postres' }, { id: 404, companyId: 107, nombre: 'Combos' },
      { id: 405, companyId: 107, nombre: 'Promociones' },
      { id: 410, companyId: 140, nombre: 'Vestidos' }, { id: 411, companyId: 140, nombre: 'Accesorios' },
    ],
    productos: [],
    pedidos: [],
    flotaPedidos: [],
    flotaMovimientos: [],
    flotaCortes: [],
    cotizaciones: new Map(),
    pagosFlota: new Map(),
    alisa: [],
    opiniones: [],
    vendedorVentas: [],
  };

  // Productos de la Arepera (107) y de la boutique (140).
  const P = (o) => Object.assign({
    descripcion: '', disponible: true, stock: 0, edad: 13, encargo: false, encargoDiasMin: null, encargoDiasMax: null,
    images: [], imageTitles: [], imagePrices: [], modifierGroups: [], borrado: false,
    cv: null,
  }, o);
  d.productos.push(
    P({ id: 9001, companyId: 107, grupoId: 401, nombre: 'Arepa reina pepiada', precio: 4.5, descripcion: 'Pollo, aguacate y mayonesa casera.', images: [foto('arepa-reina')], cv: { pct: 10, precioRedes: 4.2, activo: true, pausadoPorAdmin: false, subio: false },
      modifierGroups: [
        { id: 7001, name: 'Tipo de masa', type: 'single', required: true, maxSelect: 1, sortOrder: 0, options: [{ id: 7101, name: 'Maíz blanco', extraPrice: 0, image: null, sortOrder: 0 }, { id: 7102, name: 'Maíz amarillo', extraPrice: 0, image: null, sortOrder: 1 }] },
        { id: 7002, name: 'Extras', type: 'multiple', required: false, maxSelect: 3, sortOrder: 1, options: [{ id: 7103, name: 'Queso guayanés', extraPrice: 1.5, image: null, sortOrder: 0 }, { id: 7104, name: 'Tajadas', extraPrice: 1, image: null, sortOrder: 1 }, { id: 7105, name: 'Aguacate extra', extraPrice: 0.8, image: null, sortOrder: 2 }] },
      ] }),
    P({ id: 9002, companyId: 107, grupoId: 401, nombre: 'Arepa pabellón', precio: 5.5, descripcion: 'Carne mechada, caraotas, tajadas y queso.', images: [foto('arepa-pabellon')], cv: { pct: 10, precioRedes: 5.2, activo: true, pausadoPorAdmin: false, subio: false } }),
    P({ id: 9003, companyId: 107, grupoId: 401, nombre: 'Arepa dominó', precio: 3.8, descripcion: 'Caraotas negras y queso blanco rallado.', images: [foto('arepa-domino')], cv: { pct: 10, precioRedes: null, activo: true, pausadoPorAdmin: false, subio: false } }),
    P({ id: 9004, companyId: 107, grupoId: 401, nombre: 'Cachapa con queso de mano', precio: 6, descripcion: 'Maíz tierno con queso de mano.', images: [foto('cachapa')], disponible: false, cv: { pct: 8, precioRedes: null, activo: true, pausadoPorAdmin: true, subio: false } }),
    P({ id: 9005, companyId: 107, grupoId: 401, nombre: 'Tequeños (6 unidades)', precio: 4, descripcion: 'Con salsa de ajo.', images: [foto('tequenos')], stock: 25, cv: { pct: 12, precioRedes: 3.8, activo: true, pausadoPorAdmin: false, subio: true } }),
    P({ id: 9006, companyId: 107, grupoId: 401, nombre: 'Empanada de carne', precio: 1.8, images: [foto('empanada')] }),
    P({ id: 9007, companyId: 107, grupoId: 402, nombre: 'Papelón con limón', precio: 1.5, descripcion: 'Natural, con hielo.', images: [foto('papelon')], cv: { pct: 10, precioRedes: null, activo: true, pausadoPorAdmin: false, subio: false } }),
    P({ id: 9008, companyId: 107, grupoId: 402, nombre: 'Malta Polar', precio: 1.2, images: [foto('malta')], edad: 13 }),
    P({ id: 9009, companyId: 107, grupoId: 402, nombre: 'Jugo natural de parchita', precio: 2, images: [foto('jugo')],
      modifierGroups: [{ id: 7003, name: 'Tamaño', type: 'single', required: true, maxSelect: 1, sortOrder: 0, options: [{ id: 7106, name: 'Pequeño', extraPrice: 0, image: null, sortOrder: 0 }, { id: 7107, name: 'Grande', extraPrice: 1, image: null, sortOrder: 1 }] }] }),
    P({ id: 9010, companyId: 107, grupoId: 402, nombre: 'Café guayoyo', precio: 1, images: [foto('cafe')] }),
    P({ id: 9011, companyId: 107, grupoId: 403, nombre: 'Quesillo', precio: 2.5, images: [foto('quesillo')], stock: 8 }),
    P({ id: 9012, companyId: 107, grupoId: 403, nombre: 'Torta tres leches', precio: 3, images: [foto('tres-leches')], cv: { pct: 10, precioRedes: 2.8, activo: true, pausadoPorAdmin: false, subio: false } }),
    P({ id: 9013, companyId: 107, grupoId: 404, nombre: 'Combo familiar', precio: 18, descripcion: 'Arepas surtidas, tequeños y bebidas.',
      images: [foto('combo-2'), foto('combo-4'), foto('combo-6')], imageTitles: ['Para 2', 'Para 4', 'Para 6'], imagePrices: [10, 18, 25],
      cv: { pct: 10, precioRedes: 17, activo: true, pausadoPorAdmin: false, subio: false, preciosTalla: [{ titulo: 'Para 2', precioApp: 10, precioRedes: 9.5 }, { titulo: 'Para 4', precioApp: 18, precioRedes: 17 }, { titulo: 'Para 6', precioApp: 25, precioRedes: null }] } }),
    P({ id: 9021, companyId: 140, grupoId: 410, nombre: 'Vestido largo floreado', precio: 28, descripcion: 'Tela fresca, tallas S, M y L.', images: [foto('vestido')] }),
    P({ id: 9022, companyId: 140, grupoId: 411, nombre: 'Bolso de cuero', precio: 35, images: [foto('bolso')], encargo: true, encargoDiasMin: 7, encargoDiasMax: 12 }),
    P({ id: 9023, companyId: 140, grupoId: 411, nombre: 'Correa tejida', precio: 9, images: [] }),
  );

  // Pedidos de la Arepera: 75 días hacia atrás.
  const menu = d.productos.filter((p) => p.companyId === 107 && p.id !== 9013);
  const clientes = ['María G.', 'José R.', 'Carolina P.', 'Andrés M.', 'Valeria S.', 'Luis F.', 'Gabriela T.', 'Daniel C.', 'Paola H.', 'Ricardo L.'];
  const repartidores = [
    { nombre: 'Carlos Mendoza', telefono: '584125557788', foto: foto('repartidor-carlos') },
    { nombre: 'José Hernández', telefono: '584145552211', foto: foto('repartidor-jose') },
  ];
  d.repartidores = repartidores;
  let id = 2300;
  const promoDesde = Date.parse('2026-10-01T04:00:00Z');
  for (let dias = 75; dias >= 0; dias--) {
    const base = inicioDelDia(diaCaracas(ahora - dias * DIA_MS));
    const dow = new Date(base - CARACAS_MS).getUTCDay();
    const cuantos = 1 + Math.floor(azar() * (dow === 5 || dow === 6 ? 7 : 4));
    for (let k = 0; k < cuantos; k++) {
      const hora = azar() < 0.55 ? 11 + Math.floor(azar() * 4) : 18 + Math.floor(azar() * 4);
      const creado = base + hora * HORA_MS + Math.floor(azar() * 59) * 60000;
      if (creado > ahora - 50 * 60000) continue;
      const lineas = [];
      const n = 1 + Math.floor(azar() * 3);
      for (let j = 0; j < n; j++) {
        const p = menu[Math.floor(azar() * menu.length)];
        const cantidad = 1 + Math.floor(azar() * 2);
        const opciones = [];
        if (p.modifierGroups.length && azar() < 0.7) {
          const g = p.modifierGroups[0];
          const o = g.options[Math.floor(azar() * g.options.length)];
          opciones.push({ grupo: g.name, nombre: o.name, precioUsd: o.extraPrice });
        }
        const unit = p.precio + opciones.reduce((s, o) => s + o.precioUsd, 0);
        lineas.push({ productId: p.id, nombre: p.nombre, cantidad, precioUsd: redondo(unit), totalUsd: redondo(unit * cantidad), opciones, nota: azar() < 0.15 ? 'Sin cebolla, por favor' : '' });
      }
      const productosUsd = redondo(lineas.reduce((s, l) => s + l.totalUsd, 0));
      const envioUsd = redondo(1.5 + azar() * 1.5);
      const cancelado = azar() < 0.05;
      const canal = azar() < 0.12 ? 'vendedor' : azar() < 0.15 ? 'web' : 'app';
      const vendedorUsd = canal === 'vendedor' ? redondo(productosUsd * 0.1) : 0;
      const comision = 0.1;
      const planEntonces = creado >= ahora - 40 * DIA_MS ? 'premium' : 'basica';
      const cobroModo = canal !== 'app' ? 'por_producto' : 'porcentaje';
      const cobroUsd = cobroModo === 'por_producto' ? redondo(lineas.reduce((x, l) => x + cobroPorUnidad(l.precioUsd, planEntonces, false) * l.cantidad, 0)) : redondo(productosUsd * comision);
      const gananciaUsd = cancelado ? 0 : redondo(productosUsd - cobroUsd - vendedorUsd);
      id += 1;
      const rep = repartidores[Math.floor(azar() * repartidores.length)];
      d.pedidos.push({
        id, storeId: 31, creado, estado: cancelado ? 400 : 300, entregado: cancelado ? null : creado + (25 + Math.floor(azar() * 20)) * 60000,
        lineas, productosUsd, envioUsd, propinaUsd: azar() < 0.3 ? 1 : 0, cliente: clientes[Math.floor(azar() * clientes.length)],
        paraRecoger: azar() < 0.1, repartidor: rep, canal, vendedor: canal === 'vendedor' ? 12 + Math.floor(azar() * 3) : null,
        cupon: azar() < 0.08 ? { codigo: 'BIENVENIDO', descuentoUsd: 1, pagaLaTienda: 0 } : null,
        vendedorUsd, comision, cobroModo, cobroUsd, planComercio: planEntonces, gananciaUsd, abonado: !cancelado, motivo: cancelado ? 'El cliente canceló' : null,
        calificacion: !cancelado && azar() < 0.4 ? (azar() < 0.75 ? 5 : 4) : null, prueba: false,
      });
      if (canal === 'vendedor' && !cancelado && creado > ahora - 30 * DIA_MS) {
        d.vendedorVentas.push({ orderId: id, fecha: iso(creado), ventasUsd: productosUsd, comisionUsd: vendedorUsd, cuponUsd: azar() < 0.4 ? 0.5 : 0, vendedor: 'Promotor #' + (12 + Math.floor(azar() * 3)) });
      }
    }
  }
  // Los pedidos EN CURSO de la Arepera.
  const enCurso = (o) => Object.assign({
    storeId: 31, entregado: null, propinaUsd: 0, paraRecoger: false, repartidor: null, canal: 'app', vendedor: null, cupon: null,
    vendedorUsd: 0, comision: 0, abonado: false, motivo: null, calificacion: null, prueba: false,
  }, o);
  const linea = (pid, cantidad, opciones, nota) => {
    const p = d.productos.find((x) => x.id === pid);
    const unit = p.precio + (opciones || []).reduce((s, o) => s + o.precioUsd, 0);
    return { productId: pid, nombre: p.nombre, cantidad, precioUsd: redondo(unit), totalUsd: redondo(unit * cantidad), opciones: opciones || [], nota: nota || '' };
  };
  const nuevo = (o) => {
    o.productosUsd = redondo(o.lineas.reduce((s, l) => s + l.totalUsd, 0));
    o.envioUsd = o.paraRecoger ? 0 : 2;
    o.comision = 0.1;
    o.planComercio = 'premium';
    o.cobroModo = o.canal && o.canal !== 'app' ? 'por_producto' : 'porcentaje';
    o.cobroUsd = o.cobroModo === 'por_producto' ? redondo(o.lineas.reduce((x, l) => x + cobroPorUnidad(l.precioUsd, 'premium', false) * l.cantidad, 0)) : redondo(o.productosUsd * 0.1);
    o.gananciaUsd = redondo(o.productosUsd - o.cobroUsd - o.vendedorUsd - (o.cupon ? o.cupon.pagaLaTienda : 0));
    d.pedidos.push(enCurso(o));
  };
  nuevo({ id: 2601, creado: ahora - 3 * 60000, estado: 1, cliente: 'Mariana V.', lineas: [linea(9001, 2, [{ grupo: 'Tipo de masa', nombre: 'Maíz blanco', precioUsd: 0 }, { grupo: 'Extras', nombre: 'Queso guayanés', precioUsd: 1.5 }], 'Una sin mayonesa'), linea(9007, 2)], comision: 0, vendedorUsd: 0 });
  nuevo({ id: 2602, creado: ahora - 12 * 60000, estado: 1, cliente: 'Pedro A.', paraRecoger: true, lineas: [linea(9005, 1), linea(9008, 2)], comision: 0, vendedorUsd: 0, canal: 'web' });
  nuevo({ id: 2603, creado: ahora - 24 * 60000, estado: 100, cliente: 'Lucía B.', repartidor: repartidores[0], lineas: [linea(9002, 1), linea(9012, 1)], comision: 0, vendedorUsd: 0.86, canal: 'vendedor', vendedor: 12 });
  nuevo({ id: 2604, creado: ahora - 38 * 60000, estado: 101, cliente: 'Héctor D.', repartidor: repartidores[1], lineas: [linea(9013, 1)], comision: 0, vendedorUsd: 0, cupon: { codigo: 'ELBUDARE10', descuentoUsd: 1.8, pagaLaTienda: 1.8 } });
  // Una devolución que viene de vuelta (cancelado ya recogido).
  d.devoluciones = [{ orderId: 2589, estado: 'en_camino', pin: '4821', titulo: 'Arepa pabellón ×2', repartidor: 'José Hernández', devueltaEn: null }];
  d.pedidos.push(enCurso({ id: 2589, creado: ahora - 70 * 60000, estado: 400, cliente: 'Samuel K.', repartidor: repartidores[1], lineas: [linea(9002, 2)], productosUsd: 11, envioUsd: 2, gananciaUsd: 0, motivo: 'El cliente canceló' }));

  // La flota de la boutique (comercio de flota 22).
  const servicios = ['envío', 'envío', 'envío', 'contra viaje', 'contra efectivo'];
  const tienda58 = d.tiendas[1];
  let fid = 3100;
  for (let dias = 28; dias >= 0; dias--) {
    const base = inicioDelDia(diaCaracas(ahora - dias * DIA_MS));
    const n = azar() < 0.2 ? 0 : 1 + Math.floor(azar() * 3);
    for (let k = 0; k < n; k++) {
      const creado = base + (10 + Math.floor(azar() * 8)) * HORA_MS + Math.floor(azar() * 59) * 60000;
      if (creado > ahora - 3 * HORA_MS) continue;
      const destino = LUGARES[Math.floor(azar() * LUGARES.length)];
      const km = distanciaKm(tienda58, destino);
      const servicio = servicios[Math.floor(azar() * servicios.length)];
      const cobro = redondo(1.5 + Math.max(0, km - 3) * 0.4 + (servicio === 'contra efectivo' ? 0.5 : 0));
      fid += 1;
      d.flotaPedidos.push({
        orderId: fid, creado, servicio, estado: azar() < 0.06 ? 'Cancelado' : 'Entregado', cobroUsd: cobro,
        codigo: String(1000 + Math.floor(azar() * 8999)),
        a: { lat: tienda58.lat, lng: tienda58.lng, direccion: tienda58.direccion },
        b: { lat: destino.lat, lng: destino.lng, direccion: destino.nombre + ', ' + destino.direccion },
        recibe: { nombre: clientes[Math.floor(azar() * clientes.length)], telefono: '58414555' + String(1000 + Math.floor(azar() * 8999)) },
        nota: '', repartidor: repartidores[Math.floor(azar() * 2)].nombre, minutos: Math.round(8 + km * 3), distanciaKm: redondo(km),
      });
    }
  }
  // Uno en camino, con el repartidor moviéndose.
  const destinoVivo = LUGARES[1];
  d.flotaPedidos.push({
    orderId: 3199, creado: ahora - 14 * 60000, servicio: 'envío', estado: 'En camino', cobroUsd: 1.75, codigo: '5307',
    a: { lat: tienda58.lat, lng: tienda58.lng, direccion: tienda58.direccion },
    b: { lat: destinoVivo.lat, lng: destinoVivo.lng, direccion: destinoVivo.nombre + ', ' + destinoVivo.direccion },
    recibe: { nombre: 'Carolina P.', telefono: '584145551234' }, nota: 'Llamar al llegar', repartidor: 'Carlos Mendoza',
    minutos: 12, distanciaKm: redondo(distanciaKm(tienda58, destinoVivo)), vivo: true,
  });
  // El estado de cuenta: cargos por pedido entregado, pagos de los jueves y una membresía.
  let saldo = 0;
  const entregados = d.flotaPedidos.filter((p) => p.estado === 'Entregado').sort((a, b) => a.creado - b.creado);
  for (const p of entregados) {
    d.flotaMovimientos.push({ fecha: iso(p.creado + 30 * 60000), tipo: 'cargo', texto: 'Envío #' + p.orderId + ' · ' + p.servicio, montoUsd: -p.cobroUsd, orderId: p.orderId });
    saldo -= p.cobroUsd;
  }
  // Pagos que cubren lo de hace más de 7 días; queda la deuda de la semana.
  const corteHace = ahora - 7 * DIA_MS;
  const deuda = redondo(entregados.filter((p) => p.creado >= corteHace).reduce((s, p) => s + p.cobroUsd, 0));
  const pagado = redondo(-saldo - deuda);
  if (pagado > 0) {
    d.flotaMovimientos.push({ fecha: iso(corteHace - 2 * HORA_MS), tipo: 'pago', texto: 'Pago móvil · ref. 004512', montoUsd: redondo(pagado * 0.6) });
    d.flotaMovimientos.push({ fecha: iso(corteHace - 7 * DIA_MS), tipo: 'pago', texto: 'Transferencia · ref. 118733', montoUsd: redondo(pagado - redondo(pagado * 0.6)) });
  }
  d.flotaMovimientos.push({ fecha: iso(ahora - 20 * DIA_MS), tipo: 'penalidad', texto: 'Cancelación #3104 con el motorizado en camino', montoUsd: -1, orderId: 3104 });
  d.flotaMovimientos.push({ fecha: iso(ahora - 20 * DIA_MS + 60000), tipo: 'pago', texto: 'Pago móvil · ref. 000981', montoUsd: 1 });
  d.flotaMovimientos.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
  d.flota = {
    comercioId: 22, debeUsd: deuda || 12.23, comprometidoUsd: 1.75, venceEn: iso(proximoJueves(ahora)), pausado: false, bloqueado: false,
    contraEfectivo: true, exclusivo: false, modoCobro: 'semanal',
    plan: { texto: 'Pagas por envío: 1,50 $ hasta 3 km y 0,40 $ por km extra.', sinCargosHasta: null },
    diaPago: { texto: 'los jueves' }, // como la API de verdad (el pedazo de la frase de Alisa)
  };
  d.flotaCortes = [
    { id: 61, desde: diaCaracas(ahora - 14 * DIA_MS), hasta: diaCaracas(ahora - 8 * DIA_MS), totalUsd: redondo(pagado * 0.6), estado: 'pagado', venceEn: iso(corteHace), pagadoEn: iso(corteHace - 2 * HORA_MS) },
    { id: 60, desde: diaCaracas(ahora - 21 * DIA_MS), hasta: diaCaracas(ahora - 15 * DIA_MS), totalUsd: redondo(pagado - redondo(pagado * 0.6)), estado: 'pagado', venceEn: iso(corteHace - 7 * DIA_MS), pagadoEn: iso(corteHace - 7 * DIA_MS) },
  ];
  d.facturasFlota = [
    { numero: '00-001842', fecha: iso(corteHace - 2 * HORA_MS), totalBs: redondo(pagado * 0.6 * TASA), tipo: 'FLOTA', pdfUrl: 'https://www.deliservy.com/facturas-de-prueba/00-001842.pdf' },
    { numero: '00-001790', fecha: iso(corteHace - 7 * DIA_MS), totalBs: redondo((pagado - redondo(pagado * 0.6)) * TASA), tipo: 'FLOTA', pdfUrl: 'https://www.deliservy.com/facturas-de-prueba/00-001790.pdf' },
  ];
  d.facturas = [
    { numero: '00-001815', fecha: iso(Date.parse('2026-10-01T15:00:00Z')), totalBs: 4521.36, tipo: 'MANAGER', pdfUrl: 'https://www.deliservy.com/facturas-de-prueba/00-001815.pdf' },
    { numero: '00-001702', fecha: iso(Date.parse('2026-09-01T15:00:00Z')), totalBs: 3987.1, tipo: 'MANAGER', pdfUrl: 'https://www.deliservy.com/facturas-de-prueba/00-001702.pdf' },
    { numero: '00-001588', fecha: iso(Date.parse('2026-08-01T15:00:00Z')), totalBs: 3120.75, tipo: 'MANAGER', pdfUrl: 'https://www.deliservy.com/facturas-de-prueba/00-001588.pdf' },
  ].concat(d.facturasFlota);
  // La conversación con Alisa por el panel.
  d.alisa = [
    { de: 'comercio', texto: 'saldo', fecha: iso(ahora - 2 * DIA_MS) },
    { de: 'alisa', texto: 'Saldo: -' + usd(deuda || 12.23) + '. Vence el jueves. ¿Pago móvil o transferencia?', fecha: iso(ahora - 2 * DIA_MS + 4000) },
  ];
  // Opiniones de la Arepera.
  const opinion = (id, autor, estrellas, comentario, dias, respuesta, producto) => ({
    id, companyId: 107, autor, estrellas, comentario, fecha: iso(ahora - dias * DIA_MS), compraVerificada: true, propia: false,
    respuesta: respuesta ? { texto: respuesta, fecha: iso(ahora - (dias - 1) * DIA_MS), por: 'Arepera El Budare', estado: 'publicada' } : null,
    objetivo: producto ? 'producto' : 'tienda', producto: producto || undefined,
  });
  d.opiniones = [
    opinion(801, 'María G.', 5, 'Las arepas llegaron calienticas y la reina pepiada buenísima.', 1, null, { id: 9001, name: 'Arepa reina pepiada', image: foto('arepa-reina') }),
    opinion(802, 'José R.', 4, 'Muy rico todo, el delivery tardó un poquito.', 3, null),
    opinion(803, 'Carolina P.', 5, 'El combo familiar rinde muchísimo. Repetiré.', 5, '¡Gracias, Carolina! Te esperamos pronto.', { id: 9013, name: 'Combo familiar', image: foto('combo-4') }),
    opinion(804, 'Andrés M.', 3, 'Los tequeños estaban un poco fríos.', 8, 'Gracias por avisarnos, Andrés. Ya lo revisamos con cocina.'),
    opinion(805, 'Valeria S.', 5, 'Excelente atención.', 12, null),
    opinion(806, 'Luis F.', 5, 'El papelón con limón como el de la casa.', 15, '¡Qué bueno que te gustó!', { id: 9007, name: 'Papelón con limón', image: foto('papelon') }),
  ];
  // Los movimientos de la billetera (en Bs): ganancias de lo entregado, retiros y una penalidad.
  d.movimientos = [];
  let mid = 1;
  for (const p of d.pedidos.filter((x) => x.estado === 300).sort((a, b) => b.creado - a.creado).slice(0, 140)) {
    d.movimientos.push({ id: mid++, fecha: iso(p.entregado), tipo: 'ganancia', descripcion: 'Ganancia pedido #' + p.id + (p.vendedorUsd ? ' · promotor −' + usd(p.vendedorUsd) : ''), montoBs: redondo(p.gananciaUsd * TASA), orderId: p.id });
  }
  for (let semanas = 0; semanas < 10; semanas++) {
    d.movimientos.push({ id: mid++, fecha: iso(inicioDelDia(diaCaracas(ahora - (semanas * 7 + 1) * DIA_MS)) + 23 * HORA_MS), tipo: 'retiro', descripcion: 'Pago automático a tu cuenta (BNC)', montoBs: -redondo(12000 + azar() * 9000) });
  }
  d.movimientos.push({ id: mid++, fecha: iso(ahora - 6 * DIA_MS), tipo: 'penalidad', descripcion: 'Cancelaste el pedido #2511 (10 %)', montoBs: -redondo(0.6 * TASA), orderId: 2511 });
  d.movimientos.push({ id: mid++, fecha: iso(ahora - 2 * HORA_MS), tipo: 'retenido', descripcion: 'Tarjeta de crédito · pedido #2598 (se libera en 24 h)', montoBs: 1204.5, retenido: true, liberaEn: d.billetera.liberaEn, orderId: 2598 });
  d.movimientos.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
  return d;
}

// ── Sesión y permisos ────────────────────────────────────────────────────────

const PERMISOS = ['pedidos', 'pedidos_acciones', 'productos', 'estadisticas', 'flota_ver', 'flota_pedir'];

function quienEntra(telefono) {
  const t = telefonoNormal(telefono);
  if (!t) return null;
  for (const c of Object.values(D.cuentas)) if (c.telefono === t) return { userId: c.userId, rol: 'dueno', trabajadorId: null, telefono: t };
  for (const w of D.trabajadores) if (w.telefono === t && w.activo) return { userId: w.duenoUserId, rol: 'cajero', trabajadorId: w.id, telefono: t, versionSesion: w.versionSesion };
  // Un número autorizado de un comercio de flota entra como la cuenta dueña.
  if (t === '584125550160') return { userId: 501, rol: 'dueno', trabajadorId: null, telefono: t };
  return null;
}

function hash(t) { return crypto.createHash('sha256').update(t).digest('hex'); }

function sesionDe(req) {
  const m = /^Bearer\s+([A-Za-z0-9_-]{43})$/.exec(String(req.headers.authorization || ''));
  if (!m) return { error: 'Tu sesión terminó. Entra otra vez con tu WhatsApp.' };
  const s = D.sesiones.get(hash(m[1]));
  if (!s || s.cerrada) return { error: 'Tu sesión terminó. Entra otra vez con tu WhatsApp.' };
  if (s.venceEn < Date.now()) return { error: 'Tu sesión venció. Entra otra vez con tu WhatsApp.' };
  if (s.rol === 'cajero') {
    const w = D.trabajadores.find((x) => x.id === s.trabajadorId);
    if (!w || !w.activo || w.versionSesion !== s.versionSesion) return { error: 'Tu sesión se cerró. Entra otra vez con tu WhatsApp.' };
    s.permisos = w.permisos.slice();
  } else s.permisos = PERMISOS.slice();
  return { sesion: s };
}

function tiendasDeLaSesion(s) { return D.tiendas.filter((t) => t.userId === s.userId); }
function laTienda(s, storeId) { return tiendasDeLaSesion(s).find((t) => t.storeId === Number(storeId)) || null; }
function laEmpresa(s, companyId) { return tiendasDeLaSesion(s).find((t) => t.companyId === Number(companyId)) || null; }
function anotar(s, accion, entidad, entidadId, antes, despues) {
  D.bitacora.unshift({ userId: s.userId, trabajadorId: s.trabajadorId, accion, entidad, entidadId: String(entidadId ?? ''), antes, despues, creadoEn: iso(Date.now()) });
  D.bitacora.length = Math.min(D.bitacora.length, 200);
}

class Fallo extends Error { constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; } }
const noEncontrado = () => new Fallo(404, 'No encontrado.');
function exigir(s, permiso) { if (!s.permisos.includes(permiso)) throw new Fallo(403, 'No tienes permiso para esto.'); }
function soloDueno(s) { if (s.rol !== 'dueno') throw new Fallo(403, 'Solo el dueño de la tienda puede hacer esto.'); }

// ── Pedidos: vistas ──────────────────────────────────────────────────────────

function comandaDe(p) { return p.lineas.map((l) => l.cantidad + '× ' + l.nombre).join('\n'); }
function totalDe(p) { return redondo(p.productosUsd + p.envioUsd + p.propinaUsd - (p.cupon ? p.cupon.descuentoUsd : 0)); }
function resumen(p) {
  const t = D.tiendas.find((x) => x.storeId === p.storeId);
  return {
    id: p.id, creadoEn: iso(p.creado), estado: p.estado, totalUsd: totalDe(p),
    titulo: 'Nuevo pedido #' + p.id + ' · ' + usd(totalDe(p)) + ' · ' + (t ? t.nombre : ''),
    comanda: comandaDe(p), cliente: p.cliente, paraRecoger: p.paraRecoger,
    repartidor: p.repartidor ? p.repartidor.nombre : null, cartel: cartelDe(p),
  };
}
function cartelDe(p) {
  if (p.estado === 1 || p.estado === 50) return null; // como la API: el cartel solo va cuando ya hay repartidor
  if (p.estado === 100) return { titulo: (p.repartidor ? p.repartidor.nombre.split(' ')[0] : 'El repartidor') + ' llega en 6 min', linea: 'Ten el pedido listo', tono: 'bien', llegaA: iso(Date.now() + 6 * 60000) };
  if (p.estado === 101) return { titulo: 'En camino al cliente', linea: (p.repartidor ? p.repartidor.nombre.split(' ')[0] : 'El repartidor') + ' ya lo recogió', tono: 'bien' };
  if (p.estado === 400) return { titulo: 'Cancelado', linea: p.motivo || '', tono: 'mal' };
  return { titulo: 'Entregado', linea: '', tono: 'bien' };
}
/** Como `manager/request/near` (la entidad Order), para «en curso». */
function comoEntidad(p) {
  return {
    id: p.id, status: p.estado, createdAt: iso(p.creado), total: totalDe(p), subTotal: redondo(p.productosUsd + p.envioUsd),
    deliveryFee: p.envioUsd, isPickup: p.paraRecoger, user: { fullName: p.cliente },
    deliveryman: p.repartidor ? { fullName: p.repartidor.nombre, phone: p.repartidor.telefono, image: p.repartidor.foto } : null,
    products: p.lineas.map((l) => ({ name: l.nombre, quantity: l.cantidad, total: l.totalUsd, note: l.nota, selectedModifiers: l.opciones.map((o) => ({ groupName: o.grupo, name: o.nombre, price: o.precioUsd })) })),
    cartel: cartelDe(p), store: { id: p.storeId },
  };
}
function detalle(p) {
  const t = D.tiendas.find((x) => x.storeId === p.storeId);
  const comisionUsd = redondo(p.productosUsd * p.comision);
  const enCurso = p.estado >= 1 && p.estado < 200;
  const eventos = [{ fecha: iso(p.creado), texto: 'Pedido creado' }, { fecha: iso(p.creado + 20000), texto: 'Pago aprobado (pago móvil)' }];
  if (p.repartidor && p.estado >= 100) eventos.push({ fecha: iso(p.creado + 4 * 60000), texto: p.repartidor.nombre + ' lo aceptó' });
  if (p.estado >= 101 && p.estado !== 400) eventos.push({ fecha: iso(p.creado + 15 * 60000), texto: 'Recogido en la tienda' });
  if (p.estado >= 200 && p.estado < 400) eventos.push({ fecha: iso(p.entregado), texto: 'Entregado al cliente' });
  if (p.estado === 400) eventos.push({ fecha: iso(p.creado + 30 * 60000), texto: 'Cancelado: ' + (p.motivo || '') });
  const dev = D.devoluciones.find((x) => x.orderId === p.id);
  const porProducto = p.cobroModo === 'por_producto';
  const cobroUsd = p.cobroUsd != null ? p.cobroUsd : comisionUsd;
  const nombrePlan = { basica: 'Básica', premium: 'Premium', deluxe: 'Deluxe' }[p.planComercio || 'basica'];
  const detalleGanancia = [{ texto: 'Productos', usd: p.productosUsd },
    porProducto ? { texto: 'Deliservy por producto (' + nombrePlan + ')', usd: -cobroUsd } : { texto: 'Comisión de Deliservy (' + Math.round(p.comision * 100) + ' %)', usd: -cobroUsd }];
  if (p.cupon && p.cupon.pagaLaTienda) detalleGanancia.push({ texto: 'Cupón ' + p.cupon.codigo, usd: -p.cupon.pagaLaTienda });
  if (p.vendedorUsd) detalleGanancia.push({ texto: 'Promotor externo', usd: -p.vendedorUsd });
  const ganancia = p.estado === 400 ? 0 : redondo(p.productosUsd - cobroUsd - (p.cupon ? p.cupon.pagaLaTienda : 0) - p.vendedorUsd);
  return {
    id: p.id, storeId: p.storeId, tienda: t ? t.nombre : '', creadoEn: iso(p.creado), entregadoEn: p.entregado ? iso(p.entregado) : null,
    estado: p.estado, cartel: cartelDe(p), paraRecoger: p.paraRecoger,
    cliente: { nombre: p.cliente }, direccion: p.paraRecoger ? null : 'Urb. El Viñedo, calle 137, casa 45',
    productos: p.lineas.map((l) => ({ nombre: l.nombre, cantidad: l.cantidad, precioUsd: l.precioUsd, totalUsd: l.totalUsd, opciones: l.opciones, nota: l.nota })),
    productosUsd: p.productosUsd, envioUsd: p.envioUsd, propinaUsd: p.propinaUsd, totalUsd: totalDe(p),
    datosFactura: { nombre: 'Deliservyapp, C.A.', identificacion: { rotulo: 'RIF', valor: 'J-504754129' }, telefono: '0426-5201529', direccion: 'Av. principal, C.C. Cristal, nivel terraza, local T-26, Urb. Las Quintas, Naguanagua, Carabobo' },
    repartidor: p.repartidor ? { nombre: p.repartidor.nombre, foto: p.repartidor.foto, telefono: enCurso ? telefonoParaVer(p.repartidor.telefono) : null } : null,
    eventos: eventos.reverse(),
    devolucion: dev ? { codigo: dev.pin, estado: dev.estado } : null,
    canal: p.canal, canalTexto: p.canal === 'vendedor' ? 'Promotor #' + p.vendedor : p.canal === 'web' ? 'Tienda web' : 'App',
    cupon: p.cupon ? { codigo: p.cupon.codigo, descuentoUsd: p.cupon.descuentoUsd, pagaLaTiendaUsd: p.cupon.pagaLaTienda } : null,
    ganancia: { usd: ganancia, bs: p.abonado ? redondo(ganancia * TASA) : null, abonada: !!p.abonado, detalle: detalleGanancia },
    cobro: {
      modo: porProducto ? 'por_producto' : 'porcentaje', usd: cobroUsd, plan: p.planComercio || 'basica', pct: porProducto ? null : Math.round(p.comision * 100),
      lineas: porProducto ? p.lineas.map((l) => ({ nombre: l.nombre, cantidad: l.cantidad, porUnidadUsd: cobroPorUnidad(l.precioUsd, p.planComercio || 'basica', false), totalUsd: redondo(cobroPorUnidad(l.precioUsd, p.planComercio || 'basica', false) * l.cantidad) })) : [],
    },
    tieneRepartidorEnVivo: p.estado >= 100 && p.estado < 200 && !!p.repartidor,
    destino: p.paraRecoger ? null : { lat: 10.2121, lng: -68.0110 },
    tiendaUbicacion: t ? { lat: t.lat, lng: t.lng } : null,
  };
}
function pedidoDeLaSesion(s, id) {
  const p = D.pedidos.find((x) => x.id === Number(id));
  if (!p || !laTienda(s, p.storeId)) throw noEncontrado();
  return p;
}
/** Una posición que se mueve sola, entre la tienda y el cliente. */
function posicionViva(desde, hasta, periodoS, desfase) {
  const f = ((Date.now() / 1000 + (desfase || 0)) % periodoS) / periodoS;
  const t = f < 0.5 ? f * 2 : 2 - f * 2;
  const lat = desde.lat + (hasta.lat - desde.lat) * t + Math.sin(t * Math.PI) * 0.002;
  const lng = desde.lng + (hasta.lng - desde.lng) * t;
  const rumbo = Math.round((Math.atan2(hasta.lng - desde.lng, hasta.lat - desde.lat) * 180) / Math.PI + (f < 0.5 ? 0 : 180) + 360) % 360;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), rumbo, enviadoEn: iso(Date.now() - 3000) };
}

// ── Rangos de fechas ─────────────────────────────────────────────────────────

function rango(q, maxDias) {
  const hoy = diaCaracas(Date.now());
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(q.desde || '') ? q.desde : hoy;
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(q.hasta || '') ? q.hasta : hoy;
  if (desde > hasta) throw new Fallo(400, 'La fecha de inicio va antes de la final.');
  const dias = (Date.parse(hasta) - Date.parse(desde)) / DIA_MS + 1;
  if (maxDias && dias > maxDias) throw new Fallo(400, 'El rango máximo es de ' + maxDias + ' días.');
  return { desde, hasta, ini: inicioDelDia(desde), fin: inicioDelDia(hasta) + DIA_MS };
}
function lunesDe(dia) {
  const ms = Date.parse(dia + 'T00:00:00Z');
  const dow = new Date(ms).getUTCDay();
  return new Date(ms - ((dow + 6) % 7) * DIA_MS).toISOString().slice(0, 10);
}

// ── CSV como Excel en español ────────────────────────────────────────────────

function csv(filas) {
  const celda = (v) => {
    let t = typeof v === 'number' ? String(redondo(v)).replace('.', ',') : String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(t) && typeof v !== 'number') t = "'" + t;
    return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  };
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n';
}

// ── Multipart (las fotos) ────────────────────────────────────────────────────

function partes(cuerpo, tipo) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(tipo || '');
  if (!m) return null;
  const limite = Buffer.from('--' + (m[1] || m[2]));
  const out = {};
  let i = cuerpo.indexOf(limite);
  while (i >= 0) {
    const ini = i + limite.length;
    if (cuerpo.slice(ini, ini + 2).toString() === '--') break;
    const finCab = cuerpo.indexOf('\r\n\r\n', ini);
    if (finCab < 0) break;
    const cab = cuerpo.slice(ini + 2, finCab).toString();
    const sig = cuerpo.indexOf(limite, finCab);
    if (sig < 0) break;
    const datos = cuerpo.slice(finCab + 4, sig - 2);
    const nombre = /name="([^"]+)"/i.exec(cab);
    const archivo = /filename="([^"]*)"/i.exec(cab);
    const tipoParte = /content-type:\s*([^\r\n]+)/i.exec(cab);
    if (nombre) out[nombre[1]] = archivo ? { archivo: archivo[1], tipo: tipoParte ? tipoParte[1].trim() : '', datos } : datos.toString();
    i = sig;
  }
  return out;
}
/** Ancho y alto de un JPEG (el marcador SOF). */
function medidasJpeg(b) {
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const marca = b[i + 1];
    if (marca >= 0xC0 && marca <= 0xCF && marca !== 0xC4 && marca !== 0xC8 && marca !== 0xCC) {
      return { alto: b.readUInt16BE(i + 5), ancho: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
const MAX_FOTO = { producto: 2000, logo: 1200, banner: 1200, marcador: 1200, opcion: 400 };

// ── Flota: cotizar y Alisa ───────────────────────────────────────────────────

function precioFlota(tipo, km) {
  let p = 1.5 + Math.max(0, km - 3) * 0.4;
  if (tipo === 'contra_viaje') p += 1;
  if (tipo === 'contra_efectivo') p += 0.5;
  if (tipo === 'exclusivo') p = p * 1.6 + 1;
  return redondo(p);
}
function rutaEntre(a, b) {
  // Una ruta inventada con dos quiebres (como calles), para dibujarla.
  const m1 = { lat: a.lat, lng: a.lng + (b.lng - a.lng) * 0.55 };
  const m2 = { lat: a.lat + (b.lat - a.lat) * 0.7, lng: m1.lng };
  return [[a.lng, a.lat], [m1.lng, m1.lat], [m2.lng, m2.lat], [b.lng, b.lat]];
}
function nuevaCotizacion(t, tipo, a, b, extra) {
  const km = distanciaKm(a, b);
  if (km > 25) throw new Fallo(409, 'Esa dirección queda fuera de nuestra zona (más de 25 km).');
  const id = ++D.siguienteId;
  const c = {
    cotizacionId: id, tipo, precioUsd: precioFlota(tipo, km), sinCargosHasta: null, minutos: Math.round(8 + km * 3),
    distanciaKm: redondo(km), a, b, venceEn: iso(Date.now() + 15 * 60000), ruta: rutaEntre(a, b),
    recibe: (extra && extra.recibe) || null, nota: (extra && extra.nota) || '', storeId: t.storeId,
  };
  D.cotizaciones.set(id, c);
  return c;
}
function pedirFlota(s, c) {
  if (c.usada) throw new Fallo(409, 'Esa cotización ya se usó.');
  if (Date.parse(c.venceEn) < Date.now()) throw new Fallo(409, 'La cotización venció. Cotiza otra vez.');
  c.usada = true;
  const orderId = 3200 + D.flotaPedidos.length;
  const codigo = String(1000 + Math.floor(Math.random() * 8999));
  const servicio = { envio: 'envío', contra_viaje: 'contra viaje', contra_efectivo: 'contra efectivo', exclusivo: 'exclusivo' }[c.tipo] || 'envío';
  D.flotaPedidos.push({
    orderId, creado: Date.now(), servicio, estado: 'Buscando motorizado', cobroUsd: c.precioUsd, codigo, a: c.a, b: c.b,
    recibe: c.recibe || { nombre: '', telefono: '' }, nota: c.nota, repartidor: null, minutos: c.minutos, distanciaKm: c.distanciaKm,
  });
  D.flota.comprometidoUsd = redondo(D.flota.comprometidoUsd + (c.precioUsd || 0));
  anotar(s, 'flota_pedir', 'pedido', orderId, null, { cotizacionId: c.cotizacionId });
  return { orderId, codigo, mensaje: 'Listo: orden #' + orderId + '. Código para quien recibe: ' + codigo + '.' };
}
function atenderAlisa(s, t, texto, ubicacion) {
  const limpio = sinTildes(texto).trim();
  const a = { lat: t.lat, lng: t.lng, direccion: t.direccion };
  const pendiente = [...D.cotizaciones.values()].reverse().find((c) => c.deAlisa && !c.usada && !c.cancelada && Date.parse(c.venceEn) > Date.now());
  if (/^(si|sí|dale|ok|pidelo|listo)\b/.test(limpio) && pendiente) {
    const r = pedirFlota(s, pendiente);
    return { respuesta: 'Listo: orden #' + r.orderId + '. Código para quien recibe: ' + r.codigo + '. Te aviso cuando un motorizado lo tome.', orderId: r.orderId };
  }
  if (/^(no|cancelar|cancela)\b/.test(limpio)) {
    if (pendiente) pendiente.cancelada = true;
    return { respuesta: pendiente ? 'Listo, no lo pido.' : 'No tienes nada por confirmar.' };
  }
  if (/\bsaldo\b/.test(limpio)) return { respuesta: 'Saldo: -' + usd(D.flota.debeUsd) + '. Vence el jueves. ¿Pago móvil o transferencia?' };
  if (/\bpagar\b/.test(limpio)) return { respuesta: 'Para pagar desde aquí, toca «Pagar» arriba. Por WhatsApp también puedes escribir «pagar».' };
  let b = null;
  if (ubicacion && isFinite(ubicacion.lat) && isFinite(ubicacion.lng)) b = { lat: Number(ubicacion.lat), lng: Number(ubicacion.lng), direccion: lugarCercano(ubicacion.lat, ubicacion.lng) };
  else {
    const cuerpo = limpio.replace(/^(un |una )?(motorizado|moto|envio|delivery|domicilio)\s*(a|para|hasta)?\s*/, '');
    const lugar = buscarLugares(cuerpo)[0] || LUGARES.find((l) => cuerpo.length > 3 && sinTildes(l.nombre).includes(cuerpo));
    if (lugar) b = { lat: lugar.lat, lng: lugar.lng, direccion: lugar.nombre + ', ' + lugar.direccion };
    else if (/motorizado|envio|moto|llevar/.test(limpio)) return { respuesta: 'No encontré esa dirección. Escríbela con el sector o márcala en el mapa.' };
  }
  if (!b) return { respuesta: 'Hola. Dime a dónde lo llevamos, por ejemplo: un motorizado a Av. Bolívar Norte.' };
  const c = nuevaCotizacion(t, 'envio', a, b, {});
  c.deAlisa = true;
  return {
    respuesta: 'Envío a ' + b.direccion + ' (' + String(c.distanciaKm).replace('.', ',') + ' km): ' + usd(c.precioUsd) + ' · ' + c.minutos + ' min. ¿Lo pido?',
    cotizacion: { id: c.cotizacionId, a: c.a, b: c.b, precioUsd: c.precioUsd, minutos: c.minutos, distanciaKm: c.distanciaKm, ruta: c.ruta },
  };
}

// ── Estadísticas ─────────────────────────────────────────────────────────────

function estadisticas(t, q) {
  const r = rango(q, 400);
  const agrupar = ['dia', 'semana', 'mes'].includes(q.agrupar) ? q.agrupar : 'dia';
  const entregados = D.pedidos.filter((p) => p.storeId === t.storeId && p.estado >= 200 && p.estado < 400 && !p.prueba && p.creado >= r.ini && p.creado < r.fin);
  const serie = new Map();
  // Todos los periodos del rango, aunque estén en 0.
  for (let ms = r.ini; ms < r.fin; ms += DIA_MS) {
    const dia = diaCaracas(ms);
    const k = agrupar === 'dia' ? dia : agrupar === 'semana' ? lunesDe(dia) : dia.slice(0, 7);
    if (!serie.has(k)) serie.set(k, { periodo: k, pedidos: 0, ventasUsd: 0, gananciaUsd: 0 });
  }
  const top = new Map();
  const horas = Array.from({ length: 24 }, (_, h) => ({ hora: h, pedidos: 0 }));
  let ventas = 0;
  for (const p of entregados) {
    const dia = diaCaracas(p.creado);
    const k = agrupar === 'dia' ? dia : agrupar === 'semana' ? lunesDe(dia) : dia.slice(0, 7);
    const s = serie.get(k);
    if (s) { s.pedidos++; s.ventasUsd = redondo(s.ventasUsd + p.productosUsd); s.gananciaUsd = redondo(s.gananciaUsd + p.gananciaUsd); }
    ventas += p.productosUsd;
    horas[horaCaracas(p.creado)].pedidos++;
    for (const l of p.lineas) {
      const x = top.get(l.productId) || { productId: l.productId, nombre: l.nombre, unidades: 0, ventasUsd: 0 };
      x.unidades += l.cantidad; x.ventasUsd = redondo(x.ventasUsd + l.totalUsd);
      top.set(l.productId, x);
    }
  }
  const calificados = D.pedidos.filter((p) => p.storeId === t.storeId && p.calificacion);
  const promedio = calificados.length ? Math.round((calificados.reduce((s, p) => s + p.calificacion, 0) / calificados.length) * 10) / 10 : null;
  const canceladas = D.pedidos.filter((p) => p.storeId === t.storeId && p.estado === 400).sort((a, b) => b.creado - a.creado);
  const ops = D.opiniones.filter((o) => o.companyId === t.companyId);
  return {
    serie: [...serie.values()], top: [...top.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 8),
    ticketPromedioUsd: entregados.length ? redondo(ventas / entregados.length) : 0, horas,
    calificaciones: {
      rating: promedio, ratingCount: calificados.length, ratingRepartidores: calificados.length ? 4.8 : null, ratingRepartidoresCount: Math.round(calificados.length * 0.6),
      calificaciones: calificados.sort((a, b) => b.creado - a.creado).slice(0, 8).map((p) => ({ orderId: p.id, estrellas: p.calificacion, de: 'cliente', nombre: p.cliente, fecha: iso(p.entregado || p.creado) })),
    },
    cancelaciones: {
      hechas: { ultimos7Dias: 0, total: 1, vuelveACeroEl: null, lista: [{ orderId: 2511, fecha: iso(Date.now() - 6 * DIA_MS), motivo: 'No tenemos el producto', quien: 'comercio' }] },
      recibidas: { ultimos7Dias: canceladas.filter((p) => p.creado > Date.now() - 7 * DIA_MS).length, total: canceladas.length, vuelveACeroEl: null, lista: canceladas.slice(0, 6).map((p) => ({ orderId: p.id, fecha: iso(p.creado), motivo: p.motivo || 'El cliente canceló', nombre: p.cliente })) },
    },
    opiniones: { promedio: ops.length ? Math.round((ops.reduce((s, o) => s + o.estrellas, 0) / ops.length) * 10) / 10 : null, n: ops.length, sinResponder: ops.filter((o) => !o.respuesta).length },
  };
}

// ── Las rutas ────────────────────────────────────────────────────────────────

function leerCuerpo(req) {
  return new Promise((ok, mal) => {
    const trozos = [];
    let n = 0;
    req.on('data', (c) => { n += c.length; if (n > 12 * 1024 * 1024) { mal(new Fallo(413, 'El archivo pesa más de 10 MB.')); req.destroy(); } else trozos.push(c); });
    req.on('end', () => ok(Buffer.concat(trozos)));
    req.on('error', mal);
  });
}
function json(cuerpo) { try { return cuerpo.length ? JSON.parse(cuerpo.toString('utf8')) : {}; } catch (_) { throw new Fallo(400, 'El cuerpo no es JSON.'); } }

function contratoDe(s) {
  if (!PEDIR_FIRMA) return null;
  const t = tiendasDeLaSesion(s).find((x) => (x.authorized === 1 || x.authorized === 3) && !D.firmadas[x.companyId]);
  if (!t) return null;
  const rif = String(t.rif || '');
  const w = s.trabajadorId ? D.trabajadores.find((x) => x.id === s.trabajadorId) : null;
  return {
    falta: true, puedeFirmar: s.rol === 'dueno', companyId: t.companyId, tienda: t.nombre,
    nombre: w ? w.nombre : D.cuentas[s.userId].nombre, razonSocial: t.nombre, correo: t.correo || '',
    tipoDocumento: /^[VEJGP]/.test(rif) ? rif[0] : 'J', numero: rif.slice(1),
  };
}

async function api(req, res, url) {
  const ruta = url.pathname.replace(/^\/api\/comercio\/?/, '');
  const q = Object.fromEntries(url.searchParams.entries());
  const metodo = req.method;
  const crudo = await leerCuerpo(req);
  const esMultipart = /multipart\/form-data/i.test(req.headers['content-type'] || '');
  const body = esMultipart ? null : json(crudo);
  const ahora = Date.now();

  // Sin sesión: pedir el código y entrar.
  if (metodo === 'POST' && ruta === 'codigo') {
    const t = telefonoNormal(body.telefono);
    if (!t) throw new Fallo(400, 'Escribe un número de WhatsApp válido.');
    const lista = (D.frenos.get(t) || []).filter((x) => x > ahora - 10 * 60000);
    if (lista.length >= 3) throw new Fallo(429, 'Pediste muchos códigos. Espera unos minutos y vuelve a intentarlo.');
    lista.push(ahora); D.frenos.set(t, lista);
    if (!quienEntra(t)) throw new Fallo(404, 'Ese número no tiene una tienda en Deliservy. Escríbenos al 0414-495-7006.');
    D.codigos.set(t, { codigo: CODIGO, intentos: 0 });
    return { ok: true, mensaje: 'Te enviamos un código por WhatsApp.' };
  }
  if (metodo === 'POST' && ruta === 'entrar') {
    const t = telefonoNormal(body.telefono);
    const c = t && D.codigos.get(t);
    if (!c) throw new Fallo(400, 'Pide un código primero.');
    if (++c.intentos > 5) throw new Fallo(429, 'Demasiados intentos. Espera unos minutos y pide un código nuevo.');
    if (String(body.codigo) !== c.codigo) throw new Fallo(400, 'Ese código no es correcto o ya venció.');
    const quien = quienEntra(t);
    if (!quien) throw new Fallo(404, 'Ese número no tiene una tienda en Deliservy. Escríbenos al 0414-495-7006.');
    D.codigos.delete(t);
    const token = crypto.randomBytes(32).toString('base64url');
    const venceEn = ahora + 30 * DIA_MS;
    D.sesiones.set(hash(token), Object.assign({}, quien, { venceEn, cerrada: false }));
    const w = quien.trabajadorId ? D.trabajadores.find((x) => x.id === quien.trabajadorId) : null;
    return { token, venceEn: iso(venceEn), cuenta: { nombre: w ? w.nombre : D.cuentas[quien.userId].nombre, rol: quien.rol, permisos: w ? w.permisos : PERMISOS } };
  }

  const r = sesionDe(req);
  if (r.error) throw new Fallo(401, r.error);
  const s = r.sesion;
  const partesRuta = ruta.split('/');

  if (metodo === 'POST' && ruta === 'salir') {
    s.cerrada = true;
    return { ok: true };
  }

  // ── Cuenta y hoy ──
  if (metodo === 'GET' && ruta === 'yo') {
    const w = s.trabajadorId ? D.trabajadores.find((x) => x.id === s.trabajadorId) : null;
    return {
      cuenta: { nombre: w ? w.nombre : D.cuentas[s.userId].nombre, telefonoParaVer: telefonoParaVer(s.telefono), rol: s.rol, permisos: s.permisos },
      tiendas: tiendasDeLaSesion(s).map((t) => ({
        storeId: t.storeId, companyId: t.companyId, nombre: t.nombre, logo: t.logo, tipo: t.tipo,
        visibleEnApp: t.authorized === 1, soloFlota: t.authorized === 3, afiliada: t.authorized === 0 || t.authorized === 1 || t.authorized === 3,
        comisionPct: t.comisionPct, comisionPromo: t.comisionPromo, cobroPorProducto: !!t.cobroPorProducto,
        flota: t.flota,
      })),
      avisos: s.rol === 'dueno' ? ['Nuevo: en la tienda web y con promotores, Deliservy cobra por producto.'] : [],
      contrato: contratoDe(s),
    };
  }
  if (metodo === 'POST' && ruta === 'contrato') {
    if (s.rol !== 'dueno') throw new Fallo(403, 'Solo el dueño de la tienda puede firmar el contrato.');
    const t = tiendasDeLaSesion(s).find((x) => x.companyId === Number(body.companyId));
    if (!t) throw new Fallo(400, 'Este comercio no está aprobado para firmar.');
    if (!body.nombre || String(body.nombre).trim().length < 2) throw new Fallo(400, 'Escribe tu nombre y apellido.');
    if (!String(body.firma || '').startsWith('data:image/png;base64,')) throw new Fallo(400, 'Firma en el recuadro.');
    D.firmadas[t.companyId] = true;
    D.bitacora.unshift({ accion: 'firmar-contrato', companyId: t.companyId, correo: body.correo, copia: 'deliservyapp@gmail.com' });
    return { ok: true, correo: true };
  }

  if (metodo === 'GET' && ruta === 'hoy') {
    const t = laTienda(s, q.storeId);
    if (!t) throw noEncontrado();
    const hoy = diaCaracas(ahora);
    const deHoy = D.pedidos.filter((p) => p.storeId === t.storeId && diaCaracas(p.creado) === hoy && p.estado >= 200 && p.estado < 400);
    const verPedidos = s.permisos.includes('pedidos');
    return {
      pedidosEnCurso: verPedidos ? D.pedidos.filter((p) => p.storeId === t.storeId && p.estado >= 1 && p.estado < 200).sort((a, b) => b.creado - a.creado).map(resumen) : [],
      ventasHoy: { pedidos: deHoy.length, ventasUsd: redondo(deHoy.reduce((x, p) => x + p.productosUsd, 0)), gananciaUsd: redondo(deHoy.reduce((x, p) => x + p.gananciaUsd, 0)) },
      saldo: s.rol === 'dueno' && t.authorized !== 3 ? { disponibleBs: D.billetera.disponibleBs, retenidoBs: D.billetera.retenidoBs, liberaEn: D.billetera.liberaEn } : null,
      flota: t.flota && s.permisos.includes('flota_ver') ? { debeUsd: D.flota.debeUsd, venceEn: D.flota.venceEn, pausado: D.flota.pausado } : null,
    };
  }

  // ── Pedidos ──
  if (partesRuta[0] === 'pedidos') {
    exigir(s, 'pedidos');
    if (metodo === 'GET' && ruta === 'pedidos/nuevos') {
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      const desde = Date.parse(q.desde || '') || ahora;
      return { pedidos: D.pedidos.filter((p) => p.storeId === t.storeId && p.estado === 1 && p.creado > desde).map((p) => ({ id: p.id, creadoEn: iso(p.creado), estado: p.estado, totalUsd: totalDe(p), titulo: resumen(p).titulo, comanda: comandaDe(p) })), ahora: iso(ahora) };
    }
    if (metodo === 'GET' && ruta === 'pedidos/en-curso') {
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      return {
        requests: D.pedidos.filter((p) => p.storeId === t.storeId && p.estado >= 1 && p.estado < 200).sort((a, b) => b.creado - a.creado).map(comoEntidad),
        devoluciones: D.devoluciones.filter((x) => D.pedidos.some((p) => p.id === x.orderId && p.storeId === t.storeId)),
      };
    }
    if (metodo === 'GET' && ruta === 'pedidos/calendario') {
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      const mes = /^\d{4}-\d{2}$/.test(q.mes || '') ? q.mes : diaCaracas(ahora).slice(0, 7);
      const dias = new Map();
      for (const p of D.pedidos) {
        if (p.storeId !== t.storeId || p.estado < 200 || p.estado >= 400) continue;
        const dia = diaCaracas(p.creado);
        if (dia.slice(0, 7) !== mes) continue;
        const x = dias.get(dia) || { fecha: dia, pedidos: 0, ventasUsd: 0 };
        x.pedidos++; x.ventasUsd = redondo(x.ventasUsd + p.productosUsd);
        dias.set(dia, x);
      }
      return { dias: [...dias.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)) };
    }
    if (metodo === 'GET' && ruta === 'pedidos/exportar') {
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      const rr = rango(q, 92);
      const filas = [['Pedido', 'Fecha', 'Hora', 'Estado', 'Productos', 'Total ($)', 'Tu ganancia ($)', 'Canal']];
      for (const p of D.pedidos.filter((x) => x.storeId === t.storeId && x.estado >= 200 && x.creado >= rr.ini && x.creado < rr.fin).sort((a, b) => a.creado - b.creado)) {
        const c = new Date(p.creado + CARACAS_MS).toISOString();
        filas.push([p.id, c.slice(0, 10), c.slice(11, 16), p.estado === 400 ? 'Cancelado' : 'Entregado', comandaDe(p).replace(/\n/g, ' · '), totalDe(p), p.gananciaUsd, p.canal === 'vendedor' ? 'Promotor #' + p.vendedor : p.canal]);
      }
      return { __archivo: csv(filas), __nombre: 'pedidos-' + rr.desde + '-a-' + rr.hasta + '.csv' };
    }
    if (metodo === 'GET' && ruta === 'pedidos') {
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      const rr = rango(q, 92);
      const estado = ['entregado', 'cancelado', 'todos'].includes(q.estado) ? q.estado : 'todos';
      const lista = D.pedidos.filter((p) => p.storeId === t.storeId && p.estado >= 200 && !p.prueba && p.creado >= rr.ini && p.creado < rr.fin
        && (estado === 'todos' || (estado === 'entregado' ? p.estado < 400 : p.estado === 400))).sort((a, b) => b.creado - a.creado);
      const pagina = Math.max(1, Number(q.pagina) || 1);
      const ent = lista.filter((p) => p.estado < 400);
      return {
        pedidos: lista.slice((pagina - 1) * 50, pagina * 50).map((p) => ({ id: p.id, creadoEn: iso(p.creado), entregadoEn: p.entregado ? iso(p.entregado) : null, estado: p.estado, totalUsd: totalDe(p), gananciaUsd: p.gananciaUsd, comanda: comandaDe(p), cliente: p.cliente, canal: p.canal, canalTexto: p.canal === 'vendedor' ? 'Promotor #' + p.vendedor : null, paraRecoger: p.paraRecoger })),
        totales: { pedidos: ent.length, cancelados: lista.length - ent.length, ventasUsd: redondo(ent.reduce((x, p) => x + p.productosUsd, 0)), gananciaUsd: redondo(ent.reduce((x, p) => x + p.gananciaUsd, 0)) },
        pagina, porPagina: 50, total: lista.length, hayMas: pagina * 50 < lista.length,
      };
    }
    const m = /^pedidos\/(\d+)(?:\/(listo|cancelar|repartidor))?$/.exec(ruta);
    if (m) {
      const p = pedidoDeLaSesion(s, m[1]);
      if (!m[2] && metodo === 'GET') return detalle(p);
      if (m[2] === 'repartidor' && metodo === 'GET') {
        if (!(p.estado >= 100 && p.estado < 200) || !p.repartidor) throw noEncontrado();
        const t = D.tiendas.find((x) => x.storeId === p.storeId);
        return posicionViva(t, { lat: 10.2121, lng: -68.0110 }, 240, p.id);
      }
      if (m[2] === 'listo' && metodo === 'POST') {
        exigir(s, 'pedidos_acciones');
        if (!p.paraRecoger || p.estado !== 1) return { ok: false };
        p.estado = 100;
        anotar(s, 'pedido_listo', 'pedido', p.id, { estado: 1 }, { estado: 100 });
        return { ok: true };
      }
      if (m[2] === 'cancelar' && metodo === 'GET') {
        exigir(s, 'pedidos_acciones');
        const base = { orderId: p.id, estado: p.estado, esPrueba: false, esFlota: false };
        if (p.estado === 101) return Object.assign(base, { puedeCancelar: false, razon: 'El repartidor ya recogió el pedido. Para cancelarlo, escríbele a soporte.', motivos: [] });
        if (p.estado >= 200) return Object.assign(base, { puedeCancelar: false, razon: p.estado === 400 ? 'Ese pedido ya estaba cancelado.' : 'Ese pedido ya se entregó.', motivos: [] });
        const baseUsd = redondo(totalDe(p) - p.propinaUsd);
        const penalidadUsd = redondo(baseUsd * 0.1);
        return Object.assign(base, {
          puedeCancelar: true, porcentaje: 10, baseUsd, penalidadUsd,
          aviso: 'Al cliente se le devuelve lo que pagó y a tu tienda se le descuenta el 10 % del pedido (' + usd(penalidadUsd) + ').',
          motivos: [{ codigo: 'cliente_cancelo', etiqueta: 'El cliente canceló' }, { codigo: 'sin_producto', etiqueta: 'No tenemos el producto' }, { codigo: 'otro', etiqueta: 'Otro' }],
        });
      }
      if (m[2] === 'cancelar' && metodo === 'POST') {
        exigir(s, 'pedidos_acciones');
        if (p.estado === 101) throw new Fallo(409, 'El repartidor ya recogió el pedido. Para cancelarlo, escríbele a soporte.');
        if (p.estado >= 200) throw new Fallo(409, 'Ese pedido ya se entregó.');
        if (!['cliente_cancelo', 'sin_producto', 'otro'].includes(body.motivo)) throw new Fallo(400, 'Elige un motivo.');
        const antes = p.estado;
        p.estado = 400; p.motivo = { cliente_cancelo: 'El cliente canceló', sin_producto: 'No tenemos el producto', otro: 'Otro' }[body.motivo];
        const penalidadBs = redondo(redondo(totalDe(p) * 0.1) * TASA);
        D.billetera.disponibleBs = redondo(D.billetera.disponibleBs - penalidadBs);
        anotar(s, 'pedido_cancelar', 'pedido', p.id, { estado: antes }, { estado: 400, motivo: body.motivo, detalle: body.detalle || null });
        return { ok: true, orderId: p.id, status: 400, penalidadBs, texto: 'Pedido #' + p.id + ' cancelado. A tu tienda se le descontó el 10 % (' + bs(penalidadBs) + ').' };
      }
    }
    throw noEncontrado();
  }

  // ── Productos y grupos ──
  if (partesRuta[0] === 'productos' || partesRuta[0] === 'grupos-opciones' || partesRuta[0] === 'opciones' || partesRuta[0] === 'grupos' || ruta === 'fotos') {
    exigir(s, 'productos');
    const productoDeLaSesion = (id) => {
      const p = D.productos.find((x) => x.id === Number(id) && !x.borrado);
      if (!p || !laEmpresa(s, p.companyId)) throw noEncontrado();
      return p;
    };
    const vistaLista = (p) => {
      const g = D.grupos.find((x) => x.id === p.grupoId);
      return { id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.images[0] || '', disponible: p.disponible, stock: p.stock, grupo: g ? { id: g.id, nombre: g.nombre } : null, encargo: p.encargo, tieneOpciones: p.modifierGroups.length > 0, cv: p.cv ? { pct: p.cv.pct, precioRedes: p.cv.precioRedes, activo: p.cv.activo, pausadoPorAdmin: p.cv.pausadoPorAdmin } : null };
    };
    const vistaCompleta = (p) => Object.assign(vistaLista(p), {
      descripcion: p.descripcion, edad: p.edad, encargoDiasMin: p.encargoDiasMin, encargoDiasMax: p.encargoDiasMax, companyId: p.companyId,
      images: p.images.slice(), imageTitles: p.imageTitles.slice(), imagePrices: p.imagePrices.slice(),
      modifierGroups: p.modifierGroups.map((g) => Object.assign({}, g, { options: g.options.map((o) => Object.assign({}, o)) })),
    });
    const aplicarCampos = (p, b, nuevo) => {
      if (nuevo || b.nombre !== undefined) {
        const n = String(b.nombre || '').trim();
        if (n.length < 4) throw new Fallo(400, 'El nombre va con 4 letras o más.');
        if (n.length > 100) throw new Fallo(400, 'El nombre va hasta 100 letras.');
        p.nombre = n;
      }
      if (b.descripcion !== undefined) p.descripcion = String(b.descripcion || '').slice(0, 500);
      if (nuevo || b.precio !== undefined) {
        const pr = Number(b.precio);
        if (!isFinite(pr) || pr < 0) throw new Fallo(400, 'El precio va en dólares y no puede ser negativo.');
        p.precio = redondo(pr);
      }
      if (b.disponible !== undefined) p.disponible = !!b.disponible;
      if (b.stock !== undefined) {
        const st = Number(b.stock);
        if (!Number.isInteger(st) || st < 0) throw new Fallo(400, 'El stock es un número entero (0 = sin límite).');
        p.stock = st;
      }
      if (b.edad !== undefined) { if (![13, 18].includes(Number(b.edad))) throw new Fallo(400, 'La edad es +13 o +18.'); p.edad = Number(b.edad); }
      if (b.grupoId !== undefined) {
        if (b.grupoId === null) p.grupoId = null;
        else {
          const g = D.grupos.find((x) => x.id === Number(b.grupoId) && x.companyId === p.companyId);
          if (!g) throw noEncontrado();
          p.grupoId = g.id;
        }
      }
      if (b.encargo !== undefined) p.encargo = !!b.encargo;
      if (b.encargoDiasMin !== undefined) p.encargoDiasMin = b.encargoDiasMin == null ? null : Number(b.encargoDiasMin);
      if (b.encargoDiasMax !== undefined) p.encargoDiasMax = b.encargoDiasMax == null ? null : Number(b.encargoDiasMax);
      if (b.images !== undefined) {
        if (!Array.isArray(b.images) || b.images.length > 3) throw new Fallo(400, 'Hasta 3 fotos.');
        p.images = b.images.map(String);
        p.imageTitles = Array.isArray(b.imageTitles) ? b.imageTitles.map((x) => String(x || '').slice(0, 30)) : [];
        p.imagePrices = Array.isArray(b.imagePrices) ? b.imagePrices.map((x) => Number(x) || 0) : [];
      }
    };
    if (ruta === 'fotos' && metodo === 'POST') {
      if (!esMultipart) throw new Fallo(400, 'Falta la foto.');
      const f = partes(crudo, req.headers['content-type']);
      if (!f || !f.archivo || !f.archivo.datos) throw new Fallo(400, 'Falta la foto.');
      if (!laEmpresa(s, f.companyId)) throw noEncontrado();
      const tipo = String(f.tipo || '');
      if (!MAX_FOTO[tipo]) throw new Fallo(400, 'Tipo de foto desconocido.');
      if (['logo', 'banner', 'marcador'].includes(tipo)) soloDueno(s);
      const datos = f.archivo.datos;
      if (datos.length > 10 * 1024 * 1024) throw new Fallo(413, 'La foto pesa más de 10 MB.');
      const medidas = medidasJpeg(datos);
      ULTIMA_FOTO = { tipo, bytes: datos.length, medidas, nombre: f.archivo.archivo, tipoMime: f.archivo.tipo };
      if (FALLAR_FOTOS > 0) { FALLAR_FOTOS--; throw new Fallo(500, 'No se pudo guardar la foto. Intenta de nuevo.'); }
      if (!medidas) throw new Fallo(400, 'Esa foto no es un JPEG válido.');
      if (medidas.ancho > MAX_FOTO[tipo] || medidas.alto > MAX_FOTO[tipo]) throw new Fallo(400, 'La foto es más grande de lo permitido.');
      const idf = crypto.randomBytes(8).toString('hex');
      SUBIDAS.set(idf, datos);
      anotar(s, 'foto', tipo, f.companyId, null, { bytes: datos.length });
      return { url: '/simulado/subidas/' + idf + '.jpg' };
    }
    if (ruta === 'productos' && metodo === 'GET') {
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      const palabras = sinTildes(q.buscar).split(/\s+/).filter(Boolean);
      return D.productos.filter((p) => p.companyId === t.companyId && !p.borrado
        && (!q.grupoId || p.grupoId === Number(q.grupoId))
        && palabras.every((w) => sinTildes(p.nombre).includes(w))).map(vistaLista);
    }
    if (ruta === 'productos' && metodo === 'POST') {
      const t = (body.storeId && laTienda(s, body.storeId)) || laEmpresa(s, body.companyId);
      if (!t) throw noEncontrado();
      const p = { id: ++D.siguienteId, companyId: t.companyId, grupoId: null, nombre: '', precio: 0, descripcion: '', disponible: true, stock: 0, edad: 13, encargo: false, encargoDiasMin: null, encargoDiasMax: null, images: [], imageTitles: [], imagePrices: [], modifierGroups: [], borrado: false, cv: null };
      aplicarCampos(p, body, true);
      if (t.pctTienda > 0 && t.authorized === 1) p.cv = { pct: t.pctTienda, precioRedes: null, activo: true, pausadoPorAdmin: false, subio: false };
      D.productos.push(p);
      anotar(s, 'producto_crear', 'producto', p.id, null, vistaLista(p));
      return Object.assign(vistaCompleta(p), p.precio === 0 ? { aviso: 'Con precio 0, este producto no se vende.' } : {});
    }
    let m = /^productos\/(\d+)$/.exec(ruta);
    if (m) {
      const p = productoDeLaSesion(m[1]);
      if (metodo === 'GET') return vistaCompleta(p);
      if (metodo === 'PATCH') {
        const antes = vistaLista(p);
        aplicarCampos(p, body, false);
        if (p.cv && p.cv.precioRedes && p.cv.precioRedes > p.precio) p.cv.precioRedes = p.precio;
        anotar(s, 'producto_editar', 'producto', p.id, antes, vistaLista(p));
        return Object.assign(vistaCompleta(p), p.precio === 0 ? { aviso: 'Con precio 0, este producto no se vende.' } : {});
      }
      if (metodo === 'DELETE') { p.borrado = true; anotar(s, 'producto_borrar', 'producto', p.id, vistaLista(p), null); return { ok: true }; }
    }
    m = /^productos\/(\d+)\/grupos-opciones$/.exec(ruta);
    if (m && metodo === 'POST') {
      const p = productoDeLaSesion(m[1]);
      const nombre = String(body.name || '').trim();
      if (nombre.length < 2) throw new Fallo(400, 'Ponle nombre al grupo de opciones.');
      const g = { id: ++D.siguienteId, name: nombre, type: body.type === 'single' ? 'single' : 'multiple', required: !!body.required, maxSelect: body.maxSelect == null ? null : Number(body.maxSelect), sortOrder: Number(body.sortOrder) || 0, options: [] };
      p.modifierGroups.push(g);
      anotar(s, 'opciones_crear', 'grupo_opciones', g.id, null, g);
      return { group: g };
    }
    const grupoOpcionesDeLaSesion = (id) => {
      for (const p of D.productos) {
        if (p.borrado || !laEmpresa(s, p.companyId)) continue;
        const g = p.modifierGroups.find((x) => x.id === Number(id));
        if (g) return { p, g };
      }
      throw noEncontrado();
    };
    m = /^grupos-opciones\/(\d+)$/.exec(ruta);
    if (m) {
      const { p, g } = grupoOpcionesDeLaSesion(m[1]);
      if (metodo === 'PATCH') {
        if (body.name !== undefined) g.name = String(body.name).trim() || g.name;
        if (body.type !== undefined) g.type = body.type === 'single' ? 'single' : 'multiple';
        if (body.required !== undefined) g.required = !!body.required;
        if (body.maxSelect !== undefined) g.maxSelect = body.maxSelect == null ? null : Number(body.maxSelect);
        if (body.sortOrder !== undefined) g.sortOrder = Number(body.sortOrder) || 0;
        return { group: g };
      }
      if (metodo === 'DELETE') { p.modifierGroups = p.modifierGroups.filter((x) => x !== g); return { ok: true }; }
    }
    m = /^grupos-opciones\/(\d+)\/opciones$/.exec(ruta);
    if (m && metodo === 'POST') {
      const { g } = grupoOpcionesDeLaSesion(m[1]);
      const nombre = String(body.name || '').trim();
      if (!nombre) throw new Fallo(400, 'Ponle nombre a la opción.');
      const o = { id: ++D.siguienteId, name: nombre, extraPrice: redondo(Number(body.extraPrice) || 0), image: body.image || null, sortOrder: Number(body.sortOrder) || 0 };
      g.options.push(o);
      return { option: o };
    }
    m = /^opciones\/(\d+)$/.exec(ruta);
    if (m) {
      let hallado = null;
      for (const p of D.productos) {
        if (p.borrado || !laEmpresa(s, p.companyId)) continue;
        for (const g of p.modifierGroups) { const o = g.options.find((x) => x.id === Number(m[1])); if (o) hallado = { g, o }; }
      }
      if (!hallado) throw noEncontrado();
      if (metodo === 'PATCH') {
        if (body.name !== undefined) hallado.o.name = String(body.name).trim() || hallado.o.name;
        if (body.extraPrice !== undefined) hallado.o.extraPrice = redondo(Number(body.extraPrice) || 0);
        if (body.image !== undefined) hallado.o.image = body.image || null;
        if (body.sortOrder !== undefined) hallado.o.sortOrder = Number(body.sortOrder) || 0;
        return { option: hallado.o };
      }
      if (metodo === 'DELETE') { hallado.g.options = hallado.g.options.filter((x) => x !== hallado.o); return { ok: true }; }
    }
    if (ruta === 'grupos') {
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      if (metodo === 'GET') return D.grupos.filter((g) => g.companyId === t.companyId).map((g) => ({ id: g.id, nombre: g.nombre, productos: D.productos.filter((p) => p.grupoId === g.id && !p.borrado).length }));
      if (metodo === 'POST') {
        const n = String(body.nombre || '').trim();
        if (n.length < 4 || n.length > 20) throw new Fallo(400, 'El nombre del grupo va de 4 a 20 letras.');
        const g = { id: ++D.siguienteId, companyId: t.companyId, nombre: n };
        D.grupos.push(g);
        anotar(s, 'grupo_crear', 'grupo', g.id, null, g);
        return { id: g.id, nombre: g.nombre, productos: 0 };
      }
    }
    m = /^grupos\/(\d+)$/.exec(ruta);
    if (m) {
      const g = D.grupos.find((x) => x.id === Number(m[1]));
      if (!g || !laEmpresa(s, g.companyId)) throw noEncontrado();
      if (metodo === 'PATCH') {
        const n = String(body.nombre || '').trim();
        if (n.length < 4 || n.length > 20) throw new Fallo(400, 'El nombre del grupo va de 4 a 20 letras.');
        g.nombre = n;
        return { ok: true, id: g.id, nombre: g.nombre };
      }
      if (metodo === 'DELETE') {
        if (D.productos.some((p) => p.grupoId === g.id && !p.borrado)) throw new Fallo(409, 'Mueve o borra sus productos primero');
        D.grupos = D.grupos.filter((x) => x !== g);
        return { ok: true };
      }
    }
    throw noEncontrado();
  }

  // ── Vendedores externos (solo el dueño, tiendas visibles en la app) ──
  if (partesRuta[0] === 'vendedores-externos') {
    soloDueno(s);
    if (metodo === 'GET' && ruta === 'vendedores-externos') {
      const t = laTienda(s, q.storeId);
      if (!t || t.authorized !== 1) throw noEncontrado();
      const ventas = D.vendedorVentas.slice().sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
      return {
        pctTienda: t.pctTienda, tope: 50,
        productos: D.productos.filter((p) => p.companyId === t.companyId && !p.borrado).map((p) => ({
          productId: p.id, nombre: p.nombre, foto: p.images[0] || '', precioApp: p.precio,
          precioRedes: p.cv ? p.cv.precioRedes : null, preciosTalla: p.cv && p.cv.preciosTalla ? p.cv.preciosTalla : null,
          pct: p.cv ? p.cv.pct : 0, activo: !!(p.cv && p.cv.activo && p.cv.pct > 0), pausadoPorAdmin: !!(p.cv && p.cv.pausadoPorAdmin), subio: !!(p.cv && p.cv.subio),
        })),
        ventas: {
          ultimos30: { n: ventas.length, ventasUsd: redondo(ventas.reduce((x, v) => x + v.ventasUsd, 0)), comisionUsd: redondo(ventas.reduce((x, v) => x + v.comisionUsd, 0)), cuponesUsd: redondo(ventas.reduce((x, v) => x + v.cuponUsd, 0)) },
          lista: ventas.slice(0, 30),
        },
      };
    }
    if (metodo === 'PUT' && ruta === 'vendedores-externos/tienda') {
      const t = laEmpresa(s, body.companyId);
      if (!t || t.authorized !== 1) throw noEncontrado();
      const pct = Number(body.pct);
      if (!isFinite(pct) || pct < 0 || pct > 50) throw new Fallo(400, 'El % va de 0 a 50.');
      const antes = t.pctTienda;
      t.pctTienda = redondo(pct);
      let actualizados = 0;
      if (body.aplicarATodos) {
        for (const p of D.productos.filter((x) => x.companyId === t.companyId && !x.borrado && x.precio > 0)) {
          if (!p.cv) p.cv = { pct: 0, precioRedes: null, activo: false, pausadoPorAdmin: false, subio: false };
          p.cv.pct = t.pctTienda;
          if (!p.cv.pausadoPorAdmin) p.cv.activo = t.pctTienda > 0;
          p.cv.puestoPor = 'comercio';
          actualizados++;
        }
      }
      anotar(s, 'cv_tienda', 'tienda', t.companyId, { pct: antes }, { pct: t.pctTienda, aplicarATodos: !!body.aplicarATodos });
      return { ok: true, pctTienda: t.pctTienda, actualizados };
    }
    const m = /^vendedores-externos\/productos\/(\d+)$/.exec(ruta);
    if (m && metodo === 'PUT') {
      const p = D.productos.find((x) => x.id === Number(m[1]) && !x.borrado);
      const t = p && laEmpresa(s, p.companyId);
      if (!t || t.authorized !== 1) throw noEncontrado();
      if (p.cv && p.cv.pausadoPorAdmin) throw new Fallo(409, 'Deliservy pausó este producto en el programa');
      const pct = Number(body.pct);
      if (!isFinite(pct) || pct < 0 || pct > 50) throw new Fallo(400, 'El % va de 0 a 50.');
      let precioRedes = null;
      if (body.precioRedes != null && body.precioRedes !== '') {
        precioRedes = Number(body.precioRedes);
        if (!isFinite(precioRedes) || precioRedes <= 0) throw new Fallo(400, 'El precio de redes va mayor que 0.');
        if (precioRedes > p.precio) throw new Fallo(400, 'El precio de redes no puede ser mayor que el de la app (' + usd(p.precio) + ').');
      }
      const antes = p.cv ? Object.assign({}, p.cv) : null;
      if (!p.cv) p.cv = { pct: 0, precioRedes: null, activo: false, pausadoPorAdmin: false, subio: false };
      p.cv.pct = redondo(pct); p.cv.precioRedes = precioRedes == null ? null : redondo(precioRedes); p.cv.activo = pct > 0; p.cv.puestoPor = 'comercio';
      if (Array.isArray(body.preciosTalla) && p.cv.preciosTalla) {
        body.preciosTalla.forEach((v, i) => {
          if (!p.cv.preciosTalla[i]) return;
          if (v == null || v === '') { p.cv.preciosTalla[i].precioRedes = null; return; }
          const n = Number(v);
          if (!isFinite(n) || n <= 0 || n > p.cv.preciosTalla[i].precioApp) throw new Fallo(400, 'Cada talla va mayor que 0 y no mayor que su precio en la app.');
          p.cv.preciosTalla[i].precioRedes = redondo(n);
        });
      }
      anotar(s, 'cv_producto', 'producto', p.id, antes, p.cv);
      return { ok: true, producto: { productId: p.id, pct: p.cv.pct, precioRedes: p.cv.precioRedes, activo: p.cv.activo } };
    }
    throw noEncontrado();
  }

  // ── Billetera y facturas (solo el dueño) ──
  if (partesRuta[0] === 'billetera' || ruta === 'facturas') {
    soloDueno(s);
    if (metodo === 'GET' && ruta === 'billetera') {
      return Object.assign({}, D.billetera, { cuentaBancaria: D.cuentaBancaria, pagoAutomatico: 'todos los días a las 11 p. m.' });
    }
    if (metodo === 'GET' && ruta === 'billetera/movimientos') {
      const rr = rango(q, 400);
      const lista = D.movimientos.filter((x) => Date.parse(x.fecha) >= rr.ini && Date.parse(x.fecha) < rr.fin);
      const pagina = Math.max(1, Number(q.pagina) || 1);
      return { movimientos: lista.slice((pagina - 1) * 50, pagina * 50), pagina, hayMas: pagina * 50 < lista.length };
    }
    if (metodo === 'POST' && ruta === 'billetera/codigo') {
      D.codigos.set('retiro:' + s.userId, { codigo: CODIGO, intentos: 0 });
      return { ok: true, mensaje: 'Te enviamos un código por WhatsApp.' };
    }
    if (metodo === 'POST' && ruta === 'billetera/retirar') {
      const c = D.codigos.get('retiro:' + s.userId);
      if (!c) throw new Fallo(400, 'Pide un código primero.');
      if (++c.intentos > 5) throw new Fallo(429, 'Demasiados intentos. Espera unos minutos y pide un código nuevo.');
      if (String(body.codigo) !== c.codigo) throw new Fallo(400, 'Ese código no es correcto o ya venció.');
      D.codigos.delete('retiro:' + s.userId);
      if (D.billetera.retiroBloqueadoHasta && Date.parse(D.billetera.retiroBloqueadoHasta) > ahora) throw new Fallo(409, 'Cambiaste tu cuenta hace poco: podrás retirar después del bloqueo.');
      const monto = D.billetera.disponibleBs;
      if (monto <= 0) throw new Fallo(409, 'No tienes saldo disponible para retirar.');
      D.billetera.disponibleBs = 0;
      D.movimientos.unshift({ id: 9999, fecha: iso(ahora), tipo: 'retiro', descripcion: 'Retiro a tu cuenta (BNC)', montoBs: -monto });
      anotar(s, 'retiro', 'billetera', s.userId, { disponibleBs: monto }, { disponibleBs: 0 });
      return { ok: true, montoBs: monto, mensaje: 'Listo: te enviamos ' + bs(monto) + ' a tu cuenta del BNC.' };
    }
    if (metodo === 'GET' && ruta === 'facturas') {
      const rr = q.desde || q.hasta ? rango(q, 800) : null;
      return D.facturas.filter((f) => !rr || (Date.parse(f.fecha) >= rr.ini && Date.parse(f.fecha) < rr.fin));
    }
    throw noEncontrado();
  }

  // ── Flota ──
  if (partesRuta[0] === 'flota') {
    exigir(s, 'flota_ver');
    const t = q.storeId ? laTienda(s, q.storeId) : tiendasDeLaSesion(s).find((x) => x.flota);
    if (!t || !t.flota) throw noEncontrado();
    const vistaPedido = (p) => ({ orderId: p.orderId, creadoEn: iso(p.creado), servicio: p.servicio, desde: p.a.direccion, hasta: p.b.direccion, estado: p.estado, cobroUsd: p.cobroUsd, codigo: p.codigo, repartidor: p.repartidor });
    if (metodo === 'GET' && ruta === 'flota') {
      return Object.assign({ comercioId: D.flota.comercioId }, D.flota, { tasaBs: TASA, tienda: { lat: t.lat, lng: t.lng, direccion: t.direccion } });
    }
    if (metodo === 'GET' && ruta === 'flota/pedidos') {
      const rr = rango(q, 92);
      const lista = D.flotaPedidos.filter((p) => p.creado >= rr.ini && p.creado < rr.fin && (!q.estado || q.estado === 'todos' || (q.estado === 'en_curso' ? !['Entregado', 'Cancelado'].includes(p.estado) : true))).sort((a, b) => b.creado - a.creado);
      const pagina = Math.max(1, Number(q.pagina) || 1);
      return lista.slice((pagina - 1) * 50, pagina * 50).map(vistaPedido);
    }
    let m = /^flota\/pedidos\/(\d+)$/.exec(ruta);
    if (m && metodo === 'GET') {
      const p = D.flotaPedidos.find((x) => x.orderId === Number(m[1]));
      if (!p) throw noEncontrado();
      const vivo = p.vivo ? posicionViva(p.a, p.b, 180, 0) : null;
      return Object.assign(vistaPedido(p), {
        a: p.a, b: p.b, recibe: p.recibe, nota: p.nota, minutos: p.minutos, distanciaKm: p.distanciaKm,
        repartidor: p.repartidor ? Object.assign({ nombre: p.repartidor, telefono: '0412-555-7788' }, vivo || {}) : null,
        ruta: rutaEntre(p.a, p.b),
      });
    }
    if (metodo === 'GET' && ruta === 'flota/movimientos') {
      const rr = rango(q, 400);
      return D.flotaMovimientos.filter((x) => Date.parse(x.fecha) >= rr.ini && Date.parse(x.fecha) < rr.fin).map((x) => Object.assign({}, x, { montoBs: redondo(x.montoUsd * TASA) }));
    }
    if (metodo === 'GET' && ruta === 'flota/cortes') return D.flotaCortes;
    if (metodo === 'GET' && ruta === 'flota/facturas') { soloDueno(s); return D.facturasFlota; }
    if (metodo === 'POST' && ruta === 'flota/cotizar') {
      exigir(s, 'flota_pedir');
      if (D.flota.pausado) throw new Fallo(409, 'Tu servicio está pausado: paga para seguir pidiendo.');
      const tipo = String(body.tipo || 'envio');
      if (!['envio', 'contra_viaje', 'contra_efectivo', 'exclusivo'].includes(tipo)) throw new Fallo(400, 'Elige el tipo de servicio.');
      if (tipo === 'contra_efectivo' && !D.flota.contraEfectivo) throw new Fallo(409, 'Contra efectivo no está activado para tu comercio.');
      if (tipo === 'exclusivo' && !D.flota.exclusivo) throw new Fallo(409, 'El servicio exclusivo no está activado para tu comercio.');
      const pto = (x) => x && isFinite(Number(x.lat)) && isFinite(Number(x.lng)) ? { lat: Number(x.lat), lng: Number(x.lng), direccion: String(x.direccion || '').slice(0, 200) || lugarCercano(Number(x.lat), Number(x.lng)) } : null;
      const a = pto(body.a) || { lat: t.lat, lng: t.lng, direccion: t.direccion };
      const b = pto(body.b);
      if (!b) throw new Fallo(400, 'Marca a dónde va (el punto B).');
      if (!body.recibe || String(body.recibe.nombre || '').trim().length < 2) throw new Fallo(400, 'Escribe el nombre de quien recibe.');
      if (!telefonoNormal(body.recibe.telefono)) throw new Fallo(400, 'Escribe el teléfono de quien recibe.');
      const c = nuevaCotizacion(t, tipo, a, b, { recibe: body.recibe, nota: body.nota });
      return { cotizacionId: c.cotizacionId, precioUsd: c.precioUsd, sinCargosHasta: c.sinCargosHasta, minutos: c.minutos, distanciaKm: c.distanciaKm, a: c.a, b: c.b, venceEn: c.venceEn, ruta: c.ruta };
    }
    if (metodo === 'POST' && ruta === 'flota/pedir') {
      exigir(s, 'flota_pedir');
      const c = D.cotizaciones.get(Number(body.cotizacionId));
      if (!c || c.storeId !== t.storeId) throw noEncontrado();
      return pedirFlota(s, c);
    }
    if (metodo === 'POST' && ruta === 'flota/alisa') {
      exigir(s, 'flota_pedir');
      const texto = String(body.texto || '').trim().slice(0, 500);
      if (!texto && !body.ubicacion) throw new Fallo(400, 'Escribe tu mensaje.');
      D.alisa.push({ de: 'comercio', texto: texto || '📍 Ubicación', fecha: iso(ahora), ubicacion: body.ubicacion || null });
      const r2 = atenderAlisa(s, t, texto, body.ubicacion);
      D.alisa.push({ de: 'alisa', texto: r2.respuesta, fecha: iso(ahora + 1), cotizacion: r2.cotizacion || null, orderId: r2.orderId || null });
      return r2;
    }
    if (metodo === 'GET' && ruta === 'flota/alisa/historial') {
      return { mensajes: D.alisa.slice(-60), hayMas: false };
    }
    if (metodo === 'POST' && ruta === 'flota/pagar/cotizar') {
      soloDueno(s);
      const metodoPago = body.metodo;
      if (!['pago_movil', 'transferencia'].includes(metodoPago)) throw new Fallo(400, 'Elige pago móvil o transferencia.');
      let monto = body.montoUsd == null || body.montoUsd === '' ? D.flota.debeUsd : Number(body.montoUsd);
      if (!isFinite(monto) || monto <= 0) throw new Fallo(400, 'Escribe un monto mayor que 0.');
      if (monto > 2000) throw new Fallo(400, 'El máximo por pago es 2.000 $.');
      monto = redondo(monto);
      const pagoId = ++D.siguienteId;
      const pago = { pagoId, metodo: metodoPago, montoUsd: monto, tasa: TASA, montoBs: redondo(monto * TASA), creado: ahora };
      D.pagosFlota.set(pagoId, pago);
      return {
        pagoId, montoBs: pago.montoBs, montoUsd: monto, tasa: TASA,
        aDonde: metodoPago === 'pago_movil'
          ? { banco: '0191 · Banco Nacional de Crédito', telefono: '0414-495-7006', rif: 'J-504754129', titular: 'Deliservyapp, C.A.' }
          : { banco: '0191 · Banco Nacional de Crédito', cuenta: '0191-0123-45-2100012345', rif: 'J-504754129', titular: 'Deliservyapp, C.A.' },
      };
    }
    if (metodo === 'POST' && ruta === 'flota/pagar/confirmar') {
      soloDueno(s);
      const pago = D.pagosFlota.get(Number(body.pagoId));
      if (!pago) throw noEncontrado();
      if (pago.metodo === 'pago_movil' && !telefonoNormal(body.telefonoPagador)) throw new Fallo(400, 'Escribe el teléfono desde el que pagaste.');
      if (pago.metodo === 'transferencia' && !/^[VEJGP]?\d{6,9}$/i.test(String(body.cedulaPagador || '').replace(/[\s.-]/g, ''))) throw new Fallo(400, 'Escribe la cédula o el RIF del titular.');
      // Para probar «aún no aparece»: con el teléfono 0414-000-0000 o la cédula 1111111.
      if (String(body.telefonoPagador || '').replace(/\D/g, '').endsWith('4140000000') || String(body.cedulaPagador || '').replace(/\D/g, '') === '1111111') {
        return { ok: false, mensaje: pago.metodo === 'pago_movil' ? 'Aún no aparece. Revisa el número y vuelve a intentarlo en un minuto.' : 'Aún no aparece. Revisa la cédula y vuelve a intentarlo en un minuto.', debeUsd: D.flota.debeUsd };
      }
      if (pago.usado) throw new Fallo(409, 'Ese pago ya se registró.');
      pago.usado = true;
      D.flota.debeUsd = redondo(Math.max(0, D.flota.debeUsd - pago.montoUsd));
      D.flotaMovimientos.unshift({ fecha: iso(ahora), tipo: 'pago', texto: (pago.metodo === 'pago_movil' ? 'Pago móvil' : 'Transferencia') + ' desde el panel', montoUsd: pago.montoUsd });
      anotar(s, 'flota_pagar', 'pago', pago.pagoId, null, { montoUsd: pago.montoUsd });
      return { ok: true, mensaje: 'Pago recibido: ' + usd(pago.montoUsd) + '. Debes ahora ' + usd(D.flota.debeUsd) + '.', debeUsd: D.flota.debeUsd };
    }
    throw noEncontrado();
  }

  // ── Mi plan (§7): el cobro por producto y las membresías ──
  if (partesRuta[0] === 'plan') {
    if (metodo === 'GET' && ruta === 'plan') {
      if (s.rol !== 'dueno' && !s.permisos.includes('productos')) throw new Fallo(403, 'No tienes permiso para esto.');
      const t = laTienda(s, q.storeId);
      if (!t) throw noEncontrado();
      return vistaPlan(t);
    }
    soloDueno(s);
    const t = laEmpresa(s, body.companyId);
    if (!t) throw noEncontrado();
    const pl = D.planes[t.companyId] || (D.planes[t.companyId] = { membresia: null, solicitud: null, pagos: [] });
    if (metodo === 'POST' && ruta === 'plan/solicitar') {
      if (!['premium', 'deluxe'].includes(body.plan)) throw new Fallo(400, 'Elige Premium o Deluxe.');
      if (vistaPlan(t).plan === body.plan) throw new Fallo(409, 'Ya tienes ese plan.');
      pl.solicitud = { plan: body.plan, fecha: iso(ahora) };
      anotar(s, 'plan_solicitar', 'membresia', t.companyId, null, pl.solicitud);
      return { ok: true, mensaje: 'Listo: le avisamos a Deliservy. Te escribimos pronto.', solicitud: pl.solicitud };
    }
    if (metodo === 'POST' && ruta === 'plan/pagar/cotizar') {
      if (body.plan === 'basica') throw new Fallo(400, 'La Básica es gratis: no se paga.');
      if (body.plan === 'premium' || body.plan === 'deluxe') {
        const precio = body.plan === 'premium' ? AJUSTES.premiumUsd : AJUSTES.deluxeUsd;
        const viva = pl.membresia;
        if (viva && viva.estado === 'activa' && viva.plan !== body.plan && Date.parse(viva.activaHasta) > ahora) {
          throw new Fallo(409, 'Tienes un plan activo. Ese es el que se renueva.');
        }
        if (!viva || viva.estado === 'quitada' || viva.plan !== body.plan) {
          pl.membresia = Object.assign({}, viva, { plan: body.plan, estado: viva && viva.estado === 'activa' ? 'activa' : 'asignada', precioUsd: precio });
        }
      }
      const m = pl.membresia;
      if (!m || m.estado === 'quitada') throw new Fallo(409, 'Primero pide un plan: Deliservy te lo asigna.');
      const desde = m.estado === 'activa' && Date.parse(m.activaHasta) > ahora ? Date.parse(m.activaHasta) : ahora;
      const pagoId = ++D.siguienteId;
      const pago = { pagoId, companyId: t.companyId, plan: m.plan, montoUsd: m.precioUsd, tasa: TASA, montoBs: redondo(m.precioUsd * TASA), desde, hasta: sumarUnMes(desde) };
      D.pagosPlan = D.pagosPlan || new Map();
      D.pagosPlan.set(pagoId, pago);
      return {
        pagoId, plan: m.plan, montoUsd: pago.montoUsd, montoBs: pago.montoBs, tasa: TASA, periodo: { desde: iso(desde), hasta: iso(pago.hasta) },
        pago: { banco: 'Banco Nacional de Crédito', codigoBanco: '0191', telefono: '04144957006', cuenta: '0191-0123-45-2100012345', titular: 'Deliservyapp, C.A.', rif: 'J-504754129' },
      };
    }
    if (metodo === 'POST' && ruta === 'plan/pagar') {
      const pago = D.pagosPlan && D.pagosPlan.get(Number(body.pagoId));
      if (!pago || pago.companyId !== t.companyId) throw noEncontrado();
      if (pago.usado) throw new Fallo(409, 'Ese pago ya se registró.');
      const m = body.metodo;
      if (m === 'pago_movil') {
        if (!telefonoNormal(body.telefonoPago)) throw new Fallo(400, 'Escribe el teléfono desde el que pagaste.');
        if (String(body.telefonoPago).replace(/\D/g, '').endsWith('4140000000')) return { ok: false, mensaje: 'Aún no aparece. Revisa el número y vuelve a intentarlo en un minuto.' };
      } else if (m === 'transferencia') {
        if (!/^[VEJG]$/.test(String(body.cedulaTipo || '')) || !/^\d{6,9}$/.test(String(body.cedulaNumero || ''))) throw new Fallo(400, 'Escribe la cédula o el RIF del titular.');
        if (body.cedulaNumero === '1111111') return { ok: false, mensaje: 'Aún no aparece. Revisa la cédula y vuelve a intentarlo en un minuto.' };
      } else if (m === 'debito' || m === 'credito') {
        const tj = body.tarjeta || {};
        const n = String(tj.numero || '');
        if (!/^\d{15,16}$/.test(n) || !luhn(n)) throw new Fallo(400, 'Revisa el número de la tarjeta.');
        if (!/^\d{2}\/\d{2}$/.test(String(tj.vence || '')) || !/^\d{3,4}$/.test(String(tj.cvv || '')) || String(tj.titular || '').trim().length < 3) throw new Fallo(400, 'Completa todos los datos de la tarjeta');
        if (m === 'debito' && (!/^\d{6,9}$/.test(String(tj.cedula || '')) || !/^\d{4}$/.test(String(tj.clave || '')))) throw new Fallo(400, 'Completa todos los datos de la tarjeta');
        if (n.endsWith('0002')) throw new Fallo(402, 'El banco rechazó el pago. Revisa los datos e inténtalo de nuevo.');
      } else throw new Fallo(400, 'Elige cómo pagas.');
      pago.usado = true;
      const mem = pl.membresia;
      const estabaActiva = mem.estado === 'activa' && Date.parse(mem.activaHasta) > ahora;
      mem.estado = 'activa';
      if (!estabaActiva) mem.activaDesde = iso(pago.desde);
      mem.activaHasta = iso(pago.hasta);
      pl.solicitud = null;
      pl.pagos.unshift({ id: pago.pagoId, fecha: iso(ahora), metodo: m, montoUsd: pago.montoUsd, montoBs: pago.montoBs, referencia: String(100000 + Math.floor(Math.random() * 899999)), estado: 'aprobado', periodoDesde: iso(pago.desde), periodoHasta: iso(pago.hasta) });
      anotar(s, 'plan_pagar', 'membresia', t.companyId, null, { metodo: m, montoUsd: pago.montoUsd });
      const hasta = new Date(pago.hasta).toLocaleDateString('es-VE', { timeZone: 'America/Caracas', day: 'numeric', month: 'short' }).replace(/\.$/, '');
      return { ok: true, pagado: true, mensaje: 'Listo: tu plan ' + (mem.plan === 'deluxe' ? 'Deluxe' : 'Premium') + ' va hasta el ' + hasta + '. Dura un mes. Si no lo pagas al vencer, vuelves a la Básica. Deliservy te factura este pago con los datos de tu tienda.', membresia: Object.assign({}, mem) };
    }
    throw noEncontrado();
  }

  // ── Estadísticas y opiniones ──
  if (ruta === 'estadisticas' && metodo === 'GET') {
    exigir(s, 'estadisticas');
    const t = laTienda(s, q.storeId);
    if (!t) throw noEncontrado();
    return estadisticas(t, q);
  }
  if (ruta === 'opiniones' && metodo === 'GET') {
    exigir(s, 'estadisticas');
    const t = laEmpresa(s, q.companyId);
    if (!t) throw noEncontrado();
    let lista = D.opiniones.filter((o) => o.companyId === t.companyId && (!q.objetivo || o.objetivo === q.objetivo) && (q.sinResponder !== 'true' || !o.respuesta));
    const todas = D.opiniones.filter((o) => o.companyId === t.companyId);
    const pagina = Math.max(1, Number(q.pagina) || 1);
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    todas.forEach((o) => { dist[o.estrellas]++; });
    return {
      resumen: { promedio: todas.length ? Math.round((todas.reduce((x, o) => x + o.estrellas, 0) / todas.length) * 10) / 10 : null, cantidad: todas.length, distribucion: dist },
      opiniones: lista.slice((pagina - 1) * 10, pagina * 10).map((o) => Object.assign({}, o, { companyId: undefined })),
      hayMas: pagina * 10 < lista.length,
    };
  }
  let m2 = /^opiniones\/(\d+)\/respuesta$/.exec(ruta);
  if (m2 && metodo === 'POST') {
    exigir(s, 'estadisticas');
    const o = D.opiniones.find((x) => x.id === Number(m2[1]));
    if (!o || !laEmpresa(s, o.companyId)) throw noEncontrado();
    const texto = String(body.texto || '').trim();
    if (texto.length < 2) throw new Fallo(400, 'Escribe tu respuesta.');
    if (texto.length > 300) throw new Fallo(400, 'La respuesta va hasta 300 letras.');
    if (o.respuesta) throw new Fallo(409, 'Ya respondiste esta opinión.');
    o.respuesta = { texto, fecha: iso(ahora), por: laEmpresa(s, o.companyId).nombre, estado: 'publicada' };
    anotar(s, 'opinion_responder', 'opinion', o.id, null, { texto });
    return { ok: true, respuesta: o.respuesta };
  }

  // ── Mi tienda (solo el dueño) ──
  if (partesRuta[0] === 'tienda') {
    soloDueno(s);
    let m = /^tienda\/(\d+)$/.exec(ruta);
    if (m && metodo === 'GET') {
      const t = laTienda(s, m[1]);
      if (!t) throw noEncontrado();
      return vistaTienda(t);
    }
    if (m && metodo === 'PATCH') {
      const t = laTienda(s, m[1]);
      if (!t) throw noEncontrado();
      const antes = vistaTienda(t);
      if (body.contacto !== undefined) {
        const c = D.codigos.get('contacto:' + t.storeId);
        if (!c || c.telefono !== telefonoNormal(body.contacto)) throw new Fallo(400, 'Pide el código para ese número primero.');
        if (String(body.codigo) !== c.codigo) throw new Fallo(400, 'Ese código no es correcto o ya venció.');
        t.telefono = c.telefono;
        D.codigos.delete('contacto:' + t.storeId);
      }
      if (body.nombre !== undefined) { const n = String(body.nombre).trim(); if (n.length < 3) throw new Fallo(400, 'El nombre va con 3 letras o más.'); t.nombre = n.slice(0, 60); }
      if (body.direccion !== undefined) { const n = String(body.direccion).trim(); if (n.length < 8) throw new Fallo(400, 'Escribe la dirección completa.'); t.direccion = n.slice(0, 200); }
      if (body.correo !== undefined) { const n = String(body.correo).trim().toLowerCase(); if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(n)) throw new Fallo(400, 'Escribe un correo válido.'); t.correo = n; }
      if (body.rif !== undefined) { const n = String(body.rif).toUpperCase().replace(/[\s.-]/g, ''); if (!/^[JGVE]\d{9}$/.test(n)) throw new Fallo(400, 'Ese RIF no es válido. Revisa los 9 números.'); t.rif = n; }
      if (body.ubicacion !== undefined) { const u = body.ubicacion; if (!u || !isFinite(u.lat) || !isFinite(u.lng)) throw new Fallo(400, 'Marca la ubicación en el mapa.'); t.lat = Number(u.lat); t.lng = Number(u.lng); }
      if (body.categoriaId !== undefined) { const c = D.categorias.find((x) => x.id === Number(body.categoriaId)); if (!c) throw new Fallo(400, 'Elige una categoría.'); t.categoria = c; }
      anotar(s, 'tienda_editar', 'tienda', t.storeId, antes, vistaTienda(t));
      return { ok: true, tienda: vistaTienda(t) };
    }
    m = /^tienda\/(\d+)\/codigo-telefono$/.exec(ruta);
    if (m && metodo === 'POST') {
      const t = laTienda(s, m[1]);
      if (!t) throw noEncontrado();
      const tel = telefonoNormal(body.contacto);
      if (!tel) throw new Fallo(400, 'Escribe un número de WhatsApp válido.');
      D.codigos.set('contacto:' + t.storeId, { codigo: CODIGO, telefono: tel, intentos: 0 });
      return { ok: true, mensaje: 'Te enviamos un código por WhatsApp al número nuevo.' };
    }
    m = /^tienda\/(\d+)\/horarios$/.exec(ruta);
    if (m && metodo === 'PUT') {
      const t = laTienda(s, m[1]);
      if (!t) throw noEncontrado();
      const lista = Array.isArray(body) ? body : body.horarios;
      if (!Array.isArray(lista) || lista.length !== 7) throw new Fallo(400, 'Faltan días en el horario.');
      const nuevos = lista.map((h) => {
        const dia = Number(h.dia);
        if (!(dia >= 0 && dia <= 6)) throw new Fallo(400, 'Día inválido.');
        if (h.cerrado) return { dia, abre: '00:00', cierra: '00:00', cerrado: true };
        if (!/^\d{2}:\d{2}$/.test(h.abre || '') || !/^\d{2}:\d{2}$/.test(h.cierra || '')) throw new Fallo(400, 'Escribe las horas como 08:00.');
        if (h.abre === h.cierra) throw new Fallo(400, 'Abrir y cerrar a la misma hora es «cerrado». Márcalo como cerrado.');
        return { dia, abre: h.abre, cierra: h.cierra, cerrado: false };
      }).sort((a, b) => a.dia - b.dia);
      anotar(s, 'horarios', 'tienda', t.storeId, t.horarios, nuevos);
      t.horarios = nuevos;
      return { ok: true, horarios: nuevos };
    }
    m = /^tienda\/(\d+)\/imagenes$/.exec(ruta);
    if (m && metodo === 'PATCH') {
      const t = laEmpresa(s, m[1]);
      if (!t) throw noEncontrado();
      for (const k of ['logo', 'banner', 'marcador']) if (body[k] !== undefined) t[k] = String(body[k] || '');
      anotar(s, 'imagenes', 'tienda', t.companyId, null, body);
      return { ok: true };
    }
    m = /^tienda\/(\d+)\/mostrar-en-app$/.exec(ruta);
    if (m && metodo === 'POST') {
      const t = laTienda(s, m[1]);
      if (!t) throw noEncontrado();
      if (!t.flota) throw new Fallo(409, 'Solo para comercios de flota.');
      if (body.mostrar) {
        const faltan = requisitos(t).faltan;
        if (faltan.length) throw new Fallo(409, 'Te falta completar algunas cosas.', { faltan });
        t.authorized = 1;
      } else t.authorized = 3;
      anotar(s, 'mostrar_en_app', 'tienda', t.storeId, null, { mostrar: !!body.mostrar });
      return { ok: true, visibleEnApp: t.authorized === 1 };
    }
    throw noEncontrado();
  }

  // ── Trabajadores (solo el dueño) ──
  if (partesRuta[0] === 'trabajadores') {
    soloDueno(s);
    const vista = (w) => ({ id: w.id, nombre: w.nombre, telefono: telefonoParaVer(w.telefono), permisos: w.permisos, activo: w.activo });
    const revisar = (b, actual) => {
      const out = {};
      if (b.nombre !== undefined || !actual) { const n = String(b.nombre || '').trim(); if (n.length < 2 || n.length > 80) throw new Fallo(400, 'Escribe el nombre del trabajador.'); out.nombre = n; }
      if (b.telefono !== undefined || !actual) {
        const t = telefonoNormal(b.telefono);
        if (!t) throw new Fallo(400, 'Escribe un número de WhatsApp válido.');
        if (D.trabajadores.some((w) => w.telefono === t && w !== actual) || Object.values(D.cuentas).some((c) => c.telefono === t)) throw new Fallo(409, 'Ese número ya está registrado.');
        out.telefono = t;
      }
      if (b.permisos !== undefined || !actual) {
        const p = Array.isArray(b.permisos) ? b.permisos.filter((x) => PERMISOS.includes(x)) : [];
        if (!p.length) throw new Fallo(400, 'Marca al menos un permiso.');
        out.permisos = p;
      }
      if (b.activo !== undefined) out.activo = !!b.activo;
      return out;
    };
    if (ruta === 'trabajadores' && metodo === 'GET') return D.trabajadores.filter((w) => w.duenoUserId === s.userId).map(vista);
    if (ruta === 'trabajadores' && metodo === 'POST') {
      const w = Object.assign({ id: ++D.siguienteId, duenoUserId: s.userId, activo: true, versionSesion: 1 }, revisar(body, null));
      D.trabajadores.push(w);
      anotar(s, 'trabajador_crear', 'trabajador', w.id, null, vista(w));
      return vista(w);
    }
    const m = /^trabajadores\/(\d+)$/.exec(ruta);
    if (m) {
      const w = D.trabajadores.find((x) => x.id === Number(m[1]) && x.duenoUserId === s.userId);
      if (!w) throw noEncontrado();
      if (metodo === 'PATCH') {
        const antes = vista(w);
        const c = revisar(body, w);
        Object.assign(w, c);
        if (c.permisos || c.activo === false) w.versionSesion++;
        anotar(s, 'trabajador_editar', 'trabajador', w.id, antes, vista(w));
        return vista(w);
      }
      if (metodo === 'DELETE') {
        D.trabajadores = D.trabajadores.filter((x) => x !== w);
        anotar(s, 'trabajador_borrar', 'trabajador', w.id, vista(w), null);
        return { ok: true };
      }
    }
    throw noEncontrado();
  }

  throw noEncontrado();
}

function vistaPlan(t) {
  const pl = D.planes[t.companyId] || { membresia: null, solicitud: null, pagos: [] };
  const m = pl.membresia;
  if (m && m.estado === 'activa' && Date.parse(m.activaHasta) < Date.now()) m.estado = 'vencida';
  const promoViva = t.comisionPromo && Date.parse(t.comisionPromo.hasta) > Date.now();
  return {
    companyId: t.companyId, storeId: t.storeId, plan: m && m.estado === 'activa' ? m.plan : 'basica', membresia: m ? Object.assign({}, m) : null,
    cobroPorProducto: !!t.cobroPorProducto, comisionPct: t.comisionPct, promo: promoViva ? { pct: t.comisionPromo.pct, hasta: t.comisionPromo.hasta } : null,
    ajustes: Object.assign({}, D.ajustesCobro), solicitud: pl.solicitud, pagos: pl.pagos.slice(), tasaBs: TASA,
  };
}
/** El mismo día del mes siguiente (o el último, si ese mes no lo tiene). */
function sumarUnMes(ms) {
  const c = new Date(ms + CARACAS_MS);
  const y = c.getUTCFullYear(), m = c.getUTCMonth(), d = c.getUTCDate();
  const ultimo = new Date(Date.UTC(y, m + 2, 0)).getUTCDate();
  return Date.UTC(y, m + 1, Math.min(d, ultimo), c.getUTCHours(), c.getUTCMinutes()) - CARACAS_MS;
}
function luhn(n) {
  let suma = 0, doble = false;
  for (let i = n.length - 1; i >= 0; i--) { let x = Number(n.charAt(i)); if (doble) { x *= 2; if (x > 9) x -= 9; } suma += x; doble = !doble; }
  return suma % 10 === 0;
}
function requisitos(t) {
  const conFoto = D.productos.filter((p) => p.companyId === t.companyId && !p.borrado && p.images.length && p.precio > 0).length;
  const r = {
    productos: conFoto >= 3, horario: t.horarios.some((h) => !h.cerrado), ubicacion: isFinite(t.lat) && isFinite(t.lng),
    rif: /^[JGVE]\d{9}$/.test(t.rif || ''), cuenta: !!D.cuentaBancaria,
  };
  const faltan = [];
  if (!r.productos) faltan.push('Agrega ' + (3 - conFoto) + (3 - conFoto === 1 ? ' producto' : ' productos') + ' con foto y precio (tienes ' + conFoto + ' de 3).');
  if (!r.horario) faltan.push('Abre al menos un día en tu horario.');
  if (!r.ubicacion) faltan.push('Marca la ubicación de tu tienda.');
  if (!r.rif) faltan.push('Escribe un RIF válido.');
  if (!r.cuenta) faltan.push('Registra tu cuenta bancaria en la app.');
  return { r, faltan };
}
function vistaTienda(t) {
  return {
    storeId: t.storeId, companyId: t.companyId, nombre: t.nombre, direccion: t.direccion, telefono: telefonoParaVer(t.telefono),
    correo: t.correo, rif: t.rif, rifParaVer: t.rif ? t.rif.charAt(0) + '-' + t.rif.slice(1) : null,
    ubicacion: { lat: t.lat, lng: t.lng }, categoria: t.categoria, categorias: D.categorias,
    logo: t.logo, banner: t.banner, marcador: t.marcador,
    horarios: t.horarios.map((h) => Object.assign({}, h)),
    comisionPct: t.comisionPct, comisionPromo: t.comisionPromo, cobroPorProducto: !!t.cobroPorProducto,
    afiliada: t.authorized === 0 || t.authorized === 1 || t.authorized === 3, tipo: t.tipo, cuentaBancaria: D.cuentaBancaria,
    visibleEnApp: t.authorized === 1, soloFlota: t.authorized === 3, tieneFlota: !!t.flota, requisitos: requisitos(t).r,
  };
}

// ── El servidor ──────────────────────────────────────────────────────────────

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
};
const CABECERAS = { 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };

function servirArchivo(res, archivo) {
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

D = datosNuevos();

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(url.pathname);
  try {
    if (p.startsWith('/api/comercio/') || p === '/api/comercio') {
      // Un poco de espera, como la red de verdad.
      await new Promise((ok) => setTimeout(ok, 60 + Math.random() * 120));
      const r = await api(req, res, url);
      if (r && r.__archivo) {
        res.writeHead(200, Object.assign({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="' + r.__nombre + '"', 'Cache-Control': 'no-store' }, CABECERAS));
        res.end(r.__archivo);
        return;
      }
      responder(res, 200, r);
      return;
    }
    if (p.startsWith('/api/client/address/autocomplete/')) {
      const qtxt = p.slice('/api/client/address/autocomplete/'.length);
      responder(res, 200, { predictions: buscarLugares(qtxt).map((l) => ({ place_id: 'propio:' + l.lat + ',' + l.lng, description: l.nombre + ', ' + l.direccion, nombre: l.nombre, direccion: l.direccion })) });
      return;
    }
    if (p === '/api/client/address/donde') {
      const lat = Number(url.searchParams.get('latitude')), lng = Number(url.searchParams.get('longitude'));
      responder(res, 200, isFinite(lat) && isFinite(lng) ? { texto: lugarCercano(lat, lng) } : { texto: '' });
      return;
    }
    if (p.startsWith('/__simulado/')) {
      if (req.method === 'POST' && p === '/__simulado/reiniciar') { D = datosNuevos(); FALLAR_FOTOS = 0; PEDIR_FIRMA = false; responder(res, 200, { ok: true }); return; }
      if (req.method === 'POST' && p === '/__simulado/pedido-nuevo') {
        const id = Math.max(...D.pedidos.map((x) => x.id)) + 1;
        const pr = D.productos.find((x) => x.id === 9002), pr2 = D.productos.find((x) => x.id === 9009);
        const lineas = [{ productId: pr.id, nombre: pr.nombre, cantidad: 2, precioUsd: pr.precio, totalUsd: redondo(pr.precio * 2), opciones: [], nota: '' },
          { productId: pr2.id, nombre: pr2.nombre, cantidad: 1, precioUsd: 3, totalUsd: 3, opciones: [{ grupo: 'Tamaño', nombre: 'Grande', precioUsd: 1 }], nota: '' }];
        const productosUsd = redondo(lineas.reduce((x, l) => x + l.totalUsd, 0));
        D.pedidos.push({ id, storeId: 31, creado: Date.now(), estado: 1, entregado: null, lineas, productosUsd, envioUsd: 2, propinaUsd: 0, cliente: 'Andreína C.', paraRecoger: false, repartidor: null, canal: 'app', vendedor: null, cupon: null, vendedorUsd: 0, comision: 0.1, cobroModo: 'porcentaje', cobroUsd: redondo(productosUsd * 0.1), planComercio: 'premium', gananciaUsd: redondo(productosUsd * 0.9), abonado: false, motivo: null, calificacion: null, prueba: false });
        responder(res, 200, { ok: true, id }); return;
      }
      if (req.method === 'POST' && p === '/__simulado/vencer-sesiones') { for (const s of D.sesiones.values()) s.venceEn = Date.now() - 1000; responder(res, 200, { ok: true }); return; }
      if (req.method === 'POST' && p === '/__simulado/pedir-firma') { PEDIR_FIRMA = true; responder(res, 200, { ok: true }); return; }
      if (p === '/__simulado/ultima-foto') { responder(res, 200, ULTIMA_FOTO || {}); return; }
      if (p === '/__simulado/bitacora') { responder(res, 200, D.bitacora.slice(0, 50)); return; }
      responder(res, 404, { message: 'No encontrado.' }); return;
    }
    const foto = /^\/simulado\/fotos\/([a-z0-9-]+)\.svg$/.exec(p);
    if (foto) {
      res.writeHead(200, Object.assign({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=3600' }, CABECERAS));
      res.end(svgDeFoto(foto[1]));
      return;
    }
    const subida = /^\/simulado\/subidas\/([a-f0-9]{16})\.jpg$/.exec(p);
    if (subida && SUBIDAS.has(subida[1])) {
      res.writeHead(200, Object.assign({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'max-age=3600' }, CABECERAS));
      res.end(SUBIDAS.get(subida[1]));
      return;
    }
    if (p === '/' || p === '/comercio') { res.writeHead(302, { Location: '/comercio/' }); res.end(); return; }
    if (p.startsWith('/api/vendedor')) {
      const crudo = await leerCuerpo(req);
      let body = {};
      try { body = crudo.length ? JSON.parse(crudo.toString('utf8')) : {}; } catch (_) { body = {}; }
      const ruta = p.replace(/^\/api\/vendedor\/?/, '');
      const tokenOk = String(req.headers.authorization || '') === 'Bearer ' + promotorSimulado.token && promotorSimulado.token;
      if (req.method === 'POST' && ruta === 'acceso/codigo') { responder(res, 200, { ok: true, mensaje: 'Te enviamos un código por WhatsApp.' }); return; }
      if (req.method === 'POST' && ruta === 'acceso/verificar') {
        if (String(body.codigo) !== CODIGO) { responder(res, 400, { statusCode: 400, message: 'Ese código no es correcto o ya venció.' }); return; }
        promotorSimulado.token = crypto.randomBytes(32).toString('base64url');
        promotorSimulado.firmado = false;
        responder(res, 200, { ok: true, token: promotorSimulado.token, estado: 'activo' });
        return;
      }
      if (!tokenOk) { responder(res, 401, { statusCode: 401, message: 'Tu sesión terminó. Entra otra vez con tu WhatsApp.' }); return; }
      if (req.method === 'GET' && ruta === 'yo') {
        responder(res, 200, {
          vendedor: { nombre: 'Ana Rojas', estado: 'activo', telefono: '0412-555-0198' },
          datos: { nombre: 'Ana Rojas', razonSocial: null, tipoDocumento: 'V', documento: 'V18234567', documentoParaVer: 'V-18234567', correo: 'ana@correo.com' },
          faltanDatos: [], pedirSexo: false, pedirFoto: false, faltaFirma: !promotorSimulado.firmado,
        });
        return;
      }
      if (req.method === 'POST' && ruta === 'contrato') {
        if (!String(body.firma || '').startsWith('data:image/png;base64,')) { responder(res, 400, { statusCode: 400, message: 'Firma en el recuadro.' }); return; }
        promotorSimulado.firmado = true;
        responder(res, 200, { ok: true, correo: true });
        return;
      }
      if (req.method === 'POST' && ruta === 'acceso/salir') { promotorSimulado.token = ''; responder(res, 200, { ok: true }); return; }
      responder(res, 200, {});
      return;
    }
    if (p.startsWith('/comercio/') || p.startsWith('/vendedor/') || p.startsWith('/assets/')) {
      let rel = p.endsWith('/') ? p + 'index.html' : p;
      const archivo = path.normalize(path.join(RAIZ_WEB, rel));
      if (!archivo.startsWith(RAIZ_WEB + path.sep) || /\/\.[^/]/.test(rel)) { res.writeHead(404, CABECERAS); res.end('No está'); return; }
      servirArchivo(res, archivo);
      return;
    }
    res.writeHead(404, CABECERAS); res.end('No está');
  } catch (e) {
    if (e instanceof Fallo) { responder(res, e.status, Object.assign({ statusCode: e.status, message: e.message }, e.extra || {})); return; }
    console.error(e);
    responder(res, 500, { statusCode: 500, message: 'Internal server error' });
  }
});

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log('API del comercio simulada: http://localhost:' + PUERTO + '/comercio/  (código: ' + CODIGO + ')');
});
