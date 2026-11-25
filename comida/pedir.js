/*
 * PEDIR COMIDA DESDE LA COMPUTADORA (www.deliservy.com/comida, Gilberth, 25-nov-2026).
 *
 * «si lo está haciendo desde la web, tienes que enviarlo a pedir comida desde la web… pedir comida de las tiendas que
 * están abiertas y todo, así como en la aplicación, pero desde la web».
 *
 * En la COMPUTADORA esta página enseña el inicio de la app: las categorías, las tiendas (abiertas primero, con su foto,
 * sus estrellas y, si están cerradas, cuándo abren) y el buscador de tiendas y productos. Al tocar una tienda entra a
 * SU tienda web (`/t/<id>`; un producto, `/p/<id>`), la misma de los enlaces compartidos: ahí se arma el pedido, se
 * confirma el teléfono por WhatsApp y se paga (tarjeta, pago móvil o transferencia; nunca efectivo), y el pedido lo
 * crea el servidor como uno de la app.
 *
 * En el TELÉFONO no hace nada: la página sigue abriendo sola la descarga de la app (eso es de `index.html`).
 * Si la lista no carga, se queda lo de antes (las dos tiendas de apps y el QR).
 * Nada de lo que viene de la API se mete como HTML: todo va por `textContent`.
 */
