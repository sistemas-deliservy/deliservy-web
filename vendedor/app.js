/*
 * LA PÁGINA DE LOS PROMOTORES (www.deliservy.com/vendedor/, 24-oct-2026; rediseño 30-oct-2026): «Promotores Deliservy».
 *
 * Rediseño del 30-oct-2026 (CONTRATO-rediseno.md §1–3, pantallas P2, P3, P5, P7, P8): todo lo que se VE dice
 * «promotor/promotores» (los nombres internos —`vendedor`, `/api/vendedor/*`, esta carpeta— se quedan para no romper
 * nada); catálogo por tiendas (`GET catalogo/tiendas`) con rubros en botones, «Ganan más esta semana» y la tienda
 * abierta con «Ordenar» y «Ver más» (`orden`, `pagina`); compartir con la imagen para historia (lienzo 1080 × 1920 con
 * el QR del enlace, `vendor/qrcode.js`, MIT) y el texto con el enlace; registro en 2 pasos (WhatsApp + código → nombre y
 * red principal: los datos fiscales se piden al cobrar) y el promotor `pendiente` ya navega (Inicio, Catálogo, Enlaces).
 *
 * Gilberth: «para el lado de los influencers, youtubers… todo completo en www.deliservy.com». El promotor entra con su
 * WhatsApp (código por WhatsApp) y ve su saldo, el catálogo del programa con lo que gana por unidad, sus enlaces
 * (`https://www.deliservy.com/v/<codigo>`, uno por producto o tienda, sin vencimiento) con las visitas por red, sus
 * ventas y sus cobros. Habla con la API de Deliservy (`https://api.deliservy.site/api/vendedor/*`): al entrar, la API
 * le da un token que se guarda en este navegador y viaja en la cabecera `Authorization`; «Salir» lo borra.
 *
 * ⚠️ Nada de lo que viene del servidor se mete como HTML: todo se arma con `h()` y entra como TEXTO (o como atributo
 * ya revisado: solo fotos https y enlaces nuestros). Nada de `onclick` en el HTML ni scripts de terceros (lleva CSP).
 */
