/*
 * «COTIZA TU ENVÍO» (www.deliservy.com/cotizar, 14-nov-2026).
 *
 * Gilberth: «que ellos puedan chequear nuestros precios antes de inscribirse… todo tal cual como está en comercio, con
 * todas sus integraciones; lo único es que no pueden solicitar el servicio». Es «Pedir motorizado» con botones del panel
 * del comercio (comercio/flota.js, `conBotones`), pública y solo para cotizar:
 *  - Tipo de servicio: envío, contra viaje (se busca donde digas y se trae a tu comercio) y contra efectivo (cobra al
 *    entregar, con su recargo). El exclusivo no: su tarifa es la de cada comercio.
 *  - A y B se buscan (el buscador del panel, nuestro mapa), se tocan en el mapa, se arrastran o se pega un enlace de
 *    Google Maps o Apple Maps (`POST /api/comercio/cotizar-envio/enlace`, como «resolver-direccion» del panel).
 *  - En cuanto hay A y B, la calle de OpenStreetMap (`/cotizar-envio/calle`); si no contesta, la recta punteada.
 *  - SIN paquetes (14-nov-2026, Gilberth: «quita eso de paquetes de allí»): siempre el precio de UN envío.
 *  - «Cotizar» → `POST /api/comercio/cotizar-envio`: lo que pagaría un comercio NUEVO de la flota, con las mismas piezas
 *    que el panel y Alisa. Sin cuenta, sin quién recibe y sin guardar nada: no hay «Pedir». Después del precio,
 *    «Activar por WhatsApp» al 0426-5201529 (el número de los comercios), con la cotización escrita.
 * Usa base.js y mapa.js del panel, tal cual.
 */