(function () {
  'use strict';

  var ua = String(navigator.userAgent || '').toLowerCase();
  if (/iphone|ipad|ipod|android/.test(ua)) return;

  var raizHtml = document.documentElement;
  raizHtml.classList.add('compu');
  // Lo de antes se esconde YA (sin parpadeo); si la lista falla, vuelve.
  var oculto = document.createElement('style');
  oculto.textContent = 'html.compu body>.c{display:none!important}html.compu body{background:#08080a}';
  document.head.appendChild(oculto);
  var hoja = document.createElement('link');
  hoja.rel = 'stylesheet';
  hoja.href = '/comida/pedir.css?v=20261125b';
  // La lista se dibuja cuando llega su hoja de estilos (sin ella se vería desarmada); si no llega, lo de antes.
  var cssListo = new Promise(function (bien, mal) { hoja.onload = bien; hoja.onerror = mal; setTimeout(mal, 6000); });
  document.head.appendChild(hoja);

  /** '' (relativo) en localhost (pruebas); en la web, la dirección entera de la API (como `tienda/app.js`). */
  function baseDeLaApi(host) {
    var nombre = String(host || '').toLowerCase();
    if (nombre === 'localhost' || nombre === '127.0.0.1' || nombre === '[::1]' || /\.localhost$/.test(nombre)) return '';
    return 'https://api.deliservy.site';
  }
  var API = baseDeLaApi(location.hostname) + '/api/tienda-web';
  var APP_STORE = 'https://apps.apple.com/us/app/deliservy/id6761390577';
  var PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.ivc.deliservy';

  var S = { lista: null, cargadaEn: 0, categoria: 0, q: '', busqueda: null };
  var raiz = null;
  var principal = null;
  var aviso = null;
  var abandonada = false;
  var reloj = null;
  var pedidoDeBusqueda = 0;

  // ── Ayudantes ────────────────────────────────────────────────────────────────

  function h(tag, attrs, hijos) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null || attrs[k] === false) continue;
        if (k === 'class') e.className = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
      }
    }
    (hijos || []).forEach(function (x) {
      if (x == null || x === false) return;
      e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x);
    });
    return e;
  }
  function num(v) { var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v)); return isFinite(n) ? n : 0; }
  function miles(n) {
    var s = (Math.round(num(n) * 100) / 100).toFixed(2).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1];
  }
  function urlFoto(u) { return typeof u === 'string' && /^https:\/\/[^\s"'<>\\]+$/i.test(u) ? u : null; }
  var MARCAS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  function plano(t) {
    var s = String(t || '').toLowerCase();
    return s.normalize ? s.normalize('NFD').replace(MARCAS, '') : s;
  }
  // Las raíces del buscador de la app (`src/common/buscar-texto.ts`): cada palabra sin tildes, de 2 letras o más,
  // cortada a 4 y sin las vacías; y la tienda coincide si TODAS empiezan alguna palabra de su nombre.
  var VACIAS = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'con', 'un', 'una', 'al', 'a', 'o', 'que', 'me', 'mi',
    'para', 'por', 'quiero', 'hay', 'tienen', 'tiene', 'algo'];
  function raices(texto) {
    var todas = plano(String(texto || '').slice(0, 60)).split(/[^a-z0-9ñ]+/)
      .map(function (w) { return w.replace(/[^a-z0-9]/g, ''); })
      .filter(function (w) { return w.length >= 2; });
    var llenas = todas.filter(function (w) { return VACIAS.indexOf(w) < 0; });
    var salen = [];
    (llenas.length ? llenas : todas).forEach(function (w) {
      var r = w.length > 4 ? w.slice(0, 4) : w;
      if (salen.indexOf(r) < 0) salen.push(r);
    });
    return salen.slice(0, 5);
  }
  /** Las raíces juntas: dos textos con las mismas raíces son la misma búsqueda («pizza», «Pizzas », «PIZZERÍA»). */
  function claveDe(q) { return raices(q).join(' '); }
  function busquedaAlDia() { return !!S.busqueda && S.busqueda.clave === claveDe(S.q); }
  function tieneRaices(texto, rs) {
    if (!rs.length) return true;
    var palabras = plano(texto).split(/[^a-z0-9]+/).filter(Boolean);
    return rs.every(function (r) { return palabras.some(function (w) { return w.indexOf(r) === 0; }); });
  }

  function pedir(ruta, ms) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 12000);
    return fetch(API + ruta, {
      headers: { Accept: 'application/json' }, credentials: 'omit', signal: ctrl ? ctrl.signal : undefined,
    }).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function (e) { clearTimeout(t); throw e; });
  }

  // ── La lista ────────────────────────────────────────────────────────────────

  /** La primera vez espera 5 s como mucho (quien llega del anuncio no se queda mirando una pantalla vacía). */
  function cargar(callado) {
    return pedir('/tiendas', callado ? 12000 : 5000).then(function (d) {
      if (abandonada) return;
      if (!d || !Array.isArray(d.tiendas) || !Array.isArray(d.categorias)) throw new Error('sin lista');
      if (d.mantenimiento || !d.tiendas.length) throw new Error('sin tiendas');
      S.lista = d;
      S.cargadaEn = Date.now();
      if (S.categoria && !d.categorias.some(function (c) { return c.id === S.categoria; })) S.categoria = 0;
      pintar();
    }).catch(function () {
      // La primera vez, lo de antes (las tiendas de apps y el QR). Si ya había lista, se queda la que había.
      if (!callado || !S.lista) volverALoDeAntes();
    });
  }

  function volverALoDeAntes() {
    abandonada = true;
    raizHtml.classList.remove('compu');
    if (oculto.parentNode) oculto.parentNode.removeChild(oculto);
    if (raiz && raiz.parentNode) raiz.parentNode.removeChild(raiz);
    raiz = null;
  }

  /** Lo que se ve con la categoría y lo escrito: las tiendas que coinciden por nombre o (según el servidor) lo venden. */
  function tiendasQueSeVen() {
    var l = S.lista;
    var rs = raices(S.q);
    var delServidor = busquedaAlDia() ? S.busqueda.tiendas : [];
    return l.tiendas.filter(function (t) {
      if (S.categoria && (t.categorias || []).indexOf(S.categoria) < 0) return false;
      if (!rs.length) return true;
      return tieneRaices(t.nombre, rs) || delServidor.indexOf(t.id) >= 0;
    });
  }

  /** Mientras llega la búsqueda nueva se quedan los productos de la anterior (sin parpadeo al escribir). */
  function productosQueSeVen() {
    if (!raices(S.q).length || !S.busqueda) return [];
    var porId = {};
    S.lista.tiendas.forEach(function (t) { porId[t.id] = t; });
    return (S.busqueda.productos || []).filter(function (p) {
      var t = porId[p.tiendaId];
      return t && (!S.categoria || (t.categorias || []).indexOf(S.categoria) >= 0);
    });
  }

  // ── El dibujo ───────────────────────────────────────────────────────────────

  /** La barra de arriba (con el buscador) se crea UNA vez: al escribir solo se repinta la lista. */
  function armar() {
    if (abandonada || raiz) return;
    principal = h('main', { class: 'pd-main' });
    raiz = h('div', { id: 'pedir', class: 'pd' }, [cabecera(), principal, h('footer', { class: 'pd-pie', text: 'Deliservy · RIF: J-504754129' })]);
    document.body.insertBefore(raiz, document.body.firstChild);
    pintar();
  }

  /** Mientras llega la lista: el saludo, «Cargando tiendas…» y tarjetas vacías. */
  function cargando() {
    var esq = [];
    for (var i = 0; i < 8; i++) esq.push(h('div', { class: 'pd-esq', 'aria-hidden': 'true' }));
    return h('div', {}, [
      h('div', { class: 'pd-hola' }, [
        h('h1', { text: 'Pide comida en Valencia' }),
        h('p', { class: 'pd-cargando', role: 'status', text: 'Cargando tiendas…' }),
      ]),
      h('div', { class: 'pd-rejilla' }, esq),
    ]);
  }

  function cabecera() {
    var buscador = h('input', {
      type: 'search', id: 'pd-q', class: 'pd-q', placeholder: 'Busca una tienda o un plato', autocomplete: 'off',
      'aria-label': 'Busca una tienda o un plato', maxlength: '60', value: S.q,
      oninput: function (e) { escribir(e.target.value); },
      onkeydown: function (e) { if (e.key === 'Escape') { e.target.value = ''; escribir(''); } },
      onsearch: function (e) { if (!e.target.value) escribir(''); },
    });
    aviso = h('p', { class: 'pd-oculto', role: 'status', 'aria-live': 'polite' });
    return h('header', { class: 'pd-cab' }, [
      h('a', { class: 'pd-marca', href: '/', 'aria-label': 'Deliservy, inicio' }, [
        h('img', { src: '/assets/logo-icon.png', alt: '', width: '40', height: '40' }),
        h('span', { text: 'Deliservy' }),
      ]),
      h('label', { class: 'pd-busca' }, [
        h('span', { class: 'pd-lupa', 'aria-hidden': 'true', text: '⌕' }),
        buscador,
      ]),
      h('a', { class: 'pd-app', href: '#pd-descarga', text: '📲 La app' }),
      aviso,
    ]);
  }

  function categorias() {
    var l = S.lista;
    var chip = function (id, nombre, imagen) {
      var activa = S.categoria === id;
      return h('button', {
        type: 'button', class: 'pd-cat' + (activa ? ' activa' : ''), 'aria-pressed': activa ? 'true' : 'false', 'data-cat': String(id),
        onclick: function () { S.categoria = activa && id ? 0 : id; pintar(); },
      }, [
        urlFoto(imagen) ? h('img', { src: imagen, alt: '', loading: 'lazy', width: '44', height: '44', onerror: quitarFoto }) : h('span', { class: 'pd-cat-todas', 'aria-hidden': 'true', text: '🍽️' }),
        h('span', { text: nombre }),
      ]);
    };
    return h('nav', { class: 'pd-cats', 'aria-label': 'Categorías' }, [chip(0, 'Todas', null)].concat(
      l.categorias.map(function (c) { return chip(c.id, c.nombre, c.imagen); })));
  }

  /** Una foto que no carga: fuera (queda el fondo de la tarjeta), sin el icono de imagen rota. */
  function quitarFoto() { if (this.parentNode) this.parentNode.removeChild(this); }

  function tarjetaDeTienda(t) {
    var foto = urlFoto(t.logo);
    var inicial = function () { return h('span', { class: 'pd-inicial', 'aria-hidden': 'true', text: String(t.nombre || 'D').charAt(0).toUpperCase() }); };
    var cats = (S.lista.categorias || []).filter(function (c) { return (t.categorias || []).indexOf(c.id) >= 0; })
      .map(function (c) { return c.nombre; });
    return h('a', { class: 'pd-tienda' + (t.abierta ? '' : ' cerrada'), href: '/t/' + encodeURIComponent(String(t.id)) }, [
      h('div', { class: 'pd-foto' }, [
        foto ? h('img', { src: foto, alt: '', loading: 'lazy', onerror: function () { if (this.parentNode) this.parentNode.replaceChild(inicial(), this); } }) : inicial(),
        t.abierta ? null : h('span', { class: 'pd-cinta', text: 'Cerrado' }),
      ]),
      h('div', { class: 'pd-cuerpo' }, [
        h('h3', { text: t.nombre }),
        h('p', { class: 'pd-linea' }, [
          t.estrellas ? h('span', { class: 'pd-est' }, [h('b', { 'aria-hidden': 'true', text: '★' }), ' ' + t.estrellas]) : h('span', { class: 'pd-nueva', text: 'Nueva' }),
          cats.length ? h('span', { class: 'pd-cat-t', text: ' · ' + cats.join(', ') }) : null,
        ]),
        t.abierta
          ? h('p', { class: 'pd-estado ok', text: 'Abierta ahora' })
          : h('p', { class: 'pd-estado', text: t.abre ? 'Abre ' + t.abre : 'Cerrada por ahora' }),
      ]),
    ]);
  }

  function tarjetaDeProducto(p) {
    var foto = urlFoto(p.imagen);
    var precio = p.precio ? (p.precio.desde ? 'Desde ' : '') + miles(p.precio.usd) + ' $' : 'Ver opciones';
    var bs = p.precio && S.lista.tasa ? miles(p.precio.usd * S.lista.tasa) + ' Bs' : null;
    return h('a', { class: 'pd-prod' + (p.abierta ? '' : ' cerrada'), href: '/p/' + encodeURIComponent(String(p.id)) }, [
      h('div', { class: 'pd-prod-foto' }, [foto ? h('img', { src: foto, alt: '', loading: 'lazy', onerror: quitarFoto }) : null]),
      h('div', { class: 'pd-prod-cuerpo' }, [
        h('h4', { text: p.nombre }),
        h('p', { class: 'pd-prod-precio' }, [h('b', { text: precio }), bs ? h('span', { text: ' · ' + bs }) : null]),
        h('p', { class: 'pd-prod-tienda', text: p.tienda + (p.abierta ? '' : ' · cerrada') }),
      ]),
    ]);
  }

  function rejilla(titulo, tiendas, nota) {
    if (!tiendas.length) return null;
    return h('section', { class: 'pd-sec' }, [
      h('h2', {}, [titulo, h('span', { class: 'pd-cuenta', text: String(tiendas.length) })]),
      nota ? h('p', { class: 'pd-nota', text: nota }) : null,
      h('div', { class: 'pd-rejilla' }, tiendas.map(tarjetaDeTienda)),
    ]);
  }

  function descarga() {
    return h('section', { class: 'pd-descarga', id: 'pd-descarga' }, [
      h('img', { class: 'pd-qr', src: '/qr-descarga.png', alt: 'Código QR para descargar Deliservy', width: '132', height: '132', loading: 'lazy' }),
      h('div', {}, [
        h('h2', { text: '¿Prefieres la app?' }),
        h('p', { text: 'Escanea el código con la cámara de tu teléfono.' }),
        h('div', { class: 'pd-tiendas-app' }, [
          h('a', { href: APP_STORE, rel: 'noopener', text: 'App Store' }),
          h('a', { href: PLAY_STORE, rel: 'noopener', text: 'Google Play' }),
        ]),
      ]),
      h('div', { class: 'pd-taxi' }, [
        h('h2', { text: '¿Un taxi o mototaxi?' }),
        h('p', {}, [h('a', { href: '/taxi/', text: 'Pídelo por WhatsApp' }), ' con Alisa, sin la app.']),
      ]),
    ]);
  }

  function pintar() {
    if (!principal) return;
    if (!S.lista) { principal.textContent = ''; principal.appendChild(cargando()); return; }
    // Si el foco estaba en una categoría, vuelve a ella tras repintar (con el teclado no se pierde).
    var activo = document.activeElement;
    var catEnfocada = activo && activo.getAttribute ? activo.getAttribute('data-cat') : null;
    var hay = raices(S.q).length > 0;
    var tiendas = tiendasQueSeVen();
    var abiertas = tiendas.filter(function (t) { return t.abierta; });
    var cerradas = tiendas.filter(function (t) { return !t.abierta; });
    var productos = productosQueSeVen();
    var esperando = hay && !busquedaAlDia();

    var cuerpo = [];
    if (hay) cuerpo.push(h('h1', { class: 'pd-oculto', text: 'Resultados para «' + S.q.trim() + '»' }));
    if (!hay) {
      cuerpo.push(h('div', { class: 'pd-hola' }, [
        h('h1', { text: 'Pide comida en Valencia' }),
        h('p', { text: 'Elige una tienda, arma tu pedido y págalo aquí. Sin descargar nada.' }),
      ]));
    }
    cuerpo.push(categorias());
    var a = rejilla(hay ? 'Tiendas' : 'Abiertas ahora', hay ? abiertas.concat(cerradas) : abiertas, null);
    var c = hay ? null : rejilla('Cerradas por ahora', cerradas, null);
    if (a) cuerpo.push(a);
    if (productos.length) {
      cuerpo.push(h('section', { class: 'pd-sec' }, [
        h('h2', {}, ['Productos', h('span', { class: 'pd-cuenta', text: String(productos.length) })]),
        h('div', { class: 'pd-prods' }, productos.map(tarjetaDeProducto)),
      ]));
    }
    if (c) cuerpo.push(c);
    if (!tiendas.length && !productos.length) {
      cuerpo.push(h('p', { class: 'pd-vacio', role: 'status' },
        [esperando ? 'Buscando…' : hay ? 'No encontramos «' + S.q.trim() + '». Prueba con otra palabra.' : 'No hay tiendas en esta categoría por ahora.']));
    }
    cuerpo.push(descarga());

    principal.textContent = '';
    cuerpo.forEach(function (x) { principal.appendChild(x); });
    if (catEnfocada != null && /^\d+$/.test(catEnfocada)) {
      var chip = principal.querySelector('[data-cat="' + catEnfocada + '"]');
      if (chip) chip.focus();
    }
    // Para los lectores de pantalla: cuántas tiendas (y productos) se ven ahora.
    var dice = hay
      ? (esperando ? 'Buscando…' : tiendas.length + (tiendas.length === 1 ? ' tienda' : ' tiendas') + ' y ' + productos.length + (productos.length === 1 ? ' producto' : ' productos'))
      : abiertas.length + (abiertas.length === 1 ? ' tienda abierta' : ' tiendas abiertas');
    if (aviso && aviso.textContent !== dice) aviso.textContent = dice;
  }

  // ── El buscador ─────────────────────────────────────────────────────────────

  function escribir(texto) {
    S.q = String(texto || '');
    clearTimeout(reloj);
    var clave = claveDe(S.q);
    if (!clave) { S.busqueda = null; pedidoDeBusqueda++; pintar(); return; }
    pintar();
    // Las mismas raíces que la búsqueda que ya está («pizza» → «pizzas»): nada que pedir.
    if (busquedaAlDia()) return;
    reloj = setTimeout(function () {
      var n = ++pedidoDeBusqueda;
      // Se mandan las raíces (no el texto): el servidor las calcula igual y la misma búsqueda es la misma petición.
      pedir('/buscar?q=' + encodeURIComponent(clave)).then(function (r) {
        if (n !== pedidoDeBusqueda) return;
        S.busqueda = { clave: clave, tiendas: Array.isArray(r && r.tiendas) ? r.tiendas : [], productos: Array.isArray(r && r.productos) ? r.productos : [] };
        pintar();
      }).catch(function () {
        if (n !== pedidoDeBusqueda) return;
        // Sin el servidor, al menos las tiendas por su nombre.
        S.busqueda = { clave: clave, tiendas: [], productos: [] };
        pintar();
      });
    }, 280);
  }

  // ── Arranque ────────────────────────────────────────────────────────────────

  // La lista se pide YA (en paralelo con la página); se dibuja cuando están la página y su hoja de estilos.
  cargar(false);
  var domListo = new Promise(function (bien) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bien);
    else bien();
  });
  Promise.all([cssListo, domListo]).then(armar, volverALoDeAntes);
  // La lista al día (abre y cierra con la hora): al volver a la pestaña y cada 3 minutos mientras se ve.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && S.lista && Date.now() - S.cargadaEn > 90000) cargar(true);
  });
  setInterval(function () {
    if (document.visibilityState === 'visible' && S.lista && Date.now() - S.cargadaEn > 180000) cargar(true);
  }, 60000);
})();
