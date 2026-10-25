/*
 * EL PANEL DEL COMERCIO — «Mi plan»: el cobro de Deliservy por producto y las membresías (24-oct-2026, §7 del
 * contrato). Solo el dueño.
 *
 * Gilberth: «no cobra una comisión, sino un pago por producto». Por UNIDAD vendida: el 5 % del precio, mínimo 0,20 $
 * y máximo 0,99 $ (redondeado al céntimo, la mitad hacia arriba). Premium (14,99 $ al mes) paga la mitad (0,10 a
 * 0,50); Deluxe (25,99 $ al mes), nada. Con una promoción de 0 % viva, nada hasta que venza. Desde el 25-oct-2026
 * vale para las ventas del comercio afiliado (app, tienda web y promotores) según las dos casillas de Comisiones:
 * «Producto» (Básica entera, Premium la mitad, Deluxe nada) y «10%» (el porcentaje de la tienda). Las dos, se suman.
 * Sin ninguna, no se cobra nada. Un 0 % permanente apaga solo el porcentaje. La promo de 0 % apaga las dos.
 * La membresía se paga APARTE, nunca de las ventas: con las formas de pago de la plataforma, como la tienda web
 * (tarjeta de débito y de crédito, pago móvil verificado con el teléfono y transferencia con la cédula o el RIF).
 * Nada de efectivo. Los datos de la tarjeta no se guardan en ningún sitio.
 *
 * Rutas (el contrato no las fija; son las de la API simulada): `GET plan?storeId`, `POST plan/solicitar`,
 * `POST plan/pagar/cotizar` y `POST plan/pagar` (con el mismo cuerpo que `POST /pagar` de la tienda web).
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var documento = raiz.document;
  var h = C.h, dato = C.dato, ico = C.ico;
  var NOMBRES = { basica: 'Básica', premium: 'Premium', deluxe: 'Deluxe' };
  var METODOS = { pago_movil: 'Pago móvil', transferencia: 'Transferencia', debito: 'Tarjeta de débito', credito: 'Tarjeta de crédito' };
  var AJUSTES = { pct: 5, minimoUsd: 0.2, maximoUsd: 0.99, premiumUsd: 14.99, deluxeUsd: 25.99 };

  // ── La regla (la misma de la API: una sola cuenta) ─────────────────────────

  function ajustesDe(info) { return Object.assign({}, AJUSTES, info && info.ajustes); }
  function promoViva(info) { return !!(info && info.promo && Date.parse(info.promo.hasta) > Date.now()); }
  /** Lo que Deliservy cobra por UNA unidad de `precio` dólares, con el plan de `info` (en céntimos enteros). */
  function porUnidad(precio, info) {
    var a = ajustesDe(info);
    var plan = (info && info.plan) || 'basica';
    if (info && info.cobroPorProducto === false) return 0;
    if (promoViva(info) || plan === 'deluxe') return 0;
    var cents = Math.round(C.num(precio) * 100);
    var c = Math.floor((cents * C.num(a.pct) + 50) / 100);
    c = Math.min(Math.round(C.num(a.maximoUsd) * 100), Math.max(Math.round(C.num(a.minimoUsd) * 100), c));
    if (plan === 'premium') c = Math.min(50, Math.max(10, Math.floor((c + 1) / 2)));
    return c / 100;
  }
  /** «Deliservy: 0,23 $ por venta» (null si no hay plan o el precio es 0). Sin «Aplicar», no se cobra. */
  function textoDelPorcentaje(info) {
    if (!info || !info.cobroPorcentaje || promoViva(info) || sinComision(info)) return '';
    return 'el ' + C.porcentaje(info.comisionPct);
  }
  function textoPorVenta(precio, info, deLaApi) {
    if (!info || !(C.num(precio) > 0)) return null;
    var parte = textoDelPorcentaje(info);
    if (info.cobroPorProducto === false) return parte ? 'Deliservy: ' + parte : 'Sin cobro de Deliservy';
    var cobro = deLaApi != null ? C.num(deLaApi) : porUnidad(precio, info);
    return 'Deliservy: ' + C.dolares(cobro) + (parte ? ' + ' + parte : '') + ' por venta';
  }
  /** Ya no se enseña el 10 % de la app: o se cobra por producto, o no se cobra. */
  function textoApp() {
    return null;
  }
  /** La regla del plan en una frase. */
  function regla(plan, info) {
    var a = ajustesDe(info);
    if (plan === 'deluxe') return 'Nada por producto.';
    if (plan === 'premium') return 'La mitad: ' + C.porcentaje(C.num(a.pct) / 2) + ' de cada producto, mínimo ' + C.dolares(0.1) + ' y máximo ' + C.dolares(0.5) + '.';
    return C.porcentaje(a.pct) + ' de cada producto, mínimo ' + C.dolares(a.minimoUsd) + ' y máximo ' + C.dolares(a.maximoUsd) + '.';
  }

  // El plan de cada tienda, guardado un minuto (Productos y Vendedores externos lo usan para sus pastillas).
  var guardados = {};
  function planDe(ctx, forzar) {
    if (!ctx || !ctx.tienda) return Promise.resolve(null);
    var k = String(ctx.tienda.storeId);
    var g = guardados[k];
    if (g && !forzar && Date.now() - g.en < 60000) return g.promesa;
    var promesa = C.pedir('GET', '/plan?storeId=' + encodeURIComponent(ctx.tienda.storeId)).then(function (r) { return r && typeof r === 'object' ? r : null; }, function () { return null; });
    guardados[k] = { en: Date.now(), promesa: promesa };
    return promesa;
  }
  C.cobro = { porUnidad: porUnidad, textoPorVenta: textoPorVenta, textoApp: textoApp, regla: regla, planDe: planDe, NOMBRES: NOMBRES };

  // ── La sección ─────────────────────────────────────────────────────────────

  function tarjetaPlanActual(ctx, info, alPagar) {
    var m = info.membresia;
    var plan = info.plan || 'basica';
    var estado = !m ? null : m.estado;
    var pill = plan !== 'basica' && estado === 'activa' ? C.pill('Activa', 'verde')
      : estado === 'asignada' ? C.pill('Falta pagar', 'ambar')
        : estado === 'vencida' ? C.pill('Vencida', 'roja') : null;
    var puedePagar = m && estado !== 'quitada';
    var nombreMem = m ? NOMBRES[m.plan] || m.plan : '';
    return h('div', { class: 'tarjeta plan-actual plan-' + plan },
      h('small', null, 'Tu plan'),
      h('div', { class: 'plan-nombre' }, h('b', null, NOMBRES[plan] || plan), pill),
      plan !== 'basica' && m && m.activaHasta ? h('p', null, 'Hasta el ', C.diaMes(m.activaHasta)) : null,
      plan === 'basica' && m && estado === 'asignada' ? h('p', null, 'Deliservy te asignó ', dato('b', null, nombreMem), '. Empieza cuando lo pagues.') : null,
      plan === 'basica' && m && estado === 'vencida' ? h('p', null, 'Tu plan ', dato('b', null, nombreMem), ' venció. Vuelves a la Básica hasta que pagues.') : null,
      m && m.precioUsd ? h('p', { class: 'precio-plan' }, C.dolares(m.precioUsd), ' al mes') : h('p', { class: 'precio-plan' }, 'Gratis'),
      puedePagar ? h('div', { class: 'botones' }, C.boton('Pagar membresía', { class: 'btn', onclick: alPagar }, 'banco')) : null,
      puedePagar && estado === 'activa' ? h('p', { class: 'nota' }, 'Si pagas antes, se suma un mes al final.') : null,
      h('p', { class: 'nota' }, ico('info'), ' Se paga aparte: nunca de tus ventas.'),
      queHace(textoDelPlan(plan).hace, textoDelPlan(plan).noHace),
      plan === 'basica' && !m ? h('p', { class: 'nota' }, '¿Quieres pagar menos por producto? Pide Premium o Deluxe.') : null);
  }

  function sinComision(info) { return !!(info && C.num(info.comisionPct) === 0 && !info.promo && !promoViva(info)); }

  /** Lo que paga el comercio en este panel (la membresía) y lo que ese pago no cubre. */
  function textoDelPlan(plan) {
    if (plan === 'deluxe') return {
      hace: 'Mientras la pagues, Deliservy no te cobra por producto.',
      noHace: 'No sale de tus ventas: la pagas aquí y dura un mes. Si Deliservy también te marcó el porcentaje de la tienda, ese porcentaje sí se descuenta. No incluye el envío.',
    };
    if (plan === 'premium') return {
      hace: 'Mientras la pagues, el cobro por producto queda a la mitad: de 0,10 $ a 0,50 $ por unidad.',
      noHace: 'No lo deja en cero. No sale de tus ventas: la pagas aquí y dura un mes. Si Deliservy también te marcó el porcentaje, ese porcentaje se cobra entero. No incluye el envío.',
    };
    return {
      hace: 'Vendes con el cobro por producto entero: de 0,20 $ a 0,99 $ por cada unidad.',
      noHace: 'No baja ese cobro y no se paga. Si dejas de pagar Premium o Deluxe, vuelves a este plan.',
    };
  }
  /** Lo que se descuenta en la venta (no es la membresía). */
  function textoDelCobro(info) {
    var pct = !!(info && info.cobroPorcentaje) && !promoViva(info) && !sinComision(info);
    var producto = !(info && info.cobroPorProducto === false);
    if (!producto && !pct) return {
      hace: 'En tus ventas no se descuenta ni el cobro por producto ni el porcentaje.',
      noHace: 'No es un plan que pagues aquí. Si Deliservy marca Producto o el porcentaje, las ventas nuevas sí lo descuentan.',
    };
    if (!producto) return {
      hace: 'Deliservy descuenta el ' + C.porcentaje(info.comisionPct) + ' de lo vendido. Queda fijo al hacer el pedido y lo ves al retirar.',
      noHace: 'No es el cobro por unidad. No incluye el envío. No se paga desde aquí: sale de la venta.',
    };
    var hace = promoViva(info) ? 'Hasta que termine la promoción no se te descuenta nada.'
      : (info.plan === 'deluxe' ? 'Con Deluxe no se descuenta el cobro por producto.'
        : 'Deliservy descuenta un monto por cada unidad vendida. Queda fijo al hacer el pedido y lo ves al retirar.');
    if (pct) hace += ' También el ' + C.porcentaje(info.comisionPct) + ' de lo vendido.';
    return {
      hace: hace,
      noHace: 'No incluye el envío. No se paga desde aquí: sale de la venta. La membresía se paga aparte, en este panel.',
    };
  }
  function queHace(hace, noHace) {
    return [
      h('p', { class: 'hace' }, h('b', null, 'Qué hace'), hace),
      h('p', { class: 'no-hace' }, h('b', null, 'Qué no hace'), noHace),
    ];
  }

  function tarjetaCobro(info) {
    var plan = info.plan || 'basica';
    var promo = promoViva(info);
    if (info.cobroPorProducto === false) {
      var soloPct = textoDelPorcentaje(info);
      var c = textoDelCobro(info);
      return h('div', { class: 'tarjeta' },
        h('h2', null, 'Lo que te cobra Deliservy'),
        h('p', { class: 'regla' }, soloPct ? 'El ' + C.porcentaje(info.comisionPct) + ' de cada venta.' : 'Nada: el cobro por producto no está aplicado en tu tienda.'),
        queHace(c.hace, c.noHace),
        h('p', { class: 'nota' }, 'En todos tus pedidos.'));
    }
    var ejemplos = [4, 10, 25].map(function (precio) {
      return h('div', { class: 'ejemplo' }, h('span', null, 'Producto de ', C.dolares(precio)), h('b', null, C.dolares(porUnidad(precio, info))));
    });
    return h('div', { class: 'tarjeta' },
      h('h2', null, 'Lo que te cobra Deliservy'),
      promo ? h('p', { class: 'bien' }, ico('check'), ' Hasta el ', C.diaMes(info.promo.hasta), ' no te cobramos nada.') : null,
      h('p', { class: 'regla' }, promo ? 'Luego: ' : null, regla(plan, info)),
      queHace(textoDelCobro(info).hace, textoDelCobro(info).noHace),
      textoDelPorcentaje(info) ? h('p', { class: 'nota' }, 'También ', textoDelPorcentaje(info), ' de cada venta.') : null,
      h('p', { class: 'nota' }, 'En todos tus pedidos: app, tienda web y promotores externos.'),
      h('div', { class: 'ejemplos' }, h('span', { class: 'etq-mini' }, 'Por cada unidad vendida'), ejemplos));
  }

  function tarjetasPlanes(ctx, info, alPedir, alPagarPlan) {
    var a = ajustesDe(info);
    var actual = info.plan || 'basica';
    var pedido = info.solicitud && info.solicitud.plan;
    var datos = [
      ['basica', 'Gratis', regla('basica', info)],
      ['premium', C.dolares(a.premiumUsd) + ' al mes', regla('premium', info)],
      ['deluxe', C.dolares(a.deluxeUsd) + ' al mes', regla('deluxe', info)],
    ];
    return h('div', { class: 'planes' }, datos.map(function (d) {
      var es = d[0] === actual;
      var boton = null;
      if (es) boton = h('div', { class: 'botones' }, C.pill('Tu plan', 'verde'));
      else if (d[0] !== 'basica') {
        boton = h('div', { class: 'botones' },
          pedido === d[0] ? C.boton('Ya lo pediste', { class: 'btn chico borde', disabled: true })
            : C.boton(d[0] === 'premium' ? 'Quiero Premium' : 'Quiero Deluxe', { class: 'btn chico borde', onclick: function (ev) { alPedir(d[0], ev.currentTarget); } }),
          C.boton(d[0] === 'premium' ? 'Pagar Premium' : 'Pagar Deluxe', { class: 'btn chico' + (d[0] === 'premium' ? ' suave' : ''), onclick: function () { alPagarPlan(d[0]); } }));
      }
      return h('div', { class: 'tarjeta plan plan-' + d[0] + (es ? ' es-el-tuyo' : '') },
        h('div', { class: 'plan-cab' }, h('b', null, NOMBRES[d[0]]), h('span', { class: 'precio' }, d[1])),
        h('p', { class: 'nota' }, d[2]),
        queHace(textoDelPlan(d[0]).hace, textoDelPlan(d[0]).noHace),
        d[0] === 'basica' && !es ? h('p', { class: 'nota' }, 'Vuelves a ella si no pagas tu plan.') : null,
        boton);
    }));
  }

  function listaDePagos(info) {
    var pagos = Array.isArray(info.pagos) ? info.pagos : [];
    if (!pagos.length) return C.vacio('Aún no has pagado membresías', 'Cuando pagues, lo verás aquí.', null, 'banco');
    return h('div', { class: 'lista' }, pagos.map(function (p) {
      var est = C.sinTildes(p.estado || '');
      return h('div', { class: 'renglon' },
        h('div', { class: 'icono-mov ' + (est === 'aprobado' ? 'verde' : est === 'rechazado' ? 'roja' : 'ambar') }, ico(est === 'aprobado' ? 'check' : 'reloj')),
        h('div', { class: 'txt' },
          h('b', null, p.periodoDesde && p.periodoHasta ? [C.diaMes(p.periodoDesde), ' – ', C.diaMes(p.periodoHasta)] : C.fechaCorta(p.fecha)),
          h('small', null, METODOS[p.metodo] || dato('span', null, p.metodo || ''), p.referencia ? [' · ref. ', dato('span', null, String(p.referencia))] : null, ' · ', C.fechaCorta(p.fecha))),
        h('div', { class: 'monto' }, h('b', null, C.dolares(p.montoUsd)), p.montoBs != null ? h('small', null, C.bolivares(p.montoBs)) : null,
          C.pill(est === 'aprobado' ? 'Aprobado' : est === 'rechazado' ? 'Rechazado' : 'En revisión', est === 'aprobado' ? 'verde' : est === 'rechazado' ? 'roja' : 'ambar')));
    }));
  }

  function pintar(ctx, v, info) {
    var recargar = function () { planDe(ctx, true); C.mostrar(); };
    var pedir = function (plan, boton) {
      var q = textoDelPlan(plan);
      C.confirmar({ titulo: plan === 'premium' ? '¿Quieres Premium?' : '¿Quieres Deluxe?', texto: 'Qué hace: ' + q.hace + ' Qué no hace: ' + q.noHace + ' Le avisamos a Deliservy para que te lo asigne. Después lo pagas aquí.', si: 'Sí, avísales' }).then(function (si) {
        if (!si) return;
        C.trabajando(boton, C.pedir('POST', '/plan/solicitar', { companyId: ctx.tienda.companyId, plan: plan })).then(function (r) {
          C.avisar((r && r.mensaje) || 'Listo: le avisamos a Deliservy');
          recargar();
        }, function (e) { C.avisar(e.message, 'mal'); });
      });
    };
    var pedido = info.solicitud && info.solicitud.plan;
    C.enContenido(v, [
      C.cabeceraDeSeccion('Mi plan', ['Lo que te cobra Deliservy en ', dato('span', null, ctx.tienda.nombre), '.']),
      pedido ? h('div', { class: 'banda info', role: 'status' }, ico('info'), h('span', null, 'Pediste ', dato('b', null, NOMBRES[pedido] || pedido), ' el ', C.diaMes(info.solicitud.fecha).replace(/\.$/, ''), '. Te escribimos pronto.')) : null,
      h('div', { class: 'rejilla dos' }, tarjetaPlanActual(ctx, info, function () { pagarMembresia(ctx, recargar); }), tarjetaCobro(info)),
      h('span', { class: 'etq' }, 'Los planes'),
      tarjetasPlanes(ctx, info, pedir, function (plan) { pagarMembresia(ctx, recargar, plan); }),
      h('span', { class: 'etq' }, 'Tus pagos de membresía'),
      listaDePagos(info),
    ]);
  }

  // ── Pagar la membresía (como la tienda web) ────────────────────────────────

  function pagarMembresia(ctx, alTerminar, plan) {
    var cuerpo = { companyId: ctx.tienda.companyId };
    if (plan) cuerpo.plan = plan;
    C.pedir('POST', '/plan/pagar/cotizar', cuerpo).then(function (c) {
      c = c || {};
      c.idem = String(c.pagoId) + '-' + Math.random().toString(36).slice(2, 10);
      var metodos = [['debito', 'Tarjeta de débito', 'billetera'], ['credito', 'Tarjeta de crédito', 'billetera'], ['pago_movil', 'Pago móvil', 'telefono'], ['transferencia', 'Transferencia', 'banco']];
      var d = C.abrirDialogo({
        titulo: 'Pagar membresía',
        cuerpo: [
          h('div', { class: 'monto-retiro' }, h('small', null, 'Plan ', dato('span', null, NOMBRES[c.plan] || c.plan || '')), h('b', null, C.dolares(c.montoUsd)), h('span', null, C.bolivares(c.montoBs))),
          c.periodo ? h('p', { class: 'nota centro' }, 'Del ', C.diaMes(c.periodo.desde), ' al ', C.diaMes(c.periodo.hasta)) : null,
          queHace(textoDelPlan(c.plan || 'basica').hace, textoDelPlan(c.plan || 'basica').noHace),
          h('p', { class: 'nota' }, 'Al pagarlo empieza a correr por un mes. Si no lo renuevas, vuelves a la Básica. Deliservy te factura este pago con los datos de tu tienda.'),
          h('span', { class: 'etq-campo' }, '¿Cómo vas a pagar?'),
          h('div', { class: 'metodos' }, metodos.map(function (m) {
            return h('button', { type: 'button', class: 'metodo', onclick: function () { d.cerrar(); if (m[0] === 'debito' || m[0] === 'credito') conTarjeta(ctx, c, m[0], alTerminar); else conBanco(ctx, c, m[0], alTerminar); } },
              h('span', { class: 'ic' }, ico(m[2])), h('span', { class: 'n' }, m[1]), ico('adelante'));
          })),
          h('p', { class: 'nota centro' }, ico('candado'), ' El pago lo procesa el Banco Nacional de Crédito (BNC).'),
        ],
      });
    }, function (e) { C.avisar(e.message, 'mal'); });
  }

  function filaCopiable(rotulo, valor, copia) {
    if (!valor) return null;
    return h('div', { class: 'fila-copiable' }, h('small', null, rotulo), dato('b', null, valor),
      copia ? h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Copiar', onclick: function () { C.copiar(copia); } }, ico('copiar')) : null);
  }

  /** Pago móvil (se verifica con el teléfono) o transferencia (con la cédula o el RIF). */
  function conBanco(ctx, c, metodo, alTerminar) {
    var movil = metodo === 'pago_movil';
    var p = c.pago || {};
    var tel = C.entrada({ id: 'tel-pago', type: 'tel', inputmode: 'tel', maxlength: '16', placeholder: '0412 555 0198', autocomplete: 'tel' });
    var letra = h('select', { class: 'campo', id: 'ced-letra', 'aria-label': 'Tipo de documento' }, ['V', 'E', 'J', 'G'].map(function (x) { return h('option', { value: x }, x); }));
    var numero = C.entrada({ id: 'ced-pago', inputmode: 'numeric', maxlength: '9', placeholder: '12345678', 'aria-label': 'Número de cédula o RIF' });
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var listo = C.boton('Ya pagué', { class: 'btn' }, 'check');
    var d = C.abrirDialogo({
      titulo: movil ? 'Paga por pago móvil' : 'Paga por transferencia',
      cuerpo: [
        h('div', { class: 'monto-retiro' }, h('small', null, 'Paga exactamente'), h('b', null, C.bolivares(c.montoBs)), h('span', null, C.dolares(c.montoUsd), ' · tasa ', C.miles(c.tasa), ' Bs/$')),
        h('div', { class: 'datos-pago' },
          filaCopiable('Monto', C.miles(c.montoBs), C.miles(c.montoBs).replace(/\./g, '')),
          filaCopiable('Banco', (p.banco || 'Banco Nacional de Crédito') + (p.codigoBanco ? ' · ' + p.codigoBanco : ''), p.codigoBanco || null),
          movil ? filaCopiable('Teléfono', C.telefonoParaVer(p.telefono), String(p.telefono || '').replace(/\D/g, '')) : filaCopiable('Cuenta', p.cuenta, String(p.cuenta || '').replace(/\D/g, '')),
          !movil ? filaCopiable('Titular', p.titular, null) : null,
          filaCopiable('RIF', p.rif, String(p.rif || '').replace(/[^\dA-Za-z]/g, ''))),
        h('p', { class: 'nota' }, movil ? 'Haz el pago móvil por el monto exacto y escribe desde qué teléfono pagaste: lo buscamos en el banco.' : 'Haz la transferencia por el monto exacto y escribe la cédula o el RIF del titular: la buscamos en el banco.'),
        movil ? C.campo('tel-pago', 'Teléfono desde el que pagaste', tel)
          : h('div', { class: 'grupo-campo' }, h('label', { class: 'etq-campo', for: 'ced-pago' }, 'Cédula o RIF del titular'), h('div', { class: 'fila-campos' }, h('div', { class: 'con-flecha' }, letra, ico('abajo')), numero)),
        error,
      ],
      pie: listo,
    });
    listo.addEventListener('click', function () {
      var cuerpo = { companyId: ctx.tienda.companyId, pagoId: c.pagoId, metodo: metodo, idem: c.idem };
      if (movil) {
        if (!C.telefonoValido(tel.value)) { error.textContent = 'Escribe el teléfono desde el que pagaste.'; error.hidden = false; return; }
        cuerpo.telefonoPago = tel.value.replace(/\D/g, '');
      } else {
        var n = numero.value.replace(/\D/g, '');
        if (n.length < 6 || n.length > 9) { error.textContent = 'La cédula va con su letra y de 6 a 9 cifras.'; error.hidden = false; return; }
        cuerpo.cedulaTipo = letra.value;
        cuerpo.cedulaNumero = n;
      }
      error.hidden = true;
      error.classList.remove('ambar');
      procesar(cuerpo, false, listo).then(function (r) {
        if (r && r.ok === false) { error.textContent = r.mensaje || 'Aún no aparece. Intenta en un minuto.'; error.classList.add('ambar'); error.hidden = false; return; }
        d.cerrar();
        exito(r, alTerminar);
      }, function (e) { error.textContent = e.message; error.hidden = false; });
    });
  }

  var tarjetaBloqueada = false;
  /** La tarjeta de débito o de crédito, con los campos de la tienda web (y de la app). Nada se guarda. */
  function conTarjeta(ctx, c, tipo, alTerminar) {
    var debito = tipo === 'debito';
    if (tarjetaBloqueada) {
      C.abrirDialogo({
        titulo: 'Pago con tarjeta',
        cuerpo: [h('p', { class: 'error' }, 'No pudimos confirmar tu pago con tarjeta. Revisa los movimientos de tu tarjeta antes de intentar de nuevo: si el cobro aparece, escríbenos y lo resolvemos.')],
        pie: h('a', { class: 'btn', href: C.WHATSAPP, target: '_blank', rel: 'noopener noreferrer' }, ico('whatsapp'), 'Escribir por WhatsApp'),
      });
      return;
    }
    var marca = h('span');
    var numTxt = h('div', { class: 'num' }, '•••• •••• •••• ••••');
    var nomTxt = h('b', null, 'NOMBRE DEL TITULAR');
    var venTxt = h('b', null, 'MM/AA');
    var vista = h('div', { class: 'tarjeta-viva', 'aria-hidden': 'true' },
      h('div', { class: 'sup' }, h('span', null, debito ? 'Débito' : 'Crédito'), marca),
      h('div', { class: 'chip-oro' }), numTxt,
      h('div', { class: 'inf' }, h('div', null, h('small', null, 'TITULAR'), nomTxt), h('div', { class: 'vence' }, h('small', null, 'VENCE'), venTxt)));
    var titular = C.entrada({ id: 't-titular', autocomplete: 'cc-name', maxlength: '40', placeholder: 'Como aparece en la tarjeta', autocapitalize: 'characters' });
    var numero = C.entrada({ id: 't-numero', inputmode: 'numeric', autocomplete: 'cc-number', maxlength: '19', placeholder: '0000 0000 0000 0000' });
    var vence = C.entrada({ id: 't-vence', inputmode: 'numeric', autocomplete: 'cc-exp', maxlength: '5', placeholder: 'MM/AA' });
    var cvv = C.entrada({ id: 't-cvv', type: 'password', inputmode: 'numeric', autocomplete: 'cc-csc', maxlength: '4', placeholder: '•••' });
    var cedula = debito ? C.entrada({ id: 't-cedula', inputmode: 'numeric', maxlength: '9', placeholder: '12345678' }) : null;
    var pin = debito ? C.entrada({ id: 't-pin', type: 'password', inputmode: 'numeric', maxlength: '4', placeholder: '••••', autocomplete: 'off' }) : null;
    var cuenta = 20;
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var pagar = C.boton('Pagar ' + C.dolares(c.montoUsd), { class: 'btn' }, 'candado');
    var soloDigitos = function (i, max) { return i.value.replace(/\D/g, '').slice(0, max); };
    numero.addEventListener('input', function () {
      var dd = soloDigitos(numero, 16);
      numero.value = dd.replace(/(\d{4})(?=\d)/g, '$1 ');
      numTxt.textContent = (dd + '••••••••••••••••').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
      marca.textContent = dd.charAt(0) === '4' ? 'Visa' : (dd.charAt(0) === '5' || dd.charAt(0) === '2') ? 'Mastercard' : dd.charAt(0) === '6' ? 'Maestro' : '';
    });
    titular.addEventListener('input', function () { nomTxt.textContent = titular.value.trim().toUpperCase() || 'NOMBRE DEL TITULAR'; });
    vence.addEventListener('input', function (ev) {
      var dd = soloDigitos(vence, 4);
      if (dd.length === 1 && dd > '1') dd = '0' + dd;
      vence.value = dd.length > 2 ? dd.slice(0, 2) + '/' + dd.slice(2) : (dd.length === 2 && ev.inputType !== 'deleteContentBackward' ? dd + '/' : dd);
      venTxt.textContent = vence.value || 'MM/AA';
    });
    cvv.addEventListener('input', function () { cvv.value = soloDigitos(cvv, 4); });
    if (cedula) cedula.addEventListener('input', function () { cedula.value = soloDigitos(cedula, 9); });
    if (pin) pin.addEventListener('input', function () { pin.value = soloDigitos(pin, 4); });
    var d = C.abrirDialogo({
      titulo: debito ? 'Pagar con tarjeta de débito' : 'Pagar con tarjeta de crédito',
      cuerpo: [
        vista,
        C.campo('t-titular', 'Nombre del titular', titular),
        C.campo('t-numero', 'Número de tarjeta', numero),
        h('div', { class: 'dos-campos fijo' }, C.campo('t-vence', 'Vence', vence), C.campo('t-cvv', 'CVV', cvv)),
        debito ? h('div', { class: 'dos-campos fijo' }, C.campo('t-cedula', 'Cédula del titular', cedula), C.campo('t-pin', 'PIN (4 dígitos)', pin)) : null,
        debito ? h('div', { class: 'grupo-campo' }, h('span', { class: 'etq-campo' }, 'Tipo de cuenta'), C.segmentos('Tipo de cuenta', [['20', 'Corriente'], ['10', 'Ahorro']], '20', function (x) { cuenta = Number(x); })) : null,
        error,
        h('p', { class: 'nota centro' }, C.bolivares(c.montoBs)),
        h('p', { class: 'nota centro' }, ico('candado'), ' Se cobra en el BNC. No guardamos tu tarjeta.'),
      ],
      pie: pagar,
    });
    pagar.addEventListener('click', function () {
      var mal = '';
      var n = numero.value.replace(/\D/g, '');
      var v = /^(\d{2})\/(\d{2})$/.exec(vence.value.trim());
      var hoy = new Date(Date.now() + C.CARACAS_MS);
      if (!titular.value.trim() || !n || !vence.value.trim() || !cvv.value || (debito && (!cedula.value || !pin.value))) mal = 'Completa todos los datos de la tarjeta.';
      else if (!/^\d{15,16}$/.test(n) || !luhn(n) || !/^[2456]/.test(n)) mal = 'Revisa el número de la tarjeta.';
      else if (!v || +v[1] < 1 || +v[1] > 12) mal = 'El vencimiento va como MM/AA.';
      else if (2000 + (+v[2]) < hoy.getUTCFullYear() || (2000 + (+v[2]) === hoy.getUTCFullYear() && +v[1] < hoy.getUTCMonth() + 1)) mal = 'Esa tarjeta está vencida. Usa una vigente.';
      else if (!/^\d{3,4}$/.test(cvv.value)) mal = 'Revisa el código de seguridad.';
      else if (debito && !/^\d{4}$/.test(pin.value)) mal = 'El PIN son 4 dígitos.';
      else if (debito && !/^\d{6,9}$/.test(cedula.value)) mal = 'Falta la cédula del titular.';
      error.textContent = mal; error.hidden = !mal;
      if (mal) return;
      var t = { titular: titular.value.replace(/\s+/g, ' ').trim(), numero: n, vence: vence.value.trim(), cvv: cvv.value };
      if (debito) { t.cedula = cedula.value; t.clave = pin.value; t.tipoDeCuenta = cuenta; }
      procesar({ companyId: ctx.tienda.companyId, pagoId: c.pagoId, metodo: tipo, tarjeta: t, idem: c.idem }, true, pagar).then(function (r) {
        d.cerrar();
        exito(r, alTerminar);
      }, function (e) {
        if (e.status === 0) { tarjetaBloqueada = true; error.textContent = 'Se cortó la conexión. NO vuelvas a pagar: escríbenos por WhatsApp y te decimos si entró.'; }
        else { if (e.status === 502) tarjetaBloqueada = true; error.textContent = e.message; }
        error.hidden = false;
      });
    });
  }
  function luhn(n) {
    var s = 0, doble = false;
    for (var i = n.length - 1; i >= 0; i--) {
      var x = +n.charAt(i);
      if (doble) { x *= 2; if (x > 9) x -= 9; }
      s += x;
      doble = !doble;
    }
    return s % 10 === 0;
  }

  /** Cobrar: un velo con «Procesando tu pago…» mientras el banco contesta. */
  function procesar(cuerpo, conTarjeta_, boton) {
    var velo = h('div', { class: 'procesando', role: 'alert', 'aria-busy': 'true' }, h('div', { class: 'caja' }, h('span', { class: 'rueda' }),
      h('b', null, conTarjeta_ ? 'Procesando tu pago…' : 'Buscando tu pago en el banco…'), h('small', null, 'No cierres esta página.')));
    documento.body.appendChild(velo);
    var fin = function () { velo.remove(); };
    return C.trabajando(boton, C.pedir('POST', '/plan/pagar', cuerpo, { espera: 120000 })).then(function (r) { fin(); return r; }, function (e) { fin(); throw e; });
  }
  function exito(r, alTerminar) {
    C.abrirDialogo({
      titulo: 'Pago recibido',
      cuerpo: h('div', { class: 'resultado-bien' }, ico('check'), h('b', null, (r && r.membresia && NOMBRES[r.membresia.plan]) || 'Membresía'), r && r.mensaje ? h('p', null, r.mensaje) : null),
      pie: C.boton('Listo', { class: 'btn', onclick: function () { C.cerrarDialogos(); } }),
      alCerrar: alTerminar,
    });
  }

  C.secciones.plan = {
    id: 'plan', titulo: 'Mi plan', icono: 'estrella',
    visible: function (ctx) { return ctx.esDueno; },
    mostrar: function (ctx, sub, v) {
      planDe(ctx, true).then(function (info) {
        if (!v.viva()) return;
        if (!info) { C.falloEnVista(v, new Error('No se pudo cargar tu plan. Intenta de nuevo.')); return; }
        pintar(ctx, v, info);
      });
    },
  };
})(window);
