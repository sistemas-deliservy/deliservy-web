/*
 * EL PANEL DEL COMERCIO — la entrada y el marco (24-oct-2026).
 *
 * Entrar con el código de WhatsApp, el marco (barra lateral en la computadora, barra de abajo en el teléfono), el
 * selector de tienda, las secciones según la tienda (de la app, de flota o las dos) y los permisos del cajero, y el
 * aviso de pedido nuevo: cada 10 s se pregunta `pedidos/nuevos` (nada de socket con la cuenta del comercio: dejaría
 * mudo el aviso del teléfono), y al llegar uno suena el tono de la app, sale el aviso del navegador si dio permiso,
 * el título de la pestaña parpadea y el pedido lleva la pastilla «Nuevo».
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var documento = raiz.document;
  var h = C.h, dato = C.dato, ico = C.ico;
  var app = documento.getElementById('app');
  if (!app) return;

  var ORDEN = ['hoy', 'pedidos', 'productos', 'vendedores', 'billetera', 'flota', 'estadisticas', 'plan', 'tienda'];
  var TITULO = 'Panel del comercio · Deliservy';
  var CLAVE_AVISOS = 'deliservy_comercio_avisos';
  var CLAVE_VISTOS = 'deliservy_comercio_vistos';

  // ── El estado de la sesión ─────────────────────────────────────────────────

  var ctx = C.ctx = {
    cuenta: null, tiendas: [], tienda: null, avisos: [],
    esDueno: false,
    puede: function (permiso) { return ctx.esDueno || (ctx.cuenta && (ctx.cuenta.permisos || []).indexOf(permiso) >= 0); },
  };
  var entrada = { paso: 'telefono', telefono: '', espera: null, verificando: false };

  /** Los pedidos que ya abrió en este navegador (para la pastilla «Nuevo»). */
  var vistos = (function () { var v = C.almacen.leer(CLAVE_VISTOS); return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'number'; }) : []; })();
  C.pedidoVisto = function (id) { return vistos.indexOf(Number(id)) >= 0; };
  C.marcarVisto = function (id) {
    id = Number(id);
    if (!id || vistos.indexOf(id) >= 0) return;
    vistos.push(id);
    if (vistos.length > 300) vistos = vistos.slice(-300);
    C.almacen.guardar(CLAVE_VISTOS, vistos);
    nuevos.pendientes = nuevos.pendientes.filter(function (x) { return x !== id; });
    if (!nuevos.pendientes.length) pararTitulo();
  };

  function tiendaPorId(id) { return ctx.tiendas.filter(function (t) { return Number(t.storeId) === Number(id); })[0] || null; }
  /** ¿Esta tienda vende en la app? (las de solo flota no tienen pedidos de la app ni billetera). */
  C.esDeApp = function (t) { return !!t && !t.soloFlota; };

  // ── El idioma ──────────────────────────────────────────────────────────────

  function idiomaActual() {
    var elegido = null;
    try { elegido = raiz.localStorage.getItem(C.CLAVE_IDIOMA); } catch (_) { elegido = null; }
    if (elegido === 'en' || elegido === 'es') return elegido;
    var nav = raiz.navigator || {};
    return /^en\b/i.test((nav.languages && nav.languages[0]) || nav.language || '') ? 'en' : 'es';
  }
  C.idioma = idiomaActual;
  /** Un texto que la capa de idioma no alcanza (la pista de un <textarea>, el título de la pestaña, un aviso del sistema). */
  C.segunIdioma = function (es, en) { return idiomaActual() === 'en' ? en : es; };
  C.traducir = function (t) { return typeof raiz.idiomaTraducir === 'function' ? raiz.idiomaTraducir(t) : t; };
  function botonIdioma(clase) {
    var en = idiomaActual() === 'en';
    return h('button', {
      class: clase || 'idioma', type: 'button', 'data-idioma': 'no', title: en ? 'Cambiar a español' : 'Switch to English',
      onclick: function () {
        try { raiz.localStorage.setItem(C.CLAVE_IDIOMA, en ? 'es' : 'en'); } catch (_) { /* sin almacén: no se recuerda */ }
        raiz.location.reload();
      },
    }, en ? '🌐 Español' : '🌐 English');
  }

  function pintar(nodo) { C.cerrarDialogos(); C.vaciar(app); C.poner(app, nodo); }
  function logo(clase) { return h('img', { class: clase || 'logo-marca', src: '/assets/logo-icon.png', alt: '', width: '40', height: '40' }); }

  // ── Entrar ─────────────────────────────────────────────────────────────────

  function pantallaEntrar(paso, d) {
    d = d || {};
    var cuerpo;
    if (paso === 'codigo') {
      var casillas = C.casillasDeCodigo('codigo', function (cod) { verificar(cod, null); });
      var reenviar = h('button', { class: 'btn borde chico', type: 'button', id: 'reenviar', disabled: true, onclick: function () { pedirCodigo(entrada.telefono, reenviar, true); } }, 'Reenviar código');
      cuerpo = h('form', {
        novalidate: true,
        onsubmit: function (ev) {
          ev.preventDefault();
          var cod = casillas.valor();
          if (cod.length !== 6) { pintar(pantallaEntrar('codigo', { error: 'El código tiene 6 números.' })); enfocar('codigo'); cuentaAtras(); return; }
          verificar(cod, ev.target.querySelector('button[type="submit"]'));
        },
      },
      h('p', { class: 'bien' }, d.mensaje || 'Te enviamos un código por WhatsApp al ', d.mensaje ? null : dato('span', { class: 'sin-cortes' }, C.telefonoParaVer(entrada.telefono)), d.mensaje ? null : '.'),
      h('label', { class: 'etq-campo', for: 'codigo' }, 'Código de 6 números'),
      casillas.caja,
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Entrar')),
      h('div', { class: 'botones' },
        h('button', { class: 'btn borde chico', type: 'button', onclick: function () { clearInterval(entrada.espera); entrada.paso = 'telefono'; pintar(pantallaEntrar('telefono', { telefono: entrada.telefono })); enfocar('telefono'); } }, 'Cambiar número'),
        reenviar));
    } else {
      var telefono = h('input', {
        class: 'campo', id: 'telefono', name: 'telefono', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national',
        placeholder: '412 555 0198', value: d.telefono || '', required: true, maxlength: '20',
      });
      cuerpo = h('form', {
        novalidate: true,
        onsubmit: function (ev) {
          ev.preventDefault();
          var tel = String(telefono.value || '').trim();
          if (!C.telefonoValido(tel)) { pintar(pantallaEntrar('telefono', { telefono: tel, error: 'Escribe tu número de WhatsApp, por ejemplo 0412-555-0198.' })); enfocar('telefono'); return; }
          pedirCodigo(tel, ev.target.querySelector('button[type="submit"]'), false);
        },
      },
      d.aviso ? h('p', { class: 'aviso-entrar', role: 'status' }, d.aviso) : null,
      h('label', { class: 'etq-campo', for: 'telefono' }, 'Tu número de WhatsApp'),
      h('div', { class: 'prefijo' }, h('span', null, '+58'), telefono),
      d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
      h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Enviarme el código')),
      h('p', { class: 'ayuda' }, 'Te mandamos un código por WhatsApp. Sin contraseñas.'));
    }
    return h('div', { class: 'entrar' },
      h('div', { class: 'marca' },
        logo('logo-entrar'),
        h('small', null, 'Deliservy · Comercios'),
        h('h1', null, 'Panel del comercio'),
        h('p', null, 'Entra con tu WhatsApp. Aquí ves tus pedidos, tus productos y tu dinero.')),
      h('div', { class: 'tarjeta' }, cuerpo),
      h('p', { class: 'pie-entrar' }, '¿Aún no vendes con Deliservy? ', h('a', { href: C.WHATSAPP, target: '_blank', rel: 'noopener noreferrer' }, 'Escríbenos')),
      h('div', { class: 'pie-idioma' }, botonIdioma()));
  }

  function enfocar(id) {
    setTimeout(function () { var el = documento.getElementById(id); if (el) { try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); } } }, 20);
  }
  function cuentaAtras() {
    clearInterval(entrada.espera);
    var falta = 60;
    var poner = function () {
      var b = documento.getElementById('reenviar');
      if (!b) { clearInterval(entrada.espera); return; }
      b.disabled = falta > 0;
      b.textContent = falta > 0 ? 'Reenviar en ' + falta + ' s' : 'Reenviar código';
    };
    poner();
    entrada.espera = setInterval(function () { falta -= 1; poner(); if (falta <= 0) clearInterval(entrada.espera); }, 1000);
  }
  function pedirCodigo(telefono, boton, reenvio) {
    if (boton) boton.disabled = true;
    C.pedir('POST', '/codigo', { telefono: telefono }, { sinSesion: true }).then(function () {
      entrada.paso = 'codigo';
      entrada.telefono = telefono;
      pintar(pantallaEntrar('codigo'));
      enfocar('codigo');
      cuentaAtras();
      if (reenvio) C.avisar('Te enviamos otro código');
    }, function (e) {
      if (boton) boton.disabled = false;
      pintar(pantallaEntrar(entrada.paso, { telefono: telefono, error: e.message }));
      if (entrada.paso === 'codigo') { cuentaAtras(); enfocar('codigo'); } else enfocar('telefono');
    });
  }
  function verificar(codigo, boton) {
    if (entrada.verificando) return;
    entrada.verificando = true;
    if (boton) boton.disabled = true;
    C.pedir('POST', '/entrar', { telefono: entrada.telefono, codigo: codigo }, { sinSesion: true }).then(function (r) {
      entrada.verificando = false;
      clearInterval(entrada.espera);
      if (!r || typeof r.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(r.token)) {
        pintar(pantallaEntrar('codigo', { error: C.ALGO_MAL }));
        cuentaAtras();
        return;
      }
      C.sesion.guardar(r.token);
      desbloquearSonido();
      try { raiz.history.replaceState(null, '', raiz.location.pathname + '#hoy'); } catch (_) { raiz.location.hash = '#hoy'; }
      arrancar();
    }, function (e) {
      entrada.verificando = false;
      if (boton) boton.disabled = false;
      pintar(pantallaEntrar('codigo', { error: e.message, mensaje: 'Escribe el código que te llegó por WhatsApp.' }));
      enfocar('codigo');
      cuentaAtras();
    });
  }

  /** La sesión terminó (venció, la cerraron o cambiaron los permisos del cajero): a entrar, con una frase corta. */
  C.alTerminarLaSesion = function (mensaje) {
    if (!ctx.cuenta && !C.sesion.leer()) return;
    salirLocal();
    pintar(pantallaEntrar('telefono', { telefono: entrada.telefono, aviso: mensaje || 'Tu sesión terminó. Entra otra vez.' }));
  };
  function salirLocal() {
    C.sesion.borrar();
    if (C.nuevaVista) C.nuevaVista();
    pararConsulta();
    pararTitulo();
    ctx.cuenta = null; ctx.tiendas = []; ctx.tienda = null; ctx.esDueno = false;
    entrada.paso = 'telefono';
  }
  function salir() {
    C.pedir('POST', '/salir').catch(function () { return null; }).then(function () {
      salirLocal();
      try { raiz.history.replaceState(null, '', raiz.location.pathname); } catch (_) { raiz.location.hash = ''; }
      pintar(pantallaEntrar('telefono'));
      enfocar('telefono');
    });
  }
  C.salir = salir;

  // ── El marco ───────────────────────────────────────────────────────────────

  function seccionesVisibles() {
    return ORDEN.filter(function (id) { var s = C.secciones[id]; return s && s.visible(ctx); });
  }
  function selectorDeTienda(clase) {
    if (ctx.tiendas.length < 2) return dato('span', { class: 'tienda-unica' }, ctx.tienda ? ctx.tienda.nombre : '');
    var sel = h('select', { class: 'selector-tienda ' + (clase || ''), 'aria-label': 'Tienda', 'data-idioma': 'no' },
      ctx.tiendas.map(function (t) { var o = h('option', { value: String(t.storeId) }, t.nombre); if (ctx.tienda && t.storeId === ctx.tienda.storeId) o.selected = true; return o; }));
    sel.addEventListener('change', function () { elegirTienda(Number(sel.value)); });
    return h('div', { class: 'con-flecha' }, sel, ico('abajo'));
  }
  function elegirTienda(storeId) {
    var t = tiendaPorId(storeId);
    if (!t) return;
    ctx.tienda = t;
    C.almacen.guardar(C.CLAVE_TIENDA, t.storeId);
    pintarMarco();
    mostrar();
  }
  function enlaceDeSeccion(id, actual, clase, corto) {
    var s = C.secciones[id];
    return h('a', { href: '#' + id, class: clase || null, 'aria-current': id === actual ? 'page' : null, 'data-seccion': id, title: corto && s.corto ? s.titulo : null },
      ico(s.icono), h('span', null, corto && s.corto ? s.corto : s.titulo), id === 'pedidos' || id === 'hoy' ? h('span', { class: 'punto-nuevo', hidden: true, 'aria-hidden': 'true' }) : null);
  }
  /** Lo que va en la barra de abajo del teléfono (lo demás, en «Más»): primero lo que más se usa. */
  function prioridad(id) {
    var orden = ['hoy', 'pedidos', 'flota', 'productos', 'billetera', 'estadisticas', 'vendedores', 'plan', 'tienda'];
    if (id === 'flota' && !(ctx.tienda && ctx.tienda.flota)) return 50; // la invitación, al final
    return orden.indexOf(id);
  }
  function rolTexto() { return ctx.esDueno ? 'Dueño' : 'Cajero'; }

  function pintarMarco() {
    var visibles = seccionesVisibles();
    var actual = seccionDelHash().id;
    var nombre = (ctx.cuenta && ctx.cuenta.nombre) || '';
    var lateral = h('aside', { class: 'lateral', 'aria-label': 'Secciones' },
      h('div', { class: 'lateral-marca' }, logo(), h('div', null, h('b', null, 'Deliservy'), h('small', null, 'Panel del comercio'))),
      h('div', { class: 'lateral-tienda' }, ctx.tiendas.length > 1 ? h('span', { class: 'etq-mini' }, 'Tienda') : null, selectorDeTienda()),
      h('nav', { class: 'lateral-nav' }, visibles.map(function (id) { return enlaceDeSeccion(id, actual); })),
      h('div', { class: 'lateral-pie' },
        h('div', { class: 'yo-fila' }, dato('span', { class: 'yo', 'aria-hidden': 'true' }, C.inicial(nombre)),
          h('div', { class: 'txt' }, dato('b', null, nombre), h('small', null, rolTexto()))),
        h('div', { class: 'botones-pie' }, botonIdioma('idioma'), h('button', { class: 'salir', type: 'button', onclick: salir }, ico('salir'), h('span', null, 'Salir')))));
    // En el teléfono: la barra de arriba y la de abajo (con «Más» si no caben).
    var cabTel = h('header', { class: 'cabecera-tel' },
      logo('logo-cab'),
      h('div', { class: 'titulo' }, h('small', null, 'Panel del comercio'), selectorDeTienda('en-cabecera')),
      h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Tu cuenta', onclick: function () { abrirMas(visibles, C.seccionActual(), true); } }, dato('span', { class: 'yo chico', 'aria-hidden': 'true' }, C.inicial(nombre))));
    var porUso = visibles.slice().sort(function (a, b) { return prioridad(a) - prioridad(b); });
    var enBarra = visibles.length <= 5 ? visibles : visibles.filter(function (id) { return porUso.indexOf(id) < 4; });
    var enMas = visibles.filter(function (id) { return enBarra.indexOf(id) < 0; });
    var barra = h('nav', { class: 'barra-abajo', 'aria-label': 'Secciones' },
      enBarra.map(function (id) { return enlaceDeSeccion(id, actual, null, true); }),
      enMas.length ? h('button', { type: 'button', class: enMas.indexOf(actual) >= 0 ? 'activo' : null, onclick: function () { abrirMas(enMas, C.seccionActual(), false); } }, ico('mas'), h('span', null, 'Más')) : null);
    barra.style.setProperty('--columnas', String(enBarra.length + (visibles.length > 5 ? 1 : 0)));
    var avisos = h('div', { class: 'zona-avisos', id: 'zona-avisos' });
    var main = h('main', { class: 'contenido', id: 'contenido', tabindex: '-1' });
    pintar(h('div', { class: 'marco' }, lateral, h('div', { class: 'columna' }, cabTel, avisos, main), barra));
    pintarAvisos();
    marcarNuevosEnMenu();
  }

  /** «Más»: las secciones que no caben abajo, el idioma y «Salir». */
  function abrirMas(lista, actual, conCuenta) {
    var nombre = (ctx.cuenta && ctx.cuenta.nombre) || '';
    var d = C.abrirDialogo({
      titulo: conCuenta ? 'Tu cuenta' : 'Más',
      cuerpo: [
        conCuenta ? h('div', { class: 'yo-fila' }, dato('span', { class: 'yo', 'aria-hidden': 'true' }, C.inicial(nombre)),
          h('div', { class: 'txt' }, dato('b', null, nombre), h('small', null, rolTexto(), ' · ', dato('span', null, (ctx.cuenta && ctx.cuenta.telefonoParaVer) || '')))) : null,
        h('nav', { class: 'lista-mas' }, lista.map(function (id) {
          var a = enlaceDeSeccion(id, actual, 'fila-mas');
          a.addEventListener('click', function () { d.cerrar(); });
          return a;
        })),
        h('div', { class: 'botones' }, botonIdioma('btn borde chico'), h('button', { class: 'btn borde chico', type: 'button', onclick: function () { d.cerrar(); salir(); } }, ico('salir'), 'Salir')),
      ],
    });
  }

  /** Arriba del contenido: los avisos de la API y lo del sonido. */
  var avisoSonido = false;
  function pintarAvisos() {
    var z = documento.getElementById('zona-avisos');
    if (!z) return;
    C.vaciar(z);
    (ctx.avisos || []).filter(function (t) { return typeof t === 'string' && t.trim(); }).slice(0, 3).forEach(function (t) {
      z.appendChild(h('div', { class: 'banda info', role: 'status' }, ico('info'), h('span', null, t)));
    });
    if (avisoSonido) {
      z.appendChild(h('div', { class: 'banda aviso-sonido', role: 'alert' }, ico('sonido'), h('span', null, 'Activa el sonido de pedidos'),
        h('button', { class: 'btn chico', type: 'button', onclick: function () { desbloquearSonido(true); } }, 'Activar')));
    }
    z.hidden = !z.firstChild;
  }

  // ── Las secciones ──────────────────────────────────────────────────────────

  function seccionDelHash() {
    var partes = String(raiz.location.hash || '').replace(/^#/, '').split('/');
    var id = partes[0];
    var visibles = seccionesVisibles();
    if (visibles.indexOf(id) < 0) id = visibles[0] || 'hoy';
    return { id: id, sub: partes.slice(1).filter(Boolean) };
  }
  C.seccionActual = function () { return seccionDelHash().id; };
  C.ir = function (hash) {
    if (raiz.location.hash === hash) mostrar();
    else raiz.location.hash = hash;
  };
  C.contenido = function () { return documento.getElementById('contenido'); };
  /** Pinta la sección en el contenido (si la vista sigue viva). */
  C.enContenido = function (v, nodos) {
    var c = C.contenido();
    if (!c || (v && !v.viva())) return;
    C.vaciar(c);
    c.appendChild(h('div', { class: 'vista' }, nodos));
  };
  C.falloEnVista = function (v, e, reintentar) {
    if (e && e.status === 401) return; // ya se fue a entrar
    C.enContenido(v, C.tarjetaError(e, reintentar || mostrar));
  };

  function mostrar() {
    if (!ctx.cuenta) return;
    C.cerrarDialogos();
    var r = seccionDelHash();
    var s = C.secciones[r.id];
    // Marca la sección en los menús sin volver a pintar el marco.
    Array.prototype.forEach.call(documento.querySelectorAll('[data-seccion]'), function (a) {
      if (a.getAttribute('data-seccion') === r.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var barraMas = documento.querySelector('.barra-abajo > button');
    if (barraMas) barraMas.classList.toggle('activo', !documento.querySelector('.barra-abajo a[aria-current="page"]'));
    var v = C.nuevaVista();
    C.enContenido(v, C.cargando());
    try { s.mostrar(ctx, r.sub, v); } catch (e) { C.falloEnVista(v, e); if (raiz.console) raiz.console.error(e); }
    raiz.scrollTo(0, 0);
  }
  C.mostrar = mostrar;

  function arrancar() {
    if (!C.sesion.leer()) { pintar(pantallaEntrar('telefono')); return; }
    pintar(C.cargando());
    C.pedir('GET', '/yo').then(function (r) {
      ctx.cuenta = (r && r.cuenta) || {};
      ctx.esDueno = ctx.cuenta.rol !== 'cajero';
      ctx.tiendas = (r && Array.isArray(r.tiendas) ? r.tiendas : []).filter(function (t) { return t && t.storeId != null; });
      ctx.avisos = r && Array.isArray(r.avisos) ? r.avisos : [];
      if (!ctx.tiendas.length) {
        pintar(h('div', { class: 'entrar' }, h('div', { class: 'tarjeta vacio' }, ico('tienda'), h('b', null, 'No tienes tiendas activas'),
          h('p', { class: 'nota' }, 'Escríbenos por WhatsApp y te ayudamos.'),
          h('div', { class: 'botones centro' }, h('a', { class: 'btn chico', href: C.WHATSAPP, target: '_blank', rel: 'noopener noreferrer' }, 'WhatsApp'), h('button', { class: 'btn borde chico', type: 'button', onclick: salir }, 'Salir')))));
        return;
      }
      var guardada = tiendaPorId(C.almacen.leer(C.CLAVE_TIENDA));
      ctx.tienda = guardada || ctx.tiendas[0];
      pintarMarco();
      mostrar();
      empezarConsulta();
    }, function (e) {
      if (e.status === 401) return;
      pintar(h('div', { class: 'entrar' }, C.tarjetaError(e, arrancar), h('div', { class: 'botones centro' }, h('button', { class: 'btn borde chico', type: 'button', onclick: salir }, 'Salir'))));
    });
  }

  /** Vuelve a leer la cuenta y sus tiendas (después de «Mostrar en la app», por ejemplo) y repinta el marco. */
  C.recargarCuenta = function () {
    return C.pedir('GET', '/yo').then(function (r) {
      ctx.cuenta = (r && r.cuenta) || ctx.cuenta;
      ctx.tiendas = (r && Array.isArray(r.tiendas) ? r.tiendas : ctx.tiendas);
      ctx.avisos = r && Array.isArray(r.avisos) ? r.avisos : ctx.avisos;
      ctx.tienda = (ctx.tienda && tiendaPorId(ctx.tienda.storeId)) || ctx.tiendas[0];
      pintarMarco();
    });
  };

  // ── El aviso de pedido nuevo ───────────────────────────────────────────────

  var nuevos = { reloj: null, desde: {}, pendientes: [], sonando: false, repeticiones: 0, relojRepetir: null };
  var sonido = null;
  function elSonido() {
    if (!sonido) { try { sonido = new raiz.Audio('/comercio/sonidos/pedido.mp3'); sonido.preload = 'auto'; } catch (_) { sonido = null; } }
    return sonido;
  }
  /** Los navegadores no dejan sonar nada antes de que la persona toque la página: se «desbloquea» con su primer toque. */
  function desbloquearSonido(probar) {
    var a = elSonido();
    if (!a) return;
    if (probar) {
      a.currentTime = 0;
      a.play().then(function () { avisoSonido = false; pintarAvisos(); C.avisar('Sonido activado'); }, function () { /* sigue bloqueado */ });
      return;
    }
    var vol = a.volume;
    a.muted = true;
    a.play().then(function () { a.pause(); a.currentTime = 0; a.muted = false; a.volume = vol; }, function () { a.muted = false; });
  }
  documento.addEventListener('pointerdown', function primero() {
    documento.removeEventListener('pointerdown', primero, true);
    if (!avisoSonido) desbloquearSonido(false);
  }, true);

  function sonar() {
    var a = elSonido();
    if (!a) return;
    try { a.currentTime = 0; } catch (_) { /* nada */ }
    var p = a.play();
    if (p && p.catch) p.catch(function () { if (!avisoSonido) { avisoSonido = true; pintarAvisos(); } });
  }
  function avisoDelNavegador(p, tienda) {
    if (!('Notification' in raiz) || raiz.Notification.permission !== 'granted') return;
    try {
      var n = new raiz.Notification(C.traducir(p.titulo || ('Nuevo pedido #' + p.id)), {
        body: String(p.comanda || '').slice(0, 180), tag: 'pedido-' + p.id, icon: '/assets/logo-icon.png', lang: idiomaActual(),
      });
      n.onclick = function () {
        try { raiz.focus(); } catch (_) { /* nada */ }
        if (tienda && ctx.tienda && tienda.storeId !== ctx.tienda.storeId) elegirTienda(tienda.storeId);
        C.ir('#pedidos/' + p.id);
        n.close();
      };
    } catch (_) { /* algunos navegadores solo lo dejan desde un service worker: queda el sonido y el título */ }
  }

  // El título de la pestaña parpadea hasta que la persona vuelve a la página.
  var titulo = { reloj: null, encendido: false };
  function parpadearTitulo(n) {
    pararTitulo();
    var base = C.traducir(TITULO);
    var texto = '(' + n + ') ' + C.traducir(n === 1 ? 'Nuevo pedido' : 'Pedidos nuevos');
    titulo.reloj = setInterval(function () {
      titulo.encendido = !titulo.encendido;
      documento.title = titulo.encendido ? texto : base;
    }, 1100);
    documento.title = texto;
    titulo.encendido = true;
  }
  function pararTitulo() {
    clearInterval(titulo.reloj);
    titulo.reloj = null;
    documento.title = C.traducir(TITULO);
  }
  function volvio() {
    if (documento.visibilityState === 'visible' && documento.hasFocus && documento.hasFocus()) {
      setTimeout(function () { if (documento.visibilityState === 'visible') pararTitulo(); }, 2500);
    }
  }
  documento.addEventListener('visibilitychange', volvio);
  raiz.addEventListener('focus', volvio);

  function marcarNuevosEnMenu() {
    var hay = nuevos.pendientes.length > 0;
    Array.prototype.forEach.call(documento.querySelectorAll('.punto-nuevo'), function (p) { p.hidden = !hay; });
  }

  /** Cada 10 s, por cada tienda de la app de la cuenta. Usa la hora del servidor (`ahora`) para la siguiente vuelta. */
  function empezarConsulta() {
    pararConsulta();
    if (!ctx.puede('pedidos')) return;
    var tiendas = ctx.tiendas.filter(C.esDeApp);
    if (!tiendas.length) return;
    var vuelta = function () {
      if (!C.sesion.leer()) { pararConsulta(); return; }
      tiendas.forEach(function (t) {
        var desde = nuevos.desde[t.storeId] || new Date(Date.now() - 15000).toISOString();
        C.pedir('GET', '/pedidos/nuevos?desde=' + encodeURIComponent(desde) + '&storeId=' + encodeURIComponent(t.storeId)).then(function (r) {
          if (r && typeof r.ahora === 'string' && !isNaN(Date.parse(r.ahora))) nuevos.desde[t.storeId] = r.ahora;
          var lista = (r && Array.isArray(r.pedidos) ? r.pedidos : []).filter(function (p) {
            return p && p.id && !C.pedidoVisto(p.id) && nuevos.pendientes.indexOf(Number(p.id)) < 0;
          });
          if (lista.length) llegaron(lista, t);
        }, function () { /* la próxima vuelta lo intenta otra vez */ });
      });
    };
    vuelta();
    nuevos.reloj = setInterval(vuelta, 10000);
  }
  function pararConsulta() {
    clearInterval(nuevos.reloj);
    clearInterval(nuevos.relojRepetir);
    nuevos.reloj = null;
    nuevos.desde = {};
    nuevos.pendientes = [];
  }
  function llegaron(lista, tienda) {
    lista.forEach(function (p) { nuevos.pendientes.push(Number(p.id)); avisoDelNavegador(p, tienda); });
    sonar();
    // Suena otra vez cada 30 s (hasta 3 veces) mientras nadie lo abra.
    nuevos.repeticiones = 0;
    clearInterval(nuevos.relojRepetir);
    nuevos.relojRepetir = setInterval(function () {
      if (!nuevos.pendientes.length || ++nuevos.repeticiones > 3) { clearInterval(nuevos.relojRepetir); return; }
      sonar();
    }, 30000);
    parpadearTitulo(nuevos.pendientes.length);
    marcarNuevosEnMenu();
    var p = lista[0];
    var otra = ctx.tienda && tienda.storeId !== ctx.tienda.storeId;
    C.avisar((lista.length === 1 ? 'Nuevo pedido #' + p.id : lista.length + ' pedidos nuevos') + (otra ? ' · ' + tienda.nombre : ''));
    // Si está mirando «Hoy» o «Pedidos» de esa tienda, se ve enseguida.
    var r = seccionDelHash();
    if (!otra && (r.id === 'hoy' || (r.id === 'pedidos' && !r.sub.length)) && !documento.querySelector('.capa-dialogo')) {
      var s = C.secciones[r.id];
      if (s && typeof s.refrescar === 'function') s.refrescar(); else mostrar();
    }
  }
  C.pedidosPendientes = function () { return nuevos.pendientes.slice(); };

  // ── El permiso del navegador para avisar (se pide una vez, con cuidado) ─────

  /** La tarjeta «¿Te avisamos…?» (en «Hoy»), o null si ya contestó o el navegador no puede. */
  C.tarjetaPermisoDeAvisos = function () {
    if (!('Notification' in raiz) || raiz.Notification.permission !== 'default' || C.almacen.leer(CLAVE_AVISOS) === 'no') return null;
    if (!ctx.puede('pedidos') || !ctx.tiendas.some(C.esDeApp)) return null;
    var tarjeta = h('div', { class: 'tarjeta permiso-avisos' },
      h('div', { class: 'icono-grande' }, ico('campana')),
      h('div', { class: 'txt' }, h('b', null, '¿Te avisamos de cada pedido nuevo?'), h('p', { class: 'nota' }, 'Aunque tengas el panel en otra pestaña.')),
      h('div', { class: 'botones' },
        h('button', { class: 'btn chico', type: 'button', onclick: function () {
          raiz.Notification.requestPermission().then(function (p) {
            tarjeta.remove();
            if (p === 'granted') C.avisar('Avisos activados');
            else C.almacen.guardar(CLAVE_AVISOS, 'no');
          }, function () { tarjeta.remove(); });
          desbloquearSonido(false);
        } }, 'Activar avisos'),
        h('button', { class: 'btn borde chico', type: 'button', onclick: function () { C.almacen.guardar(CLAVE_AVISOS, 'no'); tarjeta.remove(); } }, 'Ahora no')));
    return tarjeta;
  };

  // ── Arranque ───────────────────────────────────────────────────────────────

  raiz.addEventListener('hashchange', function () {
    if (ctx.cuenta) { mostrar(); return; }
  });
  documento.title = C.traducir(TITULO);
  arrancar();
})(window);
