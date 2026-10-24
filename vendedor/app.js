/*
 * LA PÁGINA DEL VENDEDOR (www.deliservy.com/vendedor/, 24-oct-2026): Compra-Ventas Redes Sociales.
 *
 * Gilberth: «para el lado de los influencers, youtubers… todo completo en www.deliservy.com». El vendedor entra con su
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
  var EN_REVISION = 'Tu cuenta está en revisión. Te avisaremos por WhatsApp cuando esté lista.';
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
  function textoDeCompartir(titulo) { return String(titulo || 'Esto') + ' en Deliservy'; }
  /** Los enlaces directos para compartir (sin scripts de esas redes: solo abrir su página). */
  function enlacesParaCompartir(url, titulo) {
    var u = urlSegura(url);
    if (!u) return null;
    var t = textoDeCompartir(titulo);
    return {
      whatsapp: 'https://wa.me/?text=' + encodeURIComponent(t + ' ' + u),
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u),
      x: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t),
    };
  }
  function plural(n, uno, varios) { return Math.round(num(n)) + ' ' + (Math.round(num(n)) === 1 ? uno : varios); }

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
   * El documento como se guarda: la letra y el número, sin guion — `V12345678` (V/E: 6 a 9 cifras), `J504754129`
   * (J/G: 9 cifras, la última su verificador, como `rifEscrito`) o `PAB123456` (P + 5 a 20 letras o cifras).
   * `{ documento }` o `{ error }` con la frase para enseñar. El número puede venir con puntos, guiones o su letra.
   */
  function documentoNormalizado(tipo, numero) {
    var t = String(tipo || '').toUpperCase();
    if (!/^[VEJGP]$/.test(t)) return { error: 'Elige el tipo de documento.' };
    var limpio = String(numero == null ? '' : numero).toUpperCase().replace(/[\s.\-_/]/g, '');
    if (t !== 'P' && limpio.charAt(0) === t) limpio = limpio.slice(1);
    if (!limpio) return { error: t === 'P' ? 'Escribe el número de tu pasaporte.' : (t === 'J' || t === 'G') ? 'Escribe el RIF.' : 'Escribe tu cédula.' };
    if (t === 'V' || t === 'E') return /^\d{6,9}$/.test(limpio) ? { documento: t + limpio } : { error: 'La cédula lleva de 6 a 9 números.' };
    if (t === 'J' || t === 'G') {
      if (!/^\d{9}$/.test(limpio)) return { error: 'El RIF lleva 9 números, como J-504754129.' };
      return verificadorDelRif(t, limpio.slice(0, 8)) === Number(limpio.charAt(8)) ? { documento: t + limpio } : { error: 'Ese RIF no es válido: revisa sus números.' };
    }
    return /^[A-Z0-9]{5,20}$/.test(limpio) ? { documento: 'P' + limpio } : { error: 'El pasaporte lleva de 5 a 20 letras o números.' };
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
      var d = documentoNormalizado(c.tipoDocumento, c.numero);
      if (d.error) errores.documento = d.error; else { datos.tipoDocumento = tipo; datos.documento = d.documento; }
    }
    var correo = String(c.correo == null ? '' : c.correo).trim();
    if (!correo) errores.correo = 'Escribe tu correo: ahí te llega tu factura.';
    else if (!correoValido(correo)) errores.correo = 'Ese correo no es válido.';
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
  function hrefSeguro(v) { var s = String(v); return /^(https:\/\/[^\s"'<>]+|#[\w-]*|\/(?!\/)[^\s"'<>]*)$/.test(s) ? s : null; }

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

  function navegacion(clase, seccion) {
    return h('nav', { class: clase, 'aria-label': 'Secciones' }, SECCIONES.map(function (s) {
      return h('a', { href: '#' + s[0], 'aria-current': s[0] === seccion ? 'page' : null }, ico(s[0]), h('span', null, s[1]));
    }));
  }

  function cabecera(yo, conSalir) {
    return h('header', { class: 'cabecera' },
      h('div', { class: 'logo-d', 'aria-hidden': 'true' }, 'D'),
      h('div', { class: 'titulo' }, h('b', null, 'Compra-Ventas'), dato('small', null, (yo && yo.nombre) || '')),
      yo ? dato('div', { class: 'yo', 'aria-hidden': 'true' }, inicial(yo.nombre)) : null,
      botonIdioma(),
      conSalir ? h('button', { class: 'salir', type: 'button', onclick: salir }, 'Salir') : null);
  }

  function marco(seccion, yo, contenido) {
    var main = h('main', { class: 'contenido', id: 'contenido' }, h('div', { class: 'vista' }, contenido));
    // Arriba de cada sección, si le faltan datos para facturar: «Completa tus datos para tus facturas: …».
    var aviso = h('div', { class: 'zona-aviso-datos', id: 'aviso-datos' }, avisoDatos());
    aviso.hidden = !aviso.firstChild;
    var f = documento.createDocumentFragment();
    poner(f, [cabecera(yo, true), navegacion('pestanas', seccion), aviso, main, navegacion('navegacion', seccion)]);
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

  /** El marco de las pantallas sin sesión (entrar y registrarse): la marca, la tarjeta y el pie. */
  function sinSesion(texto, cuerpo, pie) {
    return h('div', { class: 'entrar vista' },
      h('div', { class: 'marca' },
        h('div', { class: 'logo-d', 'aria-hidden': 'true' }, 'D'),
        h('small', null, 'Deliservy · Vendedores'),
        h('h1', null, 'Compra-Ventas Redes Sociales'),
        h('p', null, texto)),
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
      h('p', { class: 'bien' }, d.mensaje || 'Si ese número es de un vendedor, te llegó un código por WhatsApp.'),
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
      h('p', { class: 'pie-entrar' }, '¿Quieres vender con Deliservy? ', h('button', { class: 'enlace', type: 'button', onclick: irARegistro }, 'Regístrate')));
  }

  // ── El registro propio (24-oct-2026): WhatsApp → código → datos para facturar → «en revisión» ──

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
    var PISTA = { V: '12345678', E: '81234567', J: '504754129', G: '200000000', P: 'AB123456' };
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
      h('p', { class: 'paso' }, 'Paso 2 de 3'),
      h('p', { class: 'bien' }, 'Te enviamos un código por WhatsApp al ', dato('span', { class: 'sin-cortes' }, telefonoParaVer(reg.telefono)), '.'),
      h('label', { class: 'etq-campo', for: 'r-codigo' }, 'Código de 6 números'),
      casillas.caja,
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, reg.listo ? 'Enviar' : 'Seguir')),
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
      h('p', { class: 'paso' }, 'Paso 1 de 3'),
      h('label', { class: 'etq-campo', for: 'r-telefono' }, 'Tu número de WhatsApp'),
      h('div', { class: 'prefijo' }, h('span', null, '+58'), telefono),
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Enviarme el código')),
      h('p', { class: 'ayuda' }, 'Te mandamos un código por WhatsApp para confirmarlo.'));
    }
    return sinSesion('Regístrate y gana en cada venta que hagas con tus enlaces.', cuerpo,
      h('p', { class: 'pie-entrar' }, '¿Ya vendes con Deliservy? ', h('button', { class: 'enlace', type: 'button', onclick: function () { irAEntrar(reg.telefono); } }, 'Entrar')));
  }

  /** Paso 3: los datos para facturar. Lo escrito vive en `reg.escrito` (así un error no borra nada). */
  function formularioDeRegistro(d) {
    var v = reg.escrito || {};
    var e = d.errores || {};
    var redes = v.redes || {};
    var nombre = h('input', { class: 'campo', id: 'r-nombre', name: 'nombre', autocomplete: 'name', maxlength: '60', placeholder: 'María Pérez', value: v.nombre || '' });
    var etqRazon = h('span', null, rotuloDeRazon(v.tipoDocumento || 'V'));
    var razon = h('input', { class: 'campo', id: 'r-razon', name: 'razonSocial', autocomplete: 'organization', maxlength: '150', placeholder: 'Solo si es una empresa', value: v.razonSocial || '' });
    var doc = campoDeDocumento('r', v.tipoDocumento || 'V', v.numero || '', function (t) { etqRazon.textContent = rotuloDeRazon(t); });
    var correo = h('input', { class: 'campo', id: 'r-correo', name: 'correo', type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: '120', placeholder: 'tucorreo@gmail.com', value: v.correo || '' });
    var direccion = h('textarea', { class: 'campo', id: 'r-direccion', name: 'direccion', rows: '2', maxlength: '300', autocomplete: 'street-address', placeholder: segunIdioma('Calle, sector y ciudad', 'Street, area and city') });
    direccion.value = v.direccion || '';
    // Cada red con su nombre delante (como el +58 del WhatsApp): escrito, se sigue sabiendo cuál es cuál.
    var campoRed = function (r) {
      return h('div', { class: 'prefijo red' }, h('span', { 'aria-hidden': 'true' }, r[1]),
        h('input', { class: 'campo', name: 'red-' + r[0], maxlength: '120', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: '@usuario', 'aria-label': r[1], value: redes[r[0]] || '' }));
    };
    var boton = h('button', { class: 'btn', type: 'submit' }, 'Enviar');
    return h('form', {
      novalidate: true, class: 'form-datos',
      onsubmit: function (ev) {
        ev.preventDefault();
        var f = ev.target;
        var escrito = {
          nombre: f.elements.nombre.value, razonSocial: f.elements.razonSocial.value, tipoDocumento: f.elements.tipoDocumento.value,
          numero: f.elements.documento.value, correo: f.elements.correo.value, direccion: f.elements.direccion.value, redes: {},
        };
        REDES_DEL_REGISTRO.forEach(function (r) { escrito.redes[r[0]] = f.elements['red-' + r[0]].value; });
        reg.escrito = escrito;
        var r = revisarDatos(escrito, { conNombre: true, conDocumento: true });
        if (r.hayErrores) { pintar(registro('datos', { errores: r.errores })); enfocarError(r.errores, 'r'); return; }
        reg.listo = true;
        reg.paraEnviar = r.datos;
        enviarRegistro(boton);
      },
    },
    h('p', { class: 'paso' }, 'Paso 3 de 3'),
    h('h2', null, 'Tus datos para facturar'),
    h('p', { class: 'nota' }, 'Con ellos te llega tu factura cada semana.'),
    grupoDeCampo('r-nombre', 'Nombre y apellido', nombre, e.nombre),
    grupoDeCampo('r-razon', etqRazon, razon, e.razonSocial),
    grupoDeCampo('r-documento', 'Cédula, RIF o pasaporte', doc.fila, e.documento, null, doc.input),
    grupoDeCampo('r-correo', 'Correo', correo, e.correo, 'Ahí te llega tu factura.'),
    grupoDeCampo('r-direccion', 'Dirección', direccion, e.direccion),
    h('div', { class: 'grupo-campo' },
      h('span', { class: 'etq-campo' }, 'Tus redes (opcional)'),
      h('div', { class: 'redes-campos' }, REDES_DEL_REGISTRO.map(campoRed))),
    d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
    h('div', { class: 'botones' }, boton),
    h('p', { class: 'ayuda' }, 'Al enviar, tu cuenta queda en revisión. Te avisamos por WhatsApp.'));
  }

  function revision(yo) {
    var f = documento.createDocumentFragment();
    poner(f, [cabecera(yo, true), h('main', { class: 'contenido' }, h('div', { class: 'vista revision' },
      h('div', { class: 'tarjeta vacio' }, ico('reloj'), h('b', null, 'Tu cuenta está en revisión'),
        h('p', { class: 'nota' }, 'Te avisaremos por WhatsApp cuando esté lista. Después podrás entrar aquí con tu número.')),
      estado.datos ? tarjetaMisDatos() : null))]);
    return f;
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
        if (doc && r.datos.documento && r.datos.documento !== String(x.documento || '').toUpperCase()) {
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

  function inicio(d) {
    var r = d.resumen || {};
    var lista = d.ventas || [];
    var nombre = String((d.vendedor && d.vendedor.nombre) || '').split(' ')[0];
    return [
      h('h1', { class: 'saludo' }, 'Hola, ', dato('span', null, nombre)),
      h('p', { class: 'sub' }, 'Así van tus ventas.'),
      h('div', { class: 'rejilla dos' },
        h('div', null, tarjetaSaldo(d.saldo, d.avisoSaldo),
          h('div', { class: 'cifras' },
            h('div', { class: 'cifra' }, h('small', null, 'Ventas este mes'), h('b', null, String(Math.round(num(r.ventasMes))))),
            h('div', { class: 'cifra verde' }, h('small', null, 'Ganado este mes'), h('b', null, dolares(r.netoMes))),
            h('div', { class: 'cifra ambar' }, h('small', null, 'Pendiente'), h('b', null, dolares(r.pendienteUsd))))),
        h('div', null, tarjetaCupon(d.cupon), tarjetaVisitas(d.visitas))),
      h('span', { class: 'etq' }, 'Ventas recientes'),
      lista.length
        ? [h('div', { class: 'lista' }, lista.map(venta)), botonIr('#ventas', 'Ver todas', 'borde')]
        : vacio('Aún no tienes ventas', 'Comparte tus enlaces o tu cupón. Cada venta te llega aquí y por WhatsApp.', botonIr('#catalogo', 'Ir al catálogo')),
    ];
  }

  function logo(foto, nombre) {
    var f = fotoSegura(foto);
    return f ? h('img', { class: 'logo', src: f, alt: '', loading: 'lazy' }) : dato('span', { class: 'inicial', 'aria-hidden': 'true' }, inicial(nombre));
  }

  function producto(p) {
    var f = fotoSegura(p.foto);
    var boton = h('button', { class: 'btn' + (p.codigo ? ' suave' : ''), type: 'button' }, ico('enlaces'), 'Mi enlace');
    boton.addEventListener('click', function () {
      if (p.url) abrirHoja({ url: p.url, titulo: p.nombre });
      else miEnlace({ tipo: 'p', productId: p.id }, p.nombre, boton, function (e) { p.codigo = e.codigo; p.url = e.url; boton.classList.add('suave'); });
    });
    return h('article', { class: 'producto' + (p.disponible === false ? ' agotado' : '') },
      f ? h('img', { class: 'foto', src: f, alt: '', loading: 'lazy' }) : dato('div', { class: 'sin-foto', 'aria-hidden': 'true' }, inicial(p.nombre)),
      h('div', { class: 'datos' },
        dato('b', null, p.nombre), dato('small', null, p.tienda),
        h('span', { class: 'precio' }, (p.desde ? 'Desde ' : '') + dolares(p.venta)),
        (p.tamanos || []).length ? h('p', { class: 'tamanos-lista' }, p.tamanos.map(function (t, i) {
          return [i ? ' · ' : '', dato('span', null, t.titulo), ' ' + dolares(t.venta)];
        })) : null,
        h('small', null, 'Paga el ' + porcentaje(p.pct)),
        h('span', { class: 'gana' }, (p.desde ? 'Ganas desde ' : 'Ganas ') + dolares(p.ganas) + ' por unidad'),
        p.disponible === false ? h('span', null, h('span', { class: 'pill' }, 'Agotado por ahora')) : null,
        p.codigo ? h('span', { class: 'ya-tiene' }, '✓ Ya tienes tu enlace') : null),
      h('div', { class: 'pie-prod' }, boton));
  }

  function resultadosDelCatalogo(d) {
    var productos = d.productos || [];
    if (!productos.length) return [h('span', { class: 'etq' }, 'Productos'), vacio('No hay productos con ese filtro', 'Prueba con otra búsqueda o quita los filtros.')];
    var grupos = [];
    var porId = {};
    productos.forEach(function (p) {
      var k = String(p.companyId);
      if (!porId[k]) { porId[k] = { id: p.companyId, nombre: p.tienda, logo: p.logo, productos: [] }; grupos.push(porId[k]); }
      porId[k].productos.push(p);
    });
    var tiendas = {};
    (d.tiendas || []).forEach(function (t) { tiendas[String(t.id)] = t; });
    return grupos.map(function (g) {
      var t = tiendas[String(g.id)] || { id: g.id, nombre: g.nombre };
      var rotulo = h('span', null, t.codigo ? 'Ver enlace de la tienda' : 'Enlace de la tienda');
      var boton = h('button', { class: 'btn chico suave', type: 'button' }, ico('enlaces'), rotulo);
      boton.addEventListener('click', function () {
        var titulo = 'Tienda ' + (t.nombre || g.nombre || '');
        if (t.url) abrirHoja({ url: t.url, titulo: titulo });
        else miEnlace({ tipo: 't', companyId: g.id }, titulo, boton, function (e) { t.codigo = e.codigo; t.url = e.url; rotulo.textContent = 'Ver enlace de la tienda'; });
      });
      return [
        h('div', { class: 'tienda-cab' }, logo(g.logo, g.nombre),
          h('div', { class: 'txt' }, dato('b', null, g.nombre), h('small', null, plural(g.productos.length, 'producto', 'productos'))), boton),
        h('div', { class: 'productos' }, g.productos.map(producto)),
      ];
    });
  }

  function filtrosDelCatalogo(d, f) {
    var opcion = function (valor, texto, elegido, esDato) {
      var o = esDato ? dato('option', { value: String(valor) }, texto) : h('option', { value: String(valor) }, texto);
      if (String(elegido) === String(valor)) o.selected = true;
      return o;
    };
    var buscar = h('input', { class: 'campo', type: 'search', id: 'buscar', placeholder: 'Busca un producto o una tienda', value: f.q || '', autocomplete: 'off', enterkeyhint: 'search', 'aria-label': 'Buscar' });
    var tienda = h('select', { class: 'campo', id: 'f-tienda', 'aria-label': 'Tienda' }, opcion('', 'Todas las tiendas', f.tienda || ''),
      (d.tiendas || []).map(function (t) { return opcion(Math.round(num(t.id)), t.nombre, f.tienda, true); }));
    var categoria = h('select', { class: 'campo', id: 'f-categoria', 'aria-label': 'Categoría' }, opcion('', 'Todas las categorías', f.categoria || ''),
      (d.categorias || []).map(function (c) { return opcion(Math.round(num(c.id)), c.nombre, f.categoria, true); }));
    var reloj = null;
    buscar.addEventListener('input', function () {
      clearTimeout(reloj);
      reloj = setTimeout(function () { estado.filtros.q = buscar.value; recargarCatalogo(); }, 320);
    });
    var alCambiar = function () { estado.filtros.tienda = tienda.value; estado.filtros.categoria = categoria.value; recargarCatalogo(); };
    tienda.addEventListener('change', alCambiar);
    categoria.addEventListener('change', alCambiar);
    return h('div', { class: 'filtros' }, buscar, h('div', { class: 'dos' }, tienda, categoria));
  }

  function catalogo(d, f) {
    return [
      h('h1', { class: 'saludo' }, 'Catálogo'),
      h('p', { class: 'sub' }, 'Escoge qué promocionar. Ganas en cada unidad que se venda con tu enlace o tu cupón.'),
      filtrosDelCatalogo(d, f || {}),
      h('div', { id: 'resultados' }, resultadosDelCatalogo(d)),
    ];
  }

  function enlaces(d) {
    var lista = d.enlaces || [];
    var cab = [h('h1', { class: 'saludo' }, 'Mis enlaces'), h('p', { class: 'sub' }, 'Cada enlace es tuyo y no vence. Siempre abre la tienda web de Deliservy.')];
    if (!lista.length) return cab.concat([vacio('Aún no tienes enlaces', 'Ve al catálogo y toca «Mi enlace» en lo que quieras promocionar.', botonIr('#catalogo', 'Ir al catálogo'))]);
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
            h('button', { class: 'btn chico', type: 'button', onclick: function () { abrirHoja({ url: url, titulo: titulo }); } }, ico('compartir'), 'Compartir')),
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
    return [
      h('h1', { class: 'saludo' }, 'Cobros'), h('p', { class: 'sub' }, 'Te pagamos en tu cuenta bancaria.'),
      h('div', { class: 'rejilla dos' },
        h('div', null, tarjetaSaldo(s, d.avisoSaldo)),
        h('div', { class: 'tarjeta' }, h('h2', null, 'Tu cuenta bancaria'), cuentaHtml,
          cuenta && !editar ? h('div', { class: 'botones' }, h('button', { class: 'btn borde chico', type: 'button', onclick: function () { pintarCobros(true); } }, 'Cambiar cuenta')) : null,
          formulario, s ? null : h('p', { class: 'nota' }, NOTA_PAGO))),
      estado.datos ? h('div', { class: 'separado' }, tarjetaMisDatos()) : null,
      h('span', { class: 'etq' }, 'Tus cobros'),
      retiros.length ? h('div', { class: 'lista' }, retiros.map(function (r) {
        var e = ESTADO_DEL_COBRO[r.estado] || [r.estado || '—', ''];
        return h('div', { class: 'renglon' }, h('div', { class: 'txt' }, h('b', null, fecha(r.fecha))),
          h('div', { class: 'monto' }, bolivares(r.montoBs), h('br'), h('span', { class: 'pill ' + e[1] }, e[0])));
      })) : vacio('Aún no hay cobros', 'Cuando te paguemos, lo verás aquí.'),
    ];
  }

  function hoja(e, compartirNativo) {
    var url = urlSegura(e && e.url);
    var titulo = (e && e.titulo) || '';
    var red = enlacesParaCompartir(url, titulo) || {};
    var listo = h('button', { class: 'btn borde', type: 'button', onclick: cerrarHoja }, 'Listo');
    var capa = h('div', { id: 'capa-hoja' },
      h('div', { class: 'velo', onclick: cerrarHoja }),
      h('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hoja-titulo' },
        h('div', { class: 'asa' }),
        h('h2', { id: 'hoja-titulo' }, 'Tu enlace'),
        dato('p', { class: 'nota' }, titulo),
        h('div', { class: 'url' }, dato('code', null, url.replace(/^https?:\/\//, '')),
          h('button', { class: 'btn chico suave', type: 'button', onclick: function () { copiar(url); } }, 'Copiar')),
        h('div', { class: 'compartir' },
          compartirNativo ? h('button', { type: 'button', onclick: function () {
            if (url && raiz.navigator.share) raiz.navigator.share({ title: titulo, text: textoDeCompartir(titulo), url: url }).catch(function () { return null; });
          } }, ico('compartir'), 'Compartir') : null,
          h('a', { href: red.whatsapp || '#', target: '_blank', rel: 'noopener noreferrer' }, ico('whatsapp'), 'WhatsApp'),
          h('a', { href: red.facebook || '#', target: '_blank', rel: 'noopener noreferrer' }, ico('facebook'), 'Facebook'),
          h('a', { href: red.x || '#', target: '_blank', rel: 'noopener noreferrer' }, ico('x'), 'X'),
          compartirNativo ? null : h('button', { type: 'button', onclick: function () { copiar(url); } }, ico('copiar'), 'Copiar')),
        h('p', { class: 'redes-copiar' }, h('b', null, 'Instagram y TikTok:'), ' copia el enlace y pégalo en tu bio, en tu historia o en la descripción del video.'),
        h('div', { class: 'botones' }, listo)));
    return { capa: capa, listo: listo };
  }

  // Para las pruebas (en una caja de node, sin página): lo puro y las pantallas.
  raiz.VendedorPagina = {
    baseDeLaApi: baseDeLaApi, dolares: dolares, bolivares: bolivares, porcentaje: porcentaje, sinCortes: sinCortes,
    fotoSegura: fotoSegura, urlSegura: urlSegura, hrefSeguro: hrefSeguro, enlacesParaCompartir: enlacesParaCompartir,
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
    yo: null, seccion: 'inicio', filtros: { q: '', tienda: '', categoria: '' }, catalogo: null, ventas: null, cobros: null,
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
        var e = new Error(Array.isArray(m) ? m.join(' ') : (m ? String(m) : 'Algo salió mal. Intenta de nuevo.'));
        e.status = r.status;
        // El registro y «Mis datos»: el servidor dice qué casilla está mal (`campo`) o si ese número ya vende.
        e.campo = j && typeof j.campo === 'string' ? j.campo : null;
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
    if (e && e.status === 403 && e.message === EN_REVISION) { pintar(revision(estado.yo)); return; }
    var tarjeta = h('div', { class: 'tarjeta vacio' }, h('b', null, 'No se pudo cargar'), h('p', { class: 'nota' }, (e && e.message) || ''),
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'button', onclick: function () { if (estado.yo) mostrar(); else arrancar(); } }, 'Reintentar')));
    if (enLaVista) enContenido(tarjeta); else pintar(tarjeta);
  }

  function cargando() { return h('div', { class: 'cargando-todo' }, 'Cargando…'); }

  // ── Las secciones ──────────────────────────────────────────────────────────

  function seccionDelHash() {
    var s = String(raiz.location.hash || '').replace('#', '');
    return SECCIONES.some(function (x) { return x[0] === s; }) ? s : 'inicio';
  }

  function mostrar() {
    if (!estado.yo) return;
    cerrarHoja();
    if (estado.yo.estado === 'pendiente') { pintar(revision(estado.yo)); return; }
    var s = estado.seccion = seccionDelHash();
    pintar(marco(s, estado.yo, cargando()));
    var mal = function (e) { fallo(e, true); };
    if (s === 'inicio') pedir('GET', '/inicio').then(function (d) { enContenido(inicio(d)); }, mal);
    else if (s === 'catalogo') pedir('GET', '/catalogo' + consultaDelCatalogo()).then(function (d) { estado.catalogo = d; enContenido(catalogo(d, estado.filtros)); }, mal);
    else if (s === 'enlaces') pedir('GET', '/enlaces').then(function (d) { enContenido(enlaces(d)); }, mal);
    else if (s === 'ventas') pedir('GET', '/ventas?pagina=1').then(function (d) { estado.ventas = d; enContenido(ventas(d)); }, mal);
    else if (s === 'cobros') pedir('GET', '/cobros').then(function (d) { estado.cobros = d; enContenido(cobros(d, false)); irAMisDatosSiToca(); }, mal);
    raiz.scrollTo(0, 0);
  }

  function consultaDelCatalogo() {
    var f = estado.filtros;
    return '?q=' + encodeURIComponent(f.q || '') + '&tienda=' + encodeURIComponent(f.tienda || '') + '&categoria=' + encodeURIComponent(f.categoria || '');
  }
  /** Al buscar o filtrar: solo cambian los resultados (el buscador sigue con su foco). */
  function recargarCatalogo() {
    pedir('GET', '/catalogo' + consultaDelCatalogo()).then(function (d) {
      estado.catalogo = d;
      var r = documento.getElementById('resultados');
      if (!r) return;
      vaciar(r);
      poner(r, resultadosDelCatalogo(d));
    }, function (e) {
      if (e.status === 401 || e.status === 403) { fallo(e); return; }
      avisar(e.message);
    });
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
      estado.yo = null; entrada.paso = 'telefono';
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

  /** Paso 2: el código escrito. Si ya llenó sus datos (el código había fallado), se manda todo otra vez. */
  function codigoDeRegistro(codigo) {
    reg.codigo = codigo;
    if (reg.listo && reg.paraEnviar) { enviarRegistro(documento.querySelector('#app button[type="submit"]')); return; }
    pintar(registro('datos'));
    enfocar('r-nombre');
  }

  /**
   * Paso 3: «Enviar» → `POST /registro`. Bien: su sesión y «Tu cuenta está en revisión». Un error con `campo`: debajo de
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
      try { raiz.history.replaceState(null, '', raiz.location.pathname + '#inicio'); } catch (_) { raiz.location.hash = '#inicio'; }
      arrancar();
    }, function (e) {
      reg.enviando = false;
      if (boton) boton.disabled = false;
      if (e.campo === 'codigo') {
        reg.codigo = '';
        pintar(registro('codigo', { error: e.message }));
        enfocar('r-codigo');
        cuentaAtras();
        return;
      }
      // Un 409 sin casilla es la cédula o el RIF de otro vendedor.
      var campo = e.campo || (e.status === 409 && /c[ée]dula|RIF|pasaporte|documento/i.test(e.message) ? 'documento' : null);
      var errores = {};
      if (campo) errores[campo] = e.message;
      pintar(registro('datos', { errores: errores, error: campo ? null : e.message }));
      if (campo) enfocarError(errores, 'r');
    });
  }

  // ── Mis datos ──────────────────────────────────────────────────────────────

  function pintarMisDatos(d) {
    var viejo = documento.getElementById('mis-datos');
    if (viejo && viejo.parentNode) viejo.parentNode.replaceChild(tarjetaMisDatos(d), viejo);
  }
  function pintarAvisoDatos() {
    var z = documento.getElementById('aviso-datos');
    if (!z) return;
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
      pintarMisDatos();
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

  function abrirHoja(e) {
    cerrarHoja();
    var x = hoja(e, typeof raiz.navigator.share === 'function');
    documento.body.appendChild(x.capa);
    x.listo.focus();
  }
  function cerrarHoja() { var c = documento.getElementById('capa-hoja'); if (c) c.remove(); }

  function miEnlace(cuerpo, titulo, boton, alTenerlo) {
    if (boton) boton.disabled = true;
    pedir('POST', '/enlaces', cuerpo).then(function (r) {
      if (boton) boton.disabled = false;
      var e = (r && r.enlace) || {};
      if (alTenerlo) alTenerlo(e);
      abrirHoja({ url: e.url, titulo: titulo });
    }, function (err) {
      if (boton) boton.disabled = false;
      if (err.status === 401 || err.status === 403) { fallo(err); return; }
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
