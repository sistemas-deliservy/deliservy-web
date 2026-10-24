/*
 * EL PANEL DEL COMERCIO — «Flota» (24-oct-2026).
 *
 * Para los comercios afiliados a la flota: lo que debe y cuándo vence (grande y claro), su plan, sus pedidos de flota
 * (servicio, de dónde a dónde, cobro, código para quien recibe y repartidor), el estado de cuenta con los cortes, las
 * facturas de cada pago y «Pagar» (a dónde pagar y el monto exacto en Bs; luego el teléfono del pago móvil o la cédula
 * de la transferencia, y se verifica igual que con Alisa).
 *
 * «Pedir motorizado», de dos formas que terminan en el mismo pedido:
 *  - Con botones: el tipo (envío, contra viaje y, si se los activaron, contra efectivo y exclusivo), A (la tienda) y B
 *    (buscar o tocar el mapa), quién recibe, nota y paquetes → Cotizar (precio, minutos y la ruta) → Pedir.
 *  - Con Alisa: la misma de WhatsApp, en burbujas; si su respuesta trae una cotización, una tarjeta con el mapa (A y B)
 *    y «Sí, pídelo» / «Cancelar», que le mandan «sí» o «cancelar».
 * A una tienda de la app que no está en flota: «Pide motorizados con Deliservy» (por WhatsApp).
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;
  var estadoFlota = { pestana: 'pedidos', modo: '30' };
  var TIPOS = {
    envio: ['Envío', 'De tu tienda a tu cliente.'],
    contra_viaje: ['Contra viaje', 'Lo busca donde digas y lo trae a tu tienda.'],
    contra_efectivo: ['Contra efectivo', 'Cobra a tu cliente al entregar.'],
    exclusivo: ['Exclusivo', 'Un motorizado solo para este viaje.'],
  };

  function q(ctx) { return 'storeId=' + encodeURIComponent(ctx.tienda.storeId); }
  function tonoServicio(s) {
    var t = C.sinTildes(s);
    return /exclusivo/.test(t) ? 'roja' : /efectivo/.test(t) ? 'ambar' : /viaje/.test(t) ? 'azul' : '';
  }
  function tonoEstado(s) {
    var t = C.sinTildes(s);
    return /cancel/.test(t) ? 'gris' : /entreg/.test(t) ? 'verde' : /camino|recog|busca|asign/.test(t) ? 'azul' : '';
  }
  function rangoDelModo(modo) {
    var hoy = C.diaCaracas();
    if (modo === '7') return { desde: C.sumarDias(hoy, -6), hasta: hoy };
    if (modo === 'mes') return { desde: C.primeroDelMes(hoy), hasta: hoy };
    return { desde: C.sumarDias(hoy, -29), hasta: hoy };
  }

  // ── Sin flota: la invitación ───────────────────────────────────────────────

  function invitacion(ctx, v) {
    var texto = 'Hola, soy de ' + ctx.tienda.nombre + ' y quiero pedir motorizados con Deliservy.';
    C.enContenido(v, [
      C.cabeceraDeSeccion('Flota', 'Motorizados de Deliservy para tus envíos.'),
      h('div', { class: 'tarjeta invitacion' },
        h('div', { class: 'icono-grande' }, ico('moto')),
        h('h2', null, 'Pide motorizados con Deliservy'),
        h('p', { class: 'nota' }, 'Envíos de tu tienda a tus clientes, aunque no hayan pedido por la app. Pagas solo lo que usas.'),
        h('ul', { class: 'lista-ventajas' },
          h('li', null, ico('check'), 'Marca el punto exacto en el mapa.'),
          h('li', null, ico('check'), 'Ve al motorizado en vivo.'),
          h('li', null, ico('check'), 'El código de entrega a la vista.')),
        h('div', { class: 'botones' }, h('a', { class: 'btn', href: 'https://wa.me/584144957006?text=' + encodeURIComponent(texto), target: '_blank', rel: 'noopener noreferrer' }, ico('whatsapp'), 'Quiero la flota'))),
    ]);
  }

  // ── La flota: lo que debe y lo demás ───────────────────────────────────────

  function tarjetaGrande(ctx, f) {
    var debe = C.num(f.debeUsd);
    var alDia = debe <= 0.004;
    var tasa = C.num(f.tasaBs);
    return h('div', { class: 'tarjeta deuda grande-deuda' + (f.pausado || f.bloqueado ? ' pausada' : alDia ? ' al-dia' : '') },
      h('div', { class: 'deuda-txt' },
        h('small', null, alDia ? 'Tu cuenta de flota' : 'Debes ahora'),
        alDia ? h('b', { class: 'grande' }, 'Estás al día') : h('b', { class: 'grande' }, C.dolares(debe)),
        !alDia && tasa ? h('span', { class: 'equivale' }, '≈ ', C.bolivares(debe * tasa)) : null,
        f.bloqueado ? h('p', null, 'Tu comercio está bloqueado en la flota. Escríbenos.')
          : f.pausado ? h('p', null, 'Tu servicio está pausado. Paga para seguir pidiendo.')
            : !alDia && f.venceEn ? h('p', null, 'Vence el ', C.diaYFecha(f.venceEn), ' a las ', C.hora(f.venceEn)) : null,
        C.num(f.comprometidoUsd) > 0 ? h('p', { class: 'en-camino' }, 'En camino: ', C.dolares(f.comprometidoUsd), ' (se suma al entregarse)') : null),
      h('div', { class: 'botones' },
        !alDia && ctx.esDueno ? h('a', { class: 'btn blanco', href: '#flota/pagar' }, ico('banco'), 'Pagar') : null,
        ctx.puede('flota_pedir') && !f.pausado && !f.bloqueado ? h('a', { class: 'btn borde-blanco', href: '#flota/pedir' }, ico('moto'), 'Pedir motorizado') : null));
  }

  function tarjetaPlan(f) {
    var plan = f.plan || {};
    var dia = f.diaPago || {};
    return h('div', { class: 'tarjeta' },
      h('h2', null, 'Tu plan'),
      plan.texto ? dato('p', { class: 'texto-plan' }, plan.texto) : null,
      plan.sinCargosHasta ? h('p', { class: 'bien' }, ico('check'), ' Sin cargos hasta el ', C.fechaCorta(plan.sinCargosHasta)) : null,
      dia.texto ? dato('p', { class: 'nota' }, dia.texto) : null,
      h('div', { class: 'chips' },
        C.pill('Envío', ''), C.pill('Contra viaje', 'azul'),
        f.contraEfectivo ? C.pill('Contra efectivo', 'ambar') : null,
        f.exclusivo ? C.pill('Exclusivo', 'roja') : null));
  }

  function filaPedidoFlota(p) {
    return h('a', { class: 'fila-flota', href: '#flota/pedido/' + Math.round(C.num(p.orderId)) },
      h('div', { class: 'fp-cab' }, h('b', { class: 'fp-num' }, '#' + Math.round(C.num(p.orderId))),
        h('span', { class: 'pill ' + tonoServicio(p.servicio) }, p.servicio || 'envío'), h('span', { class: 'pill ' + tonoEstado(p.estado) }, p.estado || ''),
        h('span', { class: 'fp-hora' }, C.fechaHora(p.creadoEn))),
      h('div', { class: 'a-b' },
        h('div', { class: 'punto' }, h('span', { class: 'letra a' }, 'A'), dato('span', null, p.desde || '')),
        h('div', { class: 'punto' }, h('span', { class: 'letra b' }, 'B'), dato('span', null, p.hasta || ''))),
      h('div', { class: 'fp-pie' },
        h('b', null, C.dolares(p.cobroUsd)),
        p.codigo ? h('span', { class: 'codigo-mini' }, 'Código ', dato('b', null, String(p.codigo))) : null,
        p.repartidor ? h('span', { class: 'cartel-linea' }, ico('moto'), dato('span', null, p.repartidor)) : null));
  }

  function pestanaPedidos(ctx, v, caja) {
    var r = rangoDelModo(estadoFlota.modo);
    var lista = h('div', { class: 'lista-pedidos' }, C.cargando());
    var datos = [];
    var exportar = C.boton('Exportar a Excel', { class: 'btn borde chico', onclick: function () {
      if (!datos.length) { C.avisar('No hay pedidos para exportar', 'mal'); return; }
      var filas = [['Pedido', 'Fecha', 'Hora', 'Servicio', 'Desde', 'Hasta', 'Estado', 'Cobro ($)', 'Código', 'Repartidor']];
      datos.forEach(function (p) { var f = C.fechaParaCsv(p.creadoEn); filas.push([Math.round(C.num(p.orderId)), f[0], f[1], p.servicio || '', p.desde || '', p.hasta || '', p.estado || '', C.num(p.cobroUsd), p.codigo || '', p.repartidor || '']); });
      C.descargarCsv('flota-pedidos-' + r.desde + '-a-' + r.hasta + '.csv', filas);
      C.avisar('Listo: revisa tus descargas');
    } }, 'descargar');
    C.reemplazar(caja, [
      h('div', { class: 'barra-filtros' },
        C.segmentos('Fechas', [['7', '7 días'], ['30', '30 días'], ['mes', 'Este mes']], estadoFlota.modo, function (m) { estadoFlota.modo = m; pestanaPedidos(ctx, v, caja); }),
        h('div', { class: 'filtros-dcha' }, exportar)),
      lista]);
    C.pedir('GET', '/flota/pedidos?desde=' + r.desde + '&hasta=' + r.hasta + '&estado=todos&pagina=1&' + q(ctx)).then(function (x) {
      if (!v.viva()) return;
      datos = Array.isArray(x) ? x : (x && Array.isArray(x.pedidos) ? x.pedidos : []);
      C.reemplazar(lista, datos.length ? datos.map(filaPedidoFlota) : C.vacio('Sin pedidos de flota en estas fechas', 'Pide uno con «Pedir motorizado».', null, 'moto'));
    }, function (e) { if (v.viva()) C.reemplazar(lista, C.tarjetaError(e)); });
  }

  function pestanaCuenta(ctx, v, caja) {
    var r = rangoDelModo(estadoFlota.modo);
    var movs = h('div', { class: 'lista' }, C.cargando());
    var cortes = h('div', null);
    var datos = [];
    var exportar = C.boton('Exportar a Excel', { class: 'btn borde chico', onclick: function () {
      if (!datos.length) { C.avisar('No hay movimientos para exportar', 'mal'); return; }
      var filas = [['Fecha', 'Hora', 'Movimiento', 'Monto ($)', 'Monto (Bs)']];
      datos.forEach(function (m) { var f = C.fechaParaCsv(m.fecha); filas.push([f[0], f[1], m.texto || m.descripcion || m.tipo || '', C.num(m.montoUsd), m.montoBs != null ? C.num(m.montoBs) : '']); });
      C.descargarCsv('flota-estado-de-cuenta-' + r.desde + '-a-' + r.hasta + '.csv', filas);
      C.avisar('Listo: revisa tus descargas');
    } }, 'descargar');
    C.reemplazar(caja, [
      h('div', { class: 'barra-filtros' },
        C.segmentos('Fechas', [['7', '7 días'], ['30', '30 días'], ['mes', 'Este mes']], estadoFlota.modo, function (m) { estadoFlota.modo = m; pestanaCuenta(ctx, v, caja); }),
        h('div', { class: 'filtros-dcha' }, exportar)),
      movs, h('span', { class: 'etq' }, 'Cortes'), cortes]);
    C.pedir('GET', '/flota/movimientos?desde=' + r.desde + '&hasta=' + r.hasta + '&' + q(ctx)).then(function (x) {
      if (!v.viva()) return;
      datos = Array.isArray(x) ? x : (x && Array.isArray(x.movimientos) ? x.movimientos : []);
      C.reemplazar(movs, datos.length ? datos.map(function (m) {
        var usd = C.num(m.montoUsd);
        var tipo = C.sinTildes(m.tipo || '');
        return h('div', { class: 'renglon' },
          h('div', { class: 'icono-mov ' + (usd >= 0 ? 'verde' : tipo === 'penalidad' ? 'roja' : '') }, ico(usd >= 0 ? 'check' : tipo === 'penalidad' ? 'alerta' : 'moto')),
          h('div', { class: 'txt' }, h('b', null, m.texto || m.descripcion || m.tipo || ''), h('small', null, C.fechaHora(m.fecha))),
          h('div', { class: 'monto' }, h('b', { class: usd >= 0 ? 'verde' : '' }, C.conSigno(usd)), m.montoBs != null ? h('small', null, C.conSigno(m.montoBs, C.bolivares)) : null));
      }) : h('p', { class: 'nota relleno' }, 'Sin movimientos en estas fechas.'));
    }, function (e) { if (v.viva()) C.reemplazar(movs, C.tarjetaError(e)); });
    C.pedir('GET', '/flota/cortes?' + q(ctx)).then(function (x) {
      if (!v.viva()) return;
      var lista = Array.isArray(x) ? x : (x && Array.isArray(x.cortes) ? x.cortes : []);
      C.reemplazar(cortes, lista.length ? h('div', { class: 'lista' }, lista.map(function (c) {
        var est = C.sinTildes(c.estado || '');
        return h('div', { class: 'renglon' },
          h('div', { class: 'txt' }, h('b', null, c.desde && c.hasta ? [C.diaCorto(String(c.desde).slice(0, 10)), ' – ', C.diaCorto(String(c.hasta).slice(0, 10))] : 'Corte'),
            h('small', null, c.pagadoEn ? ['Pagado el ', C.fechaCorta(c.pagadoEn)] : c.venceEn ? ['Vence el ', C.fechaCorta(c.venceEn)] : '')),
          h('div', { class: 'monto' }, h('b', null, C.dolares(c.totalUsd)), C.pill(est === 'pagado' ? 'Pagado' : est === 'vencido' ? 'Vencido' : 'Pendiente', est === 'pagado' ? 'verde' : est === 'vencido' ? 'roja' : 'ambar')));
      })) : h('p', { class: 'nota relleno' }, 'Aún no hay cortes.'));
    }, function () { C.reemplazar(cortes, h('p', { class: 'nota relleno' }, 'No se pudieron cargar los cortes.')); });
  }

  function principal(ctx, v, abrirPago) {
    C.pedir('GET', '/flota?' + q(ctx)).then(function (f) {
      f = f || {};
      C.flotaActual = f;
      var caja = h('div', { class: 'contenido-pestana' });
      var pestanas = [['pedidos', 'Pedidos'], ['cuenta', 'Estado de cuenta']];
      if (ctx.esDueno) pestanas.push(['facturas', 'Facturas']);
      var abrir = function (p) {
        estadoFlota.pestana = p;
        if (p === 'cuenta') pestanaCuenta(ctx, v, caja);
        else if (p === 'facturas') {
          C.reemplazar(caja, C.cargando());
          C.pedir('GET', '/flota/facturas?' + q(ctx)).then(function (x) { if (v.viva()) C.reemplazar(caja, C.tablaDeFacturas(Array.isArray(x) ? x : (x && x.facturas) || [])); },
            function (e) { if (v.viva()) C.reemplazar(caja, C.tarjetaError(e)); });
        } else pestanaPedidos(ctx, v, caja);
      };
      if (!pestanas.some(function (p) { return p[0] === estadoFlota.pestana; })) estadoFlota.pestana = 'pedidos';
      C.enContenido(v, [
        C.cabeceraDeSeccion('Flota', 'Tus motorizados de Deliservy.'),
        h('div', { class: 'rejilla dos flota-arriba' }, tarjetaGrande(ctx, f), tarjetaPlan(f)),
        C.segmentos('Flota', pestanas, estadoFlota.pestana, abrir, 'pestanas-segmento'),
        caja,
      ]);
      abrir(estadoFlota.pestana);
      if (abrirPago) pagar(ctx, f);
    }, function (e) { C.falloEnVista(v, e); });
  }

  // ── Pagar ──────────────────────────────────────────────────────────────────

  function filaCopiable(rotulo, valor) {
    if (!valor) return null;
    return h('div', { class: 'fila-copiable' }, h('small', null, rotulo), dato('b', null, valor),
      h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Copiar', onclick: function () { C.copiar(valor); } }, ico('copiar')));
  }

  function pagar(ctx, f) {
    if (!ctx.esDueno) return;
    var debe = C.num(f.debeUsd);
    var metodo = 'pago_movil';
    var todo = h('input', { type: 'radio', name: 'monto-flota', value: 'todo', checked: true });
    var otro = h('input', { type: 'radio', name: 'monto-flota', value: 'otro' });
    var monto = C.entrada({ id: 'monto-flota', inputmode: 'decimal', maxlength: '9', placeholder: '0,00', 'aria-label': 'Monto en dólares', disabled: true });
    todo.addEventListener('change', function () { monto.disabled = true; });
    otro.addEventListener('change', function () { monto.disabled = false; monto.focus(); });
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var seguir = C.boton('Continuar', { class: 'btn' });
    var d = C.abrirDialogo({
      titulo: 'Pagar la flota',
      cuerpo: [
        h('div', { class: 'monto-retiro' }, h('small', null, 'Debes ahora'), h('b', null, C.dolares(debe))),
        h('span', { class: 'etq-campo' }, '¿Cómo pagas?'),
        C.segmentos('Método', [['pago_movil', 'Pago móvil'], ['transferencia', 'Transferencia']], metodo, function (m) { metodo = m; }),
        h('span', { class: 'etq-campo' }, '¿Cuánto?'),
        h('div', { class: 'opciones-lista' },
          h('label', { class: 'opcion-radio' }, todo, h('span', null, 'Todo lo que debes (', C.dolares(debe), ')')),
          h('label', { class: 'opcion-radio' }, otro, h('span', null, 'Otro monto'), h('div', { class: 'con-sufijo' }, monto, h('span', null, '$')))),
        error,
      ],
      pie: seguir,
    });
    seguir.addEventListener('click', function () {
      var cuerpo = { metodo: metodo };
      if (otro.checked) {
        var n = C.leerNumero(monto.value);
        if (isNaN(n) || n <= 0) { error.textContent = 'Escribe un monto mayor que 0.'; error.hidden = false; return; }
        if (n > 2000) { error.textContent = 'El máximo por pago es 2.000 $.'; error.hidden = false; return; }
        cuerpo.montoUsd = C.redondo(n);
      }
      error.hidden = true;
      C.trabajando(seguir, C.pedir('POST', '/flota/pagar/cotizar?' + q(ctx), cuerpo)).then(function (r) {
        d.cerrar();
        pagarPaso2(ctx, r || {}, metodo);
      }, function (e) { error.textContent = e.message; error.hidden = false; });
    });
  }

  function pagarPaso2(ctx, r, metodo) {
    var a = r.aDonde || {};
    var movil = metodo === 'pago_movil';
    var campo = movil
      ? C.entrada({ id: 'pagador', type: 'tel', inputmode: 'tel', maxlength: '16', placeholder: '0412 555 0198', autocomplete: 'tel' })
      : C.entrada({ id: 'pagador', maxlength: '12', placeholder: 'V12345678', autocapitalize: 'characters' });
    var referencia = C.entrada({ id: 'referencia', inputmode: 'numeric', maxlength: '20', placeholder: 'Opcional' });
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var listo = C.boton('Ya pagué', { class: 'btn' }, 'check');
    var montoBs = C.bolivares(r.montoBs);
    var d = C.abrirDialogo({
      titulo: movil ? 'Paga por pago móvil' : 'Paga por transferencia',
      cuerpo: [
        h('div', { class: 'monto-retiro' }, h('small', null, 'Paga exactamente'), h('b', null, montoBs),
          h('span', null, C.dolares(r.montoUsd), ' · tasa ', C.miles(r.tasa), ' Bs/$')),
        h('div', { class: 'datos-pago' },
          filaCopiable('Monto', C.miles(r.montoBs)),
          filaCopiable('Banco', a.banco),
          movil ? filaCopiable('Teléfono', a.telefono) : filaCopiable('Cuenta', a.cuenta),
          filaCopiable('RIF', a.rif),
          a.titular ? h('div', { class: 'fila-copiable' }, h('small', null, 'Titular'), dato('b', null, a.titular)) : null),
        h('p', { class: 'nota' }, 'El monto en Bs vale por hoy. Al pagar, escribe:'),
        C.campo('pagador', movil ? 'Teléfono desde el que pagaste' : 'Cédula o RIF del titular', campo),
        movil ? null : C.campo('referencia', 'Referencia', referencia),
        error,
      ],
      pie: listo,
    });
    listo.addEventListener('click', function () {
      var cuerpo = { pagoId: r.pagoId };
      var val = String(campo.value || '').trim();
      if (movil) {
        if (!C.telefonoValido(val)) { error.textContent = 'Escribe el teléfono desde el que pagaste.'; error.hidden = false; return; }
        cuerpo.telefonoPagador = val.replace(/\D/g, '');
      } else {
        var ced = val.toUpperCase().replace(/[\s.\-]/g, '');
        if (!/^[VEJGP]?\d{6,9}$/.test(ced)) { error.textContent = 'Escribe la cédula o el RIF del titular.'; error.hidden = false; return; }
        cuerpo.cedulaPagador = ced;
        if (referencia.value.trim()) cuerpo.referencia = referencia.value.trim().replace(/\D/g, '');
      }
      error.hidden = true;
      C.trabajando(listo, C.pedir('POST', '/flota/pagar/confirmar?' + q(ctx), cuerpo)).then(function (x) {
        if (!x || x.ok === false) {
          error.textContent = (x && x.mensaje) || 'Aún no aparece. Intenta en un minuto.';
          error.hidden = false;
          error.classList.add('ambar');
          return;
        }
        d.cerrar();
        C.abrirDialogo({
          titulo: 'Pago recibido',
          cuerpo: h('div', { class: 'resultado-bien' }, ico('check'), x.mensaje ? h('p', null, x.mensaje) : null,
            x.debeUsd != null ? h('b', null, C.num(x.debeUsd) > 0 ? ['Debes ahora ', C.dolares(x.debeUsd)] : 'Estás al día') : null),
          pie: C.boton('Listo', { class: 'btn', onclick: function () { C.cerrarDialogos(); } }),
          alCerrar: function () { C.ir('#flota'); },
        });
      }, function (e) { error.classList.remove('ambar'); error.textContent = e.message; error.hidden = false; });
    });
  }

  // ── El detalle de un pedido de flota ───────────────────────────────────────

  function detalleFlota(ctx, v, id) {
    var mapaCaja = h('div', { class: 'mapa mapa-detalle' });
    var m = null, encuadrado = false;
    var pintar = function (p) {
      var enCurso = !/entreg|cancel/i.test(C.sinTildes(p.estado || ''));
      var rep = p.repartidor && typeof p.repartidor === 'object' ? p.repartidor : (p.repartidor ? { nombre: p.repartidor } : null);
      return [
        h('a', { class: 'volver', href: '#flota' }, ico('atras'), 'Flota'),
        h('div', { class: 'cab-pedido' }, h('h1', null, 'Pedido de flota #' + Math.round(C.num(p.orderId))),
          h('div', { class: 'chips' }, h('span', { class: 'pill ' + tonoServicio(p.servicio) }, p.servicio || ''), h('span', { class: 'pill ' + tonoEstado(p.estado) }, p.estado || '')),
          h('p', { class: 'sub' }, C.fechaHora(p.creadoEn))),
        h('div', { class: 'rejilla-detalle' },
          h('div', { class: 'col' }, h('div', { class: 'tarjeta sin-relleno' }, mapaCaja,
            h('div', { class: 'a-b relleno' },
              h('div', { class: 'punto' }, h('span', { class: 'letra a' }, 'A'), dato('span', null, (p.a && p.a.direccion) || p.desde || '')),
              h('div', { class: 'punto' }, h('span', { class: 'letra b' }, 'B'), dato('span', null, (p.b && p.b.direccion) || p.hasta || ''))))),
          h('div', { class: 'col' },
            p.codigo ? h('div', { class: 'tarjeta codigo-entrega' }, h('small', null, 'Código para quien recibe'), dato('b', null, String(p.codigo)),
              C.boton('Copiar', { class: 'btn chico suave', onclick: function () { C.copiar(String(p.codigo)); } }, 'copiar')) : null,
            h('div', { class: 'tarjeta' },
              h('dl', { class: 'datos-lista' },
                h('dt', null, 'Cobro'), h('dd', null, C.dolares(p.cobroUsd)),
                p.distanciaKm != null ? [h('dt', null, 'Distancia'), h('dd', null, String(C.redondo(p.distanciaKm)).replace('.', ',') + ' km')] : null,
                p.recibe && p.recibe.nombre ? [h('dt', null, 'Recibe'), dato('dd', null, p.recibe.nombre + (p.recibe.telefono ? ' · ' + C.telefonoParaVer(p.recibe.telefono) : ''))] : null,
                p.nota ? [h('dt', null, 'Nota'), dato('dd', null, p.nota)] : null,
                rep && rep.nombre ? [h('dt', null, 'Repartidor'), dato('dd', null, rep.nombre + (enCurso && rep.telefono ? ' · ' + C.telefonoParaVer(rep.telefono) : ''))] : null))),
        ),
      ];
    };
    var cargar = function (primera) {
      return C.pedir('GET', '/flota/pedidos/' + encodeURIComponent(id) + '?' + q(ctx)).then(function (p) {
        if (!v.viva()) return;
        p = p || {};
        if (primera) {
          C.enContenido(v, pintar(p));
          C.mapa.crear(mapaCaja, { centro: p.a, zoom: 13 }).then(function (mm) {
            if (!v.viva()) { mm.quitar(); return; }
            m = mm;
            v.alSalir(function () { mm.quitar(); });
            ponerEnMapa(p);
          }, function () { /* el recuadro ya lo dice */ });
        } else if (m) ponerEnMapa(p);
      }, function (e) {
        if (!primera) return;
        if (e.status === 404) C.enContenido(v, [h('a', { class: 'volver', href: '#flota' }, ico('atras'), 'Flota'), C.vacio('No encontramos ese pedido', 'Puede ser de otro comercio.', null, 'buscar')]);
        else C.falloEnVista(v, e);
      });
    };
    var ponerEnMapa = function (p) {
      if (p.a) m.marcador('a', 'a', p.a);
      if (p.b) m.marcador('b', 'b', p.b);
      var rep = p.repartidor && typeof p.repartidor === 'object' ? p.repartidor : null;
      if (rep && C.mapa.valido(rep)) m.marcador('moto', 'moto', rep);
      if (Array.isArray(p.ruta) && p.ruta.length >= 2) m.ruta(p.ruta, false);
      else if (p.a && p.b) m.ruta([[p.a.lng, p.a.lat], [p.b.lng, p.b.lat]], true);
      if (!encuadrado) { m.encuadrar([p.a, p.b, rep]); encuadrado = true; }
    };
    cargar(true);
    v.cada(10000, function () { cargar(false); });
  }

  // ── Pedir motorizado ───────────────────────────────────────────────────────

  function pedir(ctx, v, conAlisa) {
    C.pedir('GET', '/flota?' + q(ctx)).then(function (f) {
      f = f || {};
      if (!v.viva()) return;
      var caja = h('div', { class: 'pedir-caja' });
      C.enContenido(v, [
        h('a', { class: 'volver', href: '#flota' }, ico('atras'), 'Flota'),
        C.cabeceraDeSeccion('Pedir motorizado', 'Con botones o escribiéndole a Alisa.'),
        f.pausado || f.bloqueado ? h('div', { class: 'banda mal', role: 'alert' }, ico('alerta'), h('span', null, f.bloqueado ? 'Tu comercio está bloqueado en la flota. Escríbenos.' : 'Tu servicio está pausado. Paga para seguir pidiendo.'),
          ctx.esDueno && !f.bloqueado ? h('a', { class: 'btn chico', href: '#flota/pagar' }, 'Pagar') : null) : null,
        h('nav', { class: 'pestanas', 'aria-label': 'Cómo pedir' },
          h('a', { class: 'pestana', href: '#flota/pedir', 'aria-current': conAlisa ? null : 'page' }, ico('mapa'), h('span', null, 'Con botones')),
          h('a', { class: 'pestana', href: '#flota/pedir/alisa', 'aria-current': conAlisa ? 'page' : null }, ico('chat'), h('span', null, 'Con Alisa'))),
        caja,
      ]);
      if (conAlisa) conAlisaVista(ctx, v, caja, f);
      else conBotones(ctx, v, caja, f);
    }, function (e) { C.falloEnVista(v, e); });
  }

  /** La tienda (el punto A por defecto), si la API la dice. */
  function laTienda(ctx, f) {
    var t = f.tienda || f.ubicacion || f.a || null;
    if (t && C.mapa.valido(t)) return { lat: Number(t.lat), lng: Number(t.lng), direccion: t.direccion || ctx.tienda.nombre, esTienda: true };
    return { lat: null, lng: null, direccion: ctx.tienda.nombre, esTienda: true };
  }

  function conBotones(ctx, v, caja, f) {
    var tienda = laTienda(ctx, f);
    var e = { tipo: 'envio', a: tienda, b: null, editando: 'b', cot: null, paquetes: 1 };
    var mapaCaja = h('div', { class: 'mapa mapa-pedir' });
    var m = null;
    var tipos = Object.keys(TIPOS).filter(function (k) { return k === 'envio' || k === 'contra_viaje' || (k === 'contra_efectivo' && f.contraEfectivo) || (k === 'exclusivo' && f.exclusivo); });
    var cajaTipos = h('div', { class: 'tipos-servicio', role: 'radiogroup', 'aria-label': 'Tipo de servicio' });
    var pintarTipos = function () {
      C.reemplazar(cajaTipos, tipos.map(function (k) {
        return h('button', { type: 'button', role: 'radio', 'aria-checked': String(e.tipo === k), class: 'tipo' + (e.tipo === k ? ' activo' : ''), onclick: function () { elegirTipo(k); } },
          h('b', null, TIPOS[k][0]), h('small', null, TIPOS[k][1]));
      }));
    };
    var elegirTipo = function (k) {
      var antes = e.tipo;
      e.tipo = k;
      // Contra viaje: se busca donde diga el comercio y se trae a la tienda (B es la tienda).
      if ((k === 'contra_viaje') !== (antes === 'contra_viaje')) {
        var x = e.a; e.a = e.b; e.b = x;
        e.editando = e.a && e.a.esTienda ? 'b' : 'a';
      }
      efectivo.hidden = k !== 'contra_efectivo';
      quitarCotizacion();
      pintarTipos(); pintarPuntos(); ponerEnMapa();
    };
    var puntoA = h('div', { class: 'punto-campo' });
    var puntoB = h('div', { class: 'punto-campo' });
    var buscadorDir = C.mapa.buscador({
      id: 'buscar-dir', cerca: function () { return (m && m.centro()) || (C.mapa.valido(tienda) ? tienda : null); },
      alElegir: function (lugar) { ponerPunto(e.editando, lugar); },
    });
    var avisoToque = h('p', { class: 'ayuda' }, 'Busca la dirección o toca el punto exacto en el mapa.');
    var pintarPuntos = function () {
      var fila = function (letra, p, clave) {
        var editando = e.editando === clave;
        return [
          h('span', { class: 'letra ' + clave }, letra),
          h('div', { class: 'txt' }, h('small', null, clave === 'a' ? 'Recoge en' : 'Entrega en'),
            p ? (p.esTienda ? h('b', null, 'Tu tienda', p.direccion ? [' · ', dato('span', null, p.direccion)] : null) : dato('b', null, p.direccion || 'Punto en el mapa'))
              : h('b', { class: 'falta' }, editando ? 'Búscala o toca el mapa' : 'Falta')),
          h('button', { class: 'btn chico ' + (editando ? 'suave' : 'borde'), type: 'button', onclick: function () { e.editando = clave; pintarPuntos(); try { buscadorDir.input.focus(); } catch (_) { /* nada */ } } }, editando ? 'Eligiendo' : 'Cambiar'),
        ];
      };
      C.reemplazar(puntoA, fila('A', e.a, 'a'));
      C.reemplazar(puntoB, fila('B', e.b, 'b'));
      puntoA.classList.toggle('editando', e.editando === 'a');
      puntoB.classList.toggle('editando', e.editando === 'b');
    };
    var ponerPunto = function (clave, lugar) {
      e[clave] = { lat: lugar.lat, lng: lugar.lng, direccion: lugar.direccion || '' };
      if (!lugar.direccion) {
        C.mapa.donde(lugar.lat, lugar.lng).then(function (t) { if (e[clave] && e[clave].lat === lugar.lat) { e[clave].direccion = t || 'Punto en el mapa'; pintarPuntos(); } });
      }
      // Después de A, sigue B (si falta).
      if (clave === 'a' && !e.b) e.editando = 'b';
      else if (clave === 'b' && !e.a) e.editando = 'a';
      quitarCotizacion();
      pintarPuntos(); ponerEnMapa();
    };
    var ponerEnMapa = function () {
      if (!m) return;
      ['a', 'b'].forEach(function (k) {
        var p = e[k];
        if (p && C.mapa.valido(p)) m.marcador(k, k, p, { arrastrable: true, alSoltar: function (lat, lng) { ponerPunto(k, { lat: lat, lng: lng }); } });
        else m.quitarMarcador(k);
      });
      if (e.cot && Array.isArray(e.cot.ruta) && e.cot.ruta.length >= 2) m.ruta(e.cot.ruta, false);
      else if (e.a && e.b && C.mapa.valido(e.a) && C.mapa.valido(e.b)) m.ruta([[e.a.lng, e.a.lat], [e.b.lng, e.b.lat]], true);
      else m.ruta([], true);
      m.encuadrar([e.a, e.b]);
    };
    var nombre = C.entrada({ id: 'recibe-nombre', maxlength: '60', placeholder: 'Nombre', autocomplete: 'off' });
    var telefono = C.entrada({ id: 'recibe-telefono', type: 'tel', inputmode: 'tel', maxlength: '16', placeholder: '0412 555 0198', autocomplete: 'off' });
    var nota = h('textarea', { class: 'campo', id: 'nota-flota', rows: '2', maxlength: '300', placeholder: C.segunIdioma('Ej.: llamar al llegar, edificio azul', 'E.g.: call on arrival, blue building') });
    var cuenta = h('b', { class: 'cuenta-paquetes' }, '1');
    var menos = h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Menos paquetes' }, h('span', { 'aria-hidden': 'true' }, '−'));
    var masB = h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Más paquetes' }, ico('agregar'));
    menos.addEventListener('click', function () { e.paquetes = Math.max(1, e.paquetes - 1); cuenta.textContent = String(e.paquetes); quitarCotizacion(); });
    masB.addEventListener('click', function () { e.paquetes = Math.min(10, e.paquetes + 1); cuenta.textContent = String(e.paquetes); quitarCotizacion(); });
    var montoEfectivo = C.entrada({ id: 'monto-cobrar', inputmode: 'decimal', maxlength: '9', placeholder: '0,00' });
    var efectivo = h('div', { hidden: e.tipo !== 'contra_efectivo' }, C.campo('monto-cobrar', 'Monto que cobra al entregar', h('div', { class: 'con-sufijo' }, montoEfectivo, h('span', null, '$'))));
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var resultado = h('div', { class: 'resultado-cotizacion', hidden: true, 'aria-live': 'polite' });
    var cotizar = C.boton('Cotizar', { class: 'btn' }, 'moto');
    [nombre, telefono, montoEfectivo].forEach(function (x) { x.addEventListener('input', quitarCotizacion); });
    nota.addEventListener('input', quitarCotizacion);

    function quitarCotizacion() {
      if (!e.cot) return;
      e.cot = null;
      resultado.hidden = true;
      cotizar.hidden = false;
      ponerEnMapa();
    }
    cotizar.addEventListener('click', function () {
      var mal = '';
      if (!e.b || !C.mapa.valido(e.b) && !e.b.esTienda) mal = 'Marca a dónde va (el punto B).';
      else if (e.a && !e.a.esTienda && !C.mapa.valido(e.a)) mal = 'Marca dónde se recoge (el punto A).';
      else if (!e.a) mal = 'Marca dónde se recoge (el punto A).';
      C.errorEnCampo(nombre, nombre.value.trim().length < 2 ? 'Escribe el nombre de quien recibe.' : '');
      C.errorEnCampo(telefono, !C.telefonoValido(telefono.value) ? 'Escribe un teléfono, por ejemplo 0412-555-0198.' : '');
      if (!mal && nombre.value.trim().length < 2) mal = 'Escribe el nombre de quien recibe.';
      if (!mal && !C.telefonoValido(telefono.value)) mal = 'Escribe el teléfono de quien recibe.';
      var efectivoUsd = null;
      if (!mal && e.tipo === 'contra_efectivo') {
        efectivoUsd = C.leerNumero(montoEfectivo.value);
        if (isNaN(efectivoUsd) || efectivoUsd <= 0) mal = 'Escribe el monto que cobra al entregar.';
      }
      error.textContent = mal; error.hidden = !mal;
      if (mal) return;
      var punto = function (p) { return p && !p.esTienda && C.mapa.valido(p) ? { lat: Number(Number(p.lat).toFixed(6)), lng: Number(Number(p.lng).toFixed(6)), direccion: String(p.direccion || '').slice(0, 200) } : null; };
      var cuerpo = { tipo: e.tipo, recibe: { nombre: nombre.value.trim().slice(0, 60), telefono: telefono.value.replace(/\D/g, '') }, paquetes: e.paquetes };
      // La tienda viaja como «sin punto» (la API pone la suya); un punto del mapa, con sus coordenadas.
      if (punto(e.a)) cuerpo.a = punto(e.a);
      if (punto(e.b)) cuerpo.b = punto(e.b);
      else if (e.b && e.b.esTienda && C.mapa.valido(e.b)) cuerpo.b = { lat: Number(e.b.lat), lng: Number(e.b.lng), direccion: String(e.b.direccion || '').slice(0, 200) };
      if (nota.value.trim()) cuerpo.nota = nota.value.trim().slice(0, 300);
      if (efectivoUsd != null) cuerpo.efectivoUsd = C.redondo(efectivoUsd);
      C.trabajando(cotizar, C.pedir('POST', '/flota/cotizar?' + q(ctx), cuerpo)).then(function (r) {
        r = r || {};
        e.cot = r;
        if (r.a && C.mapa.valido(r.a) && (!e.a || e.a.esTienda)) { e.a = Object.assign({ esTienda: !!(e.a && e.a.esTienda) }, r.a); tienda = e.a.esTienda ? e.a : tienda; }
        if (r.b && C.mapa.valido(r.b) && e.b && e.b.esTienda) e.b = Object.assign({ esTienda: true }, r.b);
        pintarPuntos();
        ponerEnMapa();
        pintarResultado();
      }, function (er) { error.textContent = er.message; error.hidden = false; });
    });
    function pintarResultado() {
      var r = e.cot;
      var pedirBtn = C.boton('Pedir', { class: 'btn' }, 'check');
      var cambiar = C.boton('Cambiar', { class: 'btn borde' });
      cambiar.addEventListener('click', quitarCotizacion);
      pedirBtn.addEventListener('click', function () {
        C.trabajando(pedirBtn, C.pedir('POST', '/flota/pedir?' + q(ctx), { cotizacionId: r.cotizacionId })).then(function (x) {
          x = x || {};
          pedido(x);
        }, function (er) { C.avisar(er.message, 'mal'); });
      });
      var gratis = r.precioUsd == null || C.num(r.precioUsd) === 0;
      C.reemplazar(resultado, [
        h('div', { class: 'cot-cifras' },
          h('div', { class: 'cot-precio' }, h('small', null, 'Precio'), h('b', null, gratis ? 'Sin cargo' : C.dolares(r.precioUsd))),
          h('div', null, h('small', null, 'Llega en'), h('b', null, '~' + Math.round(C.num(r.minutos)) + ' min')),
          h('div', null, h('small', null, 'Distancia'), h('b', null, String(C.redondo(r.distanciaKm)).replace('.', ',') + ' km'))),
        r.sinCargosHasta ? h('p', { class: 'bien' }, 'Sin cargos hasta el ', C.fechaCorta(r.sinCargosHasta)) : null,
        r.venceEn ? h('p', { class: 'nota' }, 'Este precio vale hasta las ', C.hora(r.venceEn)) : null,
        h('div', { class: 'botones' }, cambiar, pedirBtn)]);
      resultado.hidden = false;
      cotizar.hidden = true;
      if (resultado.scrollIntoView) resultado.scrollIntoView({ block: 'nearest' });
    }
    function pedido(x) {
      var codigo = x.codigo ? String(x.codigo) : '';
      C.abrirDialogo({
        titulo: 'Motorizado pedido',
        cuerpo: h('div', { class: 'resultado-bien' }, ico('check'),
          h('b', null, 'Orden #' + Math.round(C.num(x.orderId))),
          codigo ? h('div', { class: 'codigo-entrega' }, h('small', null, 'Código para quien recibe'), dato('b', null, codigo),
            C.boton('Copiar', { class: 'btn chico suave', onclick: function () { C.copiar(codigo); } }, 'copiar')) : null,
          x.mensaje ? h('p', { class: 'nota' }, x.mensaje) : null),
        pie: [h('a', { class: 'btn borde', href: '#flota/pedido/' + Math.round(C.num(x.orderId)), onclick: function () { C.cerrarDialogos(); } }, 'Ver pedido'),
          C.boton('Pedir otro', { class: 'btn', onclick: function () { C.cerrarDialogos(); C.mostrar(); } })],
      });
    }

    C.reemplazar(caja, h('div', { class: 'rejilla-pedir' },
      h('div', { class: 'col-mapa' }, mapaCaja, avisoToque),
      h('div', { class: 'col-form' },
        h('div', { class: 'tarjeta' },
          h('h2', null, '¿Qué necesitas?'),
          cajaTipos),
        h('div', { class: 'tarjeta' },
          h('h2', null, '¿De dónde a dónde?'),
          h('div', { class: 'puntos' }, puntoA, puntoB,
            h('button', { class: 'enlace-mini', type: 'button', onclick: function () { var x = e.a; e.a = e.b; e.b = x; quitarCotizacion(); pintarPuntos(); ponerEnMapa(); } }, ico('recargar'), 'Intercambiar A y B')),
          buscadorDir.caja),
        h('div', { class: 'tarjeta' },
          h('h2', null, '¿Quién recibe?'),
          h('div', { class: 'dos-campos' }, C.campo('recibe-nombre', 'Nombre', nombre), C.campo('recibe-telefono', 'Teléfono', telefono)),
          C.campo('nota-flota', 'Nota para el motorizado', nota),
          h('div', { class: 'grupo-campo' }, h('span', { class: 'etq-campo' }, 'Paquetes'), h('div', { class: 'contador' }, menos, cuenta, masB)),
          efectivo),
        error, resultado,
        h('div', { class: 'botones' }, cotizar))));
    pintarTipos();
    pintarPuntos();
    C.mapa.crear(mapaCaja, { centro: C.mapa.valido(tienda) ? tienda : null, zoom: 14 }).then(function (mm) {
      if (!v.viva()) { mm.quitar(); return; }
      m = mm;
      v.alSalir(function () { mm.quitar(); });
      mm.alTocar(function (lat, lng) { ponerPunto(e.editando || 'b', { lat: lat, lng: lng }); });
      ponerEnMapa();
    }, function () { avisoToque.textContent = 'Busca la dirección: el mapa no cargó.'; });
  }

  // ── Con Alisa ──────────────────────────────────────────────────────────────

  function conAlisaVista(ctx, v, caja, f) {
    var chat = h('div', { class: 'chat', 'aria-live': 'polite' });
    var texto = h('textarea', { class: 'campo', id: 'mensaje-alisa', rows: '1', maxlength: '500', placeholder: C.segunIdioma('Escríbele a Alisa…', 'Write to Alisa…'), 'aria-label': 'Mensaje para Alisa' });
    var enviar = h('button', { class: 'btn redondo', type: 'button', 'aria-label': 'Enviar' }, ico('enviar'));
    var marcar = h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Mandar un punto del mapa', title: 'Mandar un punto del mapa' }, ico('ubicacion'));
    var mapas = [];
    v.alSalir(function () { mapas.forEach(function (mm) { mm.quitar(); }); });
    var ocupado = false;

    var bajar = function () { chat.scrollTop = chat.scrollHeight; };
    var burbuja = function (msg) {
      var mia = msg.de === 'comercio' || msg.de === 'tu' || msg.de === 'yo';
      var b = mia ? h('div', { class: 'alisa-msg de-ti' }, h('p', null, msg.texto || ''), msg.fecha ? h('small', null, C.hora(msg.fecha)) : null)
        : h('div', { class: 'alisa-msg de-alisa' }, dato('p', null, msg.texto || ''), msg.fecha ? h('small', null, C.hora(msg.fecha)) : null);
      chat.appendChild(b);
      if (!mia && msg.cotizacion && typeof msg.cotizacion === 'object') chat.appendChild(tarjetaCotizacion(msg.cotizacion, msg.pendiente !== false && msg.vigente));
      return b;
    };
    var tarjetaCotizacion = function (cot, conBotones) {
      var caja = h('div', { class: 'mapa mapa-chat' });
      var si = C.boton('Sí, pídelo', { class: 'btn chico' }, 'check');
      var no = C.boton('Cancelar', { class: 'btn borde chico' });
      si.addEventListener('click', function () { botones.remove(); mandar('sí'); });
      no.addEventListener('click', function () { botones.remove(); mandar('cancelar'); });
      var botones = h('div', { class: 'botones' }, no, si);
      var tarjeta = h('div', { class: 'tarjeta-cotizacion' }, caja,
        h('div', { class: 'cot-cifras' },
          h('div', { class: 'cot-precio' }, h('small', null, 'Precio'), h('b', null, cot.precioUsd == null ? 'Sin cargo' : C.dolares(cot.precioUsd))),
          cot.minutos != null ? h('div', null, h('small', null, 'Llega en'), h('b', null, '~' + Math.round(C.num(cot.minutos)) + ' min')) : null),
        h('div', { class: 'a-b' },
          h('div', { class: 'punto' }, h('span', { class: 'letra a' }, 'A'), dato('span', null, (cot.a && cot.a.direccion) || 'Tu tienda')),
          h('div', { class: 'punto' }, h('span', { class: 'letra b' }, 'B'), dato('span', null, (cot.b && cot.b.direccion) || ''))),
        conBotones ? botones : null);
      setTimeout(function () {
        C.mapa.crear(caja, { centro: cot.b || cot.a, zoom: 13 }).then(function (mm) {
          if (!v.viva()) { mm.quitar(); return; }
          mapas.push(mm);
          if (cot.a) mm.marcador('a', 'a', cot.a);
          if (cot.b) mm.marcador('b', 'b', cot.b);
          if (Array.isArray(cot.ruta) && cot.ruta.length >= 2) mm.ruta(cot.ruta, false);
          else if (cot.a && cot.b) mm.ruta([[cot.a.lng, cot.a.lat], [cot.b.lng, cot.b.lat]], true);
          mm.encuadrar([cot.a, cot.b], 36);
        }, function () { /* sin mapa: quedan A y B escritos */ });
      }, 20);
      return tarjeta;
    };
    var escribiendo = h('div', { class: 'alisa-msg de-alisa escribiendo', 'aria-label': 'Alisa está escribiendo' }, h('span'), h('span'), h('span'));
    function mandar(t, ubicacion) {
      var limpio = String(t || '').trim();
      if ((!limpio && !ubicacion) || ocupado) return;
      ocupado = true;
      enviar.disabled = true;
      var vacioInicial = chat.querySelector('.chat-vacio');
      if (vacioInicial) vacioInicial.remove();
      burbuja({ de: 'comercio', texto: limpio || '📍', fecha: new Date().toISOString() });
      chat.appendChild(escribiendo);
      bajar();
      var cuerpo = { texto: limpio };
      if (ubicacion) cuerpo.ubicacion = ubicacion;
      C.pedir('POST', '/flota/alisa?' + q(ctx), cuerpo, { espera: 45000 }).then(function (r) {
        r = r || {};
        escribiendo.remove();
        burbuja({ de: 'alisa', texto: r.respuesta || '…', fecha: new Date().toISOString(), cotizacion: r.cotizacion || null, vigente: true });
        if (r.orderId) chat.appendChild(h('a', { class: 'btn chico borde ver-orden', href: '#flota/pedido/' + Math.round(C.num(r.orderId)) }, 'Ver orden #' + Math.round(C.num(r.orderId))));
        bajar();
      }, function (e) {
        escribiendo.remove();
        chat.appendChild(h('p', { class: 'error chat-error', role: 'alert' }, e.message));
        bajar();
      }).then(function () { ocupado = false; enviar.disabled = false; try { texto.focus({ preventScroll: true }); } catch (_) { /* nada */ } });
    }
    var enviarTexto = function () { var t = texto.value; texto.value = ''; ajustar(); mandar(t); };
    var ajustar = function () {
      if (!texto.value) { texto.style.height = ''; return; }
      texto.style.height = 'auto';
      texto.style.height = Math.min(140, texto.scrollHeight + 2) + 'px';
    };
    texto.addEventListener('input', ajustar);
    texto.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); enviarTexto(); } });
    enviar.addEventListener('click', enviarTexto);
    marcar.addEventListener('click', function () { marcarPunto(ctx, f, function (p) { mandar('📍 ' + (p.direccion || 'Este punto'), { lat: p.lat, lng: p.lng }); }); });
    var sugerencias = h('div', { class: 'sugerencias' }, ['Un motorizado a Av. Bolívar Norte', 'saldo'].map(function (s) {
      return h('button', { type: 'button', class: 'chip', onclick: function () { if (s === 'saldo') mandar(s); else { texto.value = s; ajustar(); texto.focus(); } } }, s);
    }));
    C.reemplazar(caja, h('div', { class: 'tarjeta chat-caja' },
      h('div', { class: 'chat-cab' }, h('span', { class: 'avatar-alisa', 'aria-hidden': 'true' }, 'A'), h('div', null, h('b', null, 'Alisa'), h('small', null, 'La misma de WhatsApp. Te cotiza y te pide el motorizado.'))),
      chat,
      sugerencias,
      h('div', { class: 'chat-barra' }, marcar, texto, enviar)));
    chat.appendChild(C.cargando());
    C.pedir('GET', '/flota/alisa/historial?pagina=1&' + q(ctx)).then(function (x) {
      if (!v.viva()) return;
      C.vaciar(chat);
      var lista = Array.isArray(x) ? x : (x && Array.isArray(x.mensajes) ? x.mensajes : []);
      if (!lista.length) chat.appendChild(h('div', { class: 'chat-vacio' }, ico('chat'), h('p', null, 'Escríbele como por WhatsApp: «un motorizado a…».')));
      lista.forEach(function (msg) { burbuja(Object.assign({}, msg, { vigente: false })); });
      bajar();
    }, function () {
      C.vaciar(chat);
      chat.appendChild(h('div', { class: 'chat-vacio' }, ico('chat'), h('p', null, 'Escríbele como por WhatsApp: «un motorizado a…».')));
    });
  }

  /** Elegir un punto en el mapa (para mandárselo a Alisa). */
  function marcarPunto(ctx, f, alElegir) {
    var caja = h('div', { class: 'mapa mapa-marcar' });
    var elegido = null;
    var texto = h('p', { class: 'nota' }, 'Toca el punto exacto en el mapa o búscalo.');
    var usar = C.boton('Mandar este punto', { class: 'btn', disabled: true }, 'enviar');
    var mm = null;
    var poner = function (p) {
      elegido = p;
      usar.disabled = false;
      texto.textContent = p.direccion || 'Punto elegido';
      if (mm) { mm.marcador('b', 'b', p); mm.irA(p, 16); }
      if (!p.direccion) C.mapa.donde(p.lat, p.lng).then(function (t) { if (elegido === p) { p.direccion = t; texto.textContent = t || 'Punto elegido'; } });
    };
    var bus = C.mapa.buscador({ cerca: function () { return mm ? mm.centro() : null; }, alElegir: poner });
    var d = C.abrirDialogo({ titulo: 'Mandar un punto', ancho: true, cuerpo: [bus.caja, caja, texto], pie: usar, alCerrar: function () { if (mm) mm.quitar(); } });
    usar.addEventListener('click', function () { if (elegido) { d.cerrar(); alElegir(elegido); } });
    var t = laTienda(ctx, f);
    C.mapa.crear(caja, { centro: C.mapa.valido(t) ? t : null, zoom: 14 }).then(function (m) {
      mm = m;
      if (C.mapa.valido(t)) m.marcador('a', 'a', t);
      m.alTocar(function (lat, lng) { poner({ lat: lat, lng: lng, direccion: '' }); });
    }, function () { /* el recuadro lo dice */ });
  }

  C.secciones.flota = {
    id: 'flota', titulo: 'Flota', icono: 'flota',
    visible: function (ctx) { return ctx.tienda && ctx.tienda.flota ? ctx.puede('flota_ver') : ctx.esDueno; },
    mostrar: function (ctx, sub, v) {
      if (!ctx.tienda.flota) { invitacion(ctx, v); return; }
      if (sub[0] === 'pedir' && ctx.puede('flota_pedir')) pedir(ctx, v, sub[1] === 'alisa');
      else if (sub[0] === 'pedido' && /^\d+$/.test(sub[1] || '')) detalleFlota(ctx, v, sub[1]);
      else principal(ctx, v, sub[0] === 'pagar');
    },
  };
})(window);
