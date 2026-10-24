/*
 * EL PANEL DEL COMERCIO — «Productos» (24-oct-2026).
 *
 * Buscar (como la app: sin tildes, a medias y en cualquier orden), filtrar por grupo, agregar y editar: hasta 3 fotos
 * con su título y su precio de variante, nombre, descripción, precio en dólares, grupo, disponible, stock (0 = sin
 * límite), edad (+13 / +18), por encargo con su plazo, y los grupos de opciones (tamaños, extras) con sus opciones.
 * Los grupos de la tienda se crean, se renombran (4 a 20 letras) y se borran solo si no tienen productos (si tienen,
 * la API contesta 409 y se enseña su frase).
 *
 * Los cuerpos de las opciones son los de la app (`name`, `type`, `required`, `maxSelect`, `extraPrice`, `image`).
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;
  var filtro = { buscar: '', grupoId: '' };

  function q(ctx) { return 'storeId=' + encodeURIComponent(ctx.tienda.storeId); }
  function grupoDe(p) {
    var g = p.grupo != null ? p.grupo : p.group;
    if (g && typeof g === 'object') return { id: g.id != null ? Number(g.id) : null, nombre: g.nombre || g.name || '' };
    if (typeof g === 'string') return { id: p.grupoId != null ? Number(p.grupoId) : null, nombre: g };
    return { id: p.grupoId != null ? Number(p.grupoId) : null, nombre: '' };
  }

  // ── La lista ───────────────────────────────────────────────────────────────

  function filaDeProducto(ctx, p) {
    var foto = C.fotoSegura(p.imagen || p.image || (Array.isArray(p.images) ? p.images[0] : ''));
    var disponible = p.disponible !== false && p.availability !== false;
    var precio = C.num(p.precio != null ? p.precio : p.price);
    var sw = C.interruptor('disp-' + p.id, disponible, null, function (on, input) {
      input.disabled = true;
      C.pedir('PATCH', '/productos/' + p.id, { disponible: on }).then(function () {
        input.disabled = false;
        fila.classList.toggle('agotado', !on);
        C.avisar(on ? 'Disponible' : 'Marcado como agotado');
      }, function (e) { input.disabled = false; input.checked = !on; C.avisar(e.message, 'mal'); });
    }, { clase: 'chico' });
    sw.input.setAttribute('aria-label', 'Disponible');
    var cv = p.cv && typeof p.cv === 'object' ? p.cv : null;
    var fila = h('div', { class: 'fila-producto' + (disponible ? '' : ' agotado') },
      h('a', { class: 'fp-enlace', href: '#productos/' + p.id },
        foto ? h('img', { class: 'miniatura', src: foto, alt: '', loading: 'lazy' }) : dato('span', { class: 'miniatura sin-foto' }, C.inicial(p.nombre || p.name)),
        h('div', { class: 'txt' },
          dato('b', null, p.nombre || p.name || ''),
          h('div', { class: 'chips' },
            h('span', { class: 'precio' }, C.dolares(precio)),
            precio <= 0 ? C.pill('No se vende', 'ambar') : null,
            !disponible ? C.pill('Agotado', 'gris') : null,
            C.num(p.stock) > 0 ? C.pill('Stock ' + Math.round(C.num(p.stock)), '') : null,
            p.encargo ? C.pill('Por encargo', 'azul') : null,
            p.tieneOpciones ? C.pill('Con opciones', '') : null,
            cv && cv.pausadoPorAdmin ? C.pill('Pausado por Deliservy', 'ambar') : cv && cv.activo && C.num(cv.pct) > 0 ? C.pill(C.porcentaje(cv.pct) + ' vendedores', 'verde') : null))),
      h('div', { class: 'fp-disp' }, sw.caja));
    if (!ctx.puede('productos')) sw.input.disabled = true;
    return fila;
  }

  function lista(ctx, v) {
    var resultados = h('div', { class: 'productos-lista' }, C.cargando());
    var grupos = [];
    var buscar = h('input', { class: 'campo', type: 'search', id: 'buscar-producto', placeholder: 'Busca un producto', value: filtro.buscar, autocomplete: 'off', enterkeyhint: 'search', 'aria-label': 'Buscar' });
    var selGrupo = h('select', { class: 'campo', 'aria-label': 'Grupo' }, h('option', { value: '' }, 'Todos los grupos'));
    var cargar = function () {
      var url = '/productos?' + q(ctx) + (filtro.buscar ? '&buscar=' + encodeURIComponent(filtro.buscar) : '') + (filtro.grupoId ? '&grupoId=' + encodeURIComponent(filtro.grupoId) : '');
      C.pedir('GET', url).then(function (d) {
        if (!v.viva()) return;
        var arr = Array.isArray(d) ? d : (d && Array.isArray(d.productos) ? d.productos : []);
        if (!arr.length) {
          C.reemplazar(resultados, filtro.buscar || filtro.grupoId
            ? C.vacio('No hay productos con ese filtro', 'Prueba con otra búsqueda o quita el filtro.', null, 'buscar')
            : C.vacio('Aún no tienes productos', 'Agrega el primero: nombre, precio y una foto.', h('div', { class: 'botones centro' }, h('a', { class: 'btn chico', href: '#productos/nuevo' }, ico('agregar'), 'Agregar producto')), 'productos'));
          return;
        }
        // Por grupo, en el orden de los grupos de la tienda; sin grupo, al final.
        var porGrupo = {};
        var orden = [];
        arr.forEach(function (p) {
          var g = grupoDe(p);
          var k = g.id != null ? 'g' + g.id : (g.nombre ? 'n' + g.nombre : 'sin');
          if (!porGrupo[k]) { porGrupo[k] = { nombre: g.nombre, id: g.id, productos: [] }; orden.push(k); }
          if (!porGrupo[k].nombre && g.id != null) { var gg = grupos.filter(function (x) { return Number(x.id) === g.id; })[0]; if (gg) porGrupo[k].nombre = gg.nombre; }
          porGrupo[k].productos.push(p);
        });
        orden.sort(function (a, b) {
          var ia = grupos.findIndex(function (x) { return 'g' + x.id === a; }), ib = grupos.findIndex(function (x) { return 'g' + x.id === b; });
          if (a === 'sin') return 1; if (b === 'sin') return -1;
          return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
        });
        C.reemplazar(resultados, orden.map(function (k) {
          var g = porGrupo[k];
          return h('section', { class: 'grupo-productos' },
            h('div', { class: 'etq-fila' }, g.nombre ? dato('span', { class: 'etq' }, g.nombre) : h('span', { class: 'etq' }, 'Sin grupo'), h('span', { class: 'cuenta' }, C.plural(g.productos.length, 'producto', 'productos'))),
            h('div', { class: 'lista' }, g.productos.map(function (p) { return filaDeProducto(ctx, p); })));
        }));
      }, function (e) { if (v.viva()) C.reemplazar(resultados, C.tarjetaError(e, cargar)); });
    };
    var reloj = null;
    buscar.addEventListener('input', function () { clearTimeout(reloj); reloj = setTimeout(function () { filtro.buscar = buscar.value.trim(); cargar(); }, 300); });
    selGrupo.addEventListener('change', function () { filtro.grupoId = selGrupo.value; cargar(); });
    C.enContenido(v, [
      C.cabeceraDeSeccion('Productos', ['Lo que vendes en ', dato('span', null, ctx.tienda.nombre), '.'], [
        C.boton('Grupos', { class: 'btn borde chico', onclick: function () { abrirGrupos(ctx, cargar); } }, 'filtro'),
        h('a', { class: 'btn chico', href: '#productos/nuevo' }, ico('agregar'), 'Agregar producto'),
      ]),
      h('div', { class: 'filtros' }, h('div', { class: 'con-icono' }, ico('buscar'), buscar), h('div', { class: 'con-flecha' }, selGrupo, ico('abajo'))),
      resultados,
    ]);
    C.pedir('GET', '/grupos?' + q(ctx)).then(function (gs) {
      grupos = Array.isArray(gs) ? gs : (gs && Array.isArray(gs.grupos) ? gs.grupos : []);
      grupos.forEach(function (g) { var o = dato('option', { value: String(g.id) }, g.nombre || g.name); if (String(g.id) === String(filtro.grupoId)) o.selected = true; selGrupo.appendChild(o); });
      cargar();
    }, function () { cargar(); });
  }

  // ── Los grupos de la tienda ────────────────────────────────────────────────

  function abrirGrupos(ctx, alCerrar) {
    var cuerpo = h('div', { class: 'grupos-tienda' }, C.cargando());
    var d = C.abrirDialogo({ titulo: 'Grupos de tu tienda', cuerpo: cuerpo, alCerrar: alCerrar });
    var pintar = function (grupos) {
      var nuevo = C.entrada({ id: 'grupo-nuevo', maxlength: '20', placeholder: 'Nombre del grupo nuevo' });
      var errorNuevo = h('p', { class: 'error-campo', role: 'alert', hidden: true });
      var agregar = C.boton('Agregar', { class: 'btn chico' }, 'agregar');
      agregar.addEventListener('click', function () {
        var n = nuevo.value.trim();
        if (n.length < 4 || n.length > 20) { errorNuevo.textContent = 'El nombre va de 4 a 20 letras.'; errorNuevo.hidden = false; return; }
        C.trabajando(agregar, C.pedir('POST', '/grupos?' + q(ctx), { nombre: n })).then(function () { C.avisar('Grupo creado'); recargar(); },
          function (e) { errorNuevo.textContent = e.message; errorNuevo.hidden = false; });
      });
      C.reemplazar(cuerpo, [
        h('p', { class: 'nota' }, 'Ordenan tu menú en la app. Solo se borra un grupo sin productos.'),
        h('div', { class: 'lista' }, grupos.length ? grupos.map(function (g) {
          var input = C.entrada({ value: g.nombre || g.name || '', maxlength: '20', 'aria-label': 'Nombre del grupo', 'data-idioma': 'no' });
          var err = h('p', { class: 'error-campo', role: 'alert', hidden: true });
          var guardar = C.boton('Guardar', { class: 'btn chico suave' });
          var borrar = h('button', { class: 'boton-icono peligro', type: 'button', 'aria-label': 'Borrar grupo' }, ico('borrar'));
          guardar.addEventListener('click', function () {
            var n = input.value.trim();
            if (n.length < 4 || n.length > 20) { err.textContent = 'El nombre va de 4 a 20 letras.'; err.hidden = false; return; }
            C.trabajando(guardar, C.pedir('PATCH', '/grupos/' + g.id, { nombre: n })).then(function () { err.hidden = true; C.avisar('Guardado'); }, function (e) { err.textContent = e.message; err.hidden = false; });
          });
          borrar.addEventListener('click', function () {
            C.trabajando(borrar, C.pedir('DELETE', '/grupos/' + g.id)).then(function () { C.avisar('Grupo borrado'); recargar(); }, function (e) { err.textContent = e.message; err.hidden = false; });
          });
          return h('div', { class: 'fila-grupo' },
            h('div', { class: 'fila-grupo-campos' }, input, h('small', { class: 'cuenta' }, C.plural(C.num(g.productos), 'producto', 'productos')), guardar, borrar), err);
        }) : h('p', { class: 'nota relleno' }, 'Aún no tienes grupos.')),
        h('div', { class: 'grupo-campo' }, h('label', { class: 'etq-campo', for: 'grupo-nuevo' }, 'Grupo nuevo'), h('div', { class: 'fila-campos-boton' }, nuevo, agregar), errorNuevo),
      ]);
    };
    var recargar = function () {
      C.pedir('GET', '/grupos?' + q(ctx)).then(function (gs) { pintar(Array.isArray(gs) ? gs : (gs && gs.grupos) || []); }, function (e) { C.reemplazar(cuerpo, C.tarjetaError(e, recargar)); });
    };
    recargar();
    return d;
  }

  // ── El editor ──────────────────────────────────────────────────────────────

  /** Un producto completo, venga en español (contrato) o con los nombres de la app. */
  function productoCompleto(x) {
    x = x || {};
    var imagenes = Array.isArray(x.images) ? x.images : Array.isArray(x.fotos) ? x.fotos.map(function (f) { return f && (f.url || f); }) : (x.imagen ? [x.imagen] : []);
    var grupos = Array.isArray(x.modifierGroups) ? x.modifierGroups : Array.isArray(x.gruposOpciones) ? x.gruposOpciones : Array.isArray(x.opciones) ? x.opciones : [];
    var g = grupoDe(x);
    return {
      id: x.id != null ? Number(x.id) : null,
      nombre: x.nombre != null ? x.nombre : (x.name || ''),
      descripcion: x.descripcion != null ? x.descripcion : (x.description || ''),
      precio: C.num(x.precio != null ? x.precio : x.price),
      disponible: x.disponible != null ? x.disponible !== false : x.availability !== false,
      stock: Math.round(C.num(x.stock)),
      edad: Number(x.edad != null ? x.edad : x.ageRating) === 18 ? 18 : 13,
      grupoId: g.id,
      encargo: !!x.encargo,
      encargoDiasMin: x.encargoDiasMin != null ? Number(x.encargoDiasMin) : null,
      encargoDiasMax: x.encargoDiasMax != null ? Number(x.encargoDiasMax) : null,
      fotos: [0, 1, 2].map(function (i) {
        return { url: C.fotoSegura(imagenes[i]) || '', titulo: (x.imageTitles && x.imageTitles[i]) || '', precio: x.imagePrices && C.num(x.imagePrices[i]) > 0 ? C.num(x.imagePrices[i]) : null };
      }),
      grupos: grupos.map(function (gr) {
        var ops = Array.isArray(gr.options) ? gr.options : Array.isArray(gr.opciones) ? gr.opciones : [];
        return {
          id: gr.id != null ? Number(gr.id) : null, nombre: gr.name != null ? gr.name : (gr.nombre || ''),
          tipo: (gr.type || gr.tipo) === 'single' ? 'single' : 'multiple', obligatorio: !!(gr.required != null ? gr.required : gr.obligatorio),
          max: gr.maxSelect != null ? Number(gr.maxSelect) : (gr.max != null ? Number(gr.max) : null),
          opciones: ops.map(function (o) {
            return { id: o.id != null ? Number(o.id) : null, nombre: o.name != null ? o.name : (o.nombre || ''), precio: C.num(o.extraPrice != null ? o.extraPrice : (o.precioExtra != null ? o.precioExtra : o.precio)), imagen: C.fotoSegura(o.image || o.imagen) || '' };
          }),
        };
      }),
    };
  }

  function editor(ctx, v, id) {
    var nuevo = id === 'nuevo';
    var cargar = nuevo ? Promise.resolve(productoCompleto({ disponible: true })) : C.pedir('GET', '/productos/' + encodeURIComponent(id)).then(function (x) { return productoCompleto(x && x.producto ? x.producto : x); });
    Promise.all([cargar, C.pedir('GET', '/grupos?' + q(ctx)).catch(function () { return []; })]).then(function (r) {
      if (!v.viva()) return;
      formulario(ctx, v, r[0], Array.isArray(r[1]) ? r[1] : (r[1] && r[1].grupos) || [], nuevo);
    }, function (e) {
      if (e.status === 404) C.enContenido(v, [h('a', { class: 'volver', href: '#productos' }, ico('atras'), 'Productos'), C.vacio('No encontramos ese producto', 'Puede ser de otra tienda o ya se borró.', null, 'buscar')]);
      else C.falloEnVista(v, e);
    });
  }

  function formulario(ctx, v, p, grupos, nuevo) {
    var companyId = ctx.tienda.companyId;
    var errores = h('div', { class: 'errores-form', role: 'alert', hidden: true });

    // Fotos
    var fotos = p.fotos.map(function (f, i) {
      var z = C.fotos.zona({ tipo: 'producto', companyId: companyId, url: f.url, rotulo: 'Foto ' + (i + 1) });
      var titulo = C.entrada({ value: f.titulo, maxlength: '30', placeholder: 'Título', 'aria-label': 'Título de la foto ' + (i + 1) });
      var precio = C.entrada({ value: C.enCampo(f.precio), inputmode: 'decimal', maxlength: '10', placeholder: 'Precio $', 'aria-label': 'Precio de la foto ' + (i + 1) });
      return { zona: z, titulo: titulo, precio: precio };
    });

    // Datos
    var nombre = C.entrada({ id: 'p-nombre', value: p.nombre, maxlength: '100', placeholder: 'Ej.: Arepa reina pepiada' });
    var descripcion = h('textarea', { class: 'campo', id: 'p-descripcion', rows: '3', maxlength: '500', placeholder: C.segunIdioma('Qué lleva, tamaño o detalles', 'What it has, size or details') });
    descripcion.value = p.descripcion || '';
    var precio = C.entrada({ id: 'p-precio', value: nuevo && !p.precio ? '' : C.enCampo(p.precio), inputmode: 'decimal', maxlength: '10', placeholder: '0,00' });
    var avisoCero = h('p', { class: 'ayuda ambar', hidden: true }, 'Con precio 0, este producto no se vende.');
    var revisarCero = function () { var n = C.leerNumero(precio.value); avisoCero.hidden = !(n === 0); };
    precio.addEventListener('input', revisarCero);
    var selGrupo = h('select', { class: 'campo', id: 'p-grupo' }, h('option', { value: '' }, 'Sin grupo'),
      grupos.map(function (g) { var o = dato('option', { value: String(g.id) }, g.nombre || g.name || ''); if (Number(g.id) === p.grupoId) o.selected = true; return o; }));

    // Venta
    var disponible = C.interruptor('p-disponible', p.disponible, 'Disponible');
    var stock = C.entrada({ id: 'p-stock', value: String(p.stock || 0), inputmode: 'numeric', maxlength: '6' });
    var edad = p.edad;
    var segEdad = C.segmentos('Edad', [['13', 'Para todos (+13)'], ['18', 'Solo mayores (+18)']], String(edad), function (x) { edad = Number(x); });
    var encargo = C.interruptor('p-encargo', p.encargo, 'Por encargo', function (on) { plazo.hidden = !on; });
    var diasMin = C.entrada({ id: 'p-dias-min', value: p.encargoDiasMin != null ? String(p.encargoDiasMin) : '', inputmode: 'numeric', maxlength: '3', placeholder: '7', 'aria-label': 'Días mínimos' });
    var diasMax = C.entrada({ id: 'p-dias-max', value: p.encargoDiasMax != null ? String(p.encargoDiasMax) : '', inputmode: 'numeric', maxlength: '3', placeholder: '15', 'aria-label': 'Días máximos' });
    var plazo = h('div', { class: 'plazo', hidden: !p.encargo },
      h('span', { class: 'etq-campo' }, 'Llega en (días)'), h('div', { class: 'fila-dias' }, diasMin, h('span', { 'aria-hidden': 'true' }, '–'), diasMax));

    // Opciones
    var gruposOpc = p.grupos.map(function (g) { return Object.assign({ borradas: [] }, g, { opciones: g.opciones.map(function (o) { return Object.assign({}, o); }) }); });
    var gruposBorrados = [];
    var cajaOpciones = h('div', { class: 'editor-opciones' });
    function pintarOpciones() {
      C.reemplazar(cajaOpciones, [
        gruposOpc.length ? null : h('p', { class: 'nota' }, 'Tamaños, sabores o extras que el cliente elige.'),
        gruposOpc.map(function (g, gi) {
          var nombreG = C.entrada({ value: g.nombre, maxlength: '40', placeholder: 'Ej.: Tamaño', 'aria-label': 'Nombre del grupo de opciones' });
          nombreG.addEventListener('input', function () { g.nombre = nombreG.value; });
          var tipo = C.segmentos('Tipo', [['single', 'Elige una'], ['multiple', 'Elige varias']], g.tipo, function (x) { g.tipo = x; maxCaja.hidden = x !== 'multiple'; });
          var obligatorio = C.interruptor('g-oblig-' + gi, g.obligatorio, 'Obligatorio', function (on) { g.obligatorio = on; }, { clase: 'chico' });
          var max = C.entrada({ value: g.max != null ? String(g.max) : '', inputmode: 'numeric', maxlength: '2', placeholder: 'Todas', 'aria-label': 'Máximo' });
          max.addEventListener('input', function () { var n = parseInt(max.value, 10); g.max = n > 0 ? n : null; });
          var maxCaja = h('label', { class: 'max-opciones', hidden: g.tipo !== 'multiple' }, h('span', null, 'Máximo'), max);
          return h('div', { class: 'grupo-opciones' },
            h('div', { class: 'go-cab' }, nombreG,
              h('button', { class: 'boton-icono peligro', type: 'button', 'aria-label': 'Quitar grupo de opciones', onclick: function () {
                if (g.id) gruposBorrados.push(g.id);
                gruposOpc.splice(gi, 1);
                pintarOpciones();
              } }, ico('borrar'))),
            h('div', { class: 'go-ajustes' }, tipo, obligatorio.caja, maxCaja),
            h('div', { class: 'go-opciones' }, g.opciones.map(function (o, oi) {
              var n = C.entrada({ value: o.nombre, maxlength: '40', placeholder: 'Opción', 'aria-label': 'Nombre de la opción' });
              n.addEventListener('input', function () { o.nombre = n.value; });
              var pr = C.entrada({ value: o.precio ? C.enCampo(o.precio) : '', inputmode: 'decimal', maxlength: '8', placeholder: '+0,00', 'aria-label': 'Precio extra en dólares' });
              pr.addEventListener('input', function () { o.precio = C.leerNumero(pr.value); });
              var z = C.fotos.zona({ tipo: 'opcion', companyId: companyId, url: o.imagen, pequena: true, rotulo: 'Foto de la opción', alCambiar: function (u) { o.imagen = u; } });
              o._zona = z;
              return h('div', { class: 'fila-opcion' }, z.caja, n, h('div', { class: 'con-sufijo' }, pr, h('span', null, '$')),
                h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Quitar opción', onclick: function () {
                  if (o.id) g.borradas.push(o.id);
                  g.opciones.splice(oi, 1);
                  pintarOpciones();
                } }, ico('x')));
            })),
            C.boton('Agregar opción', { class: 'btn chico suave', onclick: function () { g.opciones.push({ id: null, nombre: '', precio: 0, imagen: '' }); pintarOpciones(); } }, 'agregar'));
        }),
        C.boton('Agregar grupo de opciones', { class: 'btn borde chico', onclick: function () { gruposOpc.push({ id: null, nombre: '', tipo: 'single', obligatorio: true, max: null, opciones: [{ id: null, nombre: '', precio: 0, imagen: '' }], borradas: [] }); pintarOpciones(); } }, 'agregar'),
      ]);
    }
    pintarOpciones();

    var guardar = C.boton(nuevo ? 'Crear producto' : 'Guardar', { class: 'btn' }, 'check');
    var borrar = nuevo ? null : C.boton('Borrar producto', { class: 'btn borde peligro-texto' }, 'borrar');

    function revisar() {
      var mal = [];
      var n = nombre.value.trim();
      C.errorEnCampo(nombre, n.length < 4 ? 'El nombre va con 4 letras o más.' : '');
      if (n.length < 4) mal.push(nombre);
      var pr = C.leerNumero(precio.value);
      var malPrecio = isNaN(pr) || pr < 0 ? 'Escribe el precio en dólares, por ejemplo 4,50.' : '';
      C.errorEnCampo(precio, malPrecio);
      if (malPrecio) mal.push(precio);
      var st = String(stock.value || '0').trim();
      var malStock = /^\d{1,6}$/.test(st) ? '' : 'El stock es un número entero (0 = sin límite).';
      C.errorEnCampo(stock, malStock);
      if (malStock) mal.push(stock);
      if (encargo.input.checked) {
        var a = parseInt(diasMin.value, 10), b = parseInt(diasMax.value, 10);
        var malPlazo = diasMin.value || diasMax.value ? (!(a > 0) || !(b > 0) || a > b ? 'El plazo va en días, el primero menor o igual.' : '') : '';
        C.errorEnCampo(diasMax, malPlazo);
        if (malPlazo) mal.push(diasMax);
      }
      var fotosMal = fotos.some(function (f) { return f.precio.value.trim() && (isNaN(C.leerNumero(f.precio.value)) || C.leerNumero(f.precio.value) < 0); });
      var opcMal = gruposOpc.some(function (g) { return !g.nombre.trim() || !g.opciones.length || g.opciones.some(function (o) { return !String(o.nombre || '').trim() || (o.precio != null && (isNaN(o.precio) || o.precio < 0)); }); });
      var ocupadas = fotos.some(function (f) { return f.zona.ocupada(); }) || gruposOpc.some(function (g) { return g.opciones.some(function (o) { return o._zona && o._zona.ocupada(); }); });
      var textos = [];
      if (mal.length) textos.push('Revisa los campos en rojo.');
      if (fotosMal) textos.push('El precio de cada foto va en dólares (o vacío).');
      if (opcMal) textos.push('Cada grupo de opciones necesita nombre y opciones con nombre.');
      if (ocupadas) textos.push('Espera a que terminen de subir las fotos.');
      C.reemplazar(errores, textos.map(function (t) { return h('p', null, t); }));
      errores.hidden = !textos.length;
      if (mal[0]) { try { mal[0].focus(); } catch (_) { /* nada */ } } else if (textos.length && errores.scrollIntoView) errores.scrollIntoView({ block: 'center' });
      return !textos.length;
    }

    function cuerpoDelProducto() {
      var usadas = fotos.filter(function (f) { return f.zona.valor(); });
      var b = {
        nombre: nombre.value.trim(), descripcion: descripcion.value.trim(), precio: C.redondo(C.leerNumero(precio.value)),
        grupoId: selGrupo.value ? Number(selGrupo.value) : null, disponible: disponible.input.checked,
        stock: parseInt(stock.value || '0', 10) || 0, edad: edad, encargo: encargo.input.checked,
        encargoDiasMin: encargo.input.checked && diasMin.value ? parseInt(diasMin.value, 10) : null,
        encargoDiasMax: encargo.input.checked && diasMax.value ? parseInt(diasMax.value, 10) : null,
        images: usadas.map(function (f) { return f.zona.valor(); }),
        imageTitles: usadas.map(function (f) { return f.titulo.value.trim(); }),
        imagePrices: usadas.map(function (f) { var n = C.leerNumero(f.precio.value); return n > 0 ? C.redondo(n) : 0; }),
      };
      if (nuevo) { b.storeId = ctx.tienda.storeId; b.companyId = companyId; }
      return b;
    }

    /** Las opciones, una por una (como la app): crear, cambiar y borrar. */
    function guardarOpciones(productId) {
      var cadena = Promise.resolve();
      gruposBorrados.forEach(function (gid) { cadena = cadena.then(function () { return C.pedir('DELETE', '/grupos-opciones/' + gid); }); });
      gruposOpc.forEach(function (g, gi) {
        var cuerpoG = { name: g.nombre.trim(), type: g.tipo, required: !!g.obligatorio, maxSelect: g.tipo === 'multiple' ? g.max : 1, sortOrder: gi };
        cadena = cadena.then(function () {
          if (g.id) return C.pedir('PATCH', '/grupos-opciones/' + g.id, cuerpoG).then(function () { return g.id; });
          return C.pedir('POST', '/productos/' + productId + '/grupos-opciones', cuerpoG).then(function (r) {
            var nid = r && ((r.group && r.group.id) || (r.grupo && r.grupo.id) || r.id);
            if (!nid) throw new Error('No se pudo guardar un grupo de opciones.');
            g.id = Number(nid);
            return g.id;
          });
        }).then(function (gid) {
          var c2 = Promise.resolve();
          g.borradas.forEach(function (oid) { c2 = c2.then(function () { return C.pedir('DELETE', '/opciones/' + oid); }); });
          g.opciones.forEach(function (o, oi) {
            var cuerpoO = { name: String(o.nombre).trim(), extraPrice: C.redondo(o.precio > 0 ? o.precio : 0), sortOrder: oi };
            if (o.imagen) cuerpoO.image = o.imagen;
            c2 = c2.then(function () {
              if (o.id) return C.pedir('PATCH', '/opciones/' + o.id, Object.assign({ image: o.imagen || '' }, cuerpoO));
              return C.pedir('POST', '/grupos-opciones/' + gid + '/opciones', cuerpoO).then(function (r) {
                var nid = r && ((r.option && r.option.id) || (r.opcion && r.opcion.id) || r.id);
                if (nid) o.id = Number(nid);
              });
            });
          });
          return c2.then(function () { g.borradas = []; });
        });
      });
      return cadena.then(function () { gruposBorrados = []; });
    }

    guardar.addEventListener('click', function () {
      if (!revisar()) return;
      var cuerpo = cuerpoDelProducto();
      var trabajo = (nuevo ? C.pedir('POST', '/productos', cuerpo) : C.pedir('PATCH', '/productos/' + p.id, cuerpo)).then(function (r) {
        var pid = nuevo ? Number((r && (r.id || (r.producto && r.producto.id))) || 0) : p.id;
        if (!pid) throw new Error('No se pudo crear el producto.');
        if (nuevo) { p.id = pid; nuevo = false; }
        return guardarOpciones(pid).then(function () { return r; });
      });
      C.trabajando(guardar, trabajo).then(function (r) {
        C.avisar((r && typeof r.aviso === 'string' && r.aviso) || 'Guardado');
        filtro.buscar = ''; filtro.grupoId = '';
        C.ir('#productos');
      }, function (e) {
        C.reemplazar(errores, h('p', null, e.message));
        errores.hidden = false;
        if (errores.scrollIntoView) errores.scrollIntoView({ block: 'center' });
      });
    });
    if (borrar) {
      borrar.addEventListener('click', function () {
        C.confirmar({ titulo: '¿Borrar este producto?', texto: 'Deja de verse en la app. Tus pedidos viejos no cambian.', si: 'Borrar', peligro: true }).then(function (si) {
          if (!si) return;
          C.trabajando(borrar, C.pedir('DELETE', '/productos/' + p.id)).then(function () { C.avisar('Producto borrado'); C.ir('#productos'); }, function (e) { C.avisar(e.message, 'mal'); });
        });
      });
    }

    C.enContenido(v, [
      h('a', { class: 'volver', href: '#productos' }, ico('atras'), 'Productos'),
      C.cabeceraDeSeccion(nuevo ? 'Nuevo producto' : 'Editar producto', nuevo ? 'Se ve en la app cuando lo guardes.' : [dato('span', null, p.nombre)]),
      errores,
      h('div', { class: 'rejilla-editor' },
        h('div', { class: 'col' },
          h('div', { class: 'tarjeta' },
            h('h2', null, 'Fotos'),
            h('p', { class: 'nota' }, 'Hasta 3. Se recortan cuadradas. Con precio, cada foto es una variante (por ejemplo, un tamaño).'),
            h('div', { class: 'fotos-producto' }, fotos.map(function (f) { return h('div', { class: 'foto-variante' }, f.zona.caja, f.titulo, f.precio); }))),
          h('div', { class: 'tarjeta' },
            h('h2', null, 'Opciones'),
            cajaOpciones)),
        h('div', { class: 'col' },
          h('div', { class: 'tarjeta' },
            h('h2', null, 'Datos'),
            C.campo('p-nombre', 'Nombre', nombre),
            C.campo('p-descripcion', 'Descripción', descripcion),
            h('div', { class: 'dos-campos' },
              h('div', null, C.campo('p-precio', 'Precio en dólares', precio), avisoCero),
              C.campo('p-grupo', 'Grupo', h('div', { class: 'con-flecha' }, selGrupo, ico('abajo'))))),
          h('div', { class: 'tarjeta' },
            h('h2', null, 'Venta'),
            h('div', { class: 'fila-interruptor' }, disponible.caja, h('small', { class: 'nota' }, 'Apágalo cuando se agote.')),
            C.campo('p-stock', 'Stock', stock, { ayuda: '0 = sin límite.' }),
            h('div', { class: 'grupo-campo' }, h('span', { class: 'etq-campo' }, 'Edad'), segEdad),
            h('div', { class: 'fila-interruptor' }, encargo.caja, h('small', { class: 'nota' }, 'No lo tienes en la tienda: llega en unos días.')),
            plazo))),
      h('div', { class: 'pie-fijo' }, h('div', { class: 'botones' }, guardar, h('a', { class: 'btn borde', href: '#productos' }, 'Cancelar'), borrar)),
    ]);
    revisarCero();
  }

  C.secciones.productos = {
    id: 'productos', titulo: 'Productos', icono: 'productos',
    visible: function (ctx) { return ctx.puede('productos'); },
    mostrar: function (ctx, sub, v) {
      if (sub[0] === 'nuevo' || /^\d+$/.test(sub[0] || '')) editor(ctx, v, sub[0]);
      else lista(ctx, v);
    },
  };
  C.productoCompleto = productoCompleto;
})(window);