(function (raiz) {
  'use strict';

  var documento = raiz.document;

  // ── Dónde está la API ──────────────────────────────────────────────────────
  /** '' (relativo: las pruebas locales) en localhost; en cualquier otro sitio, la dirección entera de la API. */
  function baseDeLaApi(host) {
    var nombre = String(host || '').toLowerCase();
    if (nombre === 'api.deliservy.site' || nombre === 'localhost' || nombre === '127.0.0.1' || nombre === '[::1]' || /\.localhost$/.test(nombre)) return '';
    return 'https://api.deliservy.site';
  }
  var API = baseDeLaApi(raiz.location && raiz.location.hostname) + '/api/vendedor';
  var CLAVE_SESION = 'deliservy_vendedor_sesion';
  var CLAVE_IDIOMA = 'deliservy_idioma';
  var NOTA_PAGO = 'Se te paga solo cada noche a las 11:00 p. m. si tienes cuenta bancaria y saldo disponible.';
  /** Lo que dice la API (403) a un `pendiente` en Ventas y Cobros. */
  var EN_REVISION = 'Tu cuenta está en revisión. Te avisaremos por WhatsApp cuando esté lista.';
  /** El aviso amarillo de arriba mientras su cuenta está en revisión (P8): ya navega y prepara enlaces. */
  var AVISO_REVISION = 'Tu cuenta está en revisión. Ya puedes preparar tus enlaces: se activan cuando te aprobemos, y te avisamos por WhatsApp.';
  /** «Ordenar» del catálogo (`orden` de `GET catalogo`, contrato §1). */
  var ORDENES = [['ganancia', 'Mayor ganancia'], ['vendidos', 'Más vendidos'], ['precio', 'Precio'], ['nombre', 'A–Z']];
  /** El logo de Deliservy (de la web: 'self'). */
  var LOGO_DELISERVY = '/assets/logo-icon.png';
  /** El WhatsApp de Deliservy (0414-495-7006): para cambiar la cédula o el RIF de una cuenta ya aprobada. */
  var WHATSAPP_DELISERVY = 'https://wa.me/584144957006';
  /** Registro propio y datos para facturar (24-oct-2026): los tipos de documento del contrato (§1). */
  var TIPOS_DE_DOCUMENTO = [['V', 'V · Venezolano'], ['E', 'E · Extranjero'], ['J', 'J · Empresa'], ['G', 'G · Gobierno'], ['P', 'Pasaporte']];
  var REDES_DEL_REGISTRO = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['facebook', 'Facebook']];
  var NBSP = ' ';

  // ── Utilidades (puras) ─────────────────────────────────────────────────────

  function num(v) { var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v)); return isFinite(n) ? n : 0; }
  /** «0,50 $» (el espacio no se parte en dos renglones). */
  function dolares(n) { return (Math.round(num(n) * 100) / 100).toFixed(2).replace('.', ',') + NBSP + '$'; }
  function bolivares(n) {
    var partes = (Math.round(num(n) * 100) / 100).toFixed(2).split('.');
    return partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + partes[1] + NBSP + 'Bs';
  }
  function porcentaje(n) { return String(Math.round(num(n) * 100) / 100).replace('.', ',') + NBSP + '%'; }
  /** Los montos que vienen ya escritos del servidor («Comisión 0,50 $ − 16 % …»): sin cortes antes de $, % o Bs. */
  function sinCortes(t) { return String(t == null ? '' : t).replace(/(\d) (\$|%|Bs)/g, '$1' + NBSP + '$2'); }
  /** Solo fotos https (las del almacén de la app). */
  function fotoSegura(u) { var s = String(u == null ? '' : u); return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : ''; }
  /** El enlace del vendedor: https y nada raro dentro. */
  function urlSegura(u) { var s = String(u == null ? '' : u); return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : ''; }
  function inicial(t) { var s = String(t == null ? '' : t).trim(); return s ? s.charAt(0).toUpperCase() : 'D'; }
  function fecha(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d.getTime())) return '';
    try {
      return d.toLocaleString('es-VE', { timeZone: 'America/Caracas', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    } catch (_) { return d.toLocaleString(); }
  }
  /** El precio para enseñar: «5,50 $» o «Desde 5,50 $» (con tamaños). */
  function precioParaVer(p) { return p == null || p.venta == null ? '' : (p.desde ? 'Desde ' : '') + dolares(p.venta); }
  /**
   * El texto que se copia y se manda (P7): «<Producto> de <Tienda>, <precio>. Pídelo aquí: <enlace>». De una tienda:
   * «<Tienda> en Deliservy. Pídelo aquí: <enlace>». Va siempre en español: lo leen los clientes de Valencia.
   */
  function textoParaCompartir(info) {
    var i = info || {};
    var u = urlSegura(i.url);
    var nombre = String(i.nombre || '').trim();
    var tienda = String(i.tienda || '').trim();
    var cabeza;
    if (i.tipo === 't') cabeza = (tienda || nombre || 'Esta tienda') + ' en Deliservy';
    else {
      cabeza = (nombre || 'Esto') + (tienda ? ' de ' + tienda : '');
      if (i.venta != null && num(i.venta) > 0) cabeza += ', ' + (i.desde ? 'desde ' : '') + dolares(i.venta);
    }
    return cabeza + '. Pídelo aquí: ' + u;
  }
  /** WhatsApp con el texto ya escrito (sin scripts de esa red: solo abrir su página). */
  function enlacesParaCompartir(url, texto) {
    var u = urlSegura(url);
    if (!u) return null;
    return { whatsapp: 'https://wa.me/?text=' + encodeURIComponent(texto || u) };
  }
  /**
   * Lo que manda el servidor todavía dice «vendedor» o «Compra-Ventas» en algunas frases (y la plantilla de WhatsApp no
   * se toca: necesita a Meta). En la página se ve «promotor».
   */
  function comoPromotor(t) {
    return String(t == null ? '' : t)
      .replace(/\bvendedores\b/g, 'promotores').replace(/\bVendedores\b/g, 'Promotores')
      .replace(/\bvendedor\b/g, 'promotor').replace(/\bVendedor\b/g, 'Promotor')
      .replace(/Compra-Ventas(?: Redes Sociales)?/g, 'Promotores');
  }
  function plural(n, uno, varios) { return Math.round(num(n)) + ' ' + (Math.round(num(n)) === 1 ? uno : varios); }
  /** «Ganas 0,46 $» o, con tamaños de precio distinto, «Ganas 0,30–0,50 $». */
  function textoGanas(p) {
    var a = num(p && p.ganas);
    var b = num(p && p.ganasHasta);
    if (b > a + 0.004) return 'Ganas ' + (Math.round(a * 100) / 100).toFixed(2).replace('.', ',') + '–' + dolares(b);
    return 'Ganas ' + dolares(a);
  }
  /** Un nombre para el archivo de la imagen: «deliservy-arepa-reina-pepiada.png». */
  function nombreDeArchivo(t) {
    var s = String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return 'deliservy-' + (s || 'enlace') + '.png';
  }

  // ── Los datos para facturar (puros: los mismos que mira la API, §1 del contrato) ──

  var VALOR_DE_LA_LETRA = { V: 1, E: 2, J: 3, P: 4, G: 5, C: 3 };
  var PESOS_DEL_RIF = [3, 2, 7, 6, 5, 4, 3, 2];
  /** El dígito verificador de un RIF (módulo 11 del SENIAT), como `verificadorDelRif` de `src/common/rif.ts`. */
  function verificadorDelRif(letra, ocho) {
    var valor = VALOR_DE_LA_LETRA[String(letra || '').toUpperCase()];
    if (!valor || !/^\d{8}$/.test(String(ocho || ''))) return null;
    var suma = valor * 4;
    for (var i = 0; i < 8; i++) suma += Number(ocho.charAt(i)) * PESOS_DEL_RIF[i];
    var resto = 11 - (suma % 11);
    return resto >= 10 ? 0 : resto;
  }
  /**
   * El documento, como lo valida la API (`documentoNormalizado` de `datos-fiscales.ts`): `{ documento, numero }` o
   * `{ error }` con la misma frase. `documento` es como se guarda (la letra y el número, sin guion: `V12345678`,
   * `J504754129`, `PAB123456`); `numero`, lo que viaja en el campo `documento` (sin la letra: la letra va en
   * `tipoDocumento`). V/E: 6 a 9 cifras, sin los ceros de delante; J/G: 9 cifras, la última su verificador (como
   * `rifEscrito`); P: 5 a 19 letras o cifras. El número puede venir con puntos, guiones o con su letra delante.
   */
  function documentoNormalizado(tipo, numero) {
    var t = String(tipo || '').toUpperCase();
    if (!/^[VEJGP]$/.test(t)) return { error: 'Elige el tipo de documento.' };
    var limpio = String(numero == null ? '' : numero).toUpperCase().replace(/[\s.\-_/]/g, '');
    if (!limpio) return { error: 'Escribe el número de cédula, RIF o pasaporte.' };
    if (t === 'P') return /^[A-Z0-9]{5,19}$/.test(limpio) ? { documento: 'P' + limpio, numero: limpio } : { error: 'El pasaporte va con 5 a 19 letras o números.' };
    var m = /^([VEJGP])?(\d+)$/.exec(limpio);
    if (t === 'V' || t === 'E') {
      var cifras = m ? m[2].replace(/^0+/, '') : '';
      return /^\d{6,9}$/.test(cifras) ? { documento: t + cifras, numero: cifras } : { error: 'La cédula va con 6 a 9 números.' };
    }
    var nueve = m && m[2].length === 9 ? m[2] : '';
    return nueve && verificadorDelRif(t, nueve.slice(0, 8)) === Number(nueve.charAt(8))
      ? { documento: t + nueve, numero: nueve } : { error: 'Ese RIF no es válido. Revisa los 9 números.' };
  }
  /** Para verlo: `V-12345678`, `J-504754129` (letra, guion y el número COMPLETO), `Pasaporte AB123456`. */
  function documentoParaVer(doc) {
    var d = String(doc == null ? '' : doc).toUpperCase();
    if (/^[VEJG]\d+$/.test(d)) return d.charAt(0) + '-' + d.slice(1);
    if (/^P[A-Z0-9]+$/.test(d)) return 'Pasaporte ' + d.slice(1);
    return d;
  }
  /** El número sin su letra (para ponerlo en el campo al cambiar los datos). */
  function numeroDelDocumento(doc) { var d = String(doc == null ? '' : doc).toUpperCase(); return /^[VEJGP]/.test(d) ? d.slice(1) : d; }
  /** Sin `<` ni `>` y sin espacios de más (lo mismo que hace la API con un texto libre). */
  function textoLimpio(t) { return String(t == null ? '' : t).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim(); }
  /** Un nombre de persona (como `normalizarNombre` de la API): de 2 a 60, ni HTML ni enlaces. */
  function nombreValido(t) {
    var n = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
    return n.length >= 2 && n.length <= 60 && !/[<>"'`{}\\/@]|https?:/i.test(n) ? n : null;
  }
  /** Un correo que se puede poner en la factura (como `normalizarCorreo` de la API). */
  function correoValido(t) {
    var c = String(t == null ? '' : t).trim().toLowerCase();
    return c.length <= 120 && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(c) ? c : null;
  }
  /**
   * Lo escrito en un formulario de datos, revisado: `{ datos, errores }` (errores por campo, con la frase). `c`:
   * { nombre?, razonSocial, tipoDocumento, numero, correo, direccion, redes? }. Con `conDocumento: false` el
   * documento no se mira ni se manda (cuenta ya aprobada); `tipoActual` dice si la razón social es obligatoria.
   */
  function revisarDatos(c, opciones) {
    var o = opciones || {};
    var errores = {};
    var datos = {};
    if (o.conNombre) {
      var n = nombreValido(c.nombre);
      if (n) datos.nombre = n; else errores.nombre = 'Escribe tu nombre y apellido.';
    }
    var tipo = String((o.conDocumento ? c.tipoDocumento : o.tipoActual) || '').toUpperCase();
    var rs = textoLimpio(c.razonSocial);
    if (!rs && (tipo === 'J' || tipo === 'G')) errores.razonSocial = 'Escribe la razón social de la empresa.';
    else if (rs && (rs.length < 2 || rs.length > 150)) errores.razonSocial = 'La razón social va de 2 a 150 caracteres.';
    datos.razonSocial = rs || null;
    if (o.conDocumento) {
      // Viaja como lo pide la API: la letra en `tipoDocumento` y el número, sin ella, en `documento`.
      var d = documentoNormalizado(c.tipoDocumento, c.numero);
      if (d.error) errores.documento = d.error; else { datos.tipoDocumento = tipo; datos.documento = d.numero; }
    }
    var correo = String(c.correo == null ? '' : c.correo).trim();
    if (!correo) errores.correo = 'Escribe tu correo: ahí te llega tu factura.';
    else if (!correoValido(correo)) errores.correo = 'Escribe un correo válido.';
    else datos.correo = correoValido(correo);
    var dir = textoLimpio(c.direccion);
    if (dir.length < 10) errores.direccion = 'Escribe tu dirección completa.';
    else if (dir.length > 300) errores.direccion = 'La dirección va hasta 300 caracteres.';
    else datos.direccion = dir;
    if (c.redes) {
      var redes = {};
      REDES_DEL_REGISTRO.forEach(function (r) { var v = textoLimpio(c.redes[r[0]]).slice(0, 120); if (v) redes[r[0]] = v; });
      if (Object.keys(redes).length) datos.redes = redes;
    }
    return { datos: datos, errores: errores, hayErrores: Object.keys(errores).length > 0 };
  }

  // ── Armar la página (el texto entra SIEMPRE como texto) ─────────────────────

  /** Un enlace solo a lo nuestro, a https o a un ancla; lo demás no se pone. */
  function hrefSeguro(v) { var s = String(v); return /^(https:\/\/[^\s"'<>]+|#[\w-]*(?:\/\d{1,10})?|\/(?!\/)[^\s"'<>]*)$/.test(s) ? s : null; }

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
        else if (k === 'href' || k === 'src') { var seguro = k === 'src' ? (fotoSegura(v) || null) : hrefSeguro(v); if (seguro) el.setAttribute(k, seguro); }
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

  // Los iconos: figuras fijas, sin datos dentro.
  var NS = 'http://www.w3.org/2000/svg';
  var ICONOS = {
    inicio: [['path', { d: 'M3 11.5 12 4l9 7.5' }], ['path', { d: 'M5 10v10h14V10' }], ['path', { d: 'M10 20v-6h4v6' }]],
    catalogo: [['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }]],
    enlaces: [['path', { d: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1' }], ['path', { d: 'M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1' }]],
    ventas: [['path', { d: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z' }], ['path', { d: 'M9 8h6M9 12h6' }]],
    cobros: [['rect', { x: 3, y: 6, width: 18, height: 13, rx: 2 }], ['path', { d: 'M3 10h18' }], ['path', { d: 'M16 15h2' }]],
    compartir: [['path', { d: 'M12 3v12' }], ['path', { d: 'm7 8 5-5 5 5' }], ['path', { d: 'M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6' }]],
    copiar: [['rect', { x: 9, y: 9, width: 12, height: 12, rx: 2 }], ['path', { d: 'M5 15V5a2 2 0 0 1 2-2h10' }]],
    whatsapp: [['path', { d: 'M4 20l1.3-4A8 8 0 1 1 8 18.7z' }], ['path', { d: 'M9.5 9.5c.4 2 2 3.6 4 4' }]],
    facebook: [['path', { d: 'M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z' }]],
    x: [['path', { d: 'M4 4l16 16M20 4 4 20' }]],
    reloj: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 7v5l3 2' }]],
    abajo: [['path', { d: 'm6 9 6 6 6-6' }]],
    derecha: [['path', { d: 'm9 6 6 6-6 6' }]],
    volver: [['path', { d: 'M15 6 9 12l6 6' }]],
    buscar: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', { d: 'm20 20-3.5-3.5' }]],
    qr: [['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }], ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }], ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }], ['path', { d: 'M14 14h3v3M21 14v.01M14 21h3M21 17v4' }]],
    descargar: [['path', { d: 'M12 3v12' }], ['path', { d: 'm7 10 5 5 5-5' }], ['path', { d: 'M5 21h14' }]],
    mas: [['circle', { cx: 5, cy: 12, r: 1.4 }], ['circle', { cx: 12, cy: 12, r: 1.4 }], ['circle', { cx: 19, cy: 12, r: 1.4 }]],
    tienda: [['path', { d: 'M4 9.5 5.5 4h13L20 9.5' }], ['path', { d: 'M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0' }], ['path', { d: 'M5.5 12v8h13v-8' }]],
    caja: [['path', { d: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z' }], ['path', { d: 'm3 7.5 9 4.5 9-4.5M12 12v9' }]],
    luna: [['path', { d: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' }]],
    infinito: [['path', { d: 'M7.5 15.5a3.5 3.5 0 1 1 0-7c3.5 0 5.5 7 9 7a3.5 3.5 0 1 0 0-7c-3.5 0-5.5 7-9 7z' }]],
    check: [['path', { d: 'm5 12.5 4.5 4.5L19 7.5' }]],
    candado: [['rect', { x: 5, y: 11, width: 14, height: 10, rx: 2 }], ['path', { d: 'M8 11V8a4 4 0 0 1 8 0v3' }]],
  };
  function ico(nombre) {
    var svg = documento.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'ico');
    svg.setAttribute('aria-hidden', 'true');
    (ICONOS[nombre] || []).forEach(function (f) {
      var e = documento.createElementNS(NS, f[0]);
      for (var a in f[1]) e.setAttribute(a, String(f[1][a]));
      svg.appendChild(e);
    });
    return svg;
  }

  // ── El idioma (el mismo botón y la misma elección que el resto de deliservy.com) ──

  function idiomaActual() {
    var elegido = null;
    try { elegido = raiz.localStorage.getItem(CLAVE_IDIOMA); } catch (_) { elegido = null; }
    if (elegido === 'en' || elegido === 'es') return elegido;
    var nav = raiz.navigator || {};
    return /^en\b/i.test((nav.languages && nav.languages[0]) || nav.language || '') ? 'en' : 'es';
  }
  /**
   * Un texto que la capa de idioma no alcanza: la pista de un <textarea> (la capa no toca lo que se escribe en un
   * <textarea>, tampoco su pista). Los demás textos se traducen con el diccionario.
   */
  function segunIdioma(es, en) { return idiomaActual() === 'en' ? en : es; }

  function botonIdioma() {
    var en = idiomaActual() === 'en';
    return h('button', {
      class: 'idioma', type: 'button', 'data-idioma': 'no', title: en ? 'Cambiar a español' : 'Switch to English',
      onclick: function () {
        try { raiz.localStorage.setItem(CLAVE_IDIOMA, en ? 'es' : 'en'); } catch (_) { /* sin almacén: no se recuerda */ }
        raiz.location.reload();
      },
    }, en ? '🌐 Español' : '🌐 English');
  }

  // ── Las pantallas ──────────────────────────────────────────────────────────

  var SECCIONES = [['inicio', 'Inicio'], ['catalogo', 'Catálogo'], ['enlaces', 'Enlaces'], ['ventas', 'Ventas'], ['cobros', 'Cobros']];

  function navegacion(clase, seccion, enRevision) {
    return h('nav', { class: clase, 'aria-label': 'Secciones' }, SECCIONES.map(function (s) {
      // En revisión, Ventas y Cobros se ven con candado (se abren al aprobar).
      var cerrada = enRevision && (s[0] === 'ventas' || s[0] === 'cobros');
      return h('a', { href: '#' + s[0], class: cerrada ? 'cerrada' : null, 'aria-current': s[0] === seccion ? 'page' : null }, ico(cerrada ? 'candado' : s[0]), h('span', null, s[1]));
    }));
  }

  /** El logo de Deliservy (la imagen de la web, no un cuadro con «D»). */
  function logoDeliservy(clase) {
    // (Una ruta nuestra: `h()` solo pone fotos https en `src`, así que este se pone aparte.)
    var img = h('img', { class: 'logo-marca' + (clase ? ' ' + clase : ''), alt: '', width: '34', height: '34' });
    img.setAttribute('src', LOGO_DELISERVY);
    return img;
  }

  function cabecera(yo, conSalir) {
    return h('header', { class: 'cabecera' },
      logoDeliservy(),
      h('div', { class: 'titulo' }, h('b', null, 'Promotores Deliservy'), dato('small', null, (yo && yo.nombre) || '')),
      yo ? dato('div', { class: 'yo', 'aria-hidden': 'true' }, inicial(yo.nombre)) : null,
      botonIdioma(),
      conSalir ? h('button', { class: 'salir', type: 'button', onclick: salir }, 'Salir') : null);
  }

  function enRevision() { return !!(estado.yo && estado.yo.estado === 'pendiente'); }

  function marco(seccion, yo, contenido) {
    var main = h('main', { class: 'contenido', id: 'contenido' }, h('div', { class: 'vista' }, contenido));
    var revisando = enRevision();
    // Arriba de cada sección: en revisión, el aviso amarillo (P8); si le faltan datos para facturar, «Completa tus datos…».
    var aviso = h('div', { class: 'zona-aviso-datos', id: 'aviso-datos' },
      revisando ? h('div', { class: 'aviso-datos aviso-revision', role: 'status', id: 'aviso-revision' }, ico('reloj'), h('p', null, AVISO_REVISION)) : null,
      revisando ? null : avisoDatos());
    aviso.hidden = !aviso.firstChild;
    var f = documento.createDocumentFragment();
    poner(f, [cabecera(yo, true), navegacion('pestanas', seccion, revisando), aviso, main, navegacion('navegacion', seccion, revisando)]);
    return f;
  }

  /** «0412-555-0198» (un móvil de Venezuela); otro número, como lo escribió. */
  function telefonoParaVer(t) {
    var d = String(t == null ? '' : t).replace(/\D/g, '');
    if (d.length === 12 && d.slice(0, 2) === '58') d = '0' + d.slice(2);
    else if (d.length === 10 && d.charAt(0) === '4') d = '0' + d;
    return /^04\d{9}$/.test(d) ? d.slice(0, 4) + '-' + d.slice(4, 7) + '-' + d.slice(7) : String(t == null ? '' : t).trim();
  }

  /**
   * El código en 6 casillas (como la tienda web): un solo campo invisible encima de las seis, así el teléfono lo
   * autocompleta desde WhatsApp y se puede pegar. Al escribir el sexto número, `alCompletar(codigo)` (una vez por código,
   * y solo al escribir: entrar o salir del campo no lo vuelve a mandar).
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
    return { caja: h('div', { class: 'codigo-6' }, casillas, input), valor: function () { return String(input.value || '').replace(/\D/g, ''); } };
  }

  /** Los tres recuadros de la portada del registro (P5). */
  function ventajas() {
    var una = function (icono, titulo) { return h('div', { class: 'ventaja' }, h('span', { class: 'ventaja-ico' }, ico(icono)), h('b', null, titulo)); };
    return h('div', { class: 'ventajas' },
      una('caja', 'Sin inventario ni inversión'),
      una('luna', 'Cobro automático cada noche'),
      una('infinito', 'Enlaces que no vencen'));
  }

  /** El marco de las pantallas sin sesión (entrar y registrarse): la marca, la tarjeta y el pie. */
  function sinSesion(texto, cuerpo, pie, conVentajas) {
    return h('div', { class: 'entrar vista' },
      h('div', { class: 'marca' },
        logoDeliservy('grande'),
        h('h1', null, 'Promotores Deliservy'),
        h('p', null, texto)),
      conVentajas ? ventajas() : null,
      h('div', { class: 'tarjeta' }, cuerpo),
      pie,
      h('div', { class: 'pie-idioma' }, botonIdioma()));
  }

  function entrar(paso, d) {
    d = d || {};
    var cuerpo;
    if (paso === 'codigo') {
      var casillas = casillasDeCodigo('codigo', function (cod) { verificar(cod, null); });
      var reenviar = h('button', { class: 'btn borde chico', type: 'button', id: 'reenviar', disabled: true, onclick: function () { pedirCodigo(entrada.telefono, reenviar); } }, 'Reenviar código');
      cuerpo = h('form', {
        novalidate: true,
        onsubmit: function (ev) {
          ev.preventDefault();
          var cod = casillas.valor();
          if (cod.length !== 6) { pintar(entrar('codigo', { error: 'El código tiene 6 números.' })); cuentaAtras(); return; }
          verificar(cod, ev.target.querySelector('button[type="submit"]'));
        },
      },
      h('p', { class: 'bien' }, comoPromotor(d.mensaje || 'Si ese número es de un promotor, te llegó un código por WhatsApp.')),
      h('label', { class: 'etq-campo', for: 'codigo' }, 'Código de 6 números'),
      casillas.caja,
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Entrar')),
      h('div', { class: 'botones' },
        h('button', { class: 'btn borde chico', type: 'button', onclick: function () { clearInterval(entrada.espera); entrada.paso = 'telefono'; pintar(entrar('telefono', { telefono: entrada.telefono })); } }, 'Cambiar número'),
        reenviar));
    } else {
      var telefono = h('input', {
        class: 'campo', id: 'telefono', name: 'telefono', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national',
        placeholder: '412 555 0198', value: d.telefono || '', required: true,
      });
      cuerpo = h('form', {
        novalidate: true,
        onsubmit: function (ev) {
          ev.preventDefault();
          var tel = String(telefono.value || '').trim();
          if (tel.replace(/\D/g, '').length < 10) { pintar(entrar('telefono', { telefono: tel, error: 'Escribe tu número de WhatsApp, por ejemplo 0412-555-0198.' })); return; }
          pedirCodigo(tel, ev.target.querySelector('button[type="submit"]'));
        },
      },
      h('label', { class: 'etq-campo', for: 'telefono' }, 'Tu número de WhatsApp'),
      h('div', { class: 'prefijo' }, h('span', null, '+58'), telefono),
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Enviarme el código')),
      h('p', { class: 'ayuda' }, 'Te mandamos un código por WhatsApp. Sin contraseñas.'));
    }
    return sinSesion('Entra con tu WhatsApp. Aquí ves el catálogo, tus enlaces, tus ventas y tus cobros.', cuerpo,
      h('p', { class: 'pie-entrar' }, '¿Quieres ser promotor? ', h('button', { class: 'enlace', type: 'button', onclick: irARegistro }, 'Regístrate')));
  }

  // ── El registro en 2 pasos (30-oct-2026): WhatsApp + código → nombre y red → al catálogo ──

  /** Un campo con su rótulo, su ayuda y su error debajo (el campo, en rojo). */
  function grupoDeCampo(id, rotulo, control, error, ayuda, marcado) {
    var marcar = marcado || control;
    if (error && marcar && marcar.classList) { marcar.classList.add('mal'); marcar.setAttribute('aria-invalid', 'true'); }
    return h('div', { class: 'grupo-campo' },
      h('label', { class: 'etq-campo', for: id }, rotulo),
      control,
      ayuda ? h('p', { class: 'ayuda' }, ayuda) : null,
      error ? h('p', { class: 'error-campo', role: 'alert' }, error) : null);
  }

  /** El tipo de documento y su número, en una fila. `alCambiar(tipo)`: para el rótulo de la razón social. */
  function campoDeDocumento(prefijo, tipo, numero, alCambiar) {
    var PISTA = { V: '12345678', E: '81234567', J: '504754129', G: '200000007', P: 'AB123456' };
    var select = h('select', { class: 'campo', id: prefijo + '-tipo', name: 'tipoDocumento', 'aria-label': 'Tipo de documento' },
      TIPOS_DE_DOCUMENTO.map(function (t) { var o = h('option', { value: t[0] }, t[1]); if (t[0] === tipo) o.selected = true; return o; }));
    var input = h('input', {
      class: 'campo', id: prefijo + '-documento', name: 'documento', maxlength: '24', autocomplete: 'off', autocapitalize: 'characters',
      spellcheck: 'false', value: numero || '', 'aria-label': 'Número del documento',
    });
    var ajustar = function () {
      var t = select.value;
      input.setAttribute('placeholder', PISTA[t] || '');
      input.setAttribute('inputmode', t === 'P' ? 'text' : 'numeric');
      if (alCambiar) alCambiar(t);
    };
    select.addEventListener('change', ajustar);
    ajustar();
    return { fila: h('div', { class: 'fila-doc' }, h('div', { class: 'con-flecha' }, select, ico('abajo')), input), select: select, input: input };
  }

  /** «Razón social (opcional)», u obligatoria con J o G. */
  function rotuloDeRazon(tipo) { return tipo === 'J' || tipo === 'G' ? 'Razón social' : 'Razón social (opcional)'; }

  /**
   * El registro en 2 pasos (30-oct-2026, contrato §3, P5). Paso 1: WhatsApp → código (las 6 casillas, en la misma
   * tarjeta). Paso 2: nombre y su red principal → «Crear mi cuenta». Los datos fiscales se piden después, al cobrar.
   */
  function registro(paso, d) {
    d = d || {};
    var cuerpo;
    if (paso === 'ya') {
      cuerpo = h('div', { class: 'ya-registrado' },
        h('b', null, 'Ese número ya está registrado'),
        dato('p', { class: 'nota sin-cortes' }, telefonoParaVer(reg.telefono)),
        h('p', { class: 'nota' }, 'Entra con tu WhatsApp.'),
        h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'button', onclick: function () { irAEntrar(reg.telefono); } }, 'Entrar')));
    } else if (paso === 'codigo') {
      var casillas = casillasDeCodigo('r-codigo', function (cod) { codigoDeRegistro(cod); });
      var reenviar = h('button', { class: 'btn borde chico', type: 'button', id: 'reenviar', disabled: true, onclick: function () { pedirCodigoDeRegistro(reg.telefono, reenviar, true); } }, 'Reenviar código');
      cuerpo = h('form', {
        novalidate: true,
        onsubmit: function (ev) {
          ev.preventDefault();
          var cod = casillas.valor();
          if (cod.length !== 6) { pintar(registro('codigo', { error: 'El código tiene 6 números.' })); cuentaAtras(); return; }
          codigoDeRegistro(cod);
        },
      },
      h('p', { class: 'paso' }, 'Paso 1 de 2'),
      h('p', { class: 'bien' }, 'Te enviamos un código por WhatsApp al ', dato('span', { class: 'sin-cortes' }, telefonoParaVer(reg.telefono)), '.'),
      h('label', { class: 'etq-campo', for: 'r-codigo' }, 'Código de 6 números'),
      casillas.caja,
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, reg.listo ? 'Crear mi cuenta' : 'Seguir')),
      h('div', { class: 'botones' },
        h('button', { class: 'btn borde chico', type: 'button', onclick: function () { clearInterval(entrada.espera); pintar(registro('telefono', { telefono: reg.telefono })); } }, 'Cambiar número'),
        reenviar));
    } else if (paso === 'datos') {
      cuerpo = formularioDeRegistro(d);
    } else {
      var telefono = h('input', {
        class: 'campo', id: 'r-telefono', name: 'telefono', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national',
        placeholder: '412 555 0198', value: d.telefono || '', required: true,
      });
      cuerpo = h('form', {
        novalidate: true,
        onsubmit: function (ev) {
          ev.preventDefault();
          var tel = String(telefono.value || '').trim();
          if (tel.replace(/\D/g, '').length < 10) { pintar(registro('telefono', { telefono: tel, error: 'Escribe tu número de WhatsApp, por ejemplo 0412-555-0198.' })); return; }
          pedirCodigoDeRegistro(tel, ev.target.querySelector('button[type="submit"]'), false);
        },
      },
      h('p', { class: 'paso' }, 'Paso 1 de 2'),
      h('label', { class: 'etq-campo', for: 'r-telefono' }, 'Tu número de WhatsApp'),
      h('div', { class: 'prefijo' }, h('span', null, '+58'), telefono),
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Enviarme el código')),
      h('p', { class: 'ayuda' }, 'Te mandamos un código por WhatsApp para confirmarlo.'));
    }
    return sinSesion('Gana en cada venta con tus enlaces', cuerpo,
      h('p', { class: 'pie-entrar' }, '¿Ya eres promotor? ', h('button', { class: 'enlace', type: 'button', onclick: function () { irAEntrar(reg.telefono); } }, 'Entrar')),
      paso !== 'datos' && paso !== 'ya');
  }

  /** Paso 2: su nombre y su red principal. Lo escrito vive en `reg.escrito` (así un error no borra nada). */
  function formularioDeRegistro(d) {
    var v = reg.escrito || {};
    var e = d.errores || {};
    var nombre = h('input', { class: 'campo', id: 'r-nombre', name: 'nombre', autocomplete: 'name', maxlength: '60', placeholder: 'María Pérez', value: v.nombre || '' });
    var tipoRed = h('select', { class: 'campo', id: 'r-red', name: 'redTipo', 'aria-label': 'Red' },
      REDES_DEL_REGISTRO.map(function (r) { var o = h('option', { value: r[0] }, r[1]); if (r[0] === (v.redTipo || 'instagram')) o.selected = true; return o; }));
    var usuario = h('input', {
      class: 'campo', id: 'r-usuario', name: 'redUsuario', maxlength: '120', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false',
      placeholder: '@usuario', 'aria-label': 'Tu usuario', value: v.redUsuario || '',
    });
    var boton = h('button', { class: 'btn', type: 'submit' }, 'Crear mi cuenta');
    return h('form', {
      novalidate: true, class: 'form-datos',
      onsubmit: function (ev) {
        ev.preventDefault();
        var escrito = { nombre: nombre.value, redTipo: tipoRed.value, redUsuario: usuario.value };
        reg.escrito = escrito;
        var errores = {};
        var n = nombreValido(escrito.nombre);
        if (!n) errores.nombre = 'Escribe tu nombre y apellido.';
        var u = textoLimpio(escrito.redUsuario).slice(0, 120);
        if (!u) errores.red = 'Escribe tu usuario en esa red.';
        if (Object.keys(errores).length) { pintar(registro('datos', { errores: errores })); enfocar(errores.nombre ? 'r-nombre' : 'r-usuario'); return; }
        reg.listo = true;
        reg.paraEnviar = { nombre: n, red: { tipo: escrito.redTipo, usuario: u } };
        enviarRegistro(boton);
      },
    },
    h('p', { class: 'paso' }, 'Paso 2 de 2'),
    h('h2', null, 'Tus datos'),
    grupoDeCampo('r-nombre', 'Nombre y apellido', nombre, e.nombre),
    grupoDeCampo('r-usuario', 'Tu red principal', h('div', { class: 'fila-red' }, h('div', { class: 'con-flecha' }, tipoRed, ico('abajo')), usuario), e.red, null, usuario),
    d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
    h('div', { class: 'botones' }, boton),
    h('p', { class: 'ayuda' }, 'Entras de una vez al catálogo y preparas tus enlaces. Tu cédula o RIF, tu dirección y tu cuenta bancaria se piden al cobrar por primera vez.'));
  }

  /** Ventas o Cobros mientras su cuenta está en revisión (P8): se abren al aprobar. */
  function seccionCerrada(s) {
    return [
      h('h1', { class: 'saludo' }, s === 'ventas' ? 'Mis ventas' : 'Cobros'),
      h('div', { class: 'tarjeta vacio' }, ico('candado'),
        h('b', null, s === 'ventas' ? 'Tus ventas se abren al aprobar tu cuenta' : 'Tus cobros se abren al aprobar tu cuenta'),
        h('p', { class: 'nota' }, 'Mientras tanto, prepara tus enlaces en el catálogo. Te avisamos por WhatsApp.'),
        botonIr('#catalogo', 'Ir al catálogo')),
      s === 'cobros' && estado.datos ? h('div', { class: 'separado' }, tarjetaMisDatos()) : null,
    ];
  }
  // ── Mis datos (los de su factura semanal) ──────────────────────────────────

  /** El aviso de arriba si le faltan datos para facturar (`faltanDatos` de la API). */
  function avisoDatos() {
    var faltan = (estado.faltan || []).filter(function (x) { return typeof x === 'string' && x.trim(); });
    if (!faltan.length || !estado.datos) return null;
    return h('div', { class: 'aviso-datos', role: 'status' },
      h('p', null, 'Completa tus datos para tus facturas: ', faltan.map(function (x, i) { return [i ? ', ' : '', h('b', null, x)]; }), '.'),
      h('button', { class: 'btn chico', type: 'button', onclick: completarDatos }, 'Completar'));
  }

  /**
   * «Mis datos»: nombre, razón social, cédula o RIF, correo, WhatsApp y dirección. Cambia la razón social, el correo y la
   * dirección; la cédula o el RIF, solo si la cuenta está en revisión o aún no lo tiene (si no, por WhatsApp).
   */
  function tarjetaMisDatos(d) {
    d = d || {};
    var x = estado.datos || {};
    var tipo = String(x.tipoDocumento || (x.documento ? String(x.documento).charAt(0) : '')).toUpperCase();
    var cuerpo;
    if (!estado.editarDatos) {
      var fila = function (rotulo, valor) {
        return [h('dt', null, rotulo), valor ? dato('dd', null, valor) : h('dd', null, h('span', { class: 'pill ambar' }, 'Falta'))];
      };
      var ver = x.documentoParaVer || documentoParaVer(x.documento);
      var docHtml = !ver ? h('dd', null, h('span', { class: 'pill ambar' }, 'Falta'))
        : /^Pasaporte /.test(ver) ? h('dd', null, 'Pasaporte ', dato('span', null, ver.slice(10))) : dato('dd', null, ver);
      cuerpo = [
        h('dl', { class: 'datos-lista' },
          fila('Nombre', x.nombre),
          x.razonSocial || tipo === 'J' || tipo === 'G' ? fila('Razón social', x.razonSocial) : null,
          h('dt', null, 'Cédula o RIF'), docHtml,
          fila('Correo', x.correo),
          fila('WhatsApp', x.telefonoParaVer || telefonoParaVer(estado.yo && estado.yo.telefono)),
          fila('Dirección', x.direccion)),
        h('div', { class: 'botones' }, h('button', {
          class: 'btn borde chico', type: 'button',
          onclick: function () { estado.editarDatos = true; estado.datosEscritos = null; pintarMisDatos(); enfocar('d-razon'); },
        }, 'Cambiar mis datos'))];
    } else {
      cuerpo = formularioMisDatos(d, x, tipo);
    }
    return h('section', { class: 'tarjeta mis-datos', id: 'mis-datos', 'aria-labelledby': 'mis-datos-titulo' },
      h('h2', { id: 'mis-datos-titulo' }, 'Mis datos'),
      h('p', { class: 'nota' }, 'Con ellos te llega tu factura cada semana.'),
      cuerpo);
  }

  function formularioMisDatos(d, x, tipo) {
    var e = d.errores || {};
    var enRevision = !!(estado.yo && estado.yo.estado === 'pendiente');
    var puedeDocumento = enRevision || !x.documento;
    var v = estado.datosEscritos || {
      razonSocial: x.razonSocial || '', tipoDocumento: tipo || 'V', numero: numeroDelDocumento(x.documento), correo: x.correo || '', direccion: x.direccion || '',
    };
    var etqRazon = h('span', null, rotuloDeRazon(puedeDocumento ? v.tipoDocumento : tipo));
    var razon = h('input', { class: 'campo', id: 'd-razon', name: 'razonSocial', autocomplete: 'organization', maxlength: '150', placeholder: 'Solo si es una empresa', value: v.razonSocial || '' });
    var doc = puedeDocumento ? campoDeDocumento('d', v.tipoDocumento || 'V', v.numero || '', function (t) { etqRazon.textContent = rotuloDeRazon(t); }) : null;
    var correo = h('input', { class: 'campo', id: 'd-correo', name: 'correo', type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: '120', placeholder: 'tucorreo@gmail.com', value: v.correo || '' });
    var direccion = h('textarea', { class: 'campo', id: 'd-direccion', name: 'direccion', rows: '2', maxlength: '300', autocomplete: 'street-address', placeholder: segunIdioma('Calle, sector y ciudad', 'Street, area and city') });
    direccion.value = v.direccion || '';
    var docFijo = h('div', { class: 'grupo-campo' },
      h('span', { class: 'etq-campo' }, 'Cédula, RIF o pasaporte'),
      dato('p', { class: 'dato-fijo' }, x.documentoParaVer || documentoParaVer(x.documento)),
      h('p', { class: 'ayuda' }, 'Para cambiarlo, escríbenos por ', h('a', { href: WHATSAPP_DELISERVY, target: '_blank', rel: 'noopener noreferrer' }, 'WhatsApp'), '.'),
      e.documento ? h('p', { class: 'error-campo', role: 'alert' }, e.documento) : null);
    var boton = h('button', { class: 'btn', type: 'submit' }, 'Guardar');
    return h('form', {
      novalidate: true, class: 'form-datos',
      onsubmit: function (ev) {
        ev.preventDefault();
        var f = ev.target;
        var escrito = {
          razonSocial: f.elements.razonSocial.value, correo: f.elements.correo.value, direccion: f.elements.direccion.value,
          tipoDocumento: doc ? doc.select.value : tipo, numero: doc ? doc.input.value : numeroDelDocumento(x.documento),
        };
        estado.datosEscritos = escrito;
        var r = revisarDatos(escrito, { conDocumento: !!doc, tipoActual: tipo });
        if (r.hayErrores) { pintarMisDatos({ errores: r.errores }); enfocarError(r.errores, 'd'); return; }
        var cuerpo = { correo: r.datos.correo, direccion: r.datos.direccion };
        // La razón social: lo escrito; vacía y antes tenía una → null (borrarla); vacía y no tenía → no se manda.
        if (r.datos.razonSocial) cuerpo.razonSocial = r.datos.razonSocial;
        else if (x.razonSocial) cuerpo.razonSocial = null;
        if (doc && r.datos.documento && r.datos.tipoDocumento + r.datos.documento !== String(x.documento || '').toUpperCase()) {
          cuerpo.tipoDocumento = r.datos.tipoDocumento;
          cuerpo.documento = r.datos.documento;
        }
        guardarMisDatos(cuerpo, boton);
      },
    },
    grupoDeCampo('d-razon', etqRazon, razon, e.razonSocial),
    doc ? grupoDeCampo('d-documento', 'Cédula, RIF o pasaporte', doc.fila, e.documento, null, doc.input) : docFijo,
    grupoDeCampo('d-correo', 'Correo', correo, e.correo, 'Ahí te llega tu factura.'),
    grupoDeCampo('d-direccion', 'Dirección', direccion, e.direccion),
    d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
    h('div', { class: 'botones' }, boton,
      h('button', { class: 'btn borde', type: 'button', onclick: function () { estado.editarDatos = false; estado.datosEscritos = null; pintarMisDatos(); } }, 'Cancelar')));
  }

  function vacio(titulo, texto, extra) {
    return h('div', { class: 'tarjeta vacio' }, h('b', null, titulo), h('p', { class: 'nota' }, texto), extra || null);
  }
  function botonIr(destino, texto, clase) { return h('div', { class: 'botones' }, h('a', { class: 'btn' + (clase ? ' ' + clase : ''), href: destino }, texto)); }

  function tarjetaSaldo(saldo, aviso) {
    if (!saldo) return h('div', { class: 'tarjeta' }, h('h2', null, 'Tu saldo'), h('p', { class: 'nota' }, aviso || 'Tu saldo no se pudo cargar ahora.'));
    var retenido = num(saldo.retenidoBs) > 0
      ? h('div', { class: 'retenido' }, saldo.avisoRetencion
        ? sinCortes(saldo.avisoRetencion)
        : 'Tienes ' + bolivares(saldo.retenidoBs) + ' de pagos con tarjeta de crédito: se liberan 24 horas después del cobro.')
      : null;
    return h('div', { class: 'tarjeta saldo' },
      h('small', null, 'Disponible para cobrar'), dato('div', { class: 'grande' }, bolivares(saldo.disponibleBs)),
      retenido, h('p', { class: 'nota' }, NOTA_PAGO));
  }

  function tarjetaCupon(c) {
    if (!c || !c.code) return null;
    var nota = c.configurado && c.activo
      ? h('p', { class: 'nota' }, 'Quien lo use: ', h('b', null, c.texto), '. Vale en la app y en la web, y la venta es tuya.')
      : h('p', { class: 'nota' }, c.configurado ? 'Tu cupón está apagado por ahora.' : 'Tu cupón se activa cuando Deliservy lo configure.');
    return h('div', { class: 'tarjeta' }, h('h2', null, 'Tu cupón'),
      h('div', { class: 'cupon-codigo' }, dato('b', null, c.code),
        h('button', { class: 'btn chico suave', type: 'button', onclick: function () { copiar(c.code); } }, ico('copiar'), 'Copiar')),
      nota);
  }

  function tarjetaVisitas(lista) {
    lista = lista || [];
    if (!lista.length) return h('div', { class: 'tarjeta' }, h('h2', null, 'Visitas por red'), h('p', { class: 'nota' }, 'Aún no hay visitas. Comparte tus enlaces y aquí verás de dónde llegan.'));
    var max = Math.max.apply(null, lista.map(function (v) { return num(v.visitas); }).concat([1]));
    return h('div', { class: 'tarjeta' }, h('h2', null, 'Visitas por red'), h('p', { class: 'nota' }, 'Últimos 30 días.'),
      h('div', { class: 'barras' }, lista.map(function (v) {
        var lleno = h('span', { class: 'lleno' });
        // (Por CSSOM: la CSP no deja estilos escritos en el HTML.)
        lleno.style.width = Math.max(2, Math.min(100, Math.round(num(v.visitas) * 100 / max))) + '%';
        return h('div', { class: 'barra' }, h('span', null, v.nombre || v.red), h('span', { class: 'fondo' }, lleno), h('span', { class: 'n' }, String(Math.round(num(v.visitas)))));
      })));
  }

  function venta(v) {
    var tono = { verde: 'verde', ambar: 'ambar' }[v.tono] || '';
    var cuenta = v.estado === 'acreditada' || v.estado === 'pendiente';
    // La fecha, la tienda (un dato: no se traduce), la red y si fue con su cupón, separados por « · ».
    var donde = [fecha(v.fecha), v.tienda ? dato('span', null, v.tienda) : null, v.red || null, v.via === 'cupon' ? 'con tu cupón' : null]
      .filter(Boolean).reduce(function (a, x, i) { return a.concat(i ? [' · ', x] : [x]); }, []);
    return h('div', { class: 'renglon' },
      h('div', { class: 'txt' },
        dato('b', null, '#' + Math.round(num(v.orderId)) + ' · ' + (v.productos || 'Productos')),
        h('small', null, donde),
        h('div', { class: 'comision' }, sinCortes(v.texto)),
        v.liberaEn ? h('span', { class: 'credito' }, 'Tarjeta de crédito: se libera en 24 h (' + fecha(v.liberaEn) + ')') : null),
      h('div', { class: 'monto' }, (cuenta ? '+' + dolares(v.netoUsd) : dolares(0)), h('br'), h('span', { class: 'pill ' + tono }, v.estadoTexto || '')));
  }

  /**
   * «Empieza a ganar · n de 4» (P8): mientras no tenga ventas. Los pasos salen de lo que ya hay: sus enlaces (`GET
   * enlaces`), si alguno tuvo visitas, y si ya tiene sus datos para facturar y su cuenta bancaria.
   */
  function tarjetaEmpieza(d, misEnlaces) {
    var lista = misEnlaces || [];
    var tieneEnlace = lista.length > 0;
    var compartido = lista.some(function (e) { return num(e.visitas) > 0; });
    var datosListos = !(estado.faltan || []).length && !!(d.saldo && d.saldo.cuenta);
    var pasos = [[true, 'Cuenta creada'], [tieneEnlace, 'Crea tu primer enlace'], [compartido, 'Compártelo'], [datosListos, 'Agrega tus datos para cobrar']];
    var hechos = pasos.filter(function (p) { return p[0]; }).length;
    var lleno = h('span', { class: 'lleno' });
    lleno.style.width = Math.round(hechos * 100 / pasos.length) + '%';
    var boton = !tieneEnlace ? h('a', { class: 'btn', href: '#catalogo' }, 'Elegir mi primer producto')
      : !datosListos ? h('button', { class: 'btn', type: 'button', onclick: completarDatos }, 'Agregar mis datos')
        : h('a', { class: 'btn', href: '#catalogo' }, 'Ir al catálogo');
    return h('section', { class: 'tarjeta empieza', id: 'empieza', 'aria-labelledby': 'empieza-titulo' },
      h('h2', { id: 'empieza-titulo' }, 'Empieza a ganar · ' + hechos + ' de 4'),
      h('span', { class: 'progreso', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '4', 'aria-valuenow': String(hechos) }, lleno),
      h('ol', { class: 'pasos' }, pasos.map(function (p) {
        return h('li', { class: p[0] ? 'hecho' : null }, h('span', { class: 'marca-paso', 'aria-hidden': 'true' }, p[0] ? ico('check') : null), h('span', null, p[1]));
      })),
      h('div', { class: 'botones' }, boton));
  }

  function inicio(d, misEnlaces) {
    var r = d.resumen || {};
    var lista = d.ventas || [];
    var nombre = String((d.vendedor && d.vendedor.nombre) || '').split(' ')[0];
    var sinVentas = !Math.round(num(r.ventas)) && !lista.length;
    return [
      h('h1', { class: 'saludo' }, 'Hola, ', dato('span', null, nombre)),
      h('p', { class: 'sub' }, sinVentas ? 'Elige un producto, comparte tu enlace y gana en cada venta.' : 'Así van tus ventas.'),
      sinVentas ? tarjetaEmpieza(d, misEnlaces) : null,
      h('div', { class: 'rejilla dos' },
        h('div', null, tarjetaSaldo(d.saldo, d.avisoSaldo),
          h('div', { class: 'cifras' },
            h('div', { class: 'cifra' }, h('small', null, 'Ventas este mes'), h('b', null, String(Math.round(num(r.ventasMes))))),
            h('div', { class: 'cifra verde' }, h('small', null, 'Ganado este mes'), h('b', null, dolares(r.netoMes))),
            h('div', { class: 'cifra ambar' }, h('small', null, 'Pendiente'), h('b', null, dolares(r.pendienteUsd))))),
        h('div', null, tarjetaCupon(d.cupon), tarjetaVisitas(d.visitas))),
      sinVentas ? null : [
        h('span', { class: 'etq' }, 'Ventas recientes'),
        h('div', { class: 'lista' }, lista.map(venta)), botonIr('#ventas', 'Ver todas', 'borde')],
    ];
  }

  function logo(foto, nombre) {
    var f = fotoSegura(foto);
    return f ? h('img', { class: 'logo', src: f, alt: '', loading: 'lazy' }) : dato('span', { class: 'inicial', 'aria-hidden': 'true' }, inicial(nombre));
  }

  // ── El catálogo (P2, P3) ───────────────────────────────────────────────────

  /** Lo que se necesita para compartir un producto (la hoja y la imagen para historia). */
  function infoDeProducto(p) {
    return {
      tipo: 'p', id: p.id, nombre: p.nombre, tienda: p.tienda, foto: p.foto, venta: p.venta, desde: !!p.desde,
      ganas: p.ganas, ganasHasta: p.ganasHasta, url: p.url, codigo: p.codigo,
    };
  }
  function infoDeTienda(t) {
    return { tipo: 't', id: t.id, nombre: t.nombre, tienda: t.nombre, foto: t.logo, ganasHasta: t.ganasHasta, url: t.url, codigo: t.codigo, rubro: t.categoria };
  }

  /**
   * Un producto en FILA compacta (P3): foto de 60 px, nombre, «5,50 $ · comisión 10 %», «Ganas 0,46 $», «✓ Enlace listo
   * · 41 visitas» si ya lo tiene, atenuado si está agotado, y el botón cuadrado de compartir. `conTienda`: en la
   * pestaña «Productos» (todo el catálogo) se dice de qué tienda es.
   */
  function filaProducto(p, conTienda) {
    var f = fotoSegura(p.foto);
    var agotado = p.disponible === false;
    var listo = h('span', { class: 'ya-tiene' });
    var pintarListo = function () {
      vaciar(listo);
      listo.hidden = !p.codigo;
      if (!p.codigo) return;
      var v = estado.cat && estado.cat.visitas ? estado.cat.visitas[p.codigo] : undefined;
      listo.textContent = '✓ Enlace listo' + (v != null ? ' · ' + plural(v, 'visita', 'visitas') : '');
    };
    pintarListo();
    var boton = h('button', { class: 'btn-cuadro', type: 'button', 'aria-label': 'Compartir', title: 'Compartir' }, ico('compartir'));
    boton.addEventListener('click', function () {
      compartir(infoDeProducto(p), { tipo: 'p', productId: p.id }, boton, function (e) {
        p.codigo = e.codigo; p.url = e.url;
        if (estado.cat && estado.cat.visitas && estado.cat.visitas[e.codigo] == null) estado.cat.visitas[e.codigo] = 0;
        pintarListo();
      });
    });
    return h('div', { class: 'fila-prod' + (agotado ? ' agotado' : '') },
      f ? h('img', { class: 'foto-fila', src: f, alt: '', loading: 'lazy' }) : dato('span', { class: 'foto-fila sin-foto', 'aria-hidden': 'true' }, inicial(p.nombre)),
      h('div', { class: 'txt' },
        dato('b', null, p.nombre),
        conTienda && p.tienda ? dato('small', { class: 'de-tienda' }, p.tienda) : null,
        h('small', null, precioParaVer(p) + ' · comisión ' + porcentaje(p.pct)),
        h('span', { class: 'gana' }, textoGanas(p)),
        agotado ? h('span', { class: 'pill' }, 'Agotado por ahora') : null,
        listo),
      boton);
  }

  /** Una tienda en fila (P2): logo redondo, nombre, «8 productos · rubro», «hasta 2,27 $» en verde y la flecha. */
  function filaTienda(t) {
    return h('a', { class: 'fila-tienda', href: '#catalogo/' + Math.round(num(t.id)) },
      logo(t.logo, t.nombre),
      h('span', { class: 'txt' },
        dato('b', null, t.nombre),
        h('small', null, plural(t.productos, 'producto', 'productos'), t.categoria ? [' · ', dato('span', null, t.categoria)] : null),
        num(t.ganasHasta) > 0 ? h('span', { class: 'gana' }, 'hasta ' + dolares(t.ganasHasta)) : null),
      t.codigo ? h('span', { class: 'pill verde', title: 'Enlace listo' }, ico('check')) : null,
      ico('derecha'));
  }

  /** «Ganan más esta semana»: 3 tarjetas pequeñas (de `top`). */
  function gananMas(top) {
    var tres = (top || []).slice(0, 3);
    if (!tres.length) return null;
    return h('section', { class: 'top', 'aria-labelledby': 'top-titulo' },
      h('span', { class: 'etq', id: 'top-titulo' }, 'Ganan más esta semana'),
      h('div', { class: 'top-tarjetas' }, tres.map(function (p) {
        var f = fotoSegura(p.foto);
        var b = h('button', { class: 'top-tarjeta', type: 'button' },
          f ? h('img', { src: f, alt: '', loading: 'lazy' }) : dato('span', { class: 'sin-foto', 'aria-hidden': 'true' }, inicial(p.nombre)),
          dato('b', null, p.nombre),
          h('span', { class: 'gana' }, textoGanas(p)));
        b.addEventListener('click', function () {
          compartir(infoDeProducto(p), { tipo: 'p', productId: p.id }, b, function (e) { p.codigo = e.codigo; p.url = e.url; });
        });
        return b;
      })));
  }

  /** «Ordenar: Mayor ganancia / Más vendidos / Precio / A–Z». */
  function selectorDeOrden(id, valor, alCambiar) {
    var s = h('select', { class: 'campo chico', id: id }, ORDENES.map(function (o) {
      var op = h('option', { value: o[0] }, o[1]);
      if (o[0] === valor) op.selected = true;
      return op;
    }));
    s.addEventListener('change', function () { alCambiar(s.value); });
    return h('div', { class: 'ordenar' }, h('label', { for: id }, 'Ordenar:'), h('div', { class: 'con-flecha' }, s, ico('abajo')));
  }

  /** La lista de productos con «Ver más» (`pagina`, `hayMas`). `cargarMas()` devuelve una promesa con la página siguiente. */
  function listaDeProductos(datos, conTienda, cargarMas) {
    var lista = datos.productos || [];
    if (!lista.length) return vacio('No hay productos con ese filtro', 'Prueba con otra búsqueda o quita los filtros.');
    var caja = h('div', { class: 'lista filas', id: 'lista-productos' }, lista.map(function (p) { return filaProducto(p, conTienda); }));
    var mas = h('button', { class: 'btn borde', type: 'button', id: 'ver-mas' }, 'Ver más');
    var zona = h('div', { class: 'botones' }, mas);
    zona.hidden = !datos.hayMas;
    mas.addEventListener('click', function () {
      mas.disabled = true;
      cargarMas().then(function (d) {
        mas.disabled = false;
        poner(caja, (d.productos || []).map(function (p) { return filaProducto(p, conTienda); }));
        zona.hidden = !d.hayMas;
      }, function (e) { mas.disabled = false; if (e.status === 401) { fallo(e); return; } avisar(e.message); });
    });
    return [caja, zona];
  }

  /** P2: el cuerpo del catálogo (lo que cambia al buscar, al elegir rubro o al cambiar de pestaña). */
  function cuerpoDelCatalogo(c) {
    var t = c.tiendas || {};
    var tiendas = t.tiendas || [];
    var totalProductos = c.productos && c.productos.total != null ? Math.round(num(c.productos.total))
      : tiendas.reduce(function (a, x) { return a + Math.round(num(x.productos)); }, 0);
    var pestana = function (clave, texto, n) {
      return h('button', {
        class: 'segmento', type: 'button', role: 'tab', id: 'pestana-' + clave, 'aria-selected': c.pestana === clave ? 'true' : 'false',
        onclick: function () { if (c.pestana !== clave) { c.pestana = clave; pintarCuerpoDelCatalogo(); } },
      }, texto + ' · ' + n);
    };
    var lista;
    if (c.pestana === 'productos') {
      lista = [
        selectorDeOrden('orden-catalogo', c.orden, function (v) { c.orden = v; recargarProductos(); }),
        c.productos ? listaDeProductos(c.productos, true, masProductosDelCatalogo) : cargando(),
      ];
    } else {
      lista = tiendas.length
        ? h('div', { class: 'lista filas' }, tiendas.map(filaTienda))
        : vacio('No hay tiendas con ese filtro', 'Prueba con otra búsqueda o quita los filtros.');
    }
    return [
      c.q ? null : gananMas(t.top),
      h('div', { class: 'segmentos', role: 'tablist', 'aria-label': 'Ver' },
        pestana('tiendas', 'Tiendas', tiendas.length), pestana('productos', 'Productos', totalProductos)),
      lista,
    ];
  }

  /** Los rubros en botones redondos con desplazamiento horizontal. */
  function rubros(c) {
    var cats = (c.tiendas && c.tiendas.categorias) || [];
    if (!cats.length) return null;
    var boton = function (valor, texto, esDato) {
      var b = (esDato ? dato : h)('button', { class: 'rubro', type: 'button', 'aria-pressed': String(c.categoria) === String(valor) ? 'true' : 'false' }, texto);
      b.addEventListener('click', function () {
        if (String(c.categoria) === String(valor)) return;
        c.categoria = String(valor);
        var todos = b.parentNode ? b.parentNode.querySelectorAll('.rubro') : [];
        for (var i = 0; i < todos.length; i++) todos[i].setAttribute('aria-pressed', todos[i] === b ? 'true' : 'false');
        recargarCatalogo();
      });
      return b;
    };
    return h('div', { class: 'rubros', role: 'group', 'aria-label': 'Rubro' }, boton('', 'Todos'),
      cats.map(function (x) { return boton(Math.round(num(x.id)), x.nombre, true); }));
  }

  function catalogo(c) {
    var buscar = h('input', { class: 'campo', type: 'search', id: 'buscar', placeholder: 'Busca un producto o una tienda', value: c.q || '', autocomplete: 'off', enterkeyhint: 'search', 'aria-label': 'Buscar' });
    var reloj = null;
    buscar.addEventListener('input', function () {
      clearTimeout(reloj);
      reloj = setTimeout(function () { c.q = buscar.value.trim(); recargarCatalogo(); }, 320);
    });
    return [
      h('h1', { class: 'saludo' }, 'Catálogo'),
      h('p', { class: 'sub' }, 'Escoge qué promocionar. Ganas en cada unidad que se venda con tu enlace o tu cupón.'),
      h('div', { class: 'buscador' }, ico('buscar'), buscar),
      h('div', { id: 'zona-rubros' }, rubros(c)),
      h('div', { id: 'cuerpo-catalogo' }, cuerpoDelCatalogo(c)),
    ];
  }

  /** P3: la tienda abierta. */
  function tiendaAbierta(c) {
    var ta = c.tienda;
    var t = ta.info || {};
    var rotulo = h('span', null, 'Enlace de toda la tienda');
    var botonTienda = h('button', { class: 'btn suave', type: 'button', id: 'enlace-tienda' }, ico(t.codigo ? 'check' : 'enlaces'), rotulo);
    botonTienda.addEventListener('click', function () {
      compartir(infoDeTienda(t), { tipo: 't', companyId: t.id }, botonTienda, function (e) { t.codigo = e.codigo; t.url = e.url; });
    });
    var total = ta.datos && ta.datos.total != null ? ta.datos.total : t.productos;
    return [
      h('div', { class: 'tienda-cab' },
        h('a', { class: 'volver', href: '#catalogo', 'aria-label': 'Volver', title: 'Volver' }, ico('volver')),
        logo(t.logo, t.nombre),
        h('div', { class: 'txt' }, dato('b', null, t.nombre || ''),
          h('small', null, plural(total, 'producto', 'productos'), t.categoria ? [' · ', dato('span', null, t.categoria)] : null))),
      h('div', { class: 'botones' }, botonTienda),
      selectorDeOrden('orden-tienda', ta.orden, function (v) { ta.orden = v; recargarTienda(); }),
      h('div', { id: 'productos-tienda' }, ta.datos ? listaDeProductos(ta.datos, false, masProductosDeLaTienda) : cargando()),
    ];
  }

  function enlaces(d) {
    var lista = d.enlaces || [];
    var cab = [h('h1', { class: 'saludo' }, 'Mis enlaces'), h('p', { class: 'sub' }, 'Cada enlace es tuyo y no vence. Siempre abre la tienda web de Deliservy.')];
    if (!lista.length) return cab.concat([vacio('Aún no tienes enlaces', 'Ve al catálogo y toca el botón de compartir en lo que quieras promocionar.', botonIr('#catalogo', 'Ir al catálogo'))]);
    return cab.concat([h('div', { class: 'rejilla' }, lista.map(function (e) {
      var url = urlSegura(e.url);
      var esProducto = e.tipo === 'p';
      var titulo = esProducto ? (e.producto || 'Producto') : 'Tienda ' + (e.tienda || '');
      var foto = fotoSegura(esProducto ? e.foto : e.logo);
      var redes = (e.redes || []).map(function (r) { return h('span', { class: 'pill' }, h('span', null, r.nombre || r.red), ' · ' + Math.round(num(r.visitas))); });
      return h('div', { class: 'tarjeta' },
        h('div', { class: 'enlace-cab' },
          foto ? h('img', { class: 'miniatura', src: foto, alt: '', loading: 'lazy' }) : dato('span', { class: 'inicial', 'aria-hidden': 'true' }, inicial(titulo)),
          h('div', { class: 'txt' },
            esProducto ? dato('b', null, titulo) : h('b', null, 'Tienda ', dato('span', null, e.tienda || '')),
            h('small', null, esProducto ? dato('span', null, e.tienda || '') : 'Todo su catálogo del programa', e.activo === false ? ' · apagado' : ''))),
        url ? [
          h('div', { class: 'url completa' }, dato('code', null, url.replace(/^https?:\/\//, ''))),
          h('div', { class: 'botones' },
            h('button', { class: 'btn chico suave', type: 'button', onclick: function () { copiar(url); } }, ico('copiar'), 'Copiar'),
            h('button', { class: 'btn chico', type: 'button', onclick: function () {
              abrirHoja({ tipo: esProducto ? 'p' : 't', nombre: esProducto ? e.producto : e.tienda, tienda: e.tienda, foto: esProducto ? e.foto : e.logo, url: url, codigo: e.codigo });
            } }, ico('compartir'), 'Compartir')),
        ] : null,
        h('div', { class: 'chips' }, redes.length ? redes : h('span', { class: 'pill' }, 'Sin visitas todavía')),
        h('p', { class: 'nota' }, plural(e.visitas, 'visita', 'visitas') + ' · ' + plural(e.ventas, 'venta', 'ventas') + ' · ganaste ' + dolares(e.netoUsd)));
    }))]);
  }

  function ventas(d) {
    var r = d.resumen || {};
    var lista = d.ventas || [];
    var mas = d.hayMas ? h('div', { class: 'botones' }, h('button', { class: 'btn borde', type: 'button', onclick: masVentas }, 'Ver más')) : null;
    return [
      h('h1', { class: 'saludo' }, 'Mis ventas'),
      h('p', { class: 'sub' }, 'Cobras cuando el banco aprueba el pago. Nunca verás datos de los clientes.'),
      h('div', { class: 'cifras' },
        h('div', { class: 'cifra verde' }, h('small', null, 'Ganado este mes'), h('b', null, dolares(r.netoMes))),
        h('div', { class: 'cifra ambar' }, h('small', null, 'Pendiente'), h('b', null, dolares(r.pendienteUsd))),
        h('div', { class: 'cifra' }, h('small', null, 'Ventas en total'), h('b', null, String(Math.round(num(r.ventas)))))),
      h('span', { class: 'etq' }, 'Cada venta'),
      lista.length ? [h('div', { class: 'lista' }, lista.map(venta)), mas] : vacio('Aún no tienes ventas', 'Cuando alguien compre con tu enlace o tu cupón, la verás aquí.'),
      h('p', { class: 'ayuda' }, 'La comisión es el precio de venta × el % del producto; se le descuenta el 16 % y te llega el resto.'),
    ];
  }

  var ESTADO_DEL_COBRO = { COMPLETED: ['Pagado', 'verde'], PENDING: ['En proceso', 'ambar'], FAILED: ['No salió', 'roja'] };
  var TIPO_DE_CUENTA = { CNTA: 'Corriente', AHORRO: 'Ahorro' };

  function cobros(d, editar) {
    var s = d.saldo;
    var cuenta = s && s.cuenta;
    var bancos = d.bancos || [];
    var nombreBanco = function (codigo) {
      var b = bancos.filter(function (x) { return x.codigo === String(codigo); })[0];
      return b ? b.nombre : 'Banco ' + String(codigo || '');
    };
    var cuentaHtml = cuenta
      ? h('div', { class: 'renglon' }, dato('span', { class: 'inicial', 'aria-hidden': 'true' }, inicial(nombreBanco(cuenta.banco))),
        h('div', { class: 'txt' },
          dato('b', null, nombreBanco(cuenta.banco) + ' · ' + (cuenta.numero || '')),
          h('small', null, TIPO_DE_CUENTA[cuenta.tipo] || '', ' · ', dato('span', null, cuenta.titular || ''), ' · ', dato('span', null, cuenta.cedula || ''))))
      : h('p', { class: 'nota' }, 'Aún no tienes cuenta bancaria. Regístrala para que te paguemos.');

    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var banco = bancos.length
      ? h('select', { class: 'campo', id: 'c-banco', name: 'creditorBank', required: true }, h('option', { value: '' }, 'Elige tu banco'),
        bancos.map(function (b) {
          var o = dato('option', { value: b.codigo }, b.codigo + ' · ' + b.nombre);
          if (cuenta && String(cuenta.banco) === b.codigo) o.selected = true;
          return o;
        }))
      : h('input', { class: 'campo', id: 'c-banco', name: 'creditorBank', inputmode: 'numeric', maxlength: '4', placeholder: 'Código del banco, p. ej. 0191', required: true });
    var corriente = h('input', { type: 'radio', name: 'creditorAccType', value: 'CNTA' });
    var ahorro = h('input', { type: 'radio', name: 'creditorAccType', value: 'AHORRO' });
    if (cuenta && cuenta.tipo === 'AHORRO') ahorro.checked = true; else corriente.checked = true;
    var numero = h('input', { class: 'campo', id: 'c-numero', name: 'creditorAccount', inputmode: 'numeric', maxlength: '26', placeholder: '0191 0001 23 4567890123', autocomplete: 'off', required: true });
    var titular = h('input', { class: 'campo', id: 'c-titular', name: 'creditorName', maxlength: '60', autocomplete: 'name', value: cuenta ? cuenta.titular || '' : '', required: true });
    var cedulaTipo = h('select', { class: 'campo', name: 'cedulaTipo', 'aria-label': 'Tipo de cédula' }, h('option', { value: 'V' }, 'V'), h('option', { value: 'E' }, 'E'));
    var cedula = h('input', { class: 'campo', id: 'c-cedula', name: 'cedulaNumero', inputmode: 'numeric', maxlength: '10', placeholder: '12345678', required: true });

    var formulario = h('form', {
      novalidate: true, hidden: !!(cuenta && !editar),
      onsubmit: function (ev) {
        ev.preventDefault();
        var boton = ev.target.querySelector('button[type="submit"]');
        var digitos = String(numero.value || '').replace(/\D/g, '');
        var codigoBanco = String(banco.value || '').replace(/\D/g, '');
        var malo = !/^\d{4}$/.test(codigoBanco) ? 'Elige tu banco.'
          : digitos.length !== 20 ? 'El número de cuenta tiene 20 números.'
            : digitos.slice(0, 4) !== codigoBanco ? 'Ese número de cuenta no es de ese banco: los primeros 4 números son los del banco (' + codigoBanco + ').'
              : String(titular.value || '').trim().length < 2 ? 'Escribe el nombre del titular.'
                : !/^\d{6,9}$/.test(String(cedula.value || '').replace(/\D/g, '')) ? 'Escribe la cédula del titular.' : '';
        if (malo) { error.textContent = malo; error.hidden = false; return; }
        error.hidden = true;
        boton.disabled = true;
        pedir('POST', '/cuenta', {
          creditorBank: codigoBanco, creditorAccType: ahorro.checked ? 'AHORRO' : 'CNTA', creditorAccount: digitos,
          creditorName: String(titular.value).trim(), creditorID: String(cedulaTipo.value) + String(cedula.value).replace(/\D/g, ''),
        }).then(function () {
          avisar('Cuenta guardada');
          mostrar();
        }, function (e) {
          boton.disabled = false;
          if (e.status === 401) { fallo(e); return; }
          error.textContent = e.message; error.hidden = false;
        });
      },
    },
    h('label', { class: 'etq-campo', for: 'c-banco' }, 'Banco'), banco,
    h('label', { class: 'etq-campo' }, 'Tipo de cuenta'),
    h('div', { class: 'opciones-radio' }, h('label', null, corriente, ' Corriente'), h('label', null, ahorro, ' Ahorro')),
    h('label', { class: 'etq-campo', for: 'c-numero' }, 'Número de cuenta (20 números)'), numero,
    h('label', { class: 'etq-campo', for: 'c-titular' }, 'Titular'), titular,
    h('label', { class: 'etq-campo', for: 'c-cedula' }, 'Cédula del titular'), h('div', { class: 'fila-campos' }, cedulaTipo, cedula),
    error,
    h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Guardar cuenta'),
      cuenta ? h('button', { class: 'btn borde', type: 'button', onclick: function () { pintarCobros(false); } }, 'Cancelar') : null));

    var retiros = (s && s.retiros) || [];
    // Registro en 2 pasos (30-oct-2026, contrato §3): los datos fiscales se piden al cobrar. Sin ellos, el pago de cada
    // noche no sale: primero «Mis datos» (abierto) y después la cuenta bancaria.
    var faltanDatos = !!(estado.datos && (estado.faltan || []).length);
    if (faltanDatos && !cuenta) {
      formulario.hidden = true;
      if (!estado.editarDatos) { estado.editarDatos = true; estado.datosEscritos = null; }
    }
    var primeroDatos = faltanDatos && !cuenta
      ? h('p', { class: 'aviso-datos', role: 'status' }, 'Antes de tu cuenta bancaria, completa tus datos para facturar (arriba). Sin ellos no se te puede pagar.')
      : null;
    return [
      h('h1', { class: 'saludo' }, 'Cobros'), h('p', { class: 'sub' }, 'Te pagamos en tu cuenta bancaria.'),
      faltanDatos ? h('div', { class: 'separado primero' }, h('span', { class: 'etq' }, 'Paso 1 · Tus datos para cobrar'), tarjetaMisDatos()) : null,
      faltanDatos ? h('span', { class: 'etq' }, 'Paso 2 · Tu cuenta bancaria') : null,
      h('div', { class: 'rejilla dos' },
        h('div', null, tarjetaSaldo(s, d.avisoSaldo)),
        h('div', { class: 'tarjeta' }, h('h2', null, 'Tu cuenta bancaria'), primeroDatos || cuentaHtml,
          cuenta && !editar ? h('div', { class: 'botones' }, h('button', { class: 'btn borde chico', type: 'button', onclick: function () { pintarCobros(true); } }, 'Cambiar cuenta')) : null,
          formulario, s ? null : h('p', { class: 'nota' }, NOTA_PAGO))),
      estado.datos && !faltanDatos ? h('div', { class: 'separado' }, tarjetaMisDatos()) : null,
      h('span', { class: 'etq' }, 'Tus cobros'),
      retiros.length ? h('div', { class: 'lista' }, retiros.map(function (r) {
        var e = ESTADO_DEL_COBRO[r.estado] || [r.estado || '—', ''];
        return h('div', { class: 'renglon' }, h('div', { class: 'txt' }, h('b', null, fecha(r.fecha))),
          h('div', { class: 'monto' }, bolivares(r.montoBs), h('br'), h('span', { class: 'pill ' + e[1] }, e[0])));
      })) : vacio('Aún no hay cobros', 'Cuando te paguemos, lo verás aquí.'),
    ];
  }

  // ── Compartir (P7): la hoja, la imagen para historia y el QR ─────────────────

  var HISTORIA = { ancho: 1080, alto: 1920 };
  var LETRA_LIENZO = '"Plus Jakarta Sans", -apple-system, "Segoe UI", Roboto, sans-serif';

  /** Una imagen para el lienzo. `cruzada`: con `crossOrigin='anonymous'` (las fotos del almacén); si no carga, null. */
  function cargarImagen(src, cruzada) {
    return new Promise(function (listo) {
      if (!src) { listo(null); return; }
      var img = new raiz.Image();
      var hecho = false;
      var fin = function (v) { if (!hecho) { hecho = true; listo(v); } };
      if (cruzada) img.crossOrigin = 'anonymous';
      img.onload = function () { fin(img.naturalWidth ? img : null); };
      img.onerror = function () { fin(null); };
      setTimeout(function () { fin(null); }, 8000);
      img.src = src;
    });
  }

  /** La matriz del QR (con `vendor/qrcode.js`), o null si no está o el texto no cabe. */
  function matrizQR(texto) {
    var gen = raiz.qrcode;
    if (typeof gen !== 'function' || !texto) return null;
    try {
      var q = gen(0, 'M');
      q.addData(String(texto));
      q.make();
      var n = q.getModuleCount();
      return { n: n, oscuro: function (f, c) { return q.isDark(f, c); } };
    } catch (_) { return null; }
  }

  /** El QR en un lienzo (`x`, `y`, `lado` con el margen blanco ya dentro). */
  function dibujarQR(ctx, texto, x, y, lado) {
    var m = matrizQR(texto);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, lado, lado);
    if (!m) return false;
    var celda = Math.floor(lado / (m.n + 4));
    var inicio = Math.floor((lado - celda * m.n) / 2);
    ctx.fillStyle = '#111114';
    for (var f = 0; f < m.n; f++) for (var c = 0; c < m.n; c++) if (m.oscuro(f, c)) ctx.fillRect(x + inicio + c * celda, y + inicio + f * celda, celda, celda);
    return true;
  }

  function rectanguloRedondo(ctx, x, y, w, alto, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + alto, r);
    ctx.arcTo(x + w, y + alto, x, y + alto, r);
    ctx.arcTo(x, y + alto, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Parte un texto en renglones de `ancho` como mucho; el último, con «…» si sobra. */
  function renglones(ctx, texto, ancho, max) {
    var palabras = String(texto || '').split(/\s+/).filter(Boolean);
    var out = [];
    var actual = '';
    for (var i = 0; i < palabras.length; i++) {
      var prueba = actual ? actual + ' ' + palabras[i] : palabras[i];
      if (ctx.measureText(prueba).width <= ancho || !actual) actual = prueba;
      else { out.push(actual); actual = palabras[i]; }
    }
    if (actual) out.push(actual);
    if (out.length > max) {
      out = out.slice(0, max);
      var u = out[max - 1];
      while (u.length > 1 && ctx.measureText(u + '…').width > ancho) u = u.slice(0, -1);
      out[max - 1] = u.replace(/\s+$/, '') + '…';
    }
    return out.map(function (r) {
      var t = r;
      while (t.length > 1 && ctx.measureText(t).width > ancho) t = t.slice(0, -2) + '…';
      return t;
    });
  }

  /**
   * La imagen para historia (1080 × 1920): la foto del producto, su nombre, la tienda, el precio, el QR del enlace, el
   * logo y «Pídelo en Deliservy». Sin foto (o si su almacén no deja dibujarla: CORS), un bloque de color con la inicial.
   */
  function dibujarHistoria(lienzo, info, foto, logoImg) {
    var W = HISTORIA.ancho, H = HISTORIA.alto;
    lienzo.width = W; lienzo.height = H;
    var ctx = lienzo.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#E41616'); g.addColorStop(1, '#A80E18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    // Arriba: el logo y «Deliservy».
    ctx.fillStyle = '#FFFFFF';
    rectanguloRedondo(ctx, W / 2 - 66, 84, 132, 132, 36); ctx.fill();
    if (logoImg) ctx.drawImage(logoImg, W / 2 - 52, 98, 104, 104);
    ctx.font = '800 56px ' + LETRA_LIENZO; ctx.textAlign = 'center';
    ctx.fillText('Deliservy', W / 2, 296);

    // La tarjeta blanca con la foto.
    var cx = 90, cy = 350, cw = W - 180, ch = 1150;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#FFFFFF'; rectanguloRedondo(ctx, cx, cy, cw, ch, 48); ctx.fill(); ctx.restore();
    var lado = 760, fx = (W - lado) / 2, fy = cy + 50;
    ctx.save(); rectanguloRedondo(ctx, fx, fy, lado, lado, 36); ctx.clip();
    if (foto) {
      var s = Math.max(lado / foto.naturalWidth, lado / foto.naturalHeight);
      var dw = foto.naturalWidth * s, dh = foto.naturalHeight * s;
      ctx.drawImage(foto, fx + (lado - dw) / 2, fy + (lado - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = '#FDECEE'; ctx.fillRect(fx, fy, lado, lado);
      ctx.fillStyle = '#C8141F'; ctx.font = '800 340px ' + LETRA_LIENZO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(inicial(info.nombre), W / 2, fy + lado / 2 + 10);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    // Nombre, tienda y precio.
    var y = fy + lado + 92;
    ctx.textAlign = 'center'; ctx.fillStyle = '#16161A'; ctx.font = '800 62px ' + LETRA_LIENZO;
    renglones(ctx, info.nombre || '', cw - 100, 2).forEach(function (r) { ctx.fillText(r, W / 2, y); y += 72; });
    ctx.fillStyle = '#62626E'; ctx.font = '600 40px ' + LETRA_LIENZO;
    var sub = info.tipo === 't' ? 'Tienda en Deliservy' : (info.tienda || '');
    if (sub) { ctx.fillText(renglones(ctx, sub, cw - 100, 1)[0] || '', W / 2, y); y += 70; }
    var precio = info.tipo === 't' ? '' : precioParaVer(info).replace(NBSP, ' ');
    if (precio) {
      ctx.font = '800 56px ' + LETRA_LIENZO;
      var pw = ctx.measureText(precio).width + 64;
      ctx.fillStyle = '#FDECEE'; rectanguloRedondo(ctx, (W - pw) / 2, y - 52, pw, 78, 39); ctx.fill();
      ctx.fillStyle = '#C8141F'; ctx.fillText(precio, W / 2, y + 6);
    }

    // Abajo: el QR del enlace y «Pídelo en Deliservy».
    var url = urlSegura(info.url);
    var qx = 90, qy = 1550, ql = 300;
    ctx.fillStyle = '#FFFFFF'; rectanguloRedondo(ctx, qx - 6, qy - 6, ql + 12, ql + 12, 28); ctx.fill();
    dibujarQR(ctx, url, qx, qy, ql);
    ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 58px ' + LETRA_LIENZO;
    ctx.fillText('Pídelo en', qx + ql + 50, qy + 92);
    ctx.fillText('Deliservy', qx + ql + 50, qy + 160);
    ctx.font = '600 32px ' + LETRA_LIENZO; ctx.fillStyle = 'rgba(255,255,255,.88)';
    var corto = url.replace(/^https?:\/\/(www\.)?/, '');
    ctx.fillText(renglones(ctx, corto, W - (qx + ql + 50) - 60, 1)[0] || '', qx + ql + 50, qy + 226);
    return lienzo;
  }

  /** Dibuja la historia con la foto; si el navegador no deja leer el lienzo (CORS), la vuelve a dibujar sin ella. */
  function historiaLista(lienzo, info) {
    var fuentes = documento.fonts && documento.fonts.load
      ? Promise.all([documento.fonts.load('800 62px "Plus Jakarta Sans"'), documento.fonts.load('600 40px "Plus Jakarta Sans"')]).catch(function () { return null; })
      : Promise.resolve();
    return Promise.all([cargarImagen(fotoSegura(info.foto), true), cargarImagen(LOGO_DELISERVY, false), fuentes]).then(function (r) {
      dibujarHistoria(lienzo, info, r[0], r[1]);
      try { lienzo.getContext('2d').getImageData(0, 0, 1, 1); } catch (_) { dibujarHistoria(lienzo, info, null, r[1]); }
      return lienzo;
    });
  }

  function descargarLienzo(lienzo, nombre) {
    return new Promise(function (listo, mal) {
      var bajar = function (blob) {
        if (!blob) { mal(new Error('sin imagen')); return; }
        var u = raiz.URL.createObjectURL(blob);
        var a = documento.createElement('a');
        a.href = u; a.download = nombre; a.rel = 'noopener';
        documento.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { raiz.URL.revokeObjectURL(u); }, 4000);
        listo();
      };
      try { lienzo.toBlob(bajar, 'image/png'); } catch (e) { mal(e); }
    });
  }

  function hoja(info, compartirNativo) {
    var i = info || {};
    var url = urlSegura(i.url);
    var texto = textoParaCompartir(i);
    var red = enlacesParaCompartir(url, texto) || {};
    var gana = num(i.ganasHasta) > num(i.ganas) ? num(i.ganasHasta) : num(i.ganas);
    var titulo = gana > 0 ? (i.tipo === 't' ? 'Comparte y gana hasta ' : 'Comparte y gana ') + dolares(gana) : 'Comparte tu enlace';
    var listo = h('button', { class: 'btn borde', type: 'button', onclick: cerrarHoja }, 'Listo');

    // La vista previa de la imagen para historia (el mismo lienzo que se descarga).
    var lienzo = h('canvas', { class: 'historia', 'aria-label': 'Vista previa de la imagen para historia', role: 'img' });
    var preparada = historiaLista(lienzo, i);
    var descargar = h('button', { class: 'btn', type: 'button', id: 'descargar-historia' }, ico('descargar'), 'Descargar imagen para historia');
    descargar.addEventListener('click', function () {
      descargar.disabled = true;
      preparada.then(function () { return descargarLienzo(lienzo, nombreDeArchivo(i.nombre)); }).then(function () {
        descargar.disabled = false; avisar('Imagen descargada');
      }, function () { descargar.disabled = false; avisar('No se pudo preparar la imagen. Intenta de nuevo.'); });
    });

    var qr = h('div', { class: 'qr-caja', id: 'qr-caja', hidden: true });
    var botonQR = h('button', { type: 'button', 'aria-expanded': 'false' }, ico('qr'), 'Código QR');
    botonQR.addEventListener('click', function () {
      if (!qr.firstChild) {
        var c = h('canvas', { class: 'qr-lienzo', role: 'img', 'aria-label': 'Código QR de tu enlace' });
        c.width = 360; c.height = 360;
        dibujarQR(c.getContext('2d'), url, 0, 0, 360);
        var bajarQR = h('button', { class: 'btn chico suave', type: 'button' }, ico('descargar'), 'Descargar QR');
        bajarQR.addEventListener('click', function () { descargarLienzo(c, nombreDeArchivo('qr ' + (i.nombre || ''))).then(function () { avisar('Imagen descargada'); }, function () { avisar('No se pudo preparar la imagen. Intenta de nuevo.'); }); });
        poner(qr, [c, h('p', { class: 'nota' }, 'Ponlo en tu video o en tu historia: al escanearlo se abre tu enlace.'), bajarQR]);
      }
      qr.hidden = !qr.hidden;
      botonQR.setAttribute('aria-expanded', qr.hidden ? 'false' : 'true');
    });
    var mas = h('button', { type: 'button' }, ico('mas'), 'Más…');
    mas.addEventListener('click', function () {
      if (compartirNativo && raiz.navigator.share) raiz.navigator.share({ title: i.nombre || 'Deliservy', text: texto }).catch(function () { return null; });
      else copiar(texto);
    });

    var capa = h('div', { id: 'capa-hoja' },
      h('div', { class: 'velo', onclick: cerrarHoja }),
      h('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hoja-titulo' },
        h('div', { class: 'asa' }),
        h('h2', { id: 'hoja-titulo' }, titulo),
        dato('p', { class: 'nota' }, i.tipo === 't' ? (i.nombre || '') : [i.nombre || '', i.tienda ? ' · ' + i.tienda : ''].join('')),
        enRevision() ? h('p', { class: 'aviso-hoja' }, 'Tu enlace ya está listo: empieza a vender cuando te aprobemos.') : null,
        h('div', { class: 'hoja-cuerpo' },
          h('div', { class: 'previa' }, lienzo),
          h('div', { class: 'hoja-acciones' },
            descargar,
            h('button', { class: 'btn suave', type: 'button', id: 'copiar-texto', onclick: function () { copiar(texto); } }, ico('copiar'), 'Copiar texto con enlace'),
            h('span', { class: 'etq-campo' }, 'Tu enlace'),
            h('div', { class: 'url' }, dato('code', null, url.replace(/^https?:\/\//, '')),
              h('button', { class: 'btn chico suave', type: 'button', onclick: function () { copiar(url); } }, 'Copiar')),
            h('div', { class: 'compartir' },
              h('a', { href: red.whatsapp || '#', target: '_blank', rel: 'noopener noreferrer' }, ico('whatsapp'), 'WhatsApp'),
              botonQR,
              mas),
            qr,
            h('p', { class: 'redes-copiar' },
              h('b', null, 'Historia de Instagram:'), ' sube la imagen y ponle el sticker de enlace con tu dirección. ',
              h('b', null, 'TikTok:'), ' el QR en el video y la dirección en la descripción.'))),
        h('div', { class: 'botones' }, listo)));
    return { capa: capa, listo: listo, preparada: preparada };
  }

  // Para las pruebas (en una caja de node, sin página): lo puro y las pantallas.
  raiz.VendedorPagina = {
    baseDeLaApi: baseDeLaApi, dolares: dolares, bolivares: bolivares, porcentaje: porcentaje, sinCortes: sinCortes,
    fotoSegura: fotoSegura, urlSegura: urlSegura, hrefSeguro: hrefSeguro, enlacesParaCompartir: enlacesParaCompartir,
    textoParaCompartir: textoParaCompartir, textoGanas: textoGanas, comoPromotor: comoPromotor, nombreDeArchivo: nombreDeArchivo,
    verificadorDelRif: verificadorDelRif, documentoNormalizado: documentoNormalizado, documentoParaVer: documentoParaVer,
    numeroDelDocumento: numeroDelDocumento, nombreValido: nombreValido, correoValido: correoValido, revisarDatos: revisarDatos,
    telefonoParaVer: telefonoParaVer,
  };

  if (!documento || !documento.getElementById || !documento.getElementById('app')) return; // (en las pruebas, hasta aquí)

  // ── La sesión (el token de la API, en este navegador) ──────────────────────

  var enMemoria = null;
  var sesion = {
    leer: function () {
      try { var t = raiz.localStorage.getItem(CLAVE_SESION); if (t) return t; } catch (_) { /* sin almacén: en memoria */ }
      return enMemoria;
    },
    guardar: function (t) {
      enMemoria = t;
      try { raiz.localStorage.setItem(CLAVE_SESION, t); } catch (_) { /* queda en memoria mientras la página esté abierta */ }
    },
    borrar: function () {
      enMemoria = null;
      try { raiz.localStorage.removeItem(CLAVE_SESION); } catch (_) { /* nada */ }
    },
  };

  // ── El estado y la red ─────────────────────────────────────────────────────

  var app = documento.getElementById('app');
  var estado = {
    yo: null, seccion: 'inicio', ventas: null, cobros: null,
    // El catálogo (P2/P3): búsqueda, rubro, pestaña, orden, lo cargado y la tienda abierta. `visitas`: código → visitas.
    cat: null,
    // Sus datos para facturar (`GET /yo`: `datos` y `faltanDatos`) y si «Mis datos» está abierto para cambiarlos.
    datos: null, faltan: [], editarDatos: false, datosEscritos: null, irAMisDatos: false,
  };
  var entrada = { paso: 'telefono', telefono: '', espera: null, verificando: false };
  /** El registro en curso: su WhatsApp, el código, lo escrito en el formulario y lo que se manda. */
  function registroNuevo() { return { telefono: '', codigo: '', escrito: null, paraEnviar: null, listo: false, enviando: false }; }
  var reg = registroNuevo();

  function pedir(metodo, ruta, cuerpo) {
    var cab = { Accept: 'application/json' };
    var token = sesion.leer();
    if (token) cab.Authorization = 'Bearer ' + token;
    var op = { method: metodo, credentials: 'omit', cache: 'no-store', headers: cab };
    if (cuerpo !== undefined) { cab['Content-Type'] = 'application/json'; op.body = JSON.stringify(cuerpo); }
    return raiz.fetch(API + ruta, op).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok) return j;
        var m = j && j.message;
        if (r.status === 429 && (!m || /Throttler|Too Many/i.test(String(m)))) m = 'Hiciste muchos intentos seguidos. Espera un minuto y vuelve a intentarlo.';
        var e = new Error(comoPromotor(Array.isArray(m) ? m.join(' ') : (m ? String(m) : 'Algo salió mal. Intenta de nuevo.')));
        e.original = Array.isArray(m) ? m.join(' ') : String(m || '');
        e.status = r.status;
        // El registro y «Mis datos»: el servidor dice qué casilla está mal (`campo`) o si ese número ya vende.
        e.campo = j && typeof j.campo === 'string' ? j.campo : null;
        e.yaEsVendedor = !!(j && j.yaEsVendedor === true);
        throw e;
      });
    }, function () {
      var e = new Error('Sin conexión. Revisa tu internet e intenta de nuevo.');
      e.status = 0;
      throw e;
    });
  }

  function vaciar(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function pintar(nodo) { vaciar(app); poner(app, nodo); }
  function enContenido(nodos) {
    var c = documento.getElementById('contenido');
    if (!c) return;
    vaciar(c);
    c.appendChild(h('div', { class: 'vista' }, nodos));
  }

  var relojAviso = null;
  function avisar(texto) {
    var viejo = documento.querySelector('.aviso');
    if (viejo) viejo.remove();
    var el = h('div', { class: 'aviso', role: 'status' }, texto);
    documento.body.appendChild(el);
    clearTimeout(relojAviso);
    relojAviso = setTimeout(function () { el.remove(); }, 2400);
  }

  function copiar(texto) {
    var t = String(texto || '');
    if (!t) return;
    var viejo = function () {
      var a = h('textarea', { readonly: true, class: 'sr' });
      a.value = t;
      documento.body.appendChild(a);
      a.select();
      try { documento.execCommand('copy'); avisar('Copiado'); } catch (_) { avisar('No se pudo copiar: mantén presionado el texto'); }
      a.remove();
    };
    if (raiz.navigator.clipboard && raiz.isSecureContext) raiz.navigator.clipboard.writeText(t).then(function () { avisar('Copiado'); }, viejo);
    else viejo();
  }

  /** Lo que el servidor dice al fallar: sesión que terminó → entrar; cuenta en revisión → su pantalla; lo demás, en la vista. */
  function fallo(e, enLaVista) {
    if (e && e.status === 401) { sesion.borrar(); estado.yo = null; entrada.paso = 'telefono'; pintar(entrar('telefono', { error: e.message })); return; }
    // Una sección que la API aún no abre a una cuenta en revisión: la página lo dice en su sitio (P8), sin salir.
    if (e && e.status === 403 && e.original === EN_REVISION && estado.yo) {
      estado.yo.estado = 'pendiente';
      var s = estado.seccion;
      if (s === 'ventas' || s === 'cobros') { pintar(marco(s, estado.yo, seccionCerrada(s))); return; }
    }
    var tarjeta = h('div', { class: 'tarjeta vacio' }, h('b', null, 'No se pudo cargar'), h('p', { class: 'nota' }, (e && e.message) || ''),
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'button', onclick: function () { if (estado.yo) mostrar(); else arrancar(); } }, 'Reintentar')));
    if (enLaVista) enContenido(tarjeta); else pintar(tarjeta);
  }

  function cargando() { return h('div', { class: 'cargando-todo' }, 'Cargando…'); }

  // ── Las secciones ──────────────────────────────────────────────────────────

  /** «#catalogo/107» → la tienda 107 abierta; lo demás, la sección (o Inicio). */
  function rutaDelHash() {
    var s = String(raiz.location.hash || '').replace('#', '');
    var m = /^catalogo\/(\d{1,10})$/.exec(s);
    if (m) return { seccion: 'catalogo', tienda: Number(m[1]) };
    return { seccion: SECCIONES.some(function (x) { return x[0] === s; }) ? s : 'inicio', tienda: null };
  }

  function catalogoNuevo() {
    return { q: '', categoria: '', pestana: 'tiendas', orden: 'ganancia', tiendas: null, productos: null, visitas: null, tienda: null, pedido: 0 };
  }

  function mostrar() {
    if (!estado.yo) return;
    cerrarHoja();
    var ruta = rutaDelHash();
    var s = estado.seccion = ruta.seccion;
    var revisando = enRevision();
    pintar(marco(s, estado.yo, cargando()));
    var mal = function (e) { fallo(e, true); };
    if (revisando && (s === 'ventas' || s === 'cobros')) { enContenido(seccionCerrada(s)); irAMisDatosSiToca(); raiz.scrollTo(0, 0); return; }
    if (s === 'inicio') {
      Promise.all([pedir('GET', '/inicio'), pedir('GET', '/enlaces').catch(function () { return { enlaces: [] }; })]).then(function (r) {
        enContenido(inicio(r[0], r[1].enlaces || []));
        // Mientras no tenga ventas, la tarjeta «Empieza a ganar» ya dice lo de sus datos: sin el aviso de arriba.
        if (documento.getElementById('empieza')) { var z = documento.getElementById('aviso-datos'); if (z && !revisando) z.hidden = true; }
      }, mal);
    } else if (s === 'catalogo') mostrarCatalogo(ruta.tienda);
    else if (s === 'enlaces') pedir('GET', '/enlaces').then(function (d) { enContenido(enlaces(d)); }, mal);
    else if (s === 'ventas') pedir('GET', '/ventas?pagina=1').then(function (d) { estado.ventas = d; enContenido(ventas(d)); }, mal);
    else if (s === 'cobros') pedir('GET', '/cobros').then(function (d) { estado.cobros = d; enContenido(cobros(d, false)); irAMisDatosSiToca(); }, mal);
    raiz.scrollTo(0, 0);
  }

  function consulta(o) {
    var partes = [];
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && o[k] !== '' && o[k] != null) partes.push(k + '=' + encodeURIComponent(String(o[k])));
    return partes.length ? '?' + partes.join('&') : '';
  }

  /** Las visitas de cada enlace suyo (para «✓ Enlace listo · 41 visitas»). */
  function cargarVisitas(c) {
    return pedir('GET', '/enlaces').then(function (d) {
      var v = {};
      (d.enlaces || []).forEach(function (e) { if (e && e.codigo) v[e.codigo] = Math.round(num(e.visitas)); });
      c.visitas = v;
    }, function () { c.visitas = c.visitas || {}; });
  }

  /** El catálogo: la lista de tiendas (P2) o, con `tiendaId`, esa tienda abierta (P3). Lo cargado se guarda en `estado.cat`. */
  function mostrarCatalogo(tiendaId) {
    var c = estado.cat || (estado.cat = catalogoNuevo());
    var visitas = c.visitas ? Promise.resolve() : cargarVisitas(c);
    if (tiendaId) {
      if (!c.tienda || c.tienda.id !== tiendaId) c.tienda = { id: tiendaId, orden: 'ganancia', datos: null, info: null };
      var info = c.tiendas && (c.tiendas.tiendas || []).filter(function (t) { return Math.round(num(t.id)) === tiendaId; })[0];
      var buscarInfo = info ? Promise.resolve(info)
        : pedir('GET', '/catalogo/tiendas').then(function (d) { return (d.tiendas || []).filter(function (t) { return Math.round(num(t.id)) === tiendaId; })[0] || null; }, function () { return null; });
      Promise.all([buscarInfo, cargarTienda(c.tienda, 1), visitas]).then(function (r) {
        var ta = c.tienda;
        var p0 = (ta.datos && ta.datos.productos || [])[0] || {};
        ta.info = r[0] || ta.info || { id: tiendaId, nombre: p0.tienda || '', logo: p0.logo || '', productos: ta.datos ? ta.datos.total : 0 };
        if (estado.seccion !== 'catalogo') return;
        enContenido(tiendaAbierta(c));
      }, function (e) { fallo(e, true); });
      return;
    }
    c.tienda = null;
    if (c.tiendas) { enContenido(catalogo(c)); if (c.pestana === 'productos' && !c.productos) recargarProductos(); return; }
    Promise.all([pedir('GET', '/catalogo/tiendas' + consulta({ categoria: c.categoria, q: c.q })), visitas]).then(function (r) {
      c.tiendas = r[0];
      if (estado.seccion !== 'catalogo') return;
      enContenido(catalogo(c));
      if (c.pestana === 'productos') recargarProductos();
    }, function (e) { fallo(e, true); });
  }

  function pintarCuerpoDelCatalogo() {
    var c = estado.cat;
    var z = documento.getElementById('cuerpo-catalogo');
    if (!c || !z) return;
    vaciar(z);
    poner(z, cuerpoDelCatalogo(c));
    if (c.pestana === 'productos' && !c.productos) recargarProductos();
  }

  /** Al buscar o elegir rubro: solo cambian los resultados (el buscador sigue con su foco). */
  function recargarCatalogo() {
    var c = estado.cat;
    if (!c) return;
    var n = ++c.pedido;
    c.productos = null;
    pedir('GET', '/catalogo/tiendas' + consulta({ categoria: c.categoria, q: c.q })).then(function (d) {
      if (n !== c.pedido) return; // llegó una búsqueda más nueva
      c.tiendas = d;
      var r = documento.getElementById('zona-rubros');
      if (r && !r.firstChild) poner(r, rubros(c));
      pintarCuerpoDelCatalogo();
    }, function (e) {
      if (e.status === 401) { fallo(e); return; }
      avisar(e.message);
    });
  }

  function consultaDeProductos(c, pagina) { return '/catalogo' + consulta({ q: c.q, categoria: c.categoria, orden: c.orden, pagina: pagina }); }

  /** La pestaña «Productos»: la primera página con el orden elegido. */
  function recargarProductos() {
    var c = estado.cat;
    if (!c) return;
    var n = ++c.pedido;
    c.productos = null;
    pedir('GET', consultaDeProductos(c, 1)).then(function (d) {
      if (n !== c.pedido) return;
      c.productos = { productos: d.productos || [], total: d.total != null ? d.total : (d.productos || []).length, pagina: d.pagina || 1, hayMas: !!d.hayMas };
      pintarCuerpoDelCatalogo();
    }, function (e) {
      if (e.status === 401) { fallo(e); return; }
      avisar(e.message);
    });
  }
  function masProductosDelCatalogo() {
    var c = estado.cat;
    var sig = ((c.productos && c.productos.pagina) || 1) + 1;
    return pedir('GET', consultaDeProductos(c, sig)).then(function (d) {
      c.productos.productos = c.productos.productos.concat(d.productos || []);
      c.productos.pagina = d.pagina || sig;
      c.productos.hayMas = !!d.hayMas;
      return d;
    });
  }

  /** Los productos de la tienda abierta (página `pagina`, con su orden). */
  function cargarTienda(ta, pagina) {
    return pedir('GET', '/catalogo' + consulta({ tienda: ta.id, orden: ta.orden, pagina: pagina })).then(function (d) {
      var lista = d.productos || [];
      if (pagina === 1 || !ta.datos) ta.datos = { productos: lista, total: d.total != null ? d.total : lista.length, pagina: d.pagina || pagina, hayMas: !!d.hayMas };
      else { ta.datos.productos = ta.datos.productos.concat(lista); ta.datos.pagina = d.pagina || pagina; ta.datos.hayMas = !!d.hayMas; }
      return d;
    });
  }
  function recargarTienda() {
    var c = estado.cat;
    if (!c || !c.tienda) return;
    var ta = c.tienda;
    var z = documento.getElementById('productos-tienda');
    cargarTienda(ta, 1).then(function () {
      if (!z || !z.isConnected) return;
      vaciar(z);
      poner(z, listaDeProductos(ta.datos, false, masProductosDeLaTienda));
    }, function (e) { if (e.status === 401) { fallo(e); return; } avisar(e.message); });
  }
  function masProductosDeLaTienda() {
    var ta = estado.cat.tienda;
    return cargarTienda(ta, ((ta.datos && ta.datos.pagina) || 1) + 1);
  }

  function masVentas(ev) {
    var b = ev.currentTarget;
    var sig = ((estado.ventas && estado.ventas.pagina) || 1) + 1;
    b.disabled = true;
    pedir('GET', '/ventas?pagina=' + sig).then(function (d) {
      estado.ventas = { ventas: estado.ventas.ventas.concat(d.ventas), hayMas: d.hayMas, pagina: d.pagina, resumen: d.resumen };
      enContenido(ventas(estado.ventas));
    }, function (e) { b.disabled = false; avisar(e.message); });
  }

  function pintarCobros(editar) { if (estado.cobros) enContenido(cobros(estado.cobros, editar)); }

  function arrancar() {
    if (!sesion.leer()) { if (raiz.location.hash === '#registro') mostrarRegistro(); else pintar(entrar('telefono')); return; }
    // Un promotor ya dentro que abre el enlace del registro: a su página.
    if (raiz.location.hash === '#registro') { try { raiz.history.replaceState(null, '', raiz.location.pathname + '#inicio'); } catch (_) { raiz.location.hash = '#inicio'; } }
    pedir('GET', '/yo').then(function (r) {
      estado.yo = r.vendedor || {};
      estado.yo.cupon = r.cupon;
      // Sus datos para facturar (24-oct-2026). Sin ellos (una API de antes), la página sigue como estaba.
      estado.datos = r.datos && typeof r.datos === 'object' ? r.datos : null;
      estado.faltan = Array.isArray(r.faltanDatos) ? r.faltanDatos.filter(function (x) { return typeof x === 'string'; }) : [];
      mostrar();
    }, function (e) {
      if (e.status === 401) { sesion.borrar(); pintar(entrar('telefono')); return; }
      fallo(e);
    });
  }

  function salir() {
    pedir('POST', '/acceso/salir').catch(function () { return null; }).then(function () {
      sesion.borrar();
      estado.yo = null; entrada.paso = 'telefono'; estado.cat = null;
      estado.datos = null; estado.faltan = []; estado.editarDatos = false; estado.datosEscritos = null;
      reg = registroNuevo();
      try { raiz.history.replaceState(null, '', raiz.location.pathname); } catch (_) { raiz.location.hash = ''; }
      pintar(entrar('telefono'));
    });
  }

  // ── La entrada ─────────────────────────────────────────────────────────────

  function cuentaAtras() {
    clearInterval(entrada.espera);
    var falta = 60;
    var poner_ = function () {
      var b = documento.getElementById('reenviar');
      if (!b) { clearInterval(entrada.espera); return; }
      b.disabled = falta > 0;
      b.textContent = falta > 0 ? 'Reenviar en ' + falta + ' s' : 'Reenviar código';
    };
    poner_();
    entrada.espera = setInterval(function () { falta -= 1; poner_(); if (falta <= 0) clearInterval(entrada.espera); }, 1000);
  }

  function pedirCodigo(telefono, boton) {
    if (boton) boton.disabled = true;
    return pedir('POST', '/acceso/codigo', { telefono: telefono }).then(function (r) {
      entrada.paso = 'codigo';
      entrada.telefono = telefono;
      pintar(entrar('codigo', { mensaje: r.mensaje }));
      var c = documento.getElementById('codigo');
      if (c) c.focus();
      cuentaAtras();
    }, function (e) {
      if (boton) boton.disabled = false;
      pintar(entrar(entrada.paso, { telefono: telefono, error: e.message }));
      if (entrada.paso === 'codigo') cuentaAtras();
    });
  }

  function verificar(codigo, boton) {
    if (entrada.verificando) return;
    entrada.verificando = true;
    if (boton) boton.disabled = true;
    pedir('POST', '/acceso/verificar', { telefono: entrada.telefono, codigo: codigo }).then(function (r) {
      entrada.verificando = false;
      clearInterval(entrada.espera);
      if (r && typeof r.token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(r.token)) sesion.guardar(r.token);
      raiz.location.hash = '#inicio';
      arrancar();
    }, function (e) {
      entrada.verificando = false;
      if (boton) boton.disabled = false;
      pintar(entrar('codigo', { error: e.message, mensaje: 'Escribe el código que te llegó por WhatsApp.' }));
      enfocar('codigo');
      cuentaAtras();
    });
  }

  // ── El registro ────────────────────────────────────────────────────────────

  /** Pone el foco en un campo (y lo trae a la vista) después de pintar. */
  function enfocar(id) {
    var el = documento.getElementById(id);
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
    if (el.scrollIntoView) el.scrollIntoView({ block: 'center' });
  }
  /** El primer campo con error (en el orden del formulario). */
  function enfocarError(errores, prefijo) {
    var ids = { nombre: 'nombre', razonSocial: 'razon', documento: 'documento', correo: 'correo', direccion: 'direccion' };
    var orden = ['nombre', 'razonSocial', 'documento', 'correo', 'direccion'];
    for (var i = 0; i < orden.length; i++) if (errores[orden[i]]) { enfocar(prefijo + '-' + ids[orden[i]]); return; }
  }

  function irARegistro() {
    clearInterval(entrada.espera);
    if (raiz.location.hash === '#registro') mostrarRegistro(); else raiz.location.hash = '#registro';
  }
  function mostrarRegistro() {
    clearInterval(entrada.espera);
    pintar(registro('telefono', { telefono: reg.telefono || entrada.telefono }));
  }
  /** «Entrar» (desde el registro): la pantalla de entrar con su número ya escrito. */
  function irAEntrar(telefono) {
    clearInterval(entrada.espera);
    entrada.paso = 'telefono';
    entrada.telefono = telefono || '';
    if (raiz.location.hash === '#registro') { try { raiz.history.pushState(null, '', raiz.location.pathname); } catch (_) { /* se queda el «#» */ } }
    pintar(entrar('telefono', { telefono: entrada.telefono }));
  }

  /** Paso 1: el código por WhatsApp. Si ese número ya vende, «Ese número ya está registrado» y «Entrar». */
  function pedirCodigoDeRegistro(telefono, boton, reenvio) {
    if (boton) boton.disabled = true;
    pedir('POST', '/registro/codigo', { telefono: telefono }).then(function (r) {
      reg.telefono = telefono;
      if (r && r.yaEsVendedor) { clearInterval(entrada.espera); pintar(registro('ya')); return; }
      pintar(registro('codigo'));
      enfocar('r-codigo');
      cuentaAtras();
      if (reenvio) avisar('Te enviamos otro código');
    }, function (e) {
      if (boton) boton.disabled = false;
      pintar(registro(reenvio ? 'codigo' : 'telefono', { telefono: telefono, error: e.message }));
      if (reenvio) cuentaAtras();
    });
  }

  /** El código escrito → el paso 2. Si ya lo había llenado (el código había fallado), se manda todo otra vez. */
  function codigoDeRegistro(codigo) {
    reg.codigo = codigo;
    if (reg.listo && reg.paraEnviar) { enviarRegistro(documento.querySelector('#app button[type="submit"]')); return; }
    pintar(registro('datos'));
    enfocar('r-nombre');
  }

  /**
   * Paso 2: «Crear mi cuenta» → `POST /registro` (`{ telefono, codigo, nombre, red: { tipo, usuario } }`, contrato §3).
   * Bien: su sesión y al catálogo (en revisión, con el aviso amarillo). Un error con `campo`: debajo de
   * esa casilla (el del código, de vuelta a las casillas: al escribirlo otra vez se manda solo).
   */
  function enviarRegistro(boton) {
    if (reg.enviando) return;
    reg.enviando = true;
    if (boton) boton.disabled = true;
    var cuerpo = { telefono: reg.telefono, codigo: reg.codigo };
    for (var k in reg.paraEnviar) if (Object.prototype.hasOwnProperty.call(reg.paraEnviar, k) && reg.paraEnviar[k] != null) cuerpo[k] = reg.paraEnviar[k];
    pedir('POST', '/registro', cuerpo).then(function (r) {
      reg.enviando = false;
      if (!r || typeof r.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(r.token)) {
        if (boton) boton.disabled = false;
        pintar(registro('datos', { error: 'Algo salió mal. Intenta de nuevo.' }));
        return;
      }
      clearInterval(entrada.espera);
      sesion.guardar(r.token);
      reg = registroNuevo();
      // «Entras de una vez al catálogo y preparas tus enlaces» (P5).
      try { raiz.history.replaceState(null, '', raiz.location.pathname + '#catalogo'); } catch (_) { raiz.location.hash = '#catalogo'; }
      arrancar();
    }, function (e) {
      reg.enviando = false;
      if (boton) boton.disabled = false;
      if (e.yaEsVendedor) { clearInterval(entrada.espera); pintar(registro('ya')); return; }
      if (e.campo === 'codigo') {
        reg.codigo = '';
        pintar(registro('codigo', { error: e.message }));
        enfocar('r-codigo');
        cuentaAtras();
        return;
      }
      // En el paso 2 solo están el nombre y la red: un error de otra casilla va arriba del botón.
      var campo = e.campo === 'nombre' ? 'nombre' : /^red/.test(String(e.campo || '')) ? 'red' : null;
      var errores = {};
      if (campo) errores[campo] = e.message;
      pintar(registro('datos', { errores: errores, error: campo ? null : e.message }));
      if (campo) enfocar(campo === 'nombre' ? 'r-nombre' : 'r-usuario');
    });
  }

  // ── Mis datos ──────────────────────────────────────────────────────────────

  function pintarMisDatos(d) {
    var viejo = documento.getElementById('mis-datos');
    if (viejo && viejo.parentNode) viejo.parentNode.replaceChild(tarjetaMisDatos(d), viejo);
  }
  function pintarAvisoDatos() {
    var z = documento.getElementById('aviso-datos');
    if (!z || enRevision()) return;
    vaciar(z);
    var a = avisoDatos();
    if (a) z.appendChild(a);
    z.hidden = !a;
  }
  /** «Completar» (del aviso de arriba): Cobros, con «Mis datos» abierto. */
  function completarDatos() {
    estado.editarDatos = true;
    estado.datosEscritos = null;
    if (estado.seccion === 'cobros' && documento.getElementById('mis-datos')) { pintarMisDatos(); irAMisDatos(); return; }
    estado.irAMisDatos = true;
    raiz.location.hash = '#cobros';
  }
  function irAMisDatos() {
    var c = documento.getElementById('mis-datos');
    if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start' });
    var vacio = ['d-razon', 'd-documento', 'd-correo', 'd-direccion'].map(function (i) { return documento.getElementById(i); })
      .filter(function (el) { return el && !String(el.value || '').trim(); })[0];
    if (vacio) { try { vacio.focus({ preventScroll: true }); } catch (_) { vacio.focus(); } }
  }
  function irAMisDatosSiToca() { if (estado.irAMisDatos) { estado.irAMisDatos = false; irAMisDatos(); } }

  /** «Guardar» → `POST /datos`. Bien: sus datos nuevos y el aviso al día. Mal: debajo de la casilla. */
  function guardarMisDatos(cuerpo, boton) {
    if (boton) boton.disabled = true;
    pedir('POST', '/datos', cuerpo).then(function (r) {
      if (r && r.datos && typeof r.datos === 'object') estado.datos = r.datos;
      if (r && Array.isArray(r.faltanDatos)) estado.faltan = r.faltanDatos.filter(function (x) { return typeof x === 'string'; });
      estado.editarDatos = false;
      estado.datosEscritos = null;
      // En Cobros, con los datos completos se abre la cuenta bancaria.
      if (estado.seccion === 'cobros' && estado.cobros && !enRevision()) pintarCobros(false); else pintarMisDatos();
      pintarAvisoDatos();
      avisar('Datos guardados');
    }, function (e) {
      if (boton) boton.disabled = false;
      if (e.status === 401) { fallo(e); return; }
      var campo = e.campo || (e.status === 409 ? 'documento' : null);
      var errores = {};
      if (campo) errores[campo] = e.message;
      pintarMisDatos({ errores: errores, error: campo ? null : e.message });
      if (campo) enfocarError(errores, 'd');
    });
  }

  // ── Mi enlace ──────────────────────────────────────────────────────────────

  function abrirHoja(info) {
    cerrarHoja();
    var x = hoja(info, typeof raiz.navigator.share === 'function');
    documento.body.appendChild(x.capa);
    x.listo.focus({ preventScroll: true });
  }
  function cerrarHoja() { var c = documento.getElementById('capa-hoja'); if (c) c.remove(); }

  /**
   * Compartir un producto o una tienda: si ya tiene su enlace, la hoja; si no, `POST enlaces` (también en revisión,
   * contrato §2) y después la hoja. `alTenerlo(enlace)`: para marcar la fila con «✓ Enlace listo».
   */
  function compartir(info, cuerpo, boton, alTenerlo) {
    if (urlSegura(info.url)) { abrirHoja(info); return; }
    if (boton) boton.disabled = true;
    pedir('POST', '/enlaces', cuerpo).then(function (r) {
      if (boton) boton.disabled = false;
      var e = (r && r.enlace) || {};
      if (alTenerlo) alTenerlo(e);
      info.url = e.url; info.codigo = e.codigo;
      abrirHoja(info);
    }, function (err) {
      if (boton) boton.disabled = false;
      if (err.status === 401) { fallo(err); return; }
      avisar(err.message);
    });
  }

  documento.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrarHoja(); });
  raiz.addEventListener('hashchange', function () {
    if (estado.yo) { mostrar(); return; }
    if (sesion.leer()) return; // entrando: lo pinta `arrancar`
    if (raiz.location.hash === '#registro') mostrarRegistro();
    else pintar(entrar('telefono', { telefono: entrada.telefono }));
  });
  arrancar();
})(typeof window !== 'undefined' ? window : globalThis);
