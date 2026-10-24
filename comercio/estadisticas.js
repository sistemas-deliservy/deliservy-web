/*
 * EL PANEL DEL COMERCIO — «Estadísticas» (24-oct-2026).
 *
 * Ventas por día, semana (lunes a domingo) o mes, en hora de Caracas; los más vendidos; el ticket promedio; las horas
 * fuertes; las calificaciones y las cancelaciones (las mismas de la app, `estadisticas-de-usuario.ts`) y las opiniones
 * con «Responder». Solo pedidos entregados: sin los de prueba ni los de flota.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;
  var estado = { rango: '30', agrupar: 'dia', metrica: 'ventasUsd', sinResponder: false };
  var RANGOS = [['7', '7 días'], ['30', '30 días'], ['mes', 'Este mes'], ['90', '3 meses'], ['365', '12 meses']];

  function rangoDe(k) {
    var hoy = C.diaCaracas();
    if (k === 'mes') return { desde: C.primeroDelMes(hoy), hasta: hoy };
    var n = Number(k) || 30;
    return { desde: C.sumarDias(hoy, -(n - 1)), hasta: hoy };
  }
  function etiquetaDe(periodo, agrupar) {
    var p = String(periodo || '');
    if (agrupar === 'mes' || /^\d{4}-\d{2}$/.test(p)) return C.MESES_CORTOS[Number(p.slice(5, 7)) - 1] || p;
    if (/^\d{4}-\d{2}-\d{2}/.test(p)) return C.diaCorto(p.slice(0, 10));
    return p;
  }
  function horaTexto(hh) {
    var n = Math.round(C.num(hh)) % 24;
    return (n % 12 === 0 ? 12 : n % 12) + (n < 12 ? ' a. m.' : ' p. m.');
  }

  function tarjetaCalificaciones(cal) {
    if (!cal || typeof cal !== 'object') return null;
    var prom = cal.rating != null ? cal.rating : cal.promedio;
    var n = cal.ratingCount != null ? cal.ratingCount : cal.n;
    var promRep = cal.ratingRepartidores;
    var lista = Array.isArray(cal.calificaciones) ? cal.calificaciones : Array.isArray(cal.lista) ? cal.lista : [];
    return h('div', { class: 'tarjeta' },
      h('h2', null, 'Calificaciones'),
      h('div', { class: 'cifras' },
        C.cifra('De tus clientes', prom != null ? h('span', { class: 'con-estrella' }, ico('estrella', 'llena'), String(C.redondo(prom)).replace('.', ',')) : '—', '', C.plural(n || 0, 'calificación', 'calificaciones')),
        promRep != null ? C.cifra('De los repartidores', h('span', { class: 'con-estrella' }, ico('estrella', 'llena'), String(C.redondo(promRep)).replace('.', ',')), '', C.plural(cal.ratingRepartidoresCount || 0, 'calificación', 'calificaciones')) : null),
      lista.length ? h('div', { class: 'lista compacta' }, lista.slice(0, 6).map(function (c) {
        return h('div', { class: 'renglon' }, C.estrellas(c.estrellas),
          h('div', { class: 'txt' }, c.nombre ? dato('b', null, c.nombre) : h('b', null, 'Cliente'), h('small', null, c.orderId ? 'Pedido #' + Math.round(C.num(c.orderId)) + ' · ' : '', C.fechaCorta(c.fecha))));
      })) : h('p', { class: 'nota' }, 'Aún no tienes calificaciones.'));
  }

  function tarjetaCancelaciones(can) {
    if (!can || typeof can !== 'object') return null;
    var hechas = can.hechas || {};
    var recibidas = can.recibidas || {};
    var lista = (Array.isArray(hechas.lista) ? hechas.lista.map(function (x) { return Object.assign({ tuya: true }, x); }) : [])
      .concat(Array.isArray(recibidas.lista) ? recibidas.lista : [])
      .sort(function (a, b) { return Date.parse(b.fecha) - Date.parse(a.fecha); });
    return h('div', { class: 'tarjeta' },
      h('h2', null, 'Cancelaciones'),
      h('div', { class: 'cifras' },
        C.cifra('Las cancelaste tú', String(Math.round(C.num(hechas.total))), C.num(hechas.ultimos7Dias) ? 'ambar' : '', String(Math.round(C.num(hechas.ultimos7Dias))) + ' en 7 días'),
        C.cifra('Cancelaron otros', String(Math.round(C.num(recibidas.total))), '', String(Math.round(C.num(recibidas.ultimos7Dias))) + ' en 7 días')),
      lista.length ? h('div', { class: 'lista compacta' }, lista.slice(0, 6).map(function (c) {
        return h('div', { class: 'renglon' }, h('div', { class: 'icono-mov ' + (c.tuya ? 'ambar' : '') }, ico(c.tuya ? 'tienda' : 'x')),
          h('div', { class: 'txt' }, h('b', null, c.motivo || ''), h('small', null, c.orderId ? 'Pedido #' + Math.round(C.num(c.orderId)) + ' · ' : '', C.fechaCorta(c.fecha), c.tuya ? ' · tú' : (c.nombre ? [' · ', dato('span', null, c.nombre)] : null))));
      })) : h('p', { class: 'nota' }, 'Sin cancelaciones. ¡Bien!'));
  }

  // ── Opiniones ──────────────────────────────────────────────────────────────

  function opinion(o) {
    var caja = h('div', { class: 'opinion' });
    var pintar = function () {
      var r = o.respuesta;
      var prod = o.producto && (o.producto.name || o.producto.nombre);
      C.reemplazar(caja, [
        h('div', { class: 'op-cab' }, dato('b', null, o.autor || 'Cliente'), C.estrellas(o.estrellas), h('small', null, C.fechaCorta(o.fecha))),
        prod ? h('small', { class: 'op-producto' }, ico('productos'), dato('span', null, prod)) : null,
        o.comentario ? dato('p', { class: 'op-texto' }, o.comentario) : h('p', { class: 'nota' }, 'Sin comentario.'),
        r && r.texto ? h('div', { class: 'op-respuesta' }, h('small', null, 'Tu respuesta', r.estado === 'retenida' ? [' · ', C.pill('En revisión', 'ambar')] : null), dato('p', null, r.texto))
          : C.boton('Responder', { class: 'btn chico suave', onclick: responder }, 'chat'),
      ]);
    };
    var responder = function () {
      var area = h('textarea', { class: 'campo', rows: '3', maxlength: '300', placeholder: C.segunIdioma('Escribe tu respuesta (se ve en la app)', 'Write your reply (shown in the app)'), 'aria-label': 'Tu respuesta' });
      var cuenta = h('small', { class: 'contador-letras' }, '0/300');
      var error = h('p', { class: 'error-campo', role: 'alert', hidden: true });
      var enviar = C.boton('Enviar', { class: 'btn chico' }, 'enviar');
      var cancelar = C.boton('Cancelar', { class: 'btn borde chico', onclick: pintar });
      area.addEventListener('input', function () { cuenta.textContent = area.value.length + '/300'; });
      enviar.addEventListener('click', function () {
        var t = area.value.trim();
        if (t.length < 2) { error.textContent = 'Escribe tu respuesta.'; error.hidden = false; return; }
        C.trabajando(enviar, C.pedir('POST', '/opiniones/' + o.id + '/respuesta', { texto: t })).then(function (r) {
          o.respuesta = (r && r.respuesta) || { texto: t, estado: 'publicada' };
          C.avisar('Respuesta enviada');
          pintar();
        }, function (e) { error.textContent = e.message; error.hidden = false; });
      });
      var vieja = caja.querySelector('button.btn');
      if (vieja) vieja.replaceWith(h('div', { class: 'op-responder' }, area, h('div', { class: 'fila-contador' }, cuenta), error, h('div', { class: 'botones' }, cancelar, enviar)));
      try { area.focus(); } catch (_) { /* nada */ }
    };
    pintar();
    return caja;
  }

  function tarjetaOpiniones(ctx, v, resumen) {
    var lista = h('div', { class: 'opiniones-lista' }, C.cargando());
    var mas = h('div', { class: 'botones centro' });
    var todas = [];
    var cargar = function (pagina) {
      return C.pedir('GET', '/opiniones?companyId=' + encodeURIComponent(ctx.tienda.companyId) + '&sinResponder=' + (estado.sinResponder ? 'true' : 'false') + '&pagina=' + pagina).then(function (x) {
        if (!v.viva()) return;
        var nuevas = x && Array.isArray(x.opiniones) ? x.opiniones : Array.isArray(x) ? x : [];
        todas = pagina === 1 ? nuevas : todas.concat(nuevas);
        C.reemplazar(lista, todas.length ? todas.map(opinion) : h('p', { class: 'nota relleno' }, estado.sinResponder ? 'Respondiste todas. ¡Bien!' : 'Aún no tienes opiniones.'));
        C.reemplazar(mas, x && x.hayMas ? C.boton('Ver más', { class: 'btn borde chico', onclick: function (ev) { C.trabajando(ev.currentTarget, cargar(pagina + 1)).catch(function (e) { C.avisar(e.message, 'mal'); }); } }) : null);
      });
    };
    var r = resumen || {};
    var sinResp = C.interruptor('solo-sin-responder', estado.sinResponder, 'Solo sin responder', function (on) { estado.sinResponder = on; C.reemplazar(lista, C.cargando()); cargar(1).catch(function (e) { C.reemplazar(lista, C.tarjetaError(e)); }); }, { clase: 'chico' });
    var t = h('div', { class: 'tarjeta' },
      h('div', { class: 'cab-tarjeta' }, h('h2', null, 'Opiniones'), sinResp.caja),
      h('div', { class: 'cifras' },
        C.cifra('Promedio', r.promedio != null ? h('span', { class: 'con-estrella' }, ico('estrella', 'llena'), String(C.redondo(r.promedio)).replace('.', ',')) : '—'),
        C.cifra('Opiniones', String(Math.round(C.num(r.n != null ? r.n : r.cantidad)))),
        C.cifra('Sin responder', String(Math.round(C.num(r.sinResponder))), C.num(r.sinResponder) ? 'ambar' : '')),
      lista, mas);
    cargar(1).catch(function (e) { if (v.viva()) C.reemplazar(lista, C.tarjetaError(e)); });
    return t;
  }

  // ── La sección ─────────────────────────────────────────────────────────────

  function pintar(ctx, v, d) {
    var serie = Array.isArray(d.serie) ? d.serie : [];
    var total = serie.reduce(function (a, s) { a.pedidos += C.num(s.pedidos); a.ventas += C.num(s.ventasUsd); a.ganancia += C.num(s.gananciaUsd); return a; }, { pedidos: 0, ventas: 0, ganancia: 0 });
    var formatos = {
      ventasUsd: function (x, eje) { return eje ? (x >= 1000 ? C.miles(x / 1000, 1) + 'k' : String(Math.round(x))) + ' $' : C.dolares(x); },
      gananciaUsd: function (x, eje) { return eje ? (x >= 1000 ? C.miles(x / 1000, 1) + 'k' : String(Math.round(x))) + ' $' : C.dolares(x); },
      pedidos: function (x) { return String(Math.round(x * 10) / 10).replace('.', ','); },
    };
    var cajaGrafica = h('div', { class: 'caja-grafica' });
    var dibujar = function () {
      var m = estado.metrica;
      C.reemplazar(cajaGrafica, serie.length ? C.graficas.barras(serie.map(function (s) {
        return { etiqueta: etiquetaDe(s.periodo, estado.agrupar), valor: C.num(s[m]), titulo: etiquetaDe(s.periodo, estado.agrupar) };
      }), { formato: formatos[m], rotulo: 'Ventas por periodo' }) : h('p', { class: 'nota relleno' }, 'Sin ventas en estas fechas.'));
    };
    var top = Array.isArray(d.top) ? d.top : [];
    var horas = Array.isArray(d.horas) ? d.horas : [];
    var horasCompletas = [];
    for (var i = 0; i < 24; i++) {
      var x = horas.filter(function (hh) { return Math.round(C.num(hh.hora)) === i; })[0];
      horasCompletas.push({ etiqueta: (i % 12 === 0 ? 12 : i % 12) + (i < 12 ? 'a' : 'p'), valor: x ? C.num(x.pedidos) : 0, titulo: horaTexto(i) });
    }
    var fuerte = horasCompletas.reduce(function (a, hh, k) { return hh.valor > a.v ? { v: hh.valor, k: k } : a; }, { v: 0, k: -1 });
    C.enContenido(v, [
      C.cabeceraDeSeccion('Estadísticas', ['Cómo le va a ', dato('span', null, ctx.tienda.nombre), '.']),
      h('div', { class: 'barra-filtros' },
        C.segmentos('Fechas', RANGOS, estado.rango, function (k) {
          estado.rango = k;
          estado.agrupar = k === '365' ? 'mes' : k === '90' ? 'semana' : 'dia';
          C.mostrar();
        }, 'envolver'),
        C.segmentos('Ver por', [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']], estado.agrupar, function (g) { estado.agrupar = g; C.mostrar(); })),
      h('div', { class: 'cifras cuatro' },
        C.cifra('Pedidos', String(Math.round(total.pedidos))),
        C.cifra('Vendido', C.dolares(total.ventas)),
        C.cifra('Tu ganancia', C.dolares(total.ganancia), 'verde'),
        C.cifra('Ticket promedio', C.dolares(d.ticketPromedioUsd))),
      h('div', { class: 'tarjeta' },
        h('div', { class: 'cab-tarjeta' }, h('h2', null, 'Ventas'),
          C.segmentos('Qué ver', [['ventasUsd', 'Vendido'], ['pedidos', 'Pedidos'], ['gananciaUsd', 'Ganancia']], estado.metrica, function (m) { estado.metrica = m; dibujar(); }, 'chico')),
        cajaGrafica),
      h('div', { class: 'rejilla dos' },
        h('div', { class: 'tarjeta' }, h('h2', null, 'Lo más vendido'),
          top.length ? C.graficas.horizontales(top.map(function (t) { return { etiqueta: t.nombre, valor: C.num(t.unidades), ventas: t.ventasUsd }; }),
            { formato: function (val, dd) { return [Math.round(val) + ' u.', ' · ', C.dolares(dd.ventas)].join(''); } }) : h('p', { class: 'nota' }, 'Aún no hay ventas en estas fechas.')),
        h('div', { class: 'tarjeta' }, h('h2', null, 'Horas fuertes'),
          fuerte.k >= 0 ? h('p', { class: 'nota' }, 'Tu hora con más pedidos: ', h('b', null, horaTexto(fuerte.k))) : h('p', { class: 'nota' }, 'Aún no hay pedidos en estas fechas.'),
          C.graficas.barras(horasCompletas, { alto: 170, cada: 3, formato: function (val) { return String(Math.round(val)); }, rotulo: 'Pedidos por hora' }))),
      h('div', { class: 'rejilla dos' }, tarjetaCalificaciones(d.calificaciones), tarjetaCancelaciones(d.cancelaciones)),
      tarjetaOpiniones(ctx, v, d.opiniones),
    ]);
    dibujar();
  }

  C.secciones.estadisticas = {
    id: 'estadisticas', titulo: 'Estadísticas', icono: 'estadisticas',
    visible: function (ctx) { return ctx.puede('estadisticas'); },
    mostrar: function (ctx, sub, v) {
      var r = rangoDe(estado.rango);
      C.pedir('GET', '/estadisticas?desde=' + r.desde + '&hasta=' + r.hasta + '&storeId=' + encodeURIComponent(ctx.tienda.storeId) + '&agrupar=' + estado.agrupar)
        .then(function (d) { pintar(ctx, v, d || {}); }, function (e) { C.falloEnVista(v, e); });
    },
  };
})(window);
