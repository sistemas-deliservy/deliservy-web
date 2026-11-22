/*
 * «COTIZA» (www.deliservy.com/cotizar).
 *
 * 14-nov-2026, «Cotiza tu envío». Gilberth: «que ellos puedan chequear nuestros precios antes de inscribirse… todo tal
 * cual como está en comercio, con todas sus integraciones; lo único es que no pueden solicitar el servicio». Es «Pedir
 * motorizado» con botones del panel del comercio (comercio/flota.js, `conBotones`), pública y solo para cotizar:
 *  - Tipo de servicio: envío, contra envío (antes «contra viaje»: se busca donde digas y se trae a tu comercio) y contra
 *    efectivo (cobra al entregar, con su recargo). El exclusivo no: su tarifa es la de cada comercio.
 *  - A y B se buscan (el buscador del panel, nuestro mapa), se tocan en el mapa, se arrastran o se pega un enlace de
 *    Google Maps o Apple Maps (`POST /api/comercio/cotizar-envio/enlace`, como «resolver-direccion» del panel).
 *  - En cuanto hay A y B, la calle de OpenStreetMap (`/cotizar-envio/calle`); si no contesta, la recta punteada.
 *  - SIN paquetes (14-nov-2026, Gilberth: «quita eso de paquetes de allí»): siempre el precio de UN envío.
 *  - «Cotizar» → `POST /api/comercio/cotizar-envio`: lo que pagaría un comercio NUEVO de la flota, con las mismas piezas
 *    que el panel y Alisa. Sin cuenta, sin quién recibe y sin guardar nada: no hay «Pedir». Después del precio,
 *    «Activar por WhatsApp» al 0426-5201529 (el número de los comercios), con la cotización escrita.
 *
 * 22-nov-2026, mototaxi y taxi. Gilberth: «anexa la de Delitaxi, pero no pongas la palabra Delitaxi, pon taxi vehículo
 * y mototaxi… desde… hasta… pon también los tipos de taxi… Y cuando la persona presione pedidos por flota, allí se abra
 * envío, contraenvío y contraefectivo… mantén lo que ya está». Arriba, «¿Qué quieres cotizar?»: Mototaxi, Taxi y
 * Pedidos por flota; al tocar uno aparecen el mapa y sus campos.
 *  - Mototaxi y Taxi: «Desde» y «Hasta», cada uno con su buscador (el mismo de arriba; un enlace de Google Maps o Apple
 *    Maps pegado lo abre el servidor con `/cotizar-envio/enlace`), o tocando y arrastrando en el mapa. Taxi: básico,
 *    premium (con aire acondicionado), XL y de lujo.
 *  - El precio es el de la app: `POST /api/viaje-web/precios`, la ruta pública de la página de viajes sin la app
 *    (`deliveryCost` con `isSumaryTaxi`: la calle, el clima y solo Carabobo). Da todos los servicios de una vez, así que
 *    cambiar de mototaxi a taxi o de tipo de taxi no vuelve a preguntar. La calle: `GET /api/viaje-web/ruta` (nuestro
 *    mapa, en moto o en carro). Después del precio, «Pedir por WhatsApp» al 0414-495-7006 (Alisa), con el viaje escrito.
 *  - Pedidos por flota: el mismo precio y las mismas peticiones de antes. Desde el 22-nov-2026 también con «Desde» y
 *    «Hasta» (Gilberth: «en pedidos por flota… siempre usa también desde y hasta, porque como está ahorita no se entiende
 *    mucho»), cada uno con su pista: tu comercio, tu cliente o dónde se busca. Antes: filas A y B con un solo buscador.
 * Usa base.js y mapa.js del panel, tal cual.
 */
