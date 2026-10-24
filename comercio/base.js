/*
 * EL PANEL DEL COMERCIO (www.deliservy.com/comercio/, 24-oct-2026) — la base que usan todas las secciones.
 *
 * Gilberth: un panel web para cada comercio, hermano de la página del vendedor. Entra con su WhatsApp (código en 6
 * casillas) y ve su tienda: pedidos, productos, vendedores externos, billetera, flota, estadísticas y «Mi tienda».
 * Habla SOLO con la API de Deliservy (`https://api.deliservy.site/api/comercio/*`; en localhost, en relativo para las
 * pruebas), con un token en la cabecera `Authorization`.
 *
 * ⚠️ Nada de lo que viene del servidor se mete como HTML: todo se arma con `h()` y entra como TEXTO (o como atributo
 * ya revisado: solo fotos https y enlaces nuestros). La página lleva CSP: ningún guion ni estilo escrito dentro del
 * HTML. Un fallo aquí le robaría la sesión (y el dinero) a un comercio.
 *
 * Archivos (todos con `defer`, en este orden): base.js (esto) · mapa.js · fotos.js · graficas.js · pedidos.js ·
 * productos.js · vendedores.js · billetera.js · flota.js · estadisticas.js · tienda.js · app.js (la entrada y el marco).
 */
