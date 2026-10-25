/*
 * EL PANEL DEL COMERCIO — «Mi tienda» y «Trabajadores» (24-oct-2026). Solo el dueño.
 *
 * Datos (nombre, dirección, ubicación, correo, RIF, categoría; el teléfono de contacto se cambia con un código por
 * WhatsApp al número NUEVO), el horario de los 7 días (con «cerrado» por día: «cerrado» viaja como `cerrado: true`, y
 * nunca sale un 00:00–00:00 por error en un día abierto), logo, banner y marcador, la comisión de Deliservy (solo
 * lectura, con su promoción), la cuenta bancaria enmascarada (no se cambia desde la web) y «Mostrar en la app» (solo
 * para comercios de flota: si falta algo, la API dice qué). Trabajadores: nombre, WhatsApp y permisos.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;
  var ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0]; // de lunes a domingo (0 = domingo, como la app)
  var NOMBRE_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var PERMISOS = [
    ['pedidos', 'Ver pedidos'], ['pedidos_acciones', 'Marcar listos y cancelar'], ['productos', 'Productos'],
    ['estadisticas', 'Estadísticas'], ['flota_ver', 'Ver la flota'], ['flota_pedir', 'Pedir motorizados'],
  ];
  var REQUISITOS = [['productos', '3 productos con foto y precio'], ['horario', 'Horario con al menos un día abierto'], ['ubicacion', 'Ubicación de la tienda'], ['rif', 'RIF válido'], ['cuenta', 'Cuenta bancaria registrada']];

  function hhmm(t) { var m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : ''; }
  function minutos(t) { var m = /^(\d{2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; }

  /**
   * Revisa el horario escrito: [{dia, abre, cierra, cerrado}] → { horarios, errores:{dia: texto} }. Un día abierto con
   * abre = cierra sería «cerrado» para la base (regla de `vw_company`): se pide marcarlo cerrado o cambiar las horas.
   */
  function revisarHorario(filas) {
    var errores = {};
    var horarios = filas.map(function (f) {
      if (f.cerrado) return { dia: f.dia, abre: hhmm(f.abre) || '00:00', cierra: hhmm(f.cierra) || '00:00', cerrado: true };
      var a = hhmm(f.abre), c = hhmm(f.cierra);
      if (!a || !c || isNaN(minutos(a)) || isNaN(minutos(c))) errores[f.dia] = 'Escribe la hora de abrir y la de cerrar.';
      else if (a === c) errores[f.dia] = 'Abrir y cerrar a la misma hora es «cerrado». Cambia una hora o márcalo cerrado.';
      return { dia: f.dia, abre: a, cierra: c, cerrado: false };
    });
    return { horarios: horarios, errores: errores, hayErrores: Object.keys(errores).length > 0 };
  }
  C.revisarHorario = revisarHorario;

  function pestanas(actual) {
    var t = function (id, texto, icono) { return h('a', { class: 'pestana', href: '#tienda' + (id === 'datos' ? '' : '/' + id), 'aria-current': actual === id ? 'page' : null }, ico(icono), h('span', null, texto)); };
    return h('nav', { class: 'pestanas', 'aria-label': 'Mi tienda' }, t('datos', 'Datos', 'tienda'), t('horario', 'Horario', 'reloj'), t('imagenes', 'Imágenes', 'foto'), t('trabajadores', 'Trabajadores', 'personas'));
  }

  // ── Comisión, cuenta y «Mostrar en la app» ─────────────────────────────────

  function tarjetaComision(t) {
    var pct = C.num(t.comisionPct);
    var promo = t.comisionPromo && typeof t.comisionPromo === 'object' ? t.comisionPromo : null;
    if (t.cobroPorProducto) {
      return h('div', { class: 'tarjeta comision' },
        h('h2', null, 'Lo que te cobra Deliservy'),
        h('div', { class: 'comision-grande' }, h('small', null, 'En todos tus pedidos'), h('b', { class: 'mediano' }, 'Por producto')),
        h('p', { class: 'nota' }, 'Mira cuánto y tu membresía en ', h('a', { href: '#plan' }, 'Mi plan'), '.'));
    }
    return h('div', { class: 'tarjeta comision' },
      h('h2', null, 'Comisión de Deliservy'),
      h('div', { class: 'comision-grande' }, h('small', null, 'En la app te cobra'), h('b', null, C.porcentaje(promo ? promo.pct : pct))),
      promo ? h('p', { class: 'bien' }, C.porcentaje(promo.pct), ' hasta el ', C.diaMes(promo.hasta), ', luego ', C.porcentaje(promo.luegoPct)) : h('p', { class: 'nota' }, 'Por cada venta entregada.'),
      h('p', { class: 'nota' }, 'En la tienda web y con promotores, cobra por producto: ', h('a', { href: '#plan' }, 'Mi plan'), '.'),
      h('p', { class: 'nota' }, 'La pone Deliservy. Si tienes dudas, escríbenos.'));
  }
  function tarjetaCuenta(cuenta) {
    return h('div', { class: 'tarjeta' },
      h('h2', null, 'Cuenta para cobrar'),
      cuenta ? h('div', { class: 'cuenta-banco' }, h('div', { class: 'icono-grande' }, ico('banco')),
        h('div', { class: 'txt' }, dato('b', null, cuenta.banco || ''), dato('span', { class: 'cuenta-num' }, cuenta.cuentaParaVer || ''), dato('small', null, cuenta.titular || '')))
        : h('p', { class: 'nota' }, 'Aún no tienes cuenta bancaria.'),
      h('p', { class: 'nota' }, ico('candado'), ' Por seguridad, la cuenta solo se cambia desde la app.'));
  }
  function requisitoOk(r) { return r === true || (r && typeof r === 'object' && r.ok === true); }

  function tarjetaMostrar(ctx, t) {
    if (!t.tieneFlota && !(ctx.tienda && ctx.tienda.flota)) return null;
    var visible = t.visibleEnApp === true;
    var req = t.requisitos || {};
    var faltanCaja = h('div', { class: 'faltan', role: 'alert', hidden: true });
    var sw = C.interruptor('mostrar-app', visible, 'Mostrar en la app', function (on, input) {
      var hacer = function () {
        input.disabled = true;
        faltanCaja.hidden = true;
        C.pedir('POST', '/tienda/' + t.storeId + '/mostrar-en-app', { mostrar: on }).then(function () {
          input.disabled = false;
          C.avisar(on ? 'Tu tienda ya se ve en la app' : 'Tu tienda ya no se ve en la app');
          C.recargarCuenta().then(function () { C.mostrar(); }, function () { C.mostrar(); });
        }, function (e) {
          input.disabled = false;
          input.checked = !on;
          var faltan = e.datos && Array.isArray(e.datos.faltan) ? e.datos.faltan.filter(function (x) { return typeof x === 'string'; }) : [];
          C.reemplazar(faltanCaja, [h('b', null, faltan.length ? 'Antes de mostrarte, te falta:' : e.message),
            faltan.length ? h('ul', null, faltan.map(function (f) { return h('li', null, dato('span', null, f)); })) : null]);
          faltanCaja.hidden = false;
        });
      };
      if (!on) {
        C.confirmar({ titulo: '¿Ocultar tu tienda de la app?', texto: 'Los clientes dejarán de verla. Tu flota sigue igual.', si: 'Ocultar' }).then(function (si) { if (si) hacer(); else input.checked = true; });
      } else hacer();
    });
    return h('div', { class: 'tarjeta mostrar-app' + (visible ? ' encendido' : '') },
      h('div', { class: 'cab-tarjeta' }, h('h2', null, 'Tu tienda en la app'), sw.caja),
      h('p', { class: 'nota' }, visible ? 'Los clientes te ven y te piden por la app.' : 'Hoy solo usas la flota. Muéstrate en la app y vende más.'),
      visible ? null : h('ul', { class: 'requisitos' }, REQUISITOS.map(function (r) {
        var ok = requisitoOk(req[r[0]]);
        return h('li', { class: ok ? 'ok' : 'falta' }, ico(ok ? 'check' : 'x'), h('span', null, r[1]));
      })),
      faltanCaja);
  }

  // ── Datos ──────────────────────────────────────────────────────────────────

  function datos(ctx, v, t) {
    var nombre = C.entrada({ id: 't-nombre', value: t.nombre || '', maxlength: '60' });
    var direccion = C.entrada({ id: 't-direccion', value: t.direccion || '', maxlength: '200' });
    var correo = C.entrada({ id: 't-correo', type: 'email', inputmode: 'email', value: t.correo || '', maxlength: '120' });
    var rif = C.entrada({ id: 't-rif', value: t.rifParaVer || t.rif || '', maxlength: '14', placeholder: 'J-504754129', autocapitalize: 'characters' });
    var categorias = Array.isArray(t.categorias) ? t.categorias : [];
    var categoria = categorias.length ? h('select', { class: 'campo', id: 't-categoria', 'data-idioma': 'no' }, categorias.map(function (c) {
      var o = h('option', { value: String(c.id) }, c.nombre || c.name || '');
      if (t.categoria && Number(t.categoria.id) === Number(c.id)) o.selected = true;
      return o;
    })) : null;
    var ubic = t.ubicacion && C.mapa.valido(t.ubicacion) ? { lat: Number(t.ubicacion.lat), lng: Number(t.ubicacion.lng) } : null;
    var ubicNueva = null;
    var mapaCaja = h('div', { class: 'mapa mapa-tienda' });
    var textoUbic = h('p', { class: 'ayuda' }, ubic ? 'Arrastra el pin o toca el mapa para moverla.' : 'Toca el mapa donde está tu tienda.');
    var errores = h('div', { class: 'errores-form', role: 'alert', hidden: true });
    var guardar = C.boton('Guardar cambios', { class: 'btn' }, 'check');
    var m = null;
    var moverA = function (lat, lng) {
      ubicNueva = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      if (m) m.marcador('tienda', 'tienda', ubicNueva, { arrastrable: true, alSoltar: moverA });
      textoUbic.textContent = 'Nueva ubicación marcada. Toca «Guardar cambios».';
    };
    var buscador = C.mapa.buscador({ cerca: function () { return ubicNueva || ubic; }, alElegir: function (p) { moverA(p.lat, p.lng); if (m) m.irA(p, 17); } });
    guardar.addEventListener('click', function () {
      var cuerpo = {};
      var mal = [];
      var n = nombre.value.trim();
      C.errorEnCampo(nombre, n.length < 3 ? 'El nombre va con 3 letras o más.' : '');
      if (n.length < 3) mal.push(nombre);
      if (n !== (t.nombre || '')) cuerpo.nombre = n;
      var dirTxt = direccion.value.trim();
      C.errorEnCampo(direccion, dirTxt.length < 8 ? 'Escribe la dirección completa.' : '');
      if (dirTxt.length < 8) mal.push(direccion);
      if (dirTxt !== (t.direccion || '')) cuerpo.direccion = dirTxt;
      var c = correo.value.trim().toLowerCase();
      var malCorreo = c && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(c) ? 'Escribe un correo válido.' : '';
      C.errorEnCampo(correo, malCorreo);
      if (malCorreo) mal.push(correo);
      if (c !== (t.correo || '')) cuerpo.correo = c;
      var r = rif.value.toUpperCase().replace(/[\s.\-]/g, '');
      var antes = String(t.rif || t.rifParaVer || '').toUpperCase().replace(/[\s.\-]/g, '');
      var malRif = r && !/^[JGVE]\d{9}$/.test(r) ? 'El RIF va con su letra y 9 números, por ejemplo J-504754129.' : '';
      C.errorEnCampo(rif, malRif);
      if (malRif) mal.push(rif);
      if (r && r !== antes) cuerpo.rif = r;
      if (categoria && (!t.categoria || String(t.categoria.id) !== categoria.value)) cuerpo.categoriaId = Number(categoria.value);
      if (ubicNueva) cuerpo.ubicacion = ubicNueva;
      if (mal.length) { try { mal[0].focus(); } catch (_) { /* nada */ } return; }
      if (!Object.keys(cuerpo).length) { C.avisar('No cambiaste nada'); return; }
      errores.hidden = true;
      C.trabajando(guardar, C.pedir('PATCH', '/tienda/' + t.storeId, cuerpo)).then(function () {
        C.avisar('Guardado');
        if (cuerpo.nombre) C.recargarCuenta().then(C.mostrar, C.mostrar); else C.mostrar();
      }, function (e) { C.reemplazar(errores, h('p', null, e.message)); errores.hidden = false; });
    });
    var telefono = h('div', { class: 'fila-telefono' }, dato('b', { class: 'sin-cortes' }, t.telefono || '—'),
      C.boton('Cambiar', { class: 'btn borde chico', onclick: function () { cambiarTelefono(t); } }));
    var contenido = [
      h('div', { class: 'rejilla-editor' },
        h('div', { class: 'col' },
          h('div', { class: 'tarjeta' },
            h('h2', null, 'Datos de tu tienda'),
            errores,
            C.campo('t-nombre', 'Nombre', nombre),
            C.campo('t-direccion', 'Dirección', direccion),
            h('div', { class: 'dos-campos' }, C.campo('t-correo', 'Correo', correo), C.campo('t-rif', 'RIF', rif)),
            categoria ? C.campo('t-categoria', 'Categoría', h('div', { class: 'con-flecha' }, categoria, ico('abajo'))) : (t.categoria ? h('div', { class: 'grupo-campo' }, h('span', { class: 'etq-campo' }, 'Categoría'), dato('p', { class: 'dato-fijo' }, t.categoria.nombre || '')) : null),
            h('div', { class: 'grupo-campo' }, h('span', { class: 'etq-campo' }, 'Teléfono de contacto'), telefono, h('p', { class: 'ayuda' }, 'Para cambiarlo te mandamos un código al número nuevo.')),
            h('div', { class: 'grupo-campo' }, h('span', { class: 'etq-campo' }, 'Ubicación'), buscador.caja, mapaCaja, textoUbic),
            h('div', { class: 'botones' }, guardar))),
        h('div', { class: 'col' }, tarjetaMostrar(ctx, t), tarjetaComision(t), tarjetaCuenta(t.cuentaBancaria))),
    ];
    C.enContenido(v, [C.cabeceraDeSeccion('Mi tienda', [dato('span', null, t.nombre || '')]), pestanas('datos')].concat(contenido));
    C.mapa.crear(mapaCaja, { centro: ubic, zoom: ubic ? 16 : 12 }).then(function (mm) {
      if (!v.viva()) { mm.quitar(); return; }
      m = mm;
      v.alSalir(function () { mm.quitar(); });
      if (ubic) mm.marcador('tienda', 'tienda', ubic, { arrastrable: true, alSoltar: moverA });
      mm.alTocar(function (lat, lng) { moverA(lat, lng); });
    }, function () { textoUbic.textContent = 'El mapa no cargó: busca tu dirección.'; });
  }

  /** El teléfono de contacto: código por WhatsApp al número NUEVO y luego `PATCH {contacto, codigo}`. */
  function cambiarTelefono(t) {
    var tel = C.entrada({ id: 'tel-nuevo', type: 'tel', inputmode: 'tel', maxlength: '16', placeholder: '0412 555 0198' });
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var enviar = C.boton('Enviarme el código', { class: 'btn' }, 'whatsapp');
    var d = C.abrirDialogo({ titulo: 'Cambiar el teléfono', cuerpo: [h('p', { class: 'nota' }, 'Te mandamos un código por WhatsApp al número nuevo.'), C.campo('tel-nuevo', 'Número nuevo', tel), error], pie: enviar });
    enviar.addEventListener('click', function () {
      var val = tel.value.trim();
      if (!C.telefonoValido(val)) { error.textContent = 'Escribe un número, por ejemplo 0412-555-0198.'; error.hidden = false; return; }
      error.hidden = true;
      C.trabajando(enviar, C.pedir('POST', '/tienda/' + t.storeId + '/codigo-telefono', { contacto: val.replace(/\D/g, '') })).then(function () {
        d.cerrar();
        var err2 = h('p', { class: 'error', role: 'alert', hidden: true });
        var confirmar = C.boton('Confirmar', { class: 'btn' }, 'check');
        var mandar = function (codigo) {
          if (String(codigo).length !== 6) { err2.textContent = 'El código tiene 6 números.'; err2.hidden = false; return; }
          C.trabajando(confirmar, C.pedir('PATCH', '/tienda/' + t.storeId, { contacto: val.replace(/\D/g, ''), codigo: codigo })).then(function () {
            d2.cerrar();
            C.avisar('Teléfono cambiado');
            C.mostrar();
          }, function (e) { err2.textContent = e.message; err2.hidden = false; casillas.limpiar(); });
        };
        var casillas = C.casillasDeCodigo('codigo-telefono', mandar);
        var d2 = C.abrirDialogo({ titulo: 'Escribe el código', cuerpo: [h('p', { class: 'bien' }, 'Te enviamos un código por WhatsApp al ', dato('span', { class: 'sin-cortes' }, C.telefonoParaVer(val)), '.'), casillas.caja, err2], pie: confirmar });
        confirmar.addEventListener('click', function () { mandar(casillas.valor()); });
      }, function (e) { error.textContent = e.message; error.hidden = false; });
    });
  }

  // ── Horario ────────────────────────────────────────────────────────────────

  function horario(ctx, v, t) {
    var porDia = {};
    (Array.isArray(t.horarios) ? t.horarios : []).forEach(function (x) {
      var dia = Math.round(C.num(x.dia != null ? x.dia : x.day));
      var a = hhmm(x.abre != null ? x.abre : x.open), c = hhmm(x.cierra != null ? x.cierra : x.close);
      porDia[dia] = { dia: dia, abre: a || '08:00', cierra: c || '18:00', cerrado: x.cerrado === true || (x.cerrado == null && a && a === c) };
    });
    var filas = ORDEN_DIAS.map(function (dia) {
      var x = porDia[dia] || { dia: dia, abre: '08:00', cierra: '18:00', cerrado: true };
      if (x.cerrado && x.abre === x.cierra) { x.abre = '08:00'; x.cierra = '18:00'; } // al abrirlo, unas horas que sirvan
      var abre = C.entrada({ type: 'time', value: x.abre, step: '900', 'aria-label': 'Abre el ' + NOMBRE_DIA[dia].toLowerCase(), disabled: x.cerrado });
      var cierra = C.entrada({ type: 'time', value: x.cierra, step: '900', 'aria-label': 'Cierra el ' + NOMBRE_DIA[dia].toLowerCase(), disabled: x.cerrado });
      var nota = h('small', { class: 'nota-dia' });
      var error = h('p', { class: 'error-campo', role: 'alert', hidden: true });
      var sw = C.interruptor('abierto-' + dia, !x.cerrado, null, function (on) { abre.disabled = !on; cierra.disabled = !on; fila.classList.toggle('cerrado', !on); notar(); }, { clase: 'chico' });
      sw.input.setAttribute('aria-label', 'Abierto el ' + NOMBRE_DIA[dia].toLowerCase());
      var etiquetaEstado = h('span', { class: 'estado-dia' });
      var notar = function () {
        var on = sw.input.checked;
        etiquetaEstado.textContent = on ? 'Abierto' : 'Cerrado';
        var a = abre.value, c = cierra.value;
        nota.textContent = on && a && c && a > c ? 'Cierra al día siguiente' : on && a === '00:00' && c === '23:59' ? 'Todo el día' : '';
        error.hidden = true;
      };
      abre.addEventListener('input', notar);
      cierra.addEventListener('input', notar);
      var fila = h('div', { class: 'fila-horario' + (x.cerrado ? ' cerrado' : '') },
        h('div', { class: 'dia' }, h('b', null, NOMBRE_DIA[dia]), h('div', { class: 'dia-sw' }, sw.caja, etiquetaEstado)),
        h('div', { class: 'horas' }, abre, h('span', { class: 'guion', 'aria-hidden': 'true' }, '–'), cierra),
        h('div', { class: 'notas' }, nota, error));
      notar();
      return { dia: dia, fila: fila, abre: abre, cierra: cierra, sw: sw, error: error, notar: notar };
    });
    var errorGeneral = h('p', { class: 'error', role: 'alert', hidden: true });
    var guardar = C.boton('Guardar horario', { class: 'btn' }, 'check');
    var copiar = C.boton('Copiar el lunes a todos', { class: 'btn borde chico', onclick: function () {
      var l = filas[0];
      filas.slice(1).forEach(function (f) {
        f.abre.value = l.abre.value; f.cierra.value = l.cierra.value;
        f.sw.input.checked = l.sw.input.checked;
        f.abre.disabled = f.cierra.disabled = !l.sw.input.checked;
        f.fila.classList.toggle('cerrado', !l.sw.input.checked);
        f.notar();
      });
      C.avisar('Copiado a todos los días');
    } }, 'copiar');
    guardar.addEventListener('click', function () {
      var r = revisarHorario(filas.map(function (f) { return { dia: f.dia, abre: f.abre.value, cierra: f.cierra.value, cerrado: !f.sw.input.checked }; }));
      filas.forEach(function (f) { var e = r.errores[f.dia]; f.error.textContent = e || ''; f.error.hidden = !e; });
      if (r.hayErrores) { errorGeneral.textContent = 'Revisa los días marcados.'; errorGeneral.hidden = false; return; }
      errorGeneral.hidden = true;
      var ordenados = r.horarios.slice().sort(function (a, b) { return a.dia - b.dia; });
      C.trabajando(guardar, C.pedir('PUT', '/tienda/' + t.storeId + '/horarios', ordenados)).then(function () { C.avisar('Horario guardado'); }, function (e) { errorGeneral.textContent = e.message; errorGeneral.hidden = false; });
    });
    C.enContenido(v, [
      C.cabeceraDeSeccion('Mi tienda', [dato('span', null, t.nombre || '')]), pestanas('horario'),
      h('div', { class: 'tarjeta' },
        h('div', { class: 'cab-tarjeta' }, h('h2', null, 'Horario'), copiar),
        h('p', { class: 'nota' }, 'Hora de Venezuela. Si cierras después de medianoche, pon la hora del día siguiente (por ejemplo, 18:00 a 01:00).'),
        h('div', { class: 'horario' }, filas.map(function (f) { return f.fila; })),
        errorGeneral,
        h('div', { class: 'botones' }, guardar)),
    ]);
  }

  // ── Imágenes ───────────────────────────────────────────────────────────────

  function imagenes(ctx, v, t) {
    var zona = function (clave, titulo, nota) {
      var z = C.fotos.zona({ tipo: clave, companyId: t.companyId, url: t[clave], rotulo: titulo, sinQuitar: true, alCambiar: function (url) {
        if (!url) return;
        var cuerpo = {};
        cuerpo[clave] = url;
        C.pedir('PATCH', '/tienda/' + t.companyId + '/imagenes', cuerpo).then(function () { C.avisar('Guardado'); if (clave === 'logo') C.recargarCuenta().then(null, function () { return null; }); },
          function (e) { C.avisar(e.message, 'mal'); });
      } });
      return h('div', { class: 'tarjeta imagen-tienda' }, h('h2', null, titulo), h('p', { class: 'nota' }, nota), z.caja);
    };
    C.enContenido(v, [
      C.cabeceraDeSeccion('Mi tienda', [dato('span', null, t.nombre || '')]), pestanas('imagenes'),
      h('p', { class: 'sub' }, 'Se recortan cuadradas y se guardan al momento.'),
      h('div', { class: 'rejilla tres' },
        zona('logo', 'Logo', 'Se ve redondo en la app.'),
        zona('banner', 'Banner', 'Arriba de tu tienda en la app.'),
        zona('marcador', 'Marcador', 'Tu pin en el mapa de la app.')),
    ]);
  }

  // ── Trabajadores ───────────────────────────────────────────────────────────

  function trabajadores(ctx, v, t) {
    var lista = h('div', { class: 'lista' }, C.cargando());
    var cargar = function () {
      C.pedir('GET', '/trabajadores').then(function (x) {
        if (!v.viva()) return;
        var arr = Array.isArray(x) ? x : (x && Array.isArray(x.trabajadores) ? x.trabajadores : []);
        C.reemplazar(lista, arr.length ? arr.map(function (w) {
          var permisos = Array.isArray(w.permisos) ? w.permisos : [];
          return h('div', { class: 'renglon trabajador' + (w.activo === false ? ' inactivo' : '') },
            dato('span', { class: 'inicial' }, C.inicial(w.nombre)),
            h('div', { class: 'txt' }, dato('b', null, w.nombre || ''), dato('small', null, C.telefonoParaVer(w.telefono)),
              h('div', { class: 'chips' }, w.activo === false ? C.pill('Desactivado', 'gris') : null,
                PERMISOS.filter(function (p) { return permisos.indexOf(p[0]) >= 0; }).map(function (p) { return C.pill(p[1], 'azul'); }))),
            h('div', { class: 'acciones-fila' },
              h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Editar', onclick: function () { formularioTrabajador(w, cargar); } }, ico('editar')),
              h('button', { class: 'boton-icono peligro', type: 'button', 'aria-label': 'Borrar', onclick: function () {
                C.confirmar({ titulo: '¿Borrar a este trabajador?', texto: 'Ya no podrá entrar al panel.', si: 'Borrar', peligro: true }).then(function (si) {
                  if (!si) return;
                  C.pedir('DELETE', '/trabajadores/' + w.id).then(function () { C.avisar('Trabajador borrado'); cargar(); }, function (e) { C.avisar(e.message, 'mal'); });
                });
              } }, ico('borrar'))));
        }) : h('p', { class: 'nota relleno' }, 'Aún no tienes trabajadores.'));
      }, function (e) { if (v.viva()) C.reemplazar(lista, C.tarjetaError(e, cargar)); });
    };
    C.enContenido(v, [
      C.cabeceraDeSeccion('Mi tienda', [dato('span', null, t.nombre || '')]), pestanas('trabajadores'),
      h('div', { class: 'tarjeta' },
        h('div', { class: 'cab-tarjeta' }, h('h2', null, 'Trabajadores'), C.boton('Agregar trabajador', { class: 'btn chico', onclick: function () { formularioTrabajador(null, cargar); } }, 'agregar')),
        h('p', { class: 'nota' }, 'Entran con su WhatsApp y solo ven lo que marques. Nunca ven tu dinero ni tus datos.'),
        lista),
    ]);
    cargar();
  }

  function formularioTrabajador(w, alGuardar) {
    var nombre = C.entrada({ id: 'w-nombre', value: w ? w.nombre : '', maxlength: '80', placeholder: 'Nombre y apellido' });
    var tel = C.entrada({ id: 'w-telefono', type: 'tel', inputmode: 'tel', value: w ? C.telefonoParaVer(w.telefono) : '', maxlength: '16', placeholder: '0412 555 0198' });
    var actuales = w && Array.isArray(w.permisos) ? w.permisos : ['pedidos'];
    var casillas = PERMISOS.map(function (p) {
      var input = h('input', { type: 'checkbox', value: p[0], checked: actuales.indexOf(p[0]) >= 0, id: 'perm-' + p[0] });
      return { p: p, input: input, caja: h('label', { class: 'casilla', for: 'perm-' + p[0] }, input, h('span', null, p[1])) };
    });
    var activo = w ? C.interruptor('w-activo', w.activo !== false, 'Activo') : null;
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var guardar = C.boton(w ? 'Guardar' : 'Agregar', { class: 'btn' }, 'check');
    var d = C.abrirDialogo({
      titulo: w ? 'Editar trabajador' : 'Nuevo trabajador',
      cuerpo: [C.campo('w-nombre', 'Nombre', nombre), C.campo('w-telefono', 'WhatsApp', tel, { ayuda: 'Con este número entra al panel.' }),
        h('span', { class: 'etq-campo' }, 'Qué puede hacer'), h('div', { class: 'casillas-permisos' }, casillas.map(function (c) { return c.caja; })),
        h('p', { class: 'nota' }, 'Nunca: billetera, retiros, facturas, datos de la tienda ni trabajadores.'),
        activo ? activo.caja : null,
        w ? h('p', { class: 'ayuda' }, 'Si cambias sus permisos, tendrá que entrar otra vez.') : null,
        error],
      pie: guardar,
    });
    guardar.addEventListener('click', function () {
      var n = nombre.value.trim();
      var permisos = casillas.filter(function (c) { return c.input.checked; }).map(function (c) { return c.p[0]; });
      var mal = n.length < 2 ? 'Escribe el nombre.' : !C.telefonoValido(tel.value) ? 'Escribe un WhatsApp, por ejemplo 0412-555-0198.' : !permisos.length ? 'Marca al menos un permiso.' : '';
      if (mal) { error.textContent = mal; error.hidden = false; return; }
      var cuerpo = { nombre: n, telefono: tel.value.replace(/\D/g, ''), permisos: permisos };
      if (activo) cuerpo.activo = activo.input.checked;
      C.trabajando(guardar, w ? C.pedir('PATCH', '/trabajadores/' + w.id, cuerpo) : C.pedir('POST', '/trabajadores', cuerpo)).then(function () {
        d.cerrar();
        C.avisar(w ? 'Guardado' : 'Trabajador agregado');
        if (alGuardar) alGuardar();
      }, function (e) { error.textContent = e.message; error.hidden = false; });
    });
  }

  C.secciones.tienda = {
    id: 'tienda', titulo: 'Mi tienda', icono: 'tienda',
    visible: function (ctx) { return ctx.esDueno; },
    mostrar: function (ctx, sub, v) {
      var s = sub[0] || 'datos';
      if (s === 'trabajadores') { trabajadores(ctx, v, { nombre: ctx.tienda.nombre }); return; }
      C.pedir('GET', '/tienda/' + encodeURIComponent(ctx.tienda.storeId)).then(function (t) {
        t = t || {};
        if (t.storeId == null) t.storeId = ctx.tienda.storeId;
        if (t.companyId == null) t.companyId = ctx.tienda.companyId;
        if (s === 'horario') horario(ctx, v, t);
        else if (s === 'imagenes') imagenes(ctx, v, t);
        else datos(ctx, v, t);
      }, function (e) { C.falloEnVista(v, e); });
    },
  };
})(window);