(function (raiz) {
  'use strict';
  var C = raiz.Comercio;
  var documento = raiz.document;
  if (!C || !C.mapa) return;
  var h = C.h, dato = C.dato, ico = C.ico;
  var WHATSAPP_0426 = 'https://wa.me/584265201529';
  // Alisa (0414-495-7006): los viajes de quien no tiene la app.
  var WHATSAPP_VIAJES = C.WHATSAPP || 'https://wa.me/584144957006';

  var SERVICIOS = {
    mototaxi: {
      nombre: 'Mototaxi', detalle: 'En moto, de un punto a otro.', icono: 'moto', titulo: 'Cotiza tu mototaxi',
      intro: 'Escribe desde dónde y hasta dónde vas, o márcalo en el mapa, y mira cuánto cuesta un mototaxi de Deliservy. Sin registrarte.',
    },
    taxi: {
      nombre: 'Taxi', detalle: 'En carro: básico, premium, XL o de lujo.', icono: 'carro', titulo: 'Cotiza tu taxi',
      intro: 'Elige el tipo de taxi, escribe desde dónde y hasta dónde vas, o márcalo en el mapa, y mira el precio. Sin registrarte.',
    },
    flota: {
      nombre: 'Pedidos por flota', detalle: 'Para tu comercio: envío, contra envío y contra efectivo.', icono: 'paquete', titulo: 'Cotiza tu envío',
      intro: 'Marca tu comercio y a tu cliente en el mapa y mira cuánto cuesta un motorizado de Deliservy. Sin registrarte.',
    },
  };
  var ORDEN_SERVICIOS = ['mototaxi', 'taxi', 'flota'];
  var SIN_SERVICIO = {
    titulo: 'Cotiza tu viaje o tu envío',
    intro: 'Elige qué quieres cotizar, marca desde dónde y hasta dónde, y mira el precio. Sin registrarte.',
  };
  // El `type` de cada servicio en `/viaje-web/precios` (las empresas de la app: 40 mototaxi, 20 taxi, 70 premium, 50 XL, 60 lujo).
  var TIPO_MOTOTAXI = 40;
  var TAXIS = {
    // `mensaje`: como se escribe en el WhatsApp a Alisa; así lo reconoce también el lector de viajes de la flota
    // (`leerViaje`: «taxi básico» o «taxi normal» quedan sin servicio, «taxi vehículo» es el básico).
    basico: { tipo: 20, nombre: 'Básico', largo: 'taxi básico', mensaje: 'taxi vehículo', detalle: 'Taxi normal.' },
    premium: { tipo: 70, nombre: 'Premium', largo: 'taxi premium', mensaje: 'taxi premium', detalle: 'Con aire acondicionado.' },
    xl: { tipo: 50, nombre: 'XL', largo: 'taxi XL', mensaje: 'taxi XL', detalle: 'Más puestos y más espacio.' },
    lujo: { tipo: 60, nombre: 'De lujo', largo: 'taxi de lujo', mensaje: 'taxi de lujo', detalle: 'Vehículo de lujo.' },
  };
  var ORDEN_TAXIS = ['basico', 'premium', 'xl', 'lujo'];
  // Los del panel (comercio/flota.js), con «tu comercio» en vez de «tu tienda». La clave `contra_viaje` es la de la API.
  var TIPOS = {
    envio: ['Envío', 'De tu comercio a tu cliente.'],
    contra_viaje: ['Contra envío', 'Lo busca donde digas y lo trae a tu comercio.'],
    contra_efectivo: ['Contra efectivo', 'Lo lleva de tu comercio a tu cliente, le cobra y te trae el dinero.'],
  };

  /** El trazado de la calle: `[lng, lat]` (lo que pinta el mapa) o `{lat, lng}`. Con menos de dos puntos, nada. */
  function coordsDeRuta(ruta) {
    if (!Array.isArray(ruta)) return [];
    var out = [];
    for (var i = 0; i < ruta.length; i++) {
      var p = ruta[i];
      if (Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])) out.push([Number(p[0]), Number(p[1])]);
      else if (p && isFinite(Number(p.lng)) && isFinite(Number(p.lat))) out.push([Number(p.lng), Number(p.lat)]);
    }
    return out.length >= 2 ? out : [];
  }
  /** El trazado de `/viaje-web/ruta` (polilínea de 6 decimales, la de nuestro mapa) → `[lng, lat]`. Como `viaje-web/estatico/app.js`. */
  function decodificar(texto) {
    var puntos = [], i = 0, lat = 0, lng = 0;
    texto = typeof texto === 'string' ? texto : '';
    while (i < texto.length) {
      var b, shift = 0, result = 0;
      do { b = texto.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32 && i < texto.length);
      lat += (result & 1) ? ~(result >> 1) : (result >> 1);
      shift = 0; result = 0;
      do { b = texto.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32 && i < texto.length);
      lng += (result & 1) ? ~(result >> 1) : (result >> 1);
      var p = [lng / 1e6, lat / 1e6];
      if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90) puntos.push(p);
    }
    return puntos.length >= 2 ? puntos : [];
  }
  function km(n) { return String(C.redondo(n)).replace('.', ',') + ' km'; }
  /** El carro de «Taxi» (base.js no lo trae): mismo trazo que los demás iconos. */
  function icono(nombre) {
    if (nombre !== 'carro') return ico(nombre);
    return C.svg('svg', { viewBox: '0 0 24 24', class: 'ico', 'aria-hidden': 'true' },
      C.svg('path', { d: 'M3.5 16.5v-4L6 7h12l2.5 5.5v4z' }),
      C.svg('path', { d: 'M4 12.5h16' }),
      C.svg('path', { d: 'M5.5 17.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0' }),
      C.svg('path', { d: 'M14.5 17.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0' }));
  }

  function pagina() {
    // `servicio`: null hasta que se elige (mototaxi, taxi o flota). En mototaxi y taxi, A es «Desde» y B «Hasta».
    // En flota, `comercio()`: cuál de los dos puntos es el comercio (A en envío y contra efectivo; B en contra envío).
    var e = {
      servicio: null, taxi: 'basico', tipo: 'envio', a: null, b: null, editando: 'a', cot: null,
      calle: null, calleMin: null, calleClave: '', callePedida: '',
    };
    var comercio = function () { return e.tipo === 'contra_viaje' ? 'b' : 'a'; };
    var esViaje = function () { return e.servicio === 'mototaxi' || e.servicio === 'taxi'; };
    var m = null;
    var mapaPedido = false;
    var mapaFallo = false;
    var mapaCaja = h('div', { class: 'mapa mapa-pedir' });

    // ── ¿Qué quieres cotizar? ────────────────────────────────────────────────
    var cajaServicios = h('div', { class: 'tipos-servicio servicios', role: 'radiogroup', 'aria-label': '¿Qué quieres cotizar?' });
    function pintarServicios() {
      C.reemplazar(cajaServicios, ORDEN_SERVICIOS.map(function (k) {
        var s = SERVICIOS[k];
        return h('button', { type: 'button', role: 'radio', 'aria-checked': String(e.servicio === k), class: 'tipo servicio' + (e.servicio === k ? ' activo' : ''), onclick: function () { elegirServicio(k); } },
          icono(s.icono), h('span', { class: 'txt' }, h('b', null, s.nombre), h('small', null, s.detalle)));
      }));
    }
    function elegirServicio(k) {
      if (!SERVICIOS[k] || k === e.servicio) return;
      var antes = e.servicio;
      e.servicio = k;
      // Un precio de viaje sirve para mototaxi y para cualquier taxi (vienen todos juntos); el de flota, no.
      if (k === 'flota' || antes === 'flota' || !(e.cot && e.cot.viaje)) quitarCotizacion();
      error.hidden = true;
      e.editando = !e.a ? 'a' : !e.b ? 'b' : e.editando;
      pintarTodo();
      mostrarDireccion('a'); mostrarDireccion('b');
      if (e.cot) pintarResultado();
      asegurarMapa();
      ponerEnMapa();
      try { raiz.history.replaceState(null, '', '#' + k); } catch (_) { /* nada */ }
    }

    // ── Taxi: el tipo ────────────────────────────────────────────────────────
    var cajaTaxis = h('div', { class: 'tipos-servicio taxis', role: 'radiogroup', 'aria-label': 'Tipo de taxi' });
    function pintarTaxis() {
      C.reemplazar(cajaTaxis, ORDEN_TAXIS.map(function (k) {
        return h('button', { type: 'button', role: 'radio', 'aria-checked': String(e.taxi === k), class: 'tipo' + (e.taxi === k ? ' activo' : ''), onclick: function () { elegirTaxi(k); } },
          h('b', null, TAXIS[k].nombre), h('small', null, TAXIS[k].detalle));
      }));
    }
    function elegirTaxi(k) {
      if (!TAXIS[k]) return;
      e.taxi = k;
      pintarTaxis();
      if (e.cot && e.cot.viaje) pintarResultado();
    }

    // ── Flota: el tipo (lo de antes) ─────────────────────────────────────────
    var cajaTipos = h('div', { class: 'tipos-servicio', role: 'radiogroup', 'aria-label': 'Tipo de servicio' });
    function pintarTipos() {
      C.reemplazar(cajaTipos, Object.keys(TIPOS).map(function (k) {
        return h('button', { type: 'button', role: 'radio', 'aria-checked': String(e.tipo === k), class: 'tipo' + (e.tipo === k ? ' activo' : ''), onclick: function () { elegirTipo(k); } },
          h('b', null, TIPOS[k][0]), h('small', null, TIPOS[k][1]));
      }));
    }
    function elegirTipo(k) {
      var antes = e.tipo;
      e.tipo = k;
      // Contra envío: se busca donde diga el comercio y se trae al comercio («Hasta» es el comercio), como en el panel.
      if ((k === 'contra_viaje') !== (antes === 'contra_viaje')) {
        var x = e.a; e.a = e.b; e.b = x;
        e.editando = e.a ? (e.b ? e.editando : 'b') : 'a';
        mostrarDireccion('a'); mostrarDireccion('b');
      }
      quitarCotizacion();
      pintarTipos(); pintarCampos(); ponerEnMapa();
    }

    /** Un enlace de Google Maps o Apple Maps pegado: el punto (y su nombre) los da el servidor. Solo Carabobo. */
    function delEnlace(clave, texto) {
      return C.pedir('POST', '/cotizar-envio/enlace', { texto: texto }, { sinSesion: true }).then(function (r) {
        if (!r || !C.mapa.valido(r)) throw new Error('No pude leer ese enlace. Prueba con otro o toca el mapa.');
        // Si mientras tanto borró el enlace y escribió otra cosa, lo nuevo manda. La promesa no se cumple nunca: si se
        // cumpliera, el buscador (mapa.js) vaciaría el campo con lo que está escribiendo.
        if (campoDe(clave).input.value.trim() !== String(texto).trim()) return new Promise(function () { /* nunca */ });
        ponerPunto(clave, { lat: Number(r.lat), lng: Number(r.lng), direccion: typeof r.direccion === 'string' ? r.direccion : '' });
      });
    }
    var avisoToque = h('p', { class: 'ayuda' }, 'Toca el mapa para marcar «Desde», o arrastra los puntos.');
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var resultado = h('div', { class: 'resultado-cotizacion', hidden: true, 'aria-live': 'polite' });
    var cotizar = C.boton('Cotizar', { class: 'btn' }, 'moto');

    // ── «Desde» y «Hasta», cada uno con su buscador (los tres servicios) ─────
    function campoDeViaje(clave) {
      var rotulo = clave === 'a' ? 'Desde' : 'Hasta';
      var id = clave === 'a' ? 'cotizar-desde' : 'cotizar-hasta';
      var elegir = function () { if (e.editando !== clave) { e.editando = clave; pintarCampos(); } };
      var b = C.mapa.buscador({
        id: id,
        rotulo: rotulo,
        pista: 'Dirección o enlace',
        cerca: function () { return e[clave] || (m && m.centro()) || e.a || e.b || null; },
        alElegir: function (lugar) { ponerPunto(clave, lugar); },
        alEscribir: elegir,
        alEnlace: function (texto) { return delEnlace(clave, texto); },
      });
      b.input.addEventListener('focus', elegir);
      var campo = { input: b.input, silencio: false };
      // El campo vacío es «sin punto»: se borra del mapa (y el precio, si lo había).
      b.input.addEventListener('input', function () {
        campo.silencio = false;
        if (b.input.value.trim() || !e[clave]) return;
        e[clave] = null;
        quitarCotizacion();
        ponerEnMapa();
      });
      // En flota, de quién es cada punto: «Desde · Tu comercio», «Hasta · Tu cliente» (o «Desde · Dónde se busca»).
      var pista = h('small', { class: 'pista-punto', hidden: true });
      var caja = h('div', { class: 'campo-viaje' },
        h('label', { for: id }, h('span', { class: 'letra ' + clave }, clave === 'a' ? 'A' : 'B'), rotulo, pista),
        b.caja);
      // Con el punto ya puesto, una búsqueda que aún venía en camino (mapa.js no la cancela) no vuelve a abrir la lista
      // encima del otro campo; en cuanto escribe otra vez, sí. (Al elegir rápido de la lista pasaba: Fable y la prueba.)
      var lista = b.caja.querySelector('.resultados-dir');
      if (lista && typeof raiz.MutationObserver === 'function') {
        new raiz.MutationObserver(function () { if (campo.silencio && !lista.hidden) lista.hidden = true; })
          .observe(lista, { attributes: true, attributeFilter: ['hidden'] });
      }
      campo.caja = caja;
      campo.pista = pista;
      return campo;
    }
    var desde = campoDeViaje('a');
    var hasta = campoDeViaje('b');
    function campoDe(clave) { return clave === 'a' ? desde : hasta; }
    function pintarCampos() {
      desde.caja.classList.toggle('editando', e.editando === 'a');
      hasta.caja.classList.toggle('editando', e.editando === 'b');
      [['a', desde], ['b', hasta]].forEach(function (x) {
        var t = e.servicio !== 'flota' ? '' : comercio() === x[0] ? 'Tu comercio' : e.tipo === 'contra_viaje' ? 'Dónde se busca' : 'Tu cliente';
        x[1].pista.textContent = t ? '· ' + t : '';
        x[1].pista.hidden = !t;
      });
      pintarAviso();
    }
    /** La dirección del punto, dentro de su campo. Después del buscador, que limpia el campo al elegir o al leer un enlace. */
    function mostrarDireccion(clave) {
      var campo = clave === 'a' ? desde : hasta;
      var p = e[clave];
      raiz.setTimeout(function () {
        if (e[clave] !== p) return;
        // Sin punto, lo que escribió o pegó (un enlace que aún se está leyendo) se queda.
        if (!p && campo.input.value.trim() && campo.input.value !== campo.puesto) return;
        poner(campo, p ? (p.direccion || '') : '');
      }, 0);
    }
    function poner(campo, texto) {
      campo.input.value = texto;
      campo.puesto = campo.input.value;
    }
    function pintarAviso() {
      if (mapaFallo) { avisoToque.textContent = 'Busca la dirección: el mapa no cargó.'; return; }
      avisoToque.textContent = 'Toca el mapa para marcar «' + (e.editando === 'a' ? 'Desde' : 'Hasta') + '», o arrastra los puntos.';
    }

    function ponerPunto(clave, lugar) {
      var p = e[clave] = { lat: Number(lugar.lat), lng: Number(lugar.lng), direccion: lugar.direccion || '' };
      var campo = campoDe(clave);
      campo.silencio = true;
      var lista = campo.caja.querySelector('.resultados-dir');
      if (lista) lista.hidden = true;
      if (!lugar.direccion) {
        C.mapa.donde(lugar.lat, lugar.lng).then(function (t) {
          // Puede que mientras tanto se haya intercambiado (o cambiado a contra envío): va al campo donde esté ahora.
          var donde = e.a === p ? 'a' : e.b === p ? 'b' : null;
          if (!donde) return;
          p.direccion = t || 'Punto en el mapa';
          // En «Desde» o «Hasta», sin pisar lo que esté escribiendo.
          var campo = campoDe(donde);
          if (!campo.input.value.trim()) poner(campo, p.direccion);
          // El WhatsApp del precio ya pintado lleva la dirección (sin mover la página).
          if (e.cot && e.cot.viaje && esViaje()) pintarResultado(true);
        });
      }
      // Después de A, sigue B (si falta), y al revés.
      if (clave === 'a' && !e.b) e.editando = 'b';
      else if (clave === 'b' && !e.a) e.editando = 'a';
      quitarCotizacion();
      error.hidden = true;
      pintarCampos(); mostrarDireccion(clave); ponerEnMapa();
    }
    function intercambiar() {
      var x = e.a; e.a = e.b; e.b = x;
      quitarCotizacion();
      pintarCampos(); mostrarDireccion('a'); mostrarDireccion('b'); ponerEnMapa();
    }
    function punto6(p) { return Number(p.lat).toFixed(5) + ',' + Number(p.lng).toFixed(5); }
    /** Los dos puntos, si están. */
    function clavePuntos() {
      if (!e.a || !e.b || !C.mapa.valido(e.a) || !C.mapa.valido(e.b)) return '';
      return punto6(e.a) + '>' + punto6(e.b);
    }
    /** Cómo se traza la calle: la moto de flota, la moto del mototaxi o el carro del taxi. */
    function modoCalle() { return e.servicio === 'taxi' ? 'carro' : e.servicio === 'mototaxi' ? 'moto' : 'flota'; }
    function claveCalle() {
      var p = clavePuntos();
      return p ? modoCalle() + ':' + p : '';
    }
    function ponerEnMapa() {
      if (!m) return;
      ['a', 'b'].forEach(function (k) {
        var p = e[k];
        if (p && C.mapa.valido(p)) m.marcador(k, k, p, { arrastrable: true, alSoltar: function (lat, lng) { ponerPunto(k, { lat: lat, lng: lng }); } });
        else m.quitarMarcador(k);
      });
      var clave = claveCalle();
      var calle = e.calle && e.calleClave === clave ? e.calle : [];
      if (calle.length >= 2) m.ruta(calle, false);
      else if (clave) m.ruta([[e.a.lng, e.a.lat], [e.b.lng, e.b.lat]], true);
      else m.ruta([], true);
      m.encuadrar([e.a, e.b]);
      pedirCalle();
    }
    /** La calle de nuestro mapa en cuanto A y B existen. No es el precio. */
    function pedirCalle() {
      var clave = claveCalle();
      if (!clave || e.callePedida === clave) return;
      e.callePedida = clave;
      var modo = modoCalle();
      var a = { lat: Number(e.a.lat), lng: Number(e.a.lng) };
      var b = { lat: Number(e.b.lat), lng: Number(e.b.lng) };
      var pedido = modo === 'flota'
        ? C.pedir('POST', '/cotizar-envio/calle', { a: a, b: b }, { sinSesion: true }).then(function (r) {
          return { coords: coordsDeRuta(r && r.ruta), minutos: null };
        })
        : C.pedir('GET', '/api/viaje-web/ruta?olat=' + a.lat.toFixed(6) + '&olng=' + a.lng.toFixed(6) + '&dlat=' + b.lat.toFixed(6) + '&dlng=' + b.lng.toFixed(6)
          + '&vehiculo=' + modo, undefined, { sinSesion: true }).then(function (r) {
          return { coords: decodificar(r && r.trazado), minutos: r && r.minutos != null && isFinite(Number(r.minutos)) ? Number(r.minutos) : null };
        });
      pedido.then(function (x) {
        if (e.callePedida !== clave || claveCalle() !== clave) return;
        e.calle = x.coords.length >= 2 ? x.coords : null;
        e.calleMin = x.minutos;
        e.calleClave = clave;
        ponerEnMapa();
        // El tiempo del viaje llega con la calle: si el precio ya está, se completa.
        if (e.cot && e.cot.viaje && x.minutos != null) pintarResultado(true);
      }, function () {
        // Sin calle: se queda la recta punteada; con el próximo cambio de puntos se vuelve a pedir.
        if (e.callePedida === clave) e.callePedida = '';
      });
    }

    function quitarCotizacion() {
      if (!e.cot) return;
      e.cot = null;
      resultado.hidden = true;
      cotizar.hidden = false;
    }
    cotizar.addEventListener('click', function () {
      if (e.servicio === 'flota') cotizarEnvio();
      else if (esViaje()) cotizarViaje();
    });
    function cotizarEnvio() {
      var cv = e.tipo === 'contra_viaje';
      var mal = faltaEnLosPuntos(
        cv ? 'En «Desde», escribe dónde se busca, o márcalo en el mapa.' : 'En «Desde», escribe dónde está tu comercio, o márcalo en el mapa.',
        cv ? 'En «Hasta», escribe dónde está tu comercio, o márcalo en el mapa.' : 'En «Hasta», escribe a dónde va el pedido, o márcalo en el mapa.');
      error.textContent = mal; error.hidden = !mal;
      if (mal) return;
      var clave = e.tipo + '|' + clavePuntos();
      var punto = function (p) { return { lat: Number(Number(p.lat).toFixed(6)), lng: Number(Number(p.lng).toFixed(6)) }; };
      C.trabajando(cotizar, C.pedir('POST', '/cotizar-envio', { tipo: e.tipo, a: punto(e.a), b: punto(e.b) }, { sinSesion: true })).then(function (r) {
        // Si mientras tanto cambió el tipo o un punto (o se fue a mototaxi o taxi), este precio ya no es de lo que se ve.
        if (e.servicio !== 'flota' || e.tipo + '|' + clavePuntos() !== clave) return;
        e.cot = r || {};
        pintarResultado();
      }, function (er) { error.textContent = (er && er.message) || 'No pude cotizar ahora. Intenta de nuevo en un momento.'; error.hidden = false; });
    }
    /** El nombre del punto para la API de viajes (pide al menos 3 letras) y para el WhatsApp. */
    function textoDe(p, otro) {
      var t = String((p && p.direccion) || '').replace(/\s+/g, ' ').trim();
      return t.length >= 3 && t !== 'Punto en el mapa' ? t.slice(0, 180) : otro;
    }
    /** Lo escrito en el campo no es el punto marcado (se escribió otra cosa sin elegirla, o el enlace no se pudo leer). */
    function escritoSinElegir(clave) {
      var campo = campoDe(clave);
      var t = campo.input.value.trim();
      return !!t && !!e[clave] && t !== String(campo.puesto || '').trim();
    }
    /**
     * Lo que falta antes de cotizar, o ''. Si el campo tiene texto pero no hay punto (o es otro), se le pide elegirlo
     * de la lista: así no se cotiza con un punto que no es el que se ve escrito.
     */
    function faltaEnLosPuntos(escribeA, escribeB) {
      var elige = function (r) { return 'En «' + r + '», elige la dirección de la lista, pega un enlace o toca el mapa.'; };
      var sinPunto = function (k) { return !e[k] || !C.mapa.valido(e[k]); };
      var conTexto = function (k) { return !!campoDe(k).input.value.trim(); };
      if (sinPunto('a')) return conTexto('a') ? elige('Desde') : escribeA;
      if (sinPunto('b')) return conTexto('b') ? elige('Hasta') : escribeB;
      if (escritoSinElegir('a')) return elige('Desde');
      if (escritoSinElegir('b')) return elige('Hasta');
      return '';
    }
    function cotizarViaje() {
      var mal = faltaEnLosPuntos('Escribe desde dónde sales, o márcalo en el mapa.', 'Escribe hasta dónde vas, o márcalo en el mapa.');
      error.textContent = mal; error.hidden = !mal;
      if (mal) return;
      var clave = clavePuntos();
      var punto = function (p, otro) { return { lat: Number(Number(p.lat).toFixed(6)), lng: Number(Number(p.lng).toFixed(6)), texto: textoDe(p, otro) }; };
      C.trabajando(cotizar, C.pedir('POST', '/api/viaje-web/precios', { origen: punto(e.a, 'Punto de salida'), destino: punto(e.b, 'Destino') }, { sinSesion: true })).then(function (r) {
        // Si mientras tanto cambió un punto o se fue a flota, este precio ya no es de lo que se ve.
        if (!esViaje() || clavePuntos() !== clave) return;
        e.cot = { viaje: true, clave: clave, lista: r && Array.isArray(r.servicios) ? r.servicios : [] };
        pintarResultado();
      }, function (er) { error.textContent = (er && er.message) || 'No pude cotizar ahora. Intenta de nuevo en un momento.'; error.hidden = false; });
    }
    /** `sinMover`: un repintado que llega solo (la dirección o el tiempo), sin llevar la página al precio. */
    function pintarResultado(sinMover) {
      if (e.cot && e.cot.viaje) { if (esViaje()) pintarViaje(sinMover); return; }
      var r = e.cot;
      var precio = C.dolares(r.precioUsd);
      var detalle = TIPOS[r.tipo] ? TIPOS[r.tipo][0].toLowerCase() : 'envío';
      var texto = 'Hola, quiero activar Pedidos por WhatsApp. Coticé en la web un ' + detalle + ': ' + precio
        + (r.distanciaKm != null ? ', ' + km(r.distanciaKm) : '') + '.';
      var otro = C.boton('Cotizar otro', { class: 'btn borde' });
      otro.addEventListener('click', function () {
        quitarCotizacion();
        var cliente = comercio() === 'a' ? 'b' : 'a';
        e[cliente] = null; e.editando = cliente; pintarCampos(); mostrarDireccion(cliente); ponerEnMapa();
        try { (cliente === 'a' ? desde : hasta).input.focus(); } catch (_) { /* nada */ }
      });
      var recargos = [];
      if (r.recargoHorario) recargos.push('el recargo de este horario');
      if (r.clima) recargos.push('el recargo por ' + String(r.clima.situacion || 'el clima'));
      var partes = [];
      if (C.num(r.recargoEfectivoUsd) > 0) partes.push('Envío ' + C.dolares(r.precioUnEnvioUsd), 'recargo por cobrar en efectivo ' + C.dolares(r.recargoEfectivoUsd));
      C.reemplazar(resultado, [
        h('div', { class: 'cot-cifras' },
          h('div', { class: 'cot-precio' }, h('small', null, 'Precio'), dato('b', null, precio)),
          // Sin ruta (el mapa no contestó) la API da «minutos: null»: no se inventa «~0 min».
          r.minutos != null ? h('div', null, h('small', null, 'Llega en'), dato('b', null, '~' + Math.round(C.num(r.minutos)) + ' min')) : null,
          r.distanciaKm != null ? h('div', null, h('small', null, 'Distancia'), dato('b', null, km(r.distanciaKm))) : null),
        partes.length ? h('p', { class: 'aviso-precio' }, partes.join(' + ') + '.') : null,
        h('p', { class: 'aviso-precio' }, (r.porRuta === false ? 'Precio aproximado: ahora no pude trazar la calle. ' : '') + (recargos.length
          ? 'Es el precio de ahora: incluye ' + recargos.join(' y ') + '. En otro horario y sin lluvia, baja.'
          : 'Es el precio de ahora. De noche, en días especiales o con lluvia puede subir.')),
        h('ul', { class: 'ventajas' },
          h('li', null, 'Sin costo de afiliación y sin porcentaje de tus ventas: pagas solo el envío.'),
          h('li', null, 'Pagas por pago móvil o transferencia, en el mismo chat de WhatsApp.'),
          h('li', null, 'Repartidores verificados y entrega con código.')),
        h('div', { class: 'botones' },
          otro,
          h('a', { class: 'btn whatsapp', href: WHATSAPP_0426 + '?text=' + encodeURIComponent(texto), target: '_blank', rel: 'noopener noreferrer' }, ico('chat'), 'Activar por WhatsApp')),
      ]);
      mostrarResultado();
    }
    /** El precio de un viaje: el del mototaxi o el del tipo de taxi elegido; con taxi, los otros tipos debajo para comparar. */
    function pintarViaje(sinMover) {
      var lista = e.cot.lista;
      var delTipo = function (tipo) {
        for (var i = 0; i < lista.length; i++) if (Number(lista[i] && lista[i].type) === tipo && C.num(lista[i].precio) > 0) return lista[i];
        return null;
      };
      var taxi = e.servicio === 'taxi';
      var s = delTipo(taxi ? TAXIS[e.taxi].tipo : TIPO_MOTOTAXI);
      var nombre = taxi ? TAXIS[e.taxi].largo : 'mototaxi';
      var otro = C.boton('Cotizar otro', { class: 'btn borde' });
      otro.addEventListener('click', function () {
        quitarCotizacion();
        e.b = null; e.editando = 'b';
        pintarCampos(); mostrarDireccion('b'); ponerEnMapa();
        try { hasta.input.focus(); } catch (_) { /* nada */ }
      });
      var otros = taxi ? ORDEN_TAXIS.filter(function (k) { return k !== e.taxi && delTipo(TAXIS[k].tipo); }) : [];
      if (!s) {
        C.reemplazar(resultado, [
          h('p', { class: 'aviso-precio' }, 'Ahora no tengo precio de ' + nombre + ' para este viaje.' + (otros.length ? ' Mira los otros tipos de taxi:' : ' Prueba con otro servicio.')),
          otros.length ? cajaDeOtros(otros, delTipo) : null,
          h('div', { class: 'botones' }, otro),
        ]);
        mostrarResultado(sinMover);
        return;
      }
      var precio = C.dolares(s.precio);
      var minutos = e.calleMin != null && e.calleClave === claveCalle() ? e.calleMin : null;
      var dirA = sitioCorto(e.a), dirB = sitioCorto(e.b);
      var texto = 'Hola, quiero un ' + (taxi ? TAXIS[e.taxi].mensaje : 'mototaxi')
        + (dirA ? ' desde ' + dirA : '') + (dirB ? ' hasta ' + dirB : '') + '.'
        + '\nLo coticé en la web: ' + precio + (s.km != null && isFinite(Number(s.km)) ? ' (' + km(s.km) + ')' : '') + '.';
      var clima = s.clima && typeof s.clima === 'object' ? String(s.clima.linea || s.clima.aviso || '').trim() : '';
      C.reemplazar(resultado, [
        h('div', { class: 'cot-cifras' },
          h('div', { class: 'cot-precio' }, h('small', null, taxi ? 'Taxi ' + TAXIS[e.taxi].nombre.toLowerCase().replace('xl', 'XL') : 'Mototaxi'), dato('b', null, precio)),
          s.km != null && isFinite(Number(s.km)) ? h('div', null, h('small', null, 'Distancia'), dato('b', null, km(s.km))) : null,
          minutos != null ? h('div', null, h('small', null, 'Duración'), dato('b', null, '~' + Math.max(1, Math.round(minutos)) + ' min')) : null),
        clima ? dato('p', { class: 'aviso-precio' }, clima) : null,
        h('p', { class: 'aviso-precio' }, 'Es el precio de ahora. De noche, en días especiales o con lluvia puede subir.'),
        otros.length ? h('p', { class: 'aviso-precio' }, 'Otros tipos de taxi para este viaje:') : null,
        otros.length ? cajaDeOtros(otros, delTipo) : null,
        h('div', { class: 'botones' },
          otro,
          h('a', { class: 'btn whatsapp', href: WHATSAPP_VIAJES + '?text=' + encodeURIComponent(texto), target: '_blank', rel: 'noopener noreferrer' }, ico('chat'), 'Pedir por WhatsApp')),
      ]);
      mostrarResultado(sinMover);
    }
    /**
     * El sitio para el WhatsApp, sin la ciudad ni el estado: «Sambil Valencia», «Avenida 106 Briceño Méndez». El lector
     * de viajes de la flota corta el sitio en la primera coma, el punto y coma o « - » (`FIN_DEL_DESTINO`).
     */
    function sitioCorto(p) {
      var partes = textoDe(p, '').split(/[,;\n]|\s+-\s+/).map(function (x) { return x.replace(/[.\s]+$/, '').trim(); }).filter(Boolean);
      var t = partes[0] || '';
      // «137-45, Av. Bolívar Norte»: un número solo no dice dónde; va con lo que sigue.
      if (!/[A-Za-zÁÉÍÓÚÑáéíóúñü]{3}/.test(t) && partes[1]) t += ' ' + partes[1];
      return t.length >= 3 ? t : '';
    }
    function cajaDeOtros(otros, delTipo) {
      return h('div', { class: 'otros-taxis' }, otros.map(function (k) {
        return h('button', { type: 'button', onclick: function () { elegirTaxi(k); } },
          h('span', null, TAXIS[k].nombre), dato('b', null, C.dolares(delTipo(TAXIS[k].tipo).precio)));
      }));
    }
    function mostrarResultado(sinMover) {
      resultado.hidden = false;
      cotizar.hidden = true;
      if (!sinMover && resultado.scrollIntoView) resultado.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // ── La página ────────────────────────────────────────────────────────────
    var titulo = h('h1', null, SIN_SERVICIO.titulo);
    var intro = h('p', { class: 'cotizar-intro' }, SIN_SERVICIO.intro);
    var tarjetaTaxis = h('div', { class: 'tarjeta', hidden: true }, h('h2', null, 'Tipo de taxi'), cajaTaxis);
    var tarjetaTipos = h('div', { class: 'tarjeta', hidden: true }, h('h2', null, '¿Qué necesitas?'), cajaTipos);
    var tarjetaPuntos = h('div', { class: 'tarjeta', hidden: true },
      h('h2', null, '¿Desde dónde y hasta dónde?'),
      h('div', { class: 'puntos' }, desde.caja, hasta.caja,
        h('button', { class: 'enlace-mini', type: 'button', onclick: intercambiar }, ico('recargar'), 'Intercambiar desde y hasta')),
      h('p', { class: 'ayuda' }, 'Busca la dirección o pega un enlace de Google Maps o de Apple Maps. También puedes tocar el mapa.'));
    var botones = h('div', { class: 'botones', hidden: true }, cotizar);
    var rejilla = h('div', { class: 'rejilla-pedir', hidden: true },
      h('div', { class: 'col-mapa' }, mapaCaja, avisoToque),
      h('div', { class: 'col-form' }, tarjetaTaxis, tarjetaTipos, tarjetaPuntos, error, resultado, botones));

    function pintarTodo() {
      var s = SERVICIOS[e.servicio] || SIN_SERVICIO;
      titulo.textContent = s.titulo;
      intro.textContent = s.intro;
      documento.title = s.titulo + ' · Deliservy';
      rejilla.hidden = !e.servicio;
      botones.hidden = !e.servicio;
      tarjetaTaxis.hidden = e.servicio !== 'taxi';
      tarjetaTipos.hidden = e.servicio !== 'flota';
      tarjetaPuntos.hidden = !e.servicio;
      C.reemplazar(cotizar, [icono(e.servicio === 'taxi' ? 'carro' : 'moto'), 'Cotizar']);
      pintarServicios(); pintarTaxis(); pintarTipos(); pintarCampos();
    }
    /** El mapa se crea la primera vez que se ve (escondido no sabe su tamaño). */
    function asegurarMapa() {
      if (mapaPedido) return;
      mapaPedido = true;
      C.mapa.crear(mapaCaja, { centro: C.mapa.VALENCIA, zoom: 13 }).then(function (mm) {
        m = mm;
        mm.alTocar(function (lat, lng) { if (e.servicio) ponerPunto(e.editando || 'b', { lat: lat, lng: lng }); });
        ponerEnMapa();
      }, function () { mapaFallo = true; pintarAviso(); });
    }

    var app = documento.getElementById('app');
    C.reemplazar(app, h('main', { class: 'cotizar' },
      h('header', { class: 'cotizar-cabecera' },
        h('img', { src: '/assets/logo-icon.png', alt: 'Deliservy' }),
        h('div', { class: 'titulo' }, h('small', null, 'Deliservy · Valencia'), titulo)),
      intro,
      h('div', { class: 'tarjeta elegir-servicio' }, h('h2', null, '¿Qué quieres cotizar?'), cajaServicios),
      rejilla,
      h('p', { class: 'pie' }, 'Deliservyapp, C.A. · RIF J-504754129 · ', h('a', { href: 'https://www.deliservy.com/' }, 'www.deliservy.com'))));
    pintarTodo();
    // Un enlace puede llegar con el servicio: /cotizar#mototaxi, #taxi, #flota (o #envio); también con la página abierta.
    var delEnlaceDeLaPagina = function () {
      var pedido = String((raiz.location && raiz.location.hash) || '').replace(/^#/, '').toLowerCase();
      if (pedido === 'envio' || pedido === 'envios') pedido = 'flota';
      if (SERVICIOS[pedido]) elegirServicio(pedido);
    };
    delEnlaceDeLaPagina();
    raiz.addEventListener('hashchange', delEnlaceDeLaPagina);
  }

  if (documento.readyState === 'loading') documento.addEventListener('DOMContentLoaded', pagina);
  else pagina();
})(window);