(function (raiz) {
  'use strict';

  var documento = raiz.document;
  var C = raiz.Comercio = raiz.Comercio || {};

  // ── Dónde está la API ──────────────────────────────────────────────────────
  /** '' (relativo: las pruebas locales) en localhost; en cualquier otro sitio, la dirección entera de la API. */
  function baseDeLaApi(host) {
    var nombre = String(host || '').toLowerCase();
    if (nombre === 'localhost' || nombre === '127.0.0.1' || nombre === '[::1]' || /\.localhost$/.test(nombre)) return '';
    return 'https://api.deliservy.site';
  }
  C.BASE = baseDeLaApi(raiz.location && raiz.location.hostname);
  C.API = C.BASE + '/api/comercio';
  C.baseDeLaApi = baseDeLaApi;
  C.CLAVE_SESION = 'deliservy_comercio_sesion';
  C.CLAVE_TIENDA = 'deliservy_comercio_tienda';
  C.CLAVE_IDIOMA = 'deliservy_idioma';
  C.WHATSAPP = 'https://wa.me/584144957006';
  var NBSP = ' ';

  // ── Números, dinero y fechas ───────────────────────────────────────────────

  function num(v) { var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v)); return isFinite(n) ? n : 0; }
  function redondo(n) { return Math.round(num(n) * 100) / 100; }
  function miles(n, decimales) {
    var d = decimales == null ? 2 : decimales;
    var partes = Math.abs(redondo(n)).toFixed(d).split('.');
    var entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (redondo(n) < 0 ? '−' : '') + entero + (d ? ',' + partes[1] : '');
  }
  /** «12,50 $» (el espacio no se parte en dos renglones). */
  function dolares(n) { return miles(n) + NBSP + '$'; }
  /** «18.452,30 Bs». */
  function bolivares(n) { return miles(n) + NBSP + 'Bs'; }
  function porcentaje(n) { return String(Math.round(num(n) * 100) / 100).replace('.', ',') + NBSP + '%'; }
  /** Con signo: «+2,00 $» o «−1,50 $». */
  function conSigno(n, formato) { var f = formato || dolares; return (num(n) > 0 ? '+' : '') + f(n); }
  /** Un monto para ponerlo en un campo: «4,50» (vacío si no hay). */
  function enCampo(n) { return n == null || n === '' || !isFinite(Number(n)) ? '' : (Math.round(Number(n) * 100) / 100).toFixed(2).replace('.', ','); }
  function plural(n, uno, varios) { var k = Math.round(num(n)); return k + ' ' + (k === 1 ? uno : varios); }
  /** Un número escrito por la persona («12,5» o «12.5») → número, o NaN. */
  function leerNumero(t) {
    var s = String(t == null ? '' : t).trim().replace(/\s/g, '');
    if (!s) return NaN;
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }

  var ZONA = 'America/Caracas';
  var CARACAS_MS = -4 * 3600 * 1000; // Venezuela: UTC−4, sin horario de verano
  function aFecha(iso) { var d = iso instanceof Date ? iso : new Date(iso); return iso && !isNaN(d.getTime()) ? d : null; }
  function formatear(iso, opciones) {
    var d = aFecha(iso);
    if (!d) return '';
    try { return d.toLocaleString('es-VE', Object.assign({ timeZone: ZONA }, opciones)); } catch (_) { return d.toLocaleString(); }
  }
  /** «24 oct., 5:07 p. m.» */
  function fechaHora(iso) { return formatear(iso, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }
  /** «24 oct. 2026» */
  function fechaCorta(iso) { return formatear(iso, { day: 'numeric', month: 'short', year: 'numeric' }); }
  /** «28 nov.» (con el año solo si no es este). */
  function diaMes(iso) {
    var d = aFecha(iso);
    if (!d) return '';
    var mismoAnio = diaCaracas(d.getTime()).slice(0, 4) === diaCaracas().slice(0, 4);
    return formatear(iso, mismoAnio ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  }
  /** «5:07 p. m.» */
  function hora(iso) { return formatear(iso, { hour: 'numeric', minute: '2-digit' }); }
  /** «jueves 30 oct.» */
  function diaYFecha(iso) { return formatear(iso, { weekday: 'long', day: 'numeric', month: 'short' }); }
  /** 'AAAA-MM-DD' de hoy (o de un instante) en Caracas. */
  function diaCaracas(ms) { return new Date((ms == null ? Date.now() : ms) + CARACAS_MS).toISOString().slice(0, 10); }
  function sumarDias(dia, n) { var d = new Date(dia + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function lunesDe(dia) { var d = new Date(dia + 'T12:00:00Z'); return sumarDias(dia, -((d.getUTCDay() + 6) % 7)); }
  function diaDeLaSemana(dia) { return new Date(dia + 'T12:00:00Z').getUTCDay(); }
  function primeroDelMes(dia) { return dia.slice(0, 8) + '01'; }
  function ultimoDelMes(dia) { var d = new Date(Date.UTC(+dia.slice(0, 4), +dia.slice(5, 7), 0, 12)); return d.toISOString().slice(0, 10); }
  function sumarMeses(mes, n) { var d = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7) - 1 + n, 1, 12)); return d.toISOString().slice(0, 7); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  /** «24 oct» de un 'AAAA-MM-DD' (sin pasar por zonas). */
  function diaCorto(dia) { return Number(dia.slice(8, 10)) + ' ' + MESES_CORTOS[Number(dia.slice(5, 7)) - 1]; }
  function nombreDelMes(mes) { return MESES[Number(mes.slice(5, 7)) - 1] + ' ' + mes.slice(0, 4); }
  /** El rango de un modo (día, semana o mes) alrededor de un día: { desde, hasta } en 'AAAA-MM-DD'. */
  function rangoDe(modo, dia) {
    if (modo === 'semana') { var l = lunesDe(dia); return { desde: l, hasta: sumarDias(l, 6) }; }
    if (modo === 'mes') return { desde: primeroDelMes(dia), hasta: ultimoDelMes(dia) };
    return { desde: dia, hasta: dia };
  }
  /** Cómo se lee ese rango: «hoy», «24 oct», «20 – 26 oct», «octubre 2026». */
  function textoDelRango(modo, r) {
    if (modo === 'mes') return nombreDelMes(r.desde.slice(0, 7));
    if (modo === 'semana') {
      return r.desde.slice(5, 7) === r.hasta.slice(5, 7) ? Number(r.desde.slice(8, 10)) + ' – ' + diaCorto(r.hasta) : diaCorto(r.desde) + ' – ' + diaCorto(r.hasta);
    }
    var hoy = diaCaracas();
    if (r.desde === hoy) return 'Hoy';
    if (r.desde === sumarDias(hoy, -1)) return 'Ayer';
    return DIAS[diaDeLaSemana(r.desde)] + ' ' + diaCorto(r.desde);
  }

  /** «0412-555-0198» (un móvil de Venezuela); otro número, como venga. */
  function telefonoParaVer(t) {
    var d = String(t == null ? '' : t).replace(/\D/g, '');
    if (d.length === 12 && d.slice(0, 2) === '58') d = '0' + d.slice(2);
    else if (d.length === 10 && d.charAt(0) === '4') d = '0' + d;
    return /^0\d{10}$/.test(d) ? d.slice(0, 4) + '-' + d.slice(4, 7) + '-' + d.slice(7) : String(t == null ? '' : t).trim();
  }
  /** Un teléfono de Venezuela bien escrito (10 u 11 cifras, o con el 58). */
  function telefonoValido(t) {
    var d = String(t == null ? '' : t).replace(/\D/g, '');
    if (d.length === 12 && d.slice(0, 2) === '58') d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return /^[24]\d{9}$/.test(d);
  }
  function inicial(t) { var s = String(t == null ? '' : t).trim(); return s ? s.charAt(0).toUpperCase() : 'D'; }
  function sinTildes(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  // ── Lo que entra en un atributo, revisado ──────────────────────────────────

  /** Solo fotos https (el almacén de la app) o de esta misma web. */
  function fotoSegura(u) {
    var s = String(u == null ? '' : u).trim();
    return /^https:\/\/[^\s"'<>\\]+$/.test(s) || /^\/(?!\/)[^\s"'<>\\]*$/.test(s) ? s : '';
  }
  /** Un enlace: https, de esta web, un ancla, o un teléfono. */
  function hrefSeguro(v) {
    var s = String(v == null ? '' : v);
    return /^(https:\/\/[^\s"'<>\\]+|#[\w\-/]*|\/(?!\/)[^\s"'<>\\]*|tel:\+?\d{7,15})$/.test(s) ? s : null;
  }

  // ── Armar la página (el texto entra SIEMPRE como texto) ─────────────────────

  function h(tag, props) {
    var el = documento.createElement(tag);
    if (props) {
      for (var k in props) {
        if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k.slice(0, 2) === 'on') { if (typeof v === 'function') el.addEventListener(k.slice(2), v); }
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (k === 'href') { var seguro = hrefSeguro(v); if (seguro) el.setAttribute('href', seguro); }
        else if (k === 'src') { var foto = fotoSegura(v); if (foto) el.setAttribute('src', foto); }
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      }
    }
    for (var i = 2; i < arguments.length; i++) poner(el, arguments[i]);
    return el;
  }
  function poner(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { for (var i = 0; i < c.length; i++) poner(el, c[i]); return; }
    el.appendChild(typeof c === 'object' && c.nodeType ? c : documento.createTextNode(String(c)));
  }
  /** Un dato que viene de la base: nunca se traduce (la capa de idioma lo deja como está). */
  function dato(tag, props, texto) { props = props || {}; props['data-idioma'] = 'no'; return h(tag, props, texto); }
  function vaciar(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function reemplazar(el, nodos) { vaciar(el); poner(el, nodos); }
  /** Entre dos cosas, « · ». */
  function unidos(lista, sep) { return lista.filter(function (x) { return x != null && x !== '' && x !== false; }).reduce(function (a, x, i) { return a.concat(i ? [sep || ' · ', x] : [x]); }, []); }

  // Los iconos: figuras fijas (24 × 24, de trazo), sin datos dentro.
  var NS = 'http://www.w3.org/2000/svg';
  var ICONOS = {
    hoy: ['M3 11.5 12 4l9 7.5', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
    pedidos: ['M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z', 'M9 8h6M9 12h6M9 16h3'],
    productos: ['M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z', 'M3.5 7.5 12 12l8.5-4.5', 'M12 12v9'],
    vendedores: ['M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 6a8.5 8.5 0 0 1 0 12'],
    billetera: ['M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3', 'M3 7.5v10A2.5 2.5 0 0 0 5.5 20H20V8H5.5A2.5 2.5 0 0 1 3 7.5z', 'M16 14h.01'],
    flota: ['M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M9 17h6l-2.5-6H8', 'M14 8h2.5l2.5 9', 'M6 11h3'],
    estadisticas: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
    tienda: ['M4 9l1.5-5h13L20 9', 'M4 9a2.7 2.7 0 0 0 5.3 0a2.7 2.7 0 0 0 5.4 0a2.7 2.7 0 0 0 5.3 0', 'M5 10.5V20h14v-9.5', 'M10 20v-5h4v5'],
    mas: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
    salir: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 17l-5-5 5-5', 'M5 12h11'],
    buscar: ['M4.5 11a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0', 'M16 16l4.5 4.5'],
    agregar: ['M12 5v14', 'M5 12h14'],
    editar: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
    borrar: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6M14 11v6'],
    copiar: ['M9 9h11v11H9z', 'M5 15V4h11'],
    foto: ['M4 7h3l2-3h6l2 3h3v13H4z', 'M9 13a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
    subir: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 16v4h16v-4'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    x: ['M6 6l12 12', 'M18 6L6 18'],
    atras: ['M15 5l-7 7 7 7'],
    adelante: ['M9 5l7 7-7 7'],
    abajo: ['m6 9 6 6 6-6'],
    calendario: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v5M16 3v5'],
    descargar: ['M12 4v12', 'M7 11l5 5 5-5', 'M4 20h16'],
    campana: ['M6 10a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7', 'M10 20a2 2 0 0 0 4 0'],
    sonido: ['M4 9v6h4l5 4V5L8 9z', 'M16 9a4 4 0 0 1 0 6', 'M18.5 6.5a7.5 7.5 0 0 1 0 11'],
    ubicacion: ['M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z', 'M9.5 9a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0'],
    telefono: ['M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2'],
    whatsapp: ['M4 20l1.3-4A8 8 0 1 1 8 18.7z', 'M9.5 9.5c.4 2 2 3.6 4 4'],
    reloj: ['M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0', 'M12 7.5V12l3 2'],
    alerta: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
    info: ['M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0', 'M12 11v5', 'M12 8h.01'],
    estrella: ['M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z'],
    enviar: ['M4 12l16-8-6 16-2.5-6.5z', 'M11.5 13.5 20 4'],
    chat: ['M4 19l1.5-3.8A7.5 7.5 0 1 1 8.3 18z'],
    mapa: ['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z', 'M9 4v14', 'M15 6v14'],
    moto: ['M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M9 17h6l-2.5-6H8', 'M14 8h2.5l2.5 9'],
    candado: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
    personas: ['M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z', 'M3 20a6 6 0 0 1 12 0', 'M16 4.5a3.5 3.5 0 0 1 0 6.5', 'M18 14a6 6 0 0 1 3 6'],
    paquete: ['M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z', 'M3.5 7.5 12 12l8.5-4.5'],
    banco: ['M3 10l9-6 9 6', 'M5 10v8', 'M9.5 10v8', 'M14.5 10v8', 'M19 10v8', 'M3 20h18'],
    ojo: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'M9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0'],
    recargar: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 5v6h-6'],
    filtro: ['M4 5h16l-6 7v6l-4 2v-8z'],
  };
  function ico(nombre, clase) {
    var svg = documento.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'ico' + (clase ? ' ' + clase : ''));
    svg.setAttribute('aria-hidden', 'true');
    (ICONOS[nombre] || []).forEach(function (d) {
      var p = documento.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }
  /** Un elemento SVG con sus atributos (para las gráficas y los pines). */
  function svg(tag, attrs) {
    var el = documento.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k) && attrs[k] != null) el.setAttribute(k, String(attrs[k]));
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(x); });
      else if (c.nodeType) el.appendChild(c);
      else el.appendChild(documento.createTextNode(String(c)));
    }
    return el;
  }

  // ── El almacén de este navegador (siempre con try/catch) ────────────────────

  var almacen = {
    leer: function (k) { try { var v = raiz.localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (_) { return null; } },
    guardar: function (k, v) {
      try { if (v == null) raiz.localStorage.removeItem(k); else raiz.localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sin almacén: sigue igual */ }
    },
  };
  var enMemoria = null;
  var sesion = {
    leer: function () {
      try { var t = raiz.localStorage.getItem(C.CLAVE_SESION); if (t && /^[A-Za-z0-9_-]{43}$/.test(t)) return t; } catch (_) { /* sin almacén: en memoria */ }
      return enMemoria;
    },
    guardar: function (t) {
      enMemoria = t;
      try { raiz.localStorage.setItem(C.CLAVE_SESION, t); } catch (_) { /* queda en memoria mientras la página esté abierta */ }
    },
    borrar: function () {
      enMemoria = null;
      try { raiz.localStorage.removeItem(C.CLAVE_SESION); } catch (_) { /* nada */ }
    },
  };

  // ── La red ─────────────────────────────────────────────────────────────────

  var SIN_CONEXION = 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  var ALGO_MAL = 'Algo salió mal. Intenta de nuevo.';
  var MUCHOS_INTENTOS = 'Hiciste muchos intentos seguidos. Espera un minuto y vuelve a intentarlo.';

  /** El mensaje de un error de la API, en una frase (nunca el «Internal server error» crudo). */
  function mensajeDe(status, j) {
    var m = j && j.message;
    if (Array.isArray(m)) m = m.join(' ');
    if (m && typeof m === 'object' && typeof m.message === 'string') m = m.message;
    m = typeof m === 'string' ? m.trim() : '';
    if (status === 429 && (!m || /Throttler|Too Many/i.test(m))) return MUCHOS_INTENTOS;
    if (!m || /Internal server error|Validation failed|Cannot (GET|POST|PATCH|PUT|DELETE)|Bad Request|Forbidden resource/i.test(m)) {
      return status === 403 ? 'No tienes permiso para esto.' : status === 404 ? 'No encontrado.' : ALGO_MAL;
    }
    return m;
  }

  /**
   * Una petición a la API del comercio. `ruta` relativa a /api/comercio (o entera si empieza por /api/). Devuelve el
   * JSON; si falla, un Error con `status`, `message` (la frase del servidor) y `datos` (todo el cuerpo: `faltan`, …).
   * Un 401 con sesión es que la sesión terminó: avisa a `C.alTerminarLaSesion`.
   */
  function pedir(metodo, ruta, cuerpo, opciones) {
    opciones = opciones || {};
    var url = ruta.indexOf('/api/') === 0 ? C.BASE + ruta : C.API + ruta;
    var cab = { Accept: 'application/json' };
    var token = opciones.sinSesion ? null : sesion.leer();
    if (token) cab.Authorization = 'Bearer ' + token;
    var op = { method: metodo, credentials: 'omit', cache: 'no-store', headers: cab, referrerPolicy: 'no-referrer' };
    if (cuerpo instanceof raiz.FormData) op.body = cuerpo;
    else if (cuerpo !== undefined) { cab['Content-Type'] = 'application/json'; op.body = JSON.stringify(cuerpo); }
    var ctrl = typeof raiz.AbortController === 'function' ? new raiz.AbortController() : null;
    if (ctrl) op.signal = ctrl.signal;
    var reloj = ctrl ? setTimeout(function () { ctrl.abort(); }, opciones.espera || 30000) : null;
    return raiz.fetch(url, op).then(function (r) {
      clearTimeout(reloj);
      if (opciones.archivo && r.ok) return r.blob().then(function (b) { return { blob: b, nombre: nombreDelArchivo(r.headers.get('Content-Disposition')) }; });
      return r.text().then(function (txt) {
        var j = null;
        try { j = txt ? JSON.parse(txt) : null; } catch (_) { j = null; }
        if (r.ok) return j == null ? {} : j;
        var e = new Error(mensajeDe(r.status, j));
        e.status = r.status;
        e.datos = j || {};
        if (r.status === 401 && token && !opciones.sinSesion && typeof C.alTerminarLaSesion === 'function') C.alTerminarLaSesion(e.message);
        throw e;
      });
    }, function () {
      clearTimeout(reloj);
      var e = new Error(SIN_CONEXION);
      e.status = 0;
      throw e;
    });
  }
  function nombreDelArchivo(cd) {
    var m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd || '');
    var n = m ? decodeURIComponent(m[1]) : '';
    return /^[\w.\-]{1,120}$/.test(n) ? n : '';
  }
  /** Guarda un archivo en el teléfono o la computadora (sin abrir nada de fuera). */
  function guardarArchivo(blob, nombre) {
    var url = raiz.URL.createObjectURL(blob);
    var a = documento.createElement('a');
    a.href = url;
    a.download = nombre || 'deliservy.csv';
    a.rel = 'noopener';
    documento.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { raiz.URL.revokeObjectURL(url); }, 4000);
  }

  /**
   * Un CSV que abre bien en Excel en español: separado por «;», con BOM UTF-8 y montos con coma decimal (como el que
   * da la API en «Exportar» de Pedidos). Una celda que empieza por = + − @ va con ' delante (que Excel no la ejecute).
   */
  function csvDe(filas) {
    var celda = function (v) {
      var t;
      if (typeof v === 'number') t = String(Math.round(v * 100) / 100).replace('.', ',');
      else {
        t = String(v == null ? '' : v);
        if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
      }
      return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    };
    return '﻿' + filas.map(function (f) { return f.map(celda).join(';'); }).join('\r\n') + '\r\n';
  }
  function descargarCsv(nombre, filas) { guardarArchivo(new raiz.Blob([csvDe(filas)], { type: 'text/csv;charset=utf-8' }), nombre); }
  /** Fecha y hora de Caracas para una celda: ['2026-10-24', '17:05']. */
  function fechaParaCsv(iso) {
    var d = aFecha(iso);
    if (!d) return ['', ''];
    var c = new Date(d.getTime() + CARACAS_MS).toISOString();
    return [c.slice(0, 10), c.slice(11, 16)];
  }

  // ── Piezas de pantalla ─────────────────────────────────────────────────────

  var relojAviso = null;
  /** Un aviso corto abajo («Guardado»). `tono`: 'mal' para errores. */
  function avisar(texto, tono) {
    var viejo = documento.querySelector('.aviso');
    if (viejo) viejo.remove();
    var el = h('div', { class: 'aviso' + (tono === 'mal' ? ' mal' : ''), role: tono === 'mal' ? 'alert' : 'status' }, texto);
    documento.body.appendChild(el);
    clearTimeout(relojAviso);
    relojAviso = setTimeout(function () { el.remove(); }, tono === 'mal' ? 4200 : 2600);
  }

  function copiar(texto) {
    var t = String(texto || '');
    if (!t) return;
    var viejo = function () {
      var a = h('textarea', { readonly: true, class: 'sr' });
      a.value = t;
      documento.body.appendChild(a);
      a.select();
      try { documento.execCommand('copy'); avisar('Copiado'); } catch (_) { avisar('No se pudo copiar: mantén presionado el texto', 'mal'); }
      a.remove();
    };
    if (raiz.navigator.clipboard && raiz.isSecureContext) raiz.navigator.clipboard.writeText(t).then(function () { avisar('Copiado'); }, viejo);
    else viejo();
  }

  /** La ventana de encima (en el teléfono, una hoja que sube). Devuelve { capa, cuerpo, cerrar }. */
  var abiertas = [];
  function abrirDialogo(o) {
    var anterior = documento.activeElement;
    var cuerpo = h('div', { class: 'dialogo-cuerpo' }, o.cuerpo);
    var titulo = h('h2', { id: 'dlg-' + (abiertas.length + 1) }, o.titulo || '');
    var cerrarBtn = h('button', { class: 'cerrar-dlg', type: 'button', 'aria-label': 'Cerrar' }, ico('x'));
    var caja = h('div', { class: 'dialogo' + (o.ancho ? ' ancho' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titulo.id, tabindex: '-1' },
      h('div', { class: 'asa', 'aria-hidden': 'true' }),
      h('div', { class: 'dialogo-cab' }, titulo, cerrarBtn), cuerpo, o.pie ? h('div', { class: 'dialogo-pie' }, o.pie) : null);
    var capa = h('div', { class: 'capa-dialogo' }, h('div', { class: 'velo' }), caja);
    var hecho = false;
    var d = {
      capa: capa, cuerpo: cuerpo, caja: caja,
      cerrar: function () {
        if (hecho) return;
        hecho = true;
        capa.remove();
        abiertas = abiertas.filter(function (x) { return x !== d; });
        if (!abiertas.length) documento.body.classList.remove('con-dialogo');
        if (o.alCerrar) { try { o.alCerrar(); } catch (_) { /* nada */ } }
        if (anterior && anterior.focus && documento.body.contains(anterior)) { try { anterior.focus({ preventScroll: true }); } catch (_) { /* nada */ } }
      },
    };
    capa.firstChild.addEventListener('click', function () { if (!o.fijo) d.cerrar(); });
    cerrarBtn.addEventListener('click', d.cerrar);
    abiertas.push(d);
    documento.body.appendChild(capa);
    documento.body.classList.add('con-dialogo');
    setTimeout(function () {
      // El primer campo para escribir (no una casilla ni un radio: su anillo de foco confunde al abrir).
      var foco = caja.querySelector('[autofocus]') || caja.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([disabled]):not(.codigo-oculto), select, textarea') || caja.querySelector('.codigo-oculto') || caja;
      try { foco.focus({ preventScroll: true }); } catch (_) { /* nada */ }
    }, 30);
    return d;
  }
  function cerrarDialogos() { abiertas.slice().forEach(function (d) { d.cerrar(); }); }
  documento.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && abiertas.length) abiertas[abiertas.length - 1].cerrar(); });

  /** «¿Seguro?» en una ventana nuestra (no la del navegador). Devuelve una promesa con true o false. */
  function confirmar(o) {
    return new Promise(function (ok) {
      var respondido = false;
      var si = h('button', { class: 'btn' + (o.peligro ? ' peligro' : ''), type: 'button' }, o.si || 'Sí');
      var no = h('button', { class: 'btn borde', type: 'button' }, o.no || 'Cancelar');
      var d = abrirDialogo({
        titulo: o.titulo, cuerpo: o.texto ? h('p', { class: 'nota' }, o.texto) : null, pie: [no, si],
        alCerrar: function () { if (!respondido) ok(false); },
      });
      si.addEventListener('click', function () { respondido = true; d.cerrar(); ok(true); });
      no.addEventListener('click', function () { respondido = true; d.cerrar(); ok(false); });
      setTimeout(function () { try { si.focus(); } catch (_) { /* nada */ } }, 40);
    });
  }

  /**
   * El código en 6 casillas (como la página del vendedor): un solo campo invisible encima de las seis, así el teléfono
   * lo autocompleta desde WhatsApp y se puede pegar. Al escribir el sexto número, `alCompletar(codigo)`.
   */
  function casillasDeCodigo(id, alCompletar) {
    var input = h('input', {
      class: 'codigo-oculto', id: id, name: id, type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code',
      maxlength: '6', pattern: '[0-9]*', enterkeyhint: 'done', 'aria-label': 'Código de 6 números',
    });
    var casillas = h('div', { class: 'casillas', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4, 5].map(function () { return h('span'); }));
    var mandado = '';
    var dibujar = function (ev) {
      var v = String(input.value || '').replace(/\D/g, '').slice(0, 6);
      if (v !== input.value) input.value = v;
      for (var k = 0; k < 6; k++) {
        var c = casillas.children[k];
        c.textContent = v.charAt(k);
        c.className = documento.activeElement === input && k === Math.min(v.length, 5) ? 'foco' : '';
      }
      if (v.length < 6) mandado = '';
      else if (ev && ev.type === 'input' && v !== mandado && alCompletar) { mandado = v; alCompletar(v); }
    };
    input.addEventListener('input', dibujar);
    input.addEventListener('focus', dibujar);
    input.addEventListener('blur', dibujar);
    dibujar();
    return {
      caja: h('div', { class: 'codigo-6' }, casillas, input), input: input,
      valor: function () { return String(input.value || '').replace(/\D/g, ''); },
      limpiar: function () { input.value = ''; mandado = ''; dibujar(); },
    };
  }

  /** Un campo con su rótulo, su ayuda y su error debajo. */
  function campo(id, rotulo, control, o) {
    o = o || {};
    if (o.error && control && control.classList) { control.classList.add('mal'); control.setAttribute('aria-invalid', 'true'); }
    return h('div', { class: 'grupo-campo' + (o.clase ? ' ' + o.clase : '') },
      rotulo ? h('label', { class: 'etq-campo', for: id }, rotulo) : null,
      control,
      o.ayuda ? h('p', { class: 'ayuda' }, o.ayuda) : null,
      h('p', { class: 'error-campo', role: 'alert', hidden: !o.error }, o.error || ''));
  }
  /** Pone (o quita) el error debajo de un campo armado con `campo()`. */
  function errorEnCampo(control, texto) {
    var grupo = control && control.closest ? control.closest('.grupo-campo') : null;
    if (!grupo) return;
    var p = grupo.querySelector('.error-campo');
    if (p) { p.textContent = texto || ''; p.hidden = !texto; }
    control.classList.toggle('mal', !!texto);
    if (texto) control.setAttribute('aria-invalid', 'true'); else control.removeAttribute('aria-invalid');
  }
  function entrada(props) { return h('input', Object.assign({ class: 'campo', autocomplete: 'off' }, props || {})); }

  /** Un interruptor (casilla con forma de interruptor). */
  function interruptor(id, encendido, rotulo, alCambiar, o) {
    o = o || {};
    var input = h('input', { type: 'checkbox', id: id, role: 'switch', checked: !!encendido, disabled: !!o.apagado });
    if (alCambiar) input.addEventListener('change', function () { alCambiar(input.checked, input); });
    return {
      input: input,
      caja: h('label', { class: 'interruptor' + (o.clase ? ' ' + o.clase : ''), for: id }, input, h('span', { class: 'pista', 'aria-hidden': 'true' }), rotulo ? h('span', { class: 'rotulo' }, rotulo) : null),
    };
  }

  /** Botones de una sola elección (como pestañas pequeñas). `opciones`: [[valor, texto]]. */
  function segmentos(nombre, opciones, elegido, alCambiar, clase) {
    // `clase` puede llevar 'envolver' (en el teléfono, las opciones bajan a otro renglón en vez de cortarse).
    var caja = h('div', { class: 'segmentos' + (clase ? ' ' + clase : ''), role: 'tablist', 'aria-label': nombre });
    opciones.forEach(function (op) {
      var b = h('button', { type: 'button', role: 'tab', 'aria-selected': String(op[0] === elegido), 'data-valor': op[0] }, op[1]);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(caja.children, function (x) { x.setAttribute('aria-selected', String(x === b)); });
        alCambiar(op[0]);
      });
      caja.appendChild(b);
    });
    return caja;
  }

  function cargando(texto) { return h('div', { class: 'cargando' }, h('span', { class: 'rueda', 'aria-hidden': 'true' }), h('span', null, texto || 'Cargando…')); }
  function vacio(titulo, texto, extra, icono) {
    return h('div', { class: 'tarjeta vacio' }, icono ? ico(icono) : null, h('b', null, titulo), texto ? h('p', { class: 'nota' }, texto) : null, extra || null);
  }
  function pill(texto, tono) { return h('span', { class: 'pill' + (tono ? ' ' + tono : '') }, texto); }
  function boton(texto, props, icono) {
    props = Object.assign({ type: 'button', class: 'btn' }, props || {});
    return h('button', props, icono ? ico(icono) : null, texto);
  }
  /** Un botón que se apaga mientras trabaja (y vuelve a encenderse al terminar). */
  function trabajando(btn, promesa) {
    if (!btn) return promesa;
    btn.disabled = true;
    btn.classList.add('ocupado');
    var fin = function () { btn.disabled = false; btn.classList.remove('ocupado'); };
    return promesa.then(function (r) { fin(); return r; }, function (e) { fin(); throw e; });
  }
  /** Una tarjeta de «no se pudo cargar», con «Reintentar». */
  function tarjetaError(e, reintentar) {
    return h('div', { class: 'tarjeta vacio' }, ico('alerta'), h('b', null, 'No se pudo cargar'), h('p', { class: 'nota' }, (e && e.message) || ALGO_MAL),
      reintentar ? h('div', { class: 'botones centro' }, boton('Reintentar', { class: 'btn chico', onclick: reintentar }, 'recargar')) : null);
  }
  function cabeceraDeSeccion(titulo, sub, acciones) {
    return h('div', { class: 'cab-seccion' }, h('div', { class: 'txt' }, h('h1', null, titulo), sub ? h('p', { class: 'sub' }, sub) : null),
      acciones ? h('div', { class: 'acciones' }, acciones) : null);
  }
  function cifra(rotulo, valor, tono, nota) {
    return h('div', { class: 'cifra' + (tono ? ' ' + tono : '') }, h('small', null, rotulo), h('b', null, valor), nota ? h('span', { class: 'nota-cifra' }, nota) : null);
  }
  function estrellas(n) {
    var k = Math.max(0, Math.min(5, Math.round(num(n))));
    var caja = h('span', { class: 'estrellas', role: 'img', 'aria-label': k + ' de 5 estrellas' });
    for (var i = 1; i <= 5; i++) caja.appendChild(ico('estrella', i <= k ? 'llena' : ''));
    return caja;
  }

  // ── Los pedidos: estados y formas que pueden venir ─────────────────────────

  /** Cómo se lee un estado (los de la app: 1 Nuevo/Preparando, 50 reservado, 100 asignado, 101 recogido…). */
  function estadoDelPedido(estado, paraRecoger, visto) {
    var e = Math.round(num(estado));
    if (e === 0) return ['Creado', ''];
    if (e === 1) return visto ? ['Preparando', 'ambar'] : ['Nuevo', 'roja'];
    if (e === 50) return ['Reservado', 'azul'];
    if (e === 100) return paraRecoger ? ['Listo para recoger', 'azul'] : ['Repartidor asignado', 'azul'];
    if (e > 100 && e < 200) return ['En camino al cliente', 'verde'];
    if (e >= 200 && e < 400) return ['Entregado', 'verde'];
    if (e >= 400) return ['Cancelado', 'gris'];
    return ['En curso', ''];
  }
  function lineaDeProductos(lista) {
    return (lista || []).map(function (p) {
      var n = Math.max(1, Math.round(num(p.cantidad != null ? p.cantidad : p.quantity)));
      return n + '× ' + String(p.nombre || p.name || 'Producto');
    }).join('\n');
  }
  /**
   * Un pedido en una lista, venga como venga: el resumen del contrato (`id, creadoEn, estado, totalUsd, titulo,
   * comanda`) o la entidad de `manager/request/near` (`id, status, createdAt, total, products, deliveryman, …`).
   */
  function resumenDePedido(x) {
    x = x || {};
    var productos = x.productos || x.products || null;
    var rep = x.repartidor != null ? x.repartidor : x.deliveryman;
    return {
      id: Math.round(num(x.id != null ? x.id : x.orderId)),
      creadoEn: x.creadoEn || x.createdAt || null,
      estado: Math.round(num(x.estado != null ? x.estado : x.status)),
      totalUsd: num(x.totalUsd != null ? x.totalUsd : x.total),
      gananciaUsd: x.gananciaUsd != null ? num(x.gananciaUsd) : null,
      comanda: typeof x.comanda === 'string' && x.comanda ? x.comanda : lineaDeProductos(productos),
      titulo: typeof x.titulo === 'string' ? x.titulo : '',
      cliente: typeof x.cliente === 'string' ? x.cliente : (x.cliente && x.cliente.nombre) || (x.user && x.user.fullName) || '',
      paraRecoger: x.paraRecoger === true || x.isPickup === true,
      repartidor: typeof rep === 'string' ? rep : rep ? (rep.nombre || rep.fullName || '') : '',
      cartel: x.cartel && typeof x.cartel === 'object' ? x.cartel : null,
      canalTexto: typeof x.canalTexto === 'string' ? x.canalTexto : '',
      devolucion: x.devolucion || null,
    };
  }

  // Lo que se exporta (para las otras secciones y las pruebas).
  Object.assign(C, {
    documento: documento, num: num, redondo: redondo, miles: miles, dolares: dolares, bolivares: bolivares, porcentaje: porcentaje,
    conSigno: conSigno, plural: plural, leerNumero: leerNumero, enCampo: enCampo,
    aFecha: aFecha, fechaHora: fechaHora, fechaCorta: fechaCorta, diaMes: diaMes, hora: hora, diaYFecha: diaYFecha, diaCaracas: diaCaracas,
    sumarDias: sumarDias, lunesDe: lunesDe, diaDeLaSemana: diaDeLaSemana, primeroDelMes: primeroDelMes, ultimoDelMes: ultimoDelMes,
    sumarMeses: sumarMeses, diaCorto: diaCorto, nombreDelMes: nombreDelMes, rangoDe: rangoDe, textoDelRango: textoDelRango,
    MESES: MESES, MESES_CORTOS: MESES_CORTOS, DIAS: DIAS, CARACAS_MS: CARACAS_MS,
    telefonoParaVer: telefonoParaVer, telefonoValido: telefonoValido, inicial: inicial, sinTildes: sinTildes,
    fotoSegura: fotoSegura, hrefSeguro: hrefSeguro,
    h: h, poner: poner, dato: dato, vaciar: vaciar, reemplazar: reemplazar, unidos: unidos, ico: ico, svg: svg, NS: NS,
    almacen: almacen, sesion: sesion, pedir: pedir, mensajeDe: mensajeDe, guardarArchivo: guardarArchivo,
    csvDe: csvDe, descargarCsv: descargarCsv, fechaParaCsv: fechaParaCsv,
    avisar: avisar, copiar: copiar, abrirDialogo: abrirDialogo, cerrarDialogos: cerrarDialogos, confirmar: confirmar,
    casillasDeCodigo: casillasDeCodigo, campo: campo, errorEnCampo: errorEnCampo, entrada: entrada, interruptor: interruptor,
    segmentos: segmentos, cargando: cargando, vacio: vacio, pill: pill, boton: boton, trabajando: trabajando,
    tarjetaError: tarjetaError, cabeceraDeSeccion: cabeceraDeSeccion, cifra: cifra, estrellas: estrellas,
    estadoDelPedido: estadoDelPedido, resumenDePedido: resumenDePedido, lineaDeProductos: lineaDeProductos,
    SIN_CONEXION: SIN_CONEXION, ALGO_MAL: ALGO_MAL,
  });

  // ── Cada vista con sus relojes (al cambiar de sección se apagan solos) ──────

  var vistaActual = null;
  /**
   * Empieza una vista nueva y apaga la anterior: sus relojes (`cada`), sus mapas y lo que haya pedido limpiar
   * (`alSalir`). Una respuesta que llega tarde mira `viva()` antes de pintar.
   */
  C.nuevaVista = function () {
    if (vistaActual) vistaActual.apagar();
    var relojes = [];
    var limpiezas = [];
    var viva = true;
    var v = {
      viva: function () { return viva && vistaActual === v; },
      cada: function (ms, fn) { var id = setInterval(function () { if (v.viva()) fn(); }, ms); relojes.push(id); return id; },
      luego: function (ms, fn) { var id = setTimeout(function () { if (v.viva()) fn(); }, ms); relojes.push(id); return id; },
      alSalir: function (fn) { limpiezas.push(fn); },
      apagar: function () {
        viva = false;
        relojes.forEach(function (id) { clearInterval(id); clearTimeout(id); });
        limpiezas.forEach(function (fn) { try { fn(); } catch (_) { /* nada */ } });
        relojes = []; limpiezas = [];
      },
    };
    vistaActual = v;
    return v;
  };
  C.secciones = C.secciones || {};
})(window);