(function (raiz) {
  'use strict';
  var C = raiz.Comercio;
  var documento = raiz.document;
  if (!C || !C.mapa) return;
  var h = C.h, dato = C.dato, ico = C.ico;
  var WHATSAPP_0426 = 'https://wa.me/584265201529';
  // Los del panel (comercio/flota.js), con «tu comercio» en vez de «tu tienda».
  var TIPOS = {
    envio: ['Envío', 'De tu comercio a tu cliente.'],
    contra_viaje: ['Contra viaje', 'Lo busca donde digas y lo trae a tu comercio.'],
    contra_efectivo: ['Contra efectivo', 'Cobra a tu cliente al entregar.'],
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
  function km(n) { return String(C.redondo(n)).replace('.', ',') + ' km'; }

  function pagina() {
    // `comercio()`: cuál de los dos puntos es el comercio (A en envío y contra efectivo; B en contra viaje).
    var e = { tipo: 'envio', a: null, b: null, editando: 'a', cot: null, calle: null, calleClave: '', callePedida: '' };
    var comercio = function () { return e.tipo === 'contra_viaje' ? 'b' : 'a'; };
    var m = null;
    var mapaCaja = h('div', { class: 'mapa mapa-pedir' });

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
      // Contra viaje: se busca donde diga el comercio y se trae al comercio (B es el comercio), como en el panel.
      if ((k === 'contra_viaje') !== (antes === 'contra_viaje')) {
        var x = e.a; e.a = e.b; e.b = x;
        e.editando = e.a ? (e.b ? e.editando : 'b') : 'a';
      }
      quitarCotizacion();
      pintarTipos(); pintarPuntos(); ponerEnMapa();
    }

    var puntoA = h('div', { class: 'punto-campo' });
    var puntoB = h('div', { class: 'punto-campo' });
    var claveDelEnlace = e.editando;
    var buscadorDir = C.mapa.buscador({
      id: 'buscar-dir',
      cerca: function () { return (m && m.centro()) || e.a || e.b || null; },
      alElegir: function (lugar) { ponerPunto(e.editando, lugar); },
      alEscribir: function () { claveDelEnlace = e.editando === 'a' ? 'a' : 'b'; },
      // Un enlace de Google Maps o Apple Maps: el servidor lo abre (como en el panel) y da el punto exacto.
      alEnlace: function (texto) {
        var clave = claveDelEnlace === 'a' ? 'a' : 'b';
        return C.pedir('POST', '/cotizar-envio/enlace', { texto: texto }, { sinSesion: true }).then(function (r) {
          if (!r || !C.mapa.valido(r)) throw new Error('No pude leer ese enlace. Prueba con otro o toca el mapa.');
          ponerPunto(clave, { lat: Number(r.lat), lng: Number(r.lng), direccion: typeof r.direccion === 'string' ? r.direccion : '' });
        });
      },
    });
    var avisoToque = h('p', { class: 'ayuda' }, 'Busca la dirección o toca el punto exacto en el mapa.');
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var resultado = h('div', { class: 'resultado-cotizacion', hidden: true, 'aria-live': 'polite' });
    var cotizar = C.boton('Cotizar', { class: 'btn' }, 'moto');

    function pintarPuntos() {
      var fila = function (letra, p, clave) {
        var editando = e.editando === clave;
        var esComercio = comercio() === clave;
        var pista = esComercio ? 'Tu comercio' : e.tipo === 'contra_viaje' ? 'Dónde se busca' : 'Tu cliente';
        return [
          h('span', { class: 'letra ' + clave }, letra),
          h('div', { class: 'txt' }, h('small', null, (clave === 'a' ? 'Recoge en' : 'Entrega en') + ' · ' + pista),
            p ? dato('b', null, p.direccion || 'Punto en el mapa')
              : h('b', { class: 'falta' }, editando ? 'Búscalo o toca el mapa' : 'Falta')),
          h('button', {
            class: 'btn chico ' + (editando ? 'suave' : 'borde'), type: 'button',
            onclick: function () { e.editando = clave; pintarPuntos(); try { buscadorDir.input.focus(); } catch (_) { /* nada */ } },
          }, editando ? 'Eligiendo' : 'Cambiar'),
        ];
      };
      C.reemplazar(puntoA, fila('A', e.a, 'a'));
      C.reemplazar(puntoB, fila('B', e.b, 'b'));
      puntoA.classList.toggle('editando', e.editando === 'a');
      puntoB.classList.toggle('editando', e.editando === 'b');
    }
    function ponerPunto(clave, lugar) {
      e[clave] = { lat: Number(lugar.lat), lng: Number(lugar.lng), direccion: lugar.direccion || '' };
      if (!lugar.direccion) {
        C.mapa.donde(lugar.lat, lugar.lng).then(function (t) { if (e[clave] && e[clave].lat === Number(lugar.lat)) { e[clave].direccion = t || 'Punto en el mapa'; pintarPuntos(); } });
      }
      // Después de A, sigue B (si falta), y al revés.
      if (clave === 'a' && !e.b) e.editando = 'b';
      else if (clave === 'b' && !e.a) e.editando = 'a';
      quitarCotizacion();
      error.hidden = true;
      pintarPuntos(); ponerEnMapa();
    }
    function claveCalle() {
      if (!e.a || !e.b || !C.mapa.valido(e.a) || !C.mapa.valido(e.b)) return '';
      var f = function (p) { return Number(p.lat).toFixed(5) + ',' + Number(p.lng).toFixed(5); };
      return f(e.a) + '>' + f(e.b);
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
    /** La calle de OpenStreetMap en cuanto A y B existen. No es el precio. */
    function pedirCalle() {
      var clave = claveCalle();
      if (!clave || e.callePedida === clave) return;
      e.callePedida = clave;
      C.pedir('POST', '/cotizar-envio/calle', {
        a: { lat: Number(e.a.lat), lng: Number(e.a.lng) },
        b: { lat: Number(e.b.lat), lng: Number(e.b.lng) },
      }, { sinSesion: true }).then(function (r) {
        if (e.callePedida !== clave || claveCalle() !== clave) return;
        var coords = coordsDeRuta(r && r.ruta);
        e.calle = coords.length >= 2 ? coords : null;
        e.calleClave = clave;
        ponerEnMapa();
      }, function () { /* sin calle: se queda la recta punteada */ });
    }

    function quitarCotizacion() {
      if (!e.cot) return;
      e.cot = null;
      resultado.hidden = true;
      cotizar.hidden = false;
    }
    cotizar.addEventListener('click', function () {
      var cv = e.tipo === 'contra_viaje';
      var mal = !e.a || !C.mapa.valido(e.a) ? (cv ? 'Marca dónde se recoge (el punto A).' : 'Marca dónde está tu comercio (el punto A).')
        : !e.b || !C.mapa.valido(e.b) ? (cv ? 'Marca dónde está tu comercio (el punto B).' : 'Marca a dónde va el pedido (el punto B).') : '';
      error.textContent = mal; error.hidden = !mal;
      if (mal) return;
      var punto = function (p) { return { lat: Number(Number(p.lat).toFixed(6)), lng: Number(Number(p.lng).toFixed(6)) }; };
      C.trabajando(cotizar, C.pedir('POST', '/cotizar-envio', { tipo: e.tipo, a: punto(e.a), b: punto(e.b) }, { sinSesion: true })).then(function (r) {
        e.cot = r || {};
        pintarResultado();
      }, function (er) { error.textContent = (er && er.message) || 'No pude cotizar ahora. Intenta de nuevo en un momento.'; error.hidden = false; });
    });
    function pintarResultado() {
      var r = e.cot;
      var precio = C.dolares(r.precioUsd);
      var detalle = TIPOS[r.tipo] ? TIPOS[r.tipo][0].toLowerCase() : 'envío';
      var texto = 'Hola, quiero activar Pedidos por WhatsApp. Coticé en la web un ' + detalle + ': ' + precio
        + (r.distanciaKm != null ? ', ' + km(r.distanciaKm) : '') + '.';
      var otro = C.boton('Cotizar otro', { class: 'btn borde' });
      otro.addEventListener('click', function () {
        quitarCotizacion();
        var cliente = comercio() === 'a' ? 'b' : 'a';
        e[cliente] = null; e.editando = cliente; pintarPuntos(); ponerEnMapa();
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
      resultado.hidden = false;
      cotizar.hidden = true;
      if (resultado.scrollIntoView) resultado.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    var app = documento.getElementById('app');
    C.reemplazar(app, h('main', { class: 'cotizar' },
      h('header', { class: 'cotizar-cabecera' },
        h('img', { src: '/assets/logo-icon.png', alt: 'Deliservy' }),
        h('div', { class: 'titulo' }, h('small', null, 'Deliservy · Valencia'), h('h1', null, 'Cotiza tu envío'))),
      h('p', { class: 'cotizar-intro' }, 'Marca tu comercio y a tu cliente en el mapa y mira cuánto cuesta un motorizado de Deliservy. Sin registrarte.'),
      h('div', { class: 'rejilla-pedir' },
        h('div', { class: 'col-mapa' }, mapaCaja, avisoToque),
        h('div', { class: 'col-form' },
          h('div', { class: 'tarjeta' },
            h('h2', null, '¿Qué necesitas?'),
            cajaTipos),
          h('div', { class: 'tarjeta' },
            h('h2', null, '¿De dónde a dónde?'),
            h('div', { class: 'puntos' }, puntoA, puntoB,
              h('button', { class: 'enlace-mini', type: 'button', onclick: function () { var x = e.a; e.a = e.b; e.b = x; quitarCotizacion(); pintarPuntos(); ponerEnMapa(); } }, ico('recargar'), 'Intercambiar A y B')),
            buscadorDir.caja,
            h('p', { class: 'ayuda' }, 'También puedes pegar un enlace de Google Maps o de Apple Maps.')),
          error, resultado,
          h('div', { class: 'botones' }, cotizar))),
      h('p', { class: 'pie' }, 'Deliservyapp, C.A. · RIF J-504754129 · ', h('a', { href: 'https://www.deliservy.com/' }, 'www.deliservy.com'))));
    pintarTipos();
    pintarPuntos();
    C.mapa.crear(mapaCaja, { centro: C.mapa.VALENCIA, zoom: 13 }).then(function (mm) {
      m = mm;
      mm.alTocar(function (lat, lng) { ponerPunto(e.editando || 'b', { lat: lat, lng: lng }); });
      ponerEnMapa();
    }, function () { avisoToque.textContent = 'Busca la dirección: el mapa no cargó.'; });
  }

  if (documento.readyState === 'loading') documento.addEventListener('DOMContentLoaded', pagina);
  else pagina();
})(window);
