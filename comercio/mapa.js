/*
 * EL PANEL DEL COMERCIO — el mapa propio de Deliservy (24-oct-2026).
 *
 * El mismo de la tienda web (`public/tienda/app.js` de la API): MapLibre GL y pmtiles servidos desde esta misma web
 * (`comercio/mapa/`), con los estilos de `https://www.deliservy.website/mapa/estilos/` (`claro.json` u `oscuro.json`).
 * Solo se carga al abrir un mapa. Pines A (verde) y B (rojo), la ruta y el motorizado en vivo. Si el mapa no carga
 * (sin internet, un navegador viejo), el recuadro lo dice y todo lo demás sigue funcionando.
 *
 * El buscador de direcciones es el de la tienda web: `GET /api/client/address/autocomplete/…` (lugares de nuestro mapa,
 * `propio:lat,lng`) y `GET /api/client/address/donde…` (la dirección de un punto). Son públicas: van sin la sesión.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var documento = raiz.document;
  var h = C.h;
  var ESTILO = 'https://www.deliservy.website/mapa/estilos/';
  var VALENCIA = { lat: 10.1621, lng: -68.0077 };

  var promesa = null;
  var protocoloListo = false;
  function cargarMapLibre() {
    if (raiz.maplibregl && raiz.pmtiles) return Promise.resolve();
    if (promesa) return promesa;
    promesa = new Promise(function (ok, mal) {
      documento.head.appendChild(h('link', { rel: 'stylesheet', href: '/comercio/mapa/maplibre-gl.css?v=5.24.0' }));
      var uno = h('script', { src: '/comercio/mapa/maplibre-gl.js?v=5.24.0' });
      uno.onload = function () {
        var dos = h('script', { src: '/comercio/mapa/pmtiles.js?v=4.5.0' });
        dos.onload = function () { ok(); };
        dos.onerror = mal;
        documento.head.appendChild(dos);
      };
      uno.onerror = mal;
      documento.head.appendChild(uno);
    });
    promesa.catch(function () { promesa = null; });
    return promesa;
  }
  function oscuro() { return !documento.documentElement.classList.contains('claro'); }
  function valido(p) { return p && isFinite(Number(p.lat)) && isFinite(Number(p.lng)) && Math.abs(Number(p.lat)) <= 90 && Math.abs(Number(p.lng)) <= 180; }

  /** El pin (A verde, B rojo) o el motorizado: figuras fijas, sin datos dentro. */
  function figura(tipo) {
    if (tipo === 'moto') {
      return h('div', { class: 'pin-moto', 'aria-hidden': 'true' }, h('span', { class: 'pulso' }), C.ico('moto'));
    }
    var letra = tipo === 'a' ? 'A' : tipo === 'b' ? 'B' : '';
    var svg = C.svg('svg', { viewBox: '0 0 30 38', class: 'pin-svg', 'aria-hidden': 'true' },
      C.svg('path', { d: 'M15 0C6.7 0 0 6.6 0 14.8 0 25.8 15 38 15 38s15-12.2 15-23.2C30 6.6 23.3 0 15 0z', class: 'pin-fondo' }),
      C.svg('circle', { cx: 15, cy: 14.5, r: 8.5, fill: '#fff' }));
    return h('div', { class: 'pin pin-' + (tipo === 'a' ? 'a' : tipo === 'b' ? 'b' : 'tienda'), 'aria-hidden': 'true' }, svg, letra ? h('span', { class: 'pin-letra' }, letra) : C.ico('tienda'));
  }

  /**
   * Un mapa dentro de `caja`. Devuelve una promesa con { marcador, quitarMarcador, ruta, encuadrar, alTocar, centro,
   * irA, quitar }. Si MapLibre no se puede cargar, la promesa falla y la caja dice que el mapa no cargó.
   */
  function crear(caja, o) {
    o = o || {};
    caja.classList.add('mapa');
    var lienzo = h('div', { class: 'lienzo' });
    var aviso = h('div', { class: 'cargando-mapa' }, h('span', { class: 'rueda', 'aria-hidden': 'true' }), h('span', null, 'Cargando el mapa…'));
    C.vaciar(caja);
    caja.appendChild(lienzo);
    caja.appendChild(aviso);
    var sinMapa = function () {
      C.vaciar(aviso);
      aviso.classList.add('fallo');
      aviso.appendChild(C.ico('mapa'));
      aviso.appendChild(h('span', null, 'El mapa no cargó. Puedes seguir sin él.'));
    };
    return cargarMapLibre().then(function () {
      if (!documento.body.contains(caja)) throw new Error('fuera');
      var gl = raiz.maplibregl;
      if (!protocoloListo) {
        var protocolo = new raiz.pmtiles.Protocol();
        gl.addProtocol('pmtiles', protocolo.tile);
        protocoloListo = true;
      }
      var centro = valido(o.centro) ? o.centro : VALENCIA;
      var mapa;
      try {
        mapa = new gl.Map({
          container: lienzo, style: ESTILO + (oscuro() ? 'oscuro' : 'claro') + '.json', center: [Number(centro.lng), Number(centro.lat)],
          zoom: o.zoom || 14, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, maxZoom: 19, minZoom: 5,
          cooperativeGestures: false,
        });
      } catch (e) { sinMapa(); throw e; }
      mapa.addControl(new gl.AttributionControl({ compact: true }), 'bottom-left');
      mapa.addControl(new gl.NavigationControl({ showCompass: false }), 'top-right');
      if (mapa.touchZoomRotate) mapa.touchZoomRotate.disableRotation();
      var cargado = false;
      var listo = function () {
        if (cargado) return;
        cargado = true;
        if (aviso.parentNode) aviso.remove();
        var cr = lienzo.querySelector('.maplibregl-ctrl-attrib');
        if (cr) cr.classList.remove('maplibregl-compact-show');
        pendientes.forEach(function (fn) { try { fn(); } catch (_) { /* nada */ } });
        pendientes = [];
      };
      var pendientes = [];
      // Después del primer «load» el estilo ya está: una fuente que se recarga no impide dibujar.
      var alCargar = function (fn) { if (cargado) fn(); else pendientes.push(fn); };
      mapa.on('load', listo);
      // Si el estilo no llega (sin internet), el recuadro lo dice; los pines y los botones siguen.
      var relojFallo = setTimeout(function () { if (!cargado) sinMapa(); }, 12000);
      mapa.on('error', function (ev) {
        var msg = String((ev && ev.error && ev.error.message) || '');
        if (!cargado && /style|Failed to fetch|NetworkError|load/i.test(msg)) { clearTimeout(relojFallo); sinMapa(); }
      });
      var marcadores = {};
      var api = {
        mapa: mapa,
        /** Pone o mueve un pin: tipo 'a' | 'b' | 'moto' | 'tienda'. */
        marcador: function (clave, tipo, p, op) {
          if (!valido(p)) return;
          var lngLat = [Number(p.lng), Number(p.lat)];
          if (marcadores[clave]) { marcadores[clave].setLngLat(lngLat); return; }
          var el = figura(tipo);
          var m = new gl.Marker({ element: el, anchor: tipo === 'moto' ? 'center' : 'bottom', draggable: !!(op && op.arrastrable) }).setLngLat(lngLat).addTo(mapa);
          if (op && op.arrastrable && op.alSoltar) m.on('dragend', function () { var ll = m.getLngLat(); op.alSoltar(ll.lat, ll.lng); });
          marcadores[clave] = m;
        },
        quitarMarcador: function (clave) { if (marcadores[clave]) { marcadores[clave].remove(); delete marcadores[clave]; } },
        /** La ruta: una lista de [lng, lat]. Sin la de verdad, una línea punteada de A a B. */
        ruta: function (coords, aproximada) {
          alCargar(function () {
            var lista = (coords || []).filter(function (c) { return Array.isArray(c) && isFinite(c[0]) && isFinite(c[1]); });
            var datos = { type: 'FeatureCollection', features: lista.length >= 2 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: lista } }] : [] };
            var fuente = mapa.getSource('ruta');
            if (fuente) fuente.setData(datos);
            else {
              mapa.addSource('ruta', { type: 'geojson', data: datos });
              mapa.addLayer({ id: 'ruta-borde', type: 'line', source: 'ruta', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 } });
              mapa.addLayer({ id: 'ruta-linea', type: 'line', source: 'ruta', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#E41616', 'line-width': 4 } });
            }
            try { mapa.setPaintProperty('ruta-linea', 'line-dasharray', aproximada ? [1.2, 1.4] : [1, 0]); } catch (_) { /* nada */ }
          });
        },
        encuadrar: function (puntos, relleno) {
          var lista = (puntos || []).filter(valido);
          if (!lista.length) return;
          if (lista.length === 1) { mapa.jumpTo({ center: [Number(lista[0].lng), Number(lista[0].lat)], zoom: 15 }); return; }
          var b = new gl.LngLatBounds();
          lista.forEach(function (p) { b.extend([Number(p.lng), Number(p.lat)]); });
          try { mapa.fitBounds(b, { padding: relleno || 56, maxZoom: 16, duration: 0 }); } catch (_) { /* nada */ }
        },
        irA: function (p, zoom) { if (valido(p)) mapa.flyTo({ center: [Number(p.lng), Number(p.lat)], zoom: zoom || 16, speed: 1.6 }); },
        alTocar: function (fn) { mapa.on('click', function (ev) { fn(ev.lngLat.lat, ev.lngLat.lng); }); },
        centro: function () { var c = mapa.getCenter(); return { lat: c.lat, lng: c.lng }; },
        quitar: function () { clearTimeout(relojFallo); try { mapa.remove(); } catch (_) { /* nada */ } },
      };
      return api;
    }, function (e) {
      sinMapa();
      throw e || new Error('sin mapa');
    });
  }

  // ── El buscador de direcciones (el de la tienda web) ───────────────────────

  /**
   * Un buscador con su lista de resultados. `o.cerca()` da el punto para ordenar por cercanía; `o.alElegir({lat, lng,
   * direccion})` recibe el lugar elegido.
   */
  function buscador(o) {
    var input = h('input', { class: 'campo', type: 'search', placeholder: o.pista || 'Busca la calle, edificio o urbanización', 'aria-label': o.rotulo || 'Buscar dirección', autocomplete: 'off', enterkeyhint: 'search', id: o.id || null, maxlength: '120' });
    var resultados = h('div', { class: 'resultados-dir', hidden: true, role: 'listbox' });
    var reloj = null, seq = 0;
    input.addEventListener('input', function () {
      clearTimeout(reloj);
      var texto = input.value.trim();
      if (texto.length < 3) { resultados.hidden = true; return; }
      reloj = setTimeout(function () { buscar(texto); }, 350);
    });
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { resultados.hidden = true; } });
    function buscar(texto) {
      var mio = ++seq;
      var c = (o.cerca && o.cerca()) || VALENCIA;
      C.pedir('GET', '/api/client/address/autocomplete/' + encodeURIComponent(texto) + '?latitude=' + Number(c.lat).toFixed(6) + '&longitude=' + Number(c.lng).toFixed(6) + '&mapa=propio', undefined, { sinSesion: true }).then(function (r) {
        if (mio !== seq) return;
        var lista = (r && Array.isArray(r.predictions) ? r.predictions : []);
        C.vaciar(resultados);
        var hay = 0;
        lista.slice(0, 7).forEach(function (p) {
          var m = /^propio:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(String(p.place_id || ''));
          if (!m) return;
          hay++;
          var nombre = typeof p.nombre === 'string' && p.nombre ? p.nombre : null;
          var detalle = typeof p.direccion === 'string' && p.direccion ? p.direccion : null;
          resultados.appendChild(h('button', {
            type: 'button', role: 'option', 'data-idioma': 'no',
            onclick: function () {
              resultados.hidden = true;
              input.value = '';
              o.alElegir({ lat: parseFloat(m[1]), lng: parseFloat(m[2]), direccion: String(p.description || nombre || '') });
            },
          }, nombre && detalle ? [h('b', null, nombre), h('small', null, detalle)] : h('b', null, String(p.description || ''))));
        });
        if (!hay) resultados.appendChild(h('p', { class: 'ayuda' }, 'No encontramos esa dirección. Prueba con otra palabra o toca el mapa.'));
        resultados.hidden = false;
      }, function () {
        if (mio !== seq) return;
        C.vaciar(resultados);
        resultados.appendChild(h('p', { class: 'ayuda' }, 'No se pudo buscar. Toca el punto en el mapa.'));
        resultados.hidden = false;
      });
    }
    return { caja: h('div', { class: 'buscador-dir' }, h('div', { class: 'con-icono' }, C.ico('buscar'), input), resultados), input: input };
  }

  /** La dirección de un punto («Av. Bolívar Norte, Valencia»), o '' si no se sabe. */
  function donde(lat, lng) {
    return C.pedir('GET', '/api/client/address/donde?latitude=' + Number(lat).toFixed(6) + '&longitude=' + Number(lng).toFixed(6), undefined, { sinSesion: true })
      .then(function (r) { return r && typeof r.texto === 'string' ? r.texto.trim() : ''; }, function () { return ''; });
  }

  C.mapa = { crear: crear, buscador: buscador, donde: donde, valido: valido, VALENCIA: VALENCIA };
})(window);
