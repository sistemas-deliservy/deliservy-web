/*
 * EL PANEL DEL COMERCIO — «Promotores» (24-oct-2026; tabla con un solo «Guardar», 30-oct-2026, C5 del rediseño).
 *
 * Gente que promociona los productos del comercio en sus redes con su enlace o su cupón. El comercio decide cuánto les
 * paga: un % para todos los productos («Aplicar»: lo pone ya en todos y cada producto nuevo nace con él) y, en la
 * tabla, el % de cada producto con su precio especial de redes (mayor que 0 y no mayor que el de la app). Tope: el que
 * diga la API (50 %). Si Deliservy pausó un producto en el programa, se ve y no se puede cambiar. Las filas que se
 * tocan se marcan en ámbar y UNA barra abajo («n cambios sin guardar · Guardar cambios») manda los
 * `PUT vendedores-externos/productos/:id` de esas filas, una por una, con su error debajo de la fila que falle.
 * Las ventas salen sin datos para contactar al promotor («Promotor #N»).
 *
 * ⚠️ La gente ve «promotor/promotores», nunca «vendedor» (contrato del rediseño); por dentro todo sigue llamándose
 * `vendedores` (la sección, la ruta `vendedores-externos`). Solo el dueño y solo tiendas que se ven en la app.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;
  /** Lo que se recuerda al volver a pintar (la pestaña y el grupo elegidos). */
  var recuerdo = { pestana: 'productos', grupo: '' };

  function leerPct(input) { return C.leerNumero(String(input.value || '').replace('%', '')); }
  function pctParaCampo(n) { return String(Math.round(C.num(n) * 100) / 100).replace('.', ','); }
  function redesParaCampo(x) { return x != null && C.num(x) > 0 ? C.enCampo(x) : ''; }
  /** Lo que hay en un campo, para comparar con lo guardado: '' vacío, el número redondeado, o el texto si no es número. */
  function valorDe(input) {
    var t = String(input.value || '').replace('%', '').trim();
    if (!t) return '';
    var n = C.leerNumero(t);
    return isNaN(n) ? 'x:' + t : String(C.redondo(n));
  }
  function guardadoPct(n) { return String(C.redondo(C.num(n))); }
  function guardadoRedes(x) { return x != null && C.num(x) > 0 ? String(C.redondo(x)) : ''; }

  // ── Una fila de la tabla ───────────────────────────────────────────────────

  function nuevaFila(p, alCambiar) {
    var pausado = !!p.pausadoPorAdmin;
    var precioApp = C.num(p.precioApp);
    var nombre = p.nombre || '';
    var m = { p: p, pausado: pausado, precioApp: precioApp };
    m.pct = C.entrada({ class: 'campo tp-campo', value: pctParaCampo(p.pct), inputmode: 'decimal', maxlength: '5', 'aria-label': '% para el promotor', disabled: pausado });
    m.redes = C.entrada({ class: 'campo tp-campo', value: redesParaCampo(p.precioRedes), inputmode: 'decimal', maxlength: '10', placeholder: C.enCampo(precioApp), 'aria-label': 'Precio en redes', disabled: pausado });
    m.tallas = (Array.isArray(p.preciosTalla) ? p.preciosTalla : []).filter(function (t) { return t && typeof t === 'object'; }).map(function (t) {
      return { t: t, input: C.entrada({ class: 'campo tp-campo', value: redesParaCampo(t.precioRedes), inputmode: 'decimal', maxlength: '10', placeholder: C.enCampo(t.precioApp), 'aria-label': 'Precio en redes', disabled: pausado }) };
    });
    m.guardado = { pct: guardadoPct(p.pct), redes: guardadoRedes(p.precioRedes), tallas: m.tallas.map(function (c) { return guardadoRedes(c.t.precioRedes); }) };
    m.error = h('p', { class: 'error-campo tp-error', role: 'alert', hidden: true });
    m.nota = h('small', { class: 'tp-nota' });
    m.estado = h('span', { class: 'tp-estado' });
    var foto = C.fotoSegura(p.foto);
    m.fila = h('div', { class: 'tp-fila' + (pausado ? ' pausado' : ''), role: 'row', 'data-producto': String(p.productId) },
      h('div', { class: 'tp-producto', role: 'cell' },
        foto ? h('img', { class: 'miniatura tp-foto', src: foto, alt: '', loading: 'lazy' }) : dato('span', { class: 'miniatura sin-foto tp-foto' }, C.inicial(nombre)),
        h('div', { class: 'txt' }, dato('b', null, nombre), m.nota,
          p.subio ? h('small', { class: 'tp-aviso' }, 'Subiste el precio: revisa el de redes.') : null)),
      h('div', { class: 'tp-app', role: 'cell' }, C.dolares(precioApp)),
      h('div', { class: 'tp-col-estado', role: 'cell' }, m.estado),
      h('div', { class: 'tp-pct', role: 'cell' }, h('div', { class: 'con-sufijo' }, m.pct, h('span', null, '%'))),
      h('div', { class: 'tp-redes', role: 'cell' }, h('div', { class: 'con-sufijo' }, m.redes, h('span', null, '$'))),
      m.tallas.map(function (c) {
        return h('div', { class: 'tp-talla' },
          h('small', null, dato('span', null, c.t.titulo || ''), ' · ', h('span', null, 'En la app'), ' ', C.dolares(c.t.precioApp)),
          h('div', { class: 'con-sufijo' }, c.input, h('span', null, '$')));
      }),
      pausado ? h('p', { class: 'nota pausa tp-ancho' }, ico('candado'), 'Deliservy lo pausó en el programa. Escríbenos si tienes dudas.') : null,
      m.error);
    [m.pct, m.redes].concat(m.tallas.map(function (c) { return c.input; })).forEach(function (input) {
      input.addEventListener('input', function () { marcar(m); alCambiar(); });
    });
    pintarNota(m);
    return m;
  }

  /** «En la app 4,50 $», «Pausado por Deliservy» o «Apagado» (con lo que está GUARDADO), y su pastilla. */
  function pintarNota(m) {
    var apagado = !(C.num(m.guardado.pct) > 0) || m.p.activo === false;
    C.reemplazar(m.nota, m.pausado ? h('span', { class: 'ambar' }, 'Pausado por Deliservy') : apagado ? 'Apagado' : ['En la app', ' ', C.dolares(m.precioApp)]);
    C.reemplazar(m.estado, m.pausado ? C.pill('Pausado por Deliservy', 'ambar') : apagado ? C.pill('Apagado', 'gris') : C.pill('Activo', 'verde'));
  }

  function camposCambiados(m) {
    return {
      pct: valorDe(m.pct) !== m.guardado.pct,
      redes: valorDe(m.redes) !== m.guardado.redes,
      tallas: m.tallas.map(function (c, i) { return valorDe(c.input) !== m.guardado.tallas[i]; }),
    };
  }
  function cambiada(m) {
    if (m.pausado) return false;
    var c = camposCambiados(m);
    return c.pct || c.redes || c.tallas.some(Boolean);
  }
  /** La fila en ámbar (y cada campo cambiado con su borde) si difiere de lo guardado. */
  function marcar(m) {
    var c = camposCambiados(m);
    m.pct.classList.toggle('cambiado', c.pct);
    m.redes.classList.toggle('cambiado', c.redes);
    m.tallas.forEach(function (t, i) { t.input.classList.toggle('cambiado', c.tallas[i]); });
    m.fila.classList.toggle('cambiada', cambiada(m));
    ponerError(m, '');
  }
  function ponerError(m, texto) {
    m.error.textContent = texto || '';
    m.error.hidden = !texto;
    m.fila.classList.toggle('con-error', !!texto);
  }

  /** Las mismas reglas de antes: el % de 0 al tope, el precio de redes mayor que 0 y no mayor que el de la app. */
  function revisar(m, tope) {
    var n = leerPct(m.pct);
    if (isNaN(n) || n < 0 || n > tope) return { mal: 'El % va de 0 a ' + tope + '.' };
    var r = m.redes.value.trim() ? C.leerNumero(m.redes.value) : null;
    if (r != null && (isNaN(r) || r <= 0)) return { mal: 'El precio de redes va mayor que 0.' };
    if (r != null && r > m.precioApp) return { mal: 'El precio de redes no puede ser mayor que el de la app.' };
    var mal = '';
    var tallas = m.tallas.map(function (c) {
      if (!c.input.value.trim()) return null;
      var x = C.leerNumero(c.input.value);
      if (!mal && (isNaN(x) || x <= 0 || x > C.num(c.t.precioApp))) mal = 'Cada talla va mayor que 0 y no mayor que su precio en la app.';
      return isNaN(x) ? null : C.redondo(x);
    });
    if (mal) return { mal: mal };
    var cuerpo = { pct: C.redondo(n), precioRedes: r == null ? null : C.redondo(r) };
    if (m.tallas.length) cuerpo.preciosTalla = tallas;
    return { cuerpo: cuerpo };
  }

  /** Lo que la API ya guardó pasa a ser «lo guardado» de la fila. */
  function quedoGuardada(m, cuerpo) {
    m.p.pct = cuerpo.pct;
    m.p.precioRedes = cuerpo.precioRedes;
    m.p.activo = cuerpo.pct > 0;
    m.pct.value = pctParaCampo(cuerpo.pct);
    m.redes.value = redesParaCampo(cuerpo.precioRedes);
    m.guardado.pct = guardadoPct(cuerpo.pct);
    m.guardado.redes = guardadoRedes(cuerpo.precioRedes);
    m.tallas.forEach(function (c, i) {
      var x = cuerpo.preciosTalla ? cuerpo.preciosTalla[i] : null;
      c.t.precioRedes = x;
      c.input.value = redesParaCampo(x);
      m.guardado.tallas[i] = guardadoRedes(x);
    });
    marcar(m);
    pintarNota(m);
  }
  function deshacer(m) {
    m.pct.value = pctParaCampo(m.p.pct);
    m.redes.value = redesParaCampo(m.p.precioRedes);
    m.tallas.forEach(function (c) { c.input.value = redesParaCampo(c.t.precioRedes); });
    marcar(m);
  }

  // ── La sección ─────────────────────────────────────────────────────────────

  function nombrePromotor(t) { return C.comoPromotor(t || 'Promotor'); }

  function pintar(ctx, v, d, extra) {
    var tope = C.num(d.tope) || 50;
    var u = (d.ventas && d.ventas.ultimos30) || {};
    var ventas = (d.ventas && Array.isArray(d.ventas.lista)) ? d.ventas.lista : [];
    var nVentas = u.n != null ? Math.round(C.num(u.n)) : ventas.length;
    var productos = Array.isArray(d.productos) ? d.productos : [];

    // El grupo de cada producto (de «Productos»: esta respuesta no lo trae), en el orden de los grupos de la tienda.
    var grupoDe = extra.grupoDe || {};
    var ordenGrupos = [];
    var cuantos = {};
    productos.forEach(function (p) {
      var g = grupoDe[p.productId] || { clave: 'sin', nombre: '' };
      if (!cuantos[g.clave]) { cuantos[g.clave] = 0; ordenGrupos.push(g); }
      cuantos[g.clave]++;
    });
    ordenGrupos.sort(function (a, b) { return (a.clave === 'sin' ? 1e6 : a.orden) - (b.clave === 'sin' ? 1e6 : b.orden); });
    if (recuerdo.grupo && !cuantos[recuerdo.grupo]) recuerdo.grupo = '';

    // ── La barra de cambios ──
    var textoCambios = h('span', { class: 'bc-texto', role: 'status' });
    var guardar = C.boton('Guardar cambios', { class: 'btn chico' });
    var descartar = C.boton('Descartar', { class: 'btn chico borde-blanco' });
    var barra = h('div', { class: 'barra-cambios', hidden: true }, textoCambios, h('div', { class: 'bc-botones' }, descartar, guardar));
    var filas = [];
    var contar = function () {
      var n = filas.filter(cambiada).length;
      textoCambios.textContent = C.plural(n, 'cambio sin guardar', 'cambios sin guardar');
      barra.hidden = n === 0;
    };
    filas = productos.map(function (p) { return nuevaFila(p, contar); });

    guardar.addEventListener('click', function () {
      var lista = filas.filter(cambiada);
      if (!lista.length) return;
      var hayMal = false;
      var envios = [];
      lista.forEach(function (m) {
        var r = revisar(m, tope);
        if (r.mal) { ponerError(m, r.mal); hayMal = true; } else envios.push({ m: m, cuerpo: r.cuerpo });
      });
      // Una por una (la API frena a quien manda muchas a la vez); la que falle deja su frase debajo de su fila.
      var cadena = envios.reduce(function (antes, x) {
        return antes.then(function () {
          return C.pedir('PUT', '/vendedores-externos/productos/' + x.m.p.productId, x.cuerpo).then(function () { quedoGuardada(x.m, x.cuerpo); }, function (e) {
            if (e.status === 401) throw e;
            hayMal = true;
            ponerError(x.m, e.message);
          });
        });
      }, Promise.resolve());
      C.trabajando(guardar, cadena).then(function () {
        contar();
        if (!hayMal) { C.avisar('Guardado'); return; }
        C.avisar('Algunos cambios no se guardaron. Revisa las filas marcadas.', 'mal');
        var primera = filas.filter(function (m) { return !m.error.hidden; })[0];
        if (primera) {
          if (primera.fila.hidden) elegirGrupo('');
          if (primera.fila.scrollIntoView) primera.fila.scrollIntoView({ block: 'center' });
        }
      }, function () { /* la sesión terminó: ya se fue a entrar */ });
    });
    descartar.addEventListener('click', function () { filas.filter(cambiada).forEach(deshacer); contar(); });

    // ── % para todos ──
    var pctTodos = C.entrada({ id: 'cv-pct-tienda', value: pctParaCampo(d.pctTienda), inputmode: 'decimal', maxlength: '5', 'aria-label': '% para todos los productos' });
    var errorT = h('p', { class: 'error-campo', role: 'alert', hidden: true });
    var aplicar = C.boton('Aplicar', { class: 'btn chico oscuro' });
    aplicar.addEventListener('click', function () {
      var n = leerPct(pctTodos);
      if (isNaN(n) || n < 0 || n > tope) { errorT.textContent = 'El % va de 0 a ' + tope + '.'; errorT.hidden = false; return; }
      errorT.hidden = true;
      var pendientes = filas.some(cambiada);
      C.confirmar({
        titulo: '¿Aplicar este % a todos tus productos?',
        texto: pendientes ? 'Cambia el % de todos tus productos con precio y será el de cada producto nuevo. Los cambios sin guardar se pierden.'
          : 'Cambia el % de todos tus productos con precio y será el de cada producto nuevo.',
        si: 'Aplicar',
      }).then(function (si) {
        if (!si) return;
        C.trabajando(aplicar, C.pedir('PUT', '/vendedores-externos/tienda', { companyId: ctx.tienda.companyId, pct: C.redondo(n), aplicarATodos: true })).then(function () {
          C.avisar('Listo: aplicado a todos tus productos');
          C.mostrar();
        }, function (e) { errorT.textContent = e.message; errorT.hidden = false; });
      });
    });

    // ── Los grupos ──
    var chipsGrupos = h('div', { class: 'chips-filtro', role: 'group', 'aria-label': 'Grupos' });
    var elegirGrupo = function (clave) {
      recuerdo.grupo = clave;
      Array.prototype.forEach.call(chipsGrupos.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-grupo') === clave)); });
      filas.forEach(function (m) { var g = grupoDe[m.p.productId]; m.fila.hidden = !!clave && (g ? g.clave : 'sin') !== clave; });
    };
    if (ordenGrupos.length > 1) {
      chipsGrupos.appendChild(h('button', { type: 'button', class: 'chip', 'data-grupo': '', onclick: function () { elegirGrupo(''); } }, 'Todos · ' + productos.length));
      ordenGrupos.forEach(function (g) {
        chipsGrupos.appendChild(h('button', { type: 'button', class: 'chip', 'data-grupo': g.clave, onclick: function () { elegirGrupo(g.clave); } },
          g.nombre ? dato('span', null, g.nombre) : h('span', null, 'Sin grupo'), ' · ' + cuantos[g.clave]));
      });
    }

    // ── Las dos pestañas ──
    var panelProductos = h('div', { class: 'panel-promotores', role: 'tabpanel', id: 'pp-productos' },
      h('div', { class: 'tarjeta pct-todos' },
        h('div', { class: 'pct-todos-fila' },
          h('label', { class: 'pct-todos-txt', for: 'cv-pct-tienda' }, '% para todos los productos'),
          h('div', { class: 'con-sufijo' }, pctTodos, h('span', null, '%')),
          aplicar),
        h('p', { class: 'ayuda' }, 'Cada producto nuevo nace con este %. Máximo ' + tope + ' %.'),
        errorT),
      ordenGrupos.length > 1 ? chipsGrupos : null,
      productos.length ? h('div', { class: 'tabla-promotores', role: 'table', 'aria-label': 'Tus productos' },
        h('div', { class: 'tp-fila tp-cab', role: 'row' },
          h('span', { role: 'columnheader' }, 'Producto'), h('span', { class: 'tp-app', role: 'columnheader' }, 'En la app'),
          h('span', { class: 'tp-col-estado', role: 'columnheader' }, 'Estado'), h('span', { class: 'tp-pct', role: 'columnheader' }, '%'),
          h('span', { class: 'tp-redes', role: 'columnheader' }, 'Precio redes')),
        filas.map(function (m) { return m.fila; }))
        : C.vacio('Aún no tienes productos', 'Agrega productos para que los promotores los vendan.', null, 'productos'));
    var panelVentas = h('div', { class: 'panel-promotores', role: 'tabpanel', id: 'pp-ventas' },
      h('div', { class: 'tarjeta' },
        h('h2', null, 'Últimos 30 días'),
        h('div', { class: 'cifras dos-por-dos' },
          C.cifra('Ventas', String(Math.round(C.num(u.n)))),
          C.cifra('Vendido', C.dolares(u.ventasUsd)),
          C.cifra('Les pagaste', C.dolares(u.comisionUsd), 'ambar'),
          C.cifra('Cupones', C.dolares(u.cuponesUsd))),
        h('p', { class: 'nota' }, 'Lo del promotor sale de tu ganancia, como la comisión.')),
      h('span', { class: 'etq' }, 'Ventas de promotores'),
      ventas.length ? h('div', { class: 'lista' }, ventas.map(function (x) {
        return h('div', { class: 'renglon' },
          h('div', { class: 'txt' }, h('b', null, 'Pedido #' + Math.round(C.num(x.orderId))), h('small', null, C.fechaHora(x.fecha), ' · ', h('span', null, nombrePromotor(x.vendedor)))),
          h('div', { class: 'monto' }, h('b', null, C.dolares(x.ventasUsd)), h('small', { class: 'ambar' }, 'Comisión ', C.dolares(x.comisionUsd)), C.num(x.cuponUsd) ? h('small', null, 'Cupón ', C.dolares(x.cuponUsd)) : null));
      })) : C.vacio('Aún no hay ventas de promotores', 'Cuando un promotor venda tus productos, lo verás aquí.', null, 'vendedores'));
    var verPestana = function (cual) {
      recuerdo.pestana = cual;
      panelProductos.hidden = cual !== 'productos';
      panelVentas.hidden = cual !== 'ventas';
    };
    var pestanas = C.segmentos('Promotores', [['productos', 'Productos · ' + productos.length], ['ventas', 'Ventas · ' + nVentas]], recuerdo.pestana, verPestana, 'ancho');

    C.enContenido(v, [
      C.cabeceraDeSeccion('Promotores', 'Personas que promocionan tus productos en sus redes. Tú decides cuánto ganan.'),
      pestanas, panelProductos, panelVentas, barra,
    ]);
    verPestana(recuerdo.pestana);
    elegirGrupo(recuerdo.grupo);
    contar();
    // Al irse de la sección con cambios sin guardar, que no se pierdan sin avisar (solo si la persona cierra la pestaña).
    var antesDeSalir = function (ev) { if (filas.some(cambiada)) { ev.preventDefault(); ev.returnValue = ''; } };
    raiz.addEventListener('beforeunload', antesDeSalir);
    v.alSalir(function () { raiz.removeEventListener('beforeunload', antesDeSalir); });
  }

  /** El grupo de cada producto, de `productos` y `grupos` (la respuesta de los promotores no lo trae). */
  function gruposDeLosProductos(ctx) {
    var q = 'storeId=' + encodeURIComponent(ctx.tienda.storeId);
    return Promise.all([C.pedir('GET', '/productos?' + q), C.pedir('GET', '/grupos?' + q).catch(function () { return []; })]).then(function (r) {
      var lista = Array.isArray(r[0]) ? r[0] : (r[0] && Array.isArray(r[0].productos) ? r[0].productos : []);
      var grupos = Array.isArray(r[1]) ? r[1] : (r[1] && Array.isArray(r[1].grupos) ? r[1].grupos : []);
      var orden = {};
      grupos.forEach(function (g, i) { orden[String(g.id)] = { i: i, nombre: g.nombre || g.name || '' }; });
      var grupoDe = {};
      lista.forEach(function (p) {
        var g = p.grupo != null ? p.grupo : p.group;
        var id = g && typeof g === 'object' ? g.id : p.grupoId;
        var nombre = g && typeof g === 'object' ? (g.nombre || g.name || '') : (typeof g === 'string' ? g : '');
        if (id == null && !nombre) return;
        var o = id != null ? orden[String(id)] : null;
        grupoDe[p.id] = { clave: id != null ? 'g' + id : 'n' + nombre, nombre: nombre || (o && o.nombre) || '', orden: o ? o.i : 999 };
      });
      return { grupoDe: grupoDe };
    }, function () { return {}; });
  }

  C.secciones.vendedores = {
    id: 'vendedores', titulo: 'Promotores', corto: 'Promotores', icono: 'vendedores',
    visible: function (ctx) { return ctx.esDueno && !!ctx.tienda && ctx.tienda.visibleEnApp === true; },
    mostrar: function (ctx, sub, v) {
      Promise.all([C.pedir('GET', '/vendedores-externos?storeId=' + encodeURIComponent(ctx.tienda.storeId)), gruposDeLosProductos(ctx)]).then(function (rr) {
        if (!v.viva()) return;
        pintar(ctx, v, rr[0] || {}, rr[1] || {});
      }, function (e) { C.falloEnVista(v, e); });
    },
  };
})(window);
