/*
 * EL PANEL DEL COMERCIO — «Vendedores externos» (24-oct-2026).
 *
 * Gente que vende los productos del comercio en sus redes con su enlace o su cupón. El comercio decide cuánto les
 * paga: un % para toda la tienda (cada producto nuevo nace con él; «Aplicar a todos» lo pone ya en todos) y el % de
 * cada producto, con su precio especial de redes (mayor que 0 y no mayor que el de la app). Tope: 50 %. Si Deliservy
 * pausó un producto en el programa, se ve y no se puede cambiar. Las ventas salen sin datos para contactar al
 * vendedor («Vendedor #N»). ⚠️ El comercio nunca ve el nombre del programa por dentro: aquí es «Vendedores externos».
 * Solo el dueño y solo tiendas que se ven en la app.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;

  function leerPct(input) {
    var n = C.leerNumero(String(input.value || '').replace('%', ''));
    return n;
  }

  function filaProducto(ctx, p, tope, plan) {
    var precioApp = C.num(p.precioApp);
    var pausado = !!p.pausadoPorAdmin;
    var pct = C.entrada({ value: String(C.num(p.pct)).replace('.', ','), inputmode: 'decimal', maxlength: '5', 'aria-label': '% para el promotor', disabled: pausado });
    var redes = C.entrada({ value: p.precioRedes != null && C.num(p.precioRedes) > 0 ? C.enCampo(p.precioRedes) : '', inputmode: 'decimal', maxlength: '10', placeholder: C.enCampo(precioApp), 'aria-label': 'Precio en redes', disabled: pausado });
    var tallas = Array.isArray(p.preciosTalla) ? p.preciosTalla.filter(function (t) { return t && typeof t === 'object'; }) : [];
    var camposTalla = tallas.map(function (t) {
      return { t: t, input: C.entrada({ value: t.precioRedes != null && C.num(t.precioRedes) > 0 ? C.enCampo(t.precioRedes) : '', inputmode: 'decimal', maxlength: '10', placeholder: C.enCampo(t.precioApp), 'aria-label': 'Precio en redes de ' + (t.titulo || ''), disabled: pausado }) };
    });
    var error = h('p', { class: 'error-campo', role: 'alert', hidden: true });
    var guardar = C.boton('Guardar', { class: 'btn chico suave', disabled: pausado, 'aria-label': 'Guardar ' + (p.nombre || '') });
    var estado = h('span', { class: 'estado-cv' });
    var pintarEstado = function (pctActual) {
      C.reemplazar(estado, pausado ? C.pill('Pausado por Deliservy', 'ambar') : pctActual > 0 && p.activo !== false ? C.pill('Activo', 'verde') : C.pill('Apagado', 'gris'));
    };
    pintarEstado(C.num(p.pct));
    var foto = C.fotoSegura(p.foto);
    guardar.addEventListener('click', function () {
      var n = leerPct(pct);
      var mal = '';
      if (isNaN(n) || n < 0 || n > tope) mal = 'El % va de 0 a ' + tope + '.';
      var r = redes.value.trim() ? C.leerNumero(redes.value) : null;
      if (!mal && r != null && (isNaN(r) || r <= 0)) mal = 'El precio de redes va mayor que 0.';
      if (!mal && r != null && r > precioApp) mal = 'El precio de redes no puede ser mayor que el de la app.';
      var valoresTalla = camposTalla.map(function (c) {
        if (!c.input.value.trim()) return null;
        var x = C.leerNumero(c.input.value);
        if (!mal && (isNaN(x) || x <= 0 || x > C.num(c.t.precioApp))) mal = 'Cada talla va mayor que 0 y no mayor que su precio en la app.';
        return isNaN(x) ? null : C.redondo(x);
      });
      error.textContent = mal; error.hidden = !mal;
      if (mal) return;
      var cuerpo = { pct: C.redondo(n), precioRedes: r == null ? null : C.redondo(r) };
      if (camposTalla.length) cuerpo.preciosTalla = valoresTalla;
      C.trabajando(guardar, C.pedir('PUT', '/vendedores-externos/productos/' + p.productId, cuerpo)).then(function () {
        C.avisar('Guardado');
        p.activo = true;
        pintarEstado(cuerpo.pct);
        if (r != null) redes.value = C.enCampo(r);

      }, function (e) { error.textContent = e.message; error.hidden = false; });
    });
    return h('div', { class: 'fila-cv' + (pausado ? ' pausado' : '') },
      h('div', { class: 'cv-producto' },
        foto ? h('img', { class: 'miniatura', src: foto, alt: '', loading: 'lazy' }) : dato('span', { class: 'miniatura sin-foto' }, C.inicial(p.nombre)),
        h('div', { class: 'txt' }, dato('b', null, p.nombre || ''), h('small', null, 'En la app: ', C.dolares(precioApp)), estado,
          plan && C.cobro && precioApp > 0 ? h('small', { class: 'cobro-cv' }, C.cobro.textoPorVenta(C.num(p.precioRedes) > 0 ? p.precioRedes : precioApp, plan)) : null,
          p.subio ? h('small', { class: 'ambar' }, 'Subiste el precio: revisa el de redes.') : null)),
      h('div', { class: 'cv-campos' },
        h('label', { class: 'cv-campo' }, h('span', null, '% promotor'), h('div', { class: 'con-sufijo' }, pct, h('span', null, '%'))),
        h('label', { class: 'cv-campo' }, h('span', null, 'Precio en redes'), h('div', { class: 'con-sufijo' }, redes, h('span', null, '$'))),
        camposTalla.map(function (c) {
          return h('label', { class: 'cv-campo' }, h('span', null, dato('span', null, c.t.titulo || ''), ' (', C.dolares(c.t.precioApp), ')'), h('div', { class: 'con-sufijo' }, c.input, h('span', null, '$')));
        }),
        guardar),
      pausado ? h('p', { class: 'nota pausa' }, ico('candado'), 'Deliservy lo pausó en el programa. Escríbenos si tienes dudas.') : null,
      error);
  }

  function pintar(ctx, v, d) {
    var tope = C.num(d.tope) || 50;
    var u = (d.ventas && d.ventas.ultimos30) || {};
    var ventas = (d.ventas && Array.isArray(d.ventas.lista)) ? d.ventas.lista : [];
    var productos = Array.isArray(d.productos) ? d.productos : [];
    var pctTienda = C.entrada({ id: 'cv-pct-tienda', value: String(C.num(d.pctTienda)).replace('.', ','), inputmode: 'decimal', maxlength: '5' });
    var aTodos = h('input', { type: 'checkbox', id: 'cv-todos' });
    var errorT = h('p', { class: 'error-campo', role: 'alert', hidden: true });
    var guardarT = C.boton('Guardar', { class: 'btn chico' }, 'check');
    guardarT.addEventListener('click', function () {
      var n = leerPct(pctTienda);
      if (isNaN(n) || n < 0 || n > tope) { errorT.textContent = 'El % va de 0 a ' + tope + '.'; errorT.hidden = false; return; }
      errorT.hidden = true;
      var cuerpo = { companyId: ctx.tienda.companyId, pct: C.redondo(n) };
      if (aTodos.checked) cuerpo.aplicarATodos = true;
      C.trabajando(guardarT, C.pedir('PUT', '/vendedores-externos/tienda', cuerpo)).then(function (r) {
        C.avisar(aTodos.checked ? 'Listo: aplicado a todos tus productos' : 'Guardado');
        C.mostrar();
      }, function (e) { errorT.textContent = e.message; errorT.hidden = false; });
    });
    C.enContenido(v, [
      C.cabeceraDeSeccion('Promotores externos', 'Personas que venden tus productos en sus redes. Tú decides cuánto ganan.'),
      h('div', { class: 'rejilla dos' },
        h('div', { class: 'tarjeta' },
          h('h2', null, '% de tu tienda'),
          h('p', { class: 'nota' }, 'Cada producto nuevo nace con este %. Máximo ' + tope + ' %.'),
          h('div', { class: 'fila-pct' }, h('div', { class: 'con-sufijo grande' }, pctTienda, h('span', null, '%')), guardarT),
          h('label', { class: 'casilla', for: 'cv-todos' }, aTodos, h('span', null, 'Aplicar también a todos mis productos con precio')),
          errorT),
        h('div', { class: 'tarjeta' },
          h('h2', null, 'Últimos 30 días'),
          h('div', { class: 'cifras dos-por-dos' },
            C.cifra('Ventas', String(Math.round(C.num(u.n)))),
            C.cifra('Vendido', C.dolares(u.ventasUsd)),
            C.cifra('Les pagaste', C.dolares(u.comisionUsd), 'ambar'),
            C.cifra('Cupones', C.dolares(u.cuponesUsd))),
          h('p', { class: 'nota' }, 'Lo del promotor sale de tu ganancia, como la comisión.'))),
      h('div', { class: 'etq-fila' }, h('span', { class: 'etq' }, 'Tus productos'), h('span', { class: 'cuenta' }, C.plural(productos.length, 'producto', 'productos'))),
      productos.length ? h('div', { class: 'lista' }, productos.map(function (p) { return filaProducto(ctx, p, tope, d.__plan); }))
        : C.vacio('Aún no tienes productos', 'Agrega productos para venderlos con promotores externos.', null, 'productos'),
      h('span', { class: 'etq' }, 'Ventas de promotores'),
      ventas.length ? h('div', { class: 'lista' }, ventas.map(function (x) {
        return h('div', { class: 'renglon' },
          h('div', { class: 'txt' }, h('b', null, 'Pedido #' + Math.round(C.num(x.orderId))), h('small', null, C.fechaHora(x.fecha), ' · ', dato('span', null, x.vendedor || 'Promotor'))),
          h('div', { class: 'monto' }, h('b', null, C.dolares(x.ventasUsd)), h('small', { class: 'ambar' }, 'Comisión ', C.dolares(x.comisionUsd)), C.num(x.cuponUsd) ? h('small', null, 'Cupón ', C.dolares(x.cuponUsd)) : null));
      })) : C.vacio('Aún no hay ventas de promotores', 'Cuando un promotor venda tus productos, lo verás aquí.', null, 'vendedores'),
    ]);
  }

  C.secciones.vendedores = {
    id: 'vendedores', titulo: 'Promotores externos', corto: 'Promotores', icono: 'vendedores',
    visible: function (ctx) { return ctx.esDueno && !!ctx.tienda && ctx.tienda.visibleEnApp === true; },
    mostrar: function (ctx, sub, v) {
      Promise.all([C.pedir('GET', '/vendedores-externos?storeId=' + encodeURIComponent(ctx.tienda.storeId)), C.cobro ? C.cobro.planDe(ctx) : Promise.resolve(null)]).then(function (rr) {
        var d = rr[0] || {};
        d.__plan = rr[1];
        pintar(ctx, v, d);
      }, function (e) { C.falloEnVista(v, e); });
    },
  };
})(window);
