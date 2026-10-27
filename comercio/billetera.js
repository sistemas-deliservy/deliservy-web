/*
 * EL PANEL DEL COMERCIO — «Billetera» (24-oct-2026).
 *
 * Disponible y retenido (24 h por tarjeta de crédito), los movimientos por fechas, «Retirar ahora» (siempre con un
 * código por WhatsApp, a la cuenta registrada) y sus facturas con el PDF. La cuenta se ve aquí (banco, tipo y las
 * 4 últimas) y el dueño la cambia: al guardar otra, el texto dice que el retiro espera 24 h. Exportar a Excel: un
 * CSV con «;» y coma decimal, armado aquí con los movimientos que se ven. Solo el dueño.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;
  var rango = { modo: '30', desde: null, hasta: null };
  var avisoCuenta = '';
  var TIPOS = { MANAGER: 'Comisión', FLOTA: 'Flota', VENDEDOR: 'Promotores', MEMBRESIA: 'Membresía' };
  var TIPO_CUENTA = { CNTA: 'Corriente', AHORRO: 'Ahorro' };

  function lineaDeLaCuenta(cuenta) {
    var tipo = TIPO_CUENTA[cuenta.tipo] || '';
    return h('div', { class: 'txt' },
      dato('b', null, cuenta.banco || ''),
      dato('span', { class: 'cuenta-num' }, cuenta.cuentaParaVer || ''),
      h('small', null, tipo || (cuenta.tipo ? dato('span', null, cuenta.tipo) : null), (tipo || cuenta.tipo) && cuenta.titular ? ' · ' : null, cuenta.titular ? dato('span', null, cuenta.titular) : null));
  }

  /** Banco, tipo, número, titular y cédula: lo mismo que pide el API al guardar. */
  function formularioCuenta(cuenta, bancos, alCerrar) {
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var banco;
    if (bancos.length) {
      banco = h('select', { class: 'campo', id: 'c-banco', required: true }, h('option', { value: '' }, 'Elige tu banco'));
      bancos.forEach(function (b) {
        var o = dato('option', { value: b.codigo }, (b.codigo || '') + ' · ' + (b.nombre || ''));
        if (cuenta && String(cuenta.codigoBanco) === String(b.codigo)) o.selected = true;
        banco.appendChild(o);
      });
      if (cuenta && cuenta.codigoBanco && !bancos.some(function (b) { return String(b.codigo) === String(cuenta.codigoBanco); })) {
        var extra = dato('option', { value: cuenta.codigoBanco, selected: true }, cuenta.codigoBanco);
        banco.appendChild(extra);
      }
    } else {
      banco = C.entrada({ id: 'c-banco', inputmode: 'numeric', maxlength: '4', placeholder: '0191', value: cuenta && cuenta.codigoBanco ? cuenta.codigoBanco : '' });
    }
    var corriente = h('input', { type: 'radio', name: 'tipo-cuenta', value: 'CNTA' });
    var ahorro = h('input', { type: 'radio', name: 'tipo-cuenta', value: 'AHORRO' });
    if (cuenta && cuenta.tipo === 'AHORRO') ahorro.checked = true; else corriente.checked = true;
    var numero = C.entrada({ id: 'c-numero', inputmode: 'numeric', maxlength: '26', placeholder: '0191 0001 23 4567890123', autocomplete: 'off' });
    var titular = C.entrada({ id: 'c-titular', maxlength: '60', autocomplete: 'name', value: cuenta && cuenta.titular ? cuenta.titular : '' });
    var letra = h('select', { class: 'campo', id: 'c-letra', 'aria-label': 'Tipo de cédula' }, ['V', 'E', 'J', 'G'].map(function (x) { return h('option', { value: x }, x); }));
    var cedula = C.entrada({ id: 'c-cedula', inputmode: 'numeric', maxlength: '9', placeholder: '12345678' });
    var guardar = C.boton('Guardar cuenta', { class: 'btn', id: 'guardar-cuenta', type: 'submit' }, 'check');
    return h('form', { novalidate: true, onsubmit: function (ev) {
      ev.preventDefault();
      var codigo = String(banco.value || '').replace(/\D/g, '');
      var digitos = String(numero.value || '').replace(/\D/g, '');
      var nom = String(titular.value || '').trim();
      var ced = String(cedula.value || '').replace(/\D/g, '');
      var malo = !/^\d{4}$/.test(codigo) ? 'Elige tu banco.'
        : digitos.length !== 20 ? 'El número de cuenta tiene 20 números.'
          : digitos.slice(0, 4) !== codigo ? 'Ese número de cuenta no es de ese banco: los primeros 4 números son los del banco.'
            : nom.length < 2 ? 'Escribe el nombre del titular.'
              : !/^\d{6,9}$/.test(ced) ? 'Escribe la cédula del titular.' : '';
      if (malo) { error.textContent = malo; error.hidden = false; return; }
      error.hidden = true;
      C.trabajando(guardar, C.pedir('POST', '/billetera/cuenta', {
        creditorBank: codigo, creditorAccType: ahorro.checked ? 'AHORRO' : 'CNTA', creditorAccount: digitos,
        creditorName: nom, creditorID: String(letra.value) + ced,
      })).then(function (r) {
        avisoCuenta = r && r.espera24h ? 'Cuenta guardada. Por seguridad, el retiro espera 24 horas.' : 'Cuenta guardada.';
        C.avisar(avisoCuenta);
        C.mostrar();
      }, function (e) { error.textContent = e.message || 'No se pudo guardar.'; error.hidden = false; });
    } },
    C.campo('c-banco', 'Banco', banco),
    h('span', { class: 'etq-campo' }, 'Tipo de cuenta'),
    h('div', { class: 'opciones-tipo' }, h('label', { class: 'opcion-radio' }, corriente, 'Corriente'), h('label', { class: 'opcion-radio' }, ahorro, 'Ahorro')),
    C.campo('c-numero', 'Número de cuenta (20 números)', numero, { ayuda: 'Escribe los 20 números. Los primeros 4 son los del banco.' }),
    C.campo('c-titular', 'Titular', titular),
    h('div', { class: 'grupo-campo' }, h('label', { class: 'etq-campo', for: 'c-cedula' }, 'Cédula del titular'), h('div', { class: 'fila-campos' }, h('div', { class: 'con-flecha' }, letra, ico('abajo')), cedula)),
    error,
    h('div', { class: 'botones' }, guardar, cuenta ? C.boton('Cancelar', { class: 'btn borde', type: 'button', onclick: alCerrar }) : null));
  }

  function rangoDelModo(modo) {
    var hoy = C.diaCaracas();
    if (modo === '7') return { desde: C.sumarDias(hoy, -6), hasta: hoy };
    if (modo === 'mes') return { desde: C.primeroDelMes(hoy), hasta: hoy };
    if (modo === 'pasado') { var ini = C.sumarMeses(hoy.slice(0, 7), -1) + '-01'; return { desde: ini, hasta: C.ultimoDelMes(ini) }; }
    return { desde: C.sumarDias(hoy, -29), hasta: hoy };
  }

  function filaMovimiento(m) {
    var monto = C.num(m.montoBs != null ? m.montoBs : m.amount);
    var retenido = m.retenido === true || m.tipo === 'retenido';
    return h('div', { class: 'renglon' },
      h('div', { class: 'icono-mov ' + (retenido ? 'ambar' : monto >= 0 ? 'verde' : 'roja') }, ico(retenido ? 'reloj' : monto >= 0 ? 'agregar' : 'subir')),
      h('div', { class: 'txt' }, h('b', null, m.descripcion || m.texto || m.description || ''), h('small', null, C.fechaHora(m.fecha || m.createdAt),
        retenido && m.liberaEn ? [' · se libera ', C.fechaHora(m.liberaEn)] : null)),
      h('div', { class: 'monto' }, h('b', { class: retenido ? 'ambar' : monto >= 0 ? 'verde' : '' }, C.conSigno(monto, C.bolivares)), retenido ? C.pill('Retenido', 'ambar') : null));
  }

  function retirar(d, alTerminar) {
    var cuenta = d.cuentaBancaria;
    var monto = C.num(d.disponibleBs);
    var pedirCodigo = C.boton('Enviarme el código', { class: 'btn' }, 'whatsapp');
    var dlg = C.abrirDialogo({
      titulo: 'Retirar ahora',
      cuerpo: [
        h('div', { class: 'monto-retiro' }, h('small', null, 'Te enviamos'), h('b', null, C.bolivares(monto)),
          cuenta ? h('span', null, 'A tu cuenta ', dato('span', null, (cuenta.banco || '') + ' · ' + (cuenta.cuentaParaVer || ''))) : null),
        h('p', { class: 'nota' }, 'Por seguridad, te mandamos un código por WhatsApp para confirmar.'),
      ],
      pie: pedirCodigo,
    });
    pedirCodigo.addEventListener('click', function () {
      C.trabajando(pedirCodigo, C.pedir('POST', '/billetera/codigo')).then(function () {
        dlg.cerrar();
        pasoCodigo(monto, alTerminar);
      }, function (e) { C.avisar(e.message, 'mal'); });
    });
  }
  function pasoCodigo(monto, alTerminar) {
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var confirmar = C.boton('Retirar', { class: 'btn' }, 'check');
    var enviando = false;
    var enviar = function (codigo) {
      if (enviando) return;
      if (String(codigo || '').length !== 6) { error.textContent = 'El código tiene 6 números.'; error.hidden = false; return; }
      enviando = true;
      error.hidden = true;
      C.trabajando(confirmar, C.pedir('POST', '/billetera/retirar', { codigo: codigo })).then(function (r) {
        enviando = false;
        d.cerrar();
        C.abrirDialogo({
          titulo: 'Retiro enviado',
          cuerpo: h('div', { class: 'resultado-bien' }, ico('check'), h('b', null, C.bolivares(r && r.montoBs != null ? r.montoBs : monto)), r && r.mensaje ? h('p', { class: 'nota' }, r.mensaje) : null),
          pie: C.boton('Listo', { class: 'btn', onclick: function () { C.cerrarDialogos(); } }),
          alCerrar: alTerminar,
        });
      }, function (e) {
        enviando = false;
        error.textContent = e.message; error.hidden = false;
        casillas.limpiar();
        try { casillas.input.focus(); } catch (_) { /* nada */ }
      });
    };
    var casillas = C.casillasDeCodigo('codigo-retiro', enviar);
    var d = C.abrirDialogo({
      titulo: 'Escribe el código',
      cuerpo: [h('p', { class: 'bien' }, 'Te enviamos un código por WhatsApp.'), h('label', { class: 'etq-campo', for: 'codigo-retiro' }, 'Código de 6 números'), casillas.caja, error],
      pie: confirmar,
    });
    confirmar.addEventListener('click', function () { enviar(casillas.valor()); });
  }

  function pintar(ctx, v, d) {
    var cuenta = d.cuentaBancaria;
    var aviso = avisoCuenta;
    avisoCuenta = '';
    var bancos = Array.isArray(d.bancos) ? d.bancos : [];
    var editando = !cuenta;
    var tarjetaCuenta = h('div', { class: 'tarjeta' });
    var dibujarCuenta = function () {
      C.reemplazar(tarjetaCuenta, [
        h('h2', null, 'Tu cuenta bancaria'),
        aviso ? h('p', { class: 'bien' }, aviso) : null,
        cuenta ? h('div', { class: 'cuenta-banco' }, h('div', { class: 'icono-grande' }, ico('banco')), lineaDeLaCuenta(cuenta))
          : h('p', { class: 'nota' }, 'Aún no tienes cuenta bancaria. Regístrala aquí para cobrar.'),
        cuenta && !editando ? h('div', { class: 'botones' }, C.boton('Cambiar cuenta', { class: 'btn borde chico', id: 'cambiar-cuenta', onclick: function () { editando = true; aviso = ''; dibujarCuenta(); } }, 'banco')) : null,
        editando ? formularioCuenta(cuenta, bancos, function () { editando = false; dibujarCuenta(); }) : null,
      ]);
    };
    dibujarCuenta();
    var bloqueado = d.retiroBloqueadoHasta && Date.parse(d.retiroBloqueadoHasta) > Date.now();
    var disponible = C.num(d.disponibleBs);
    var movs = h('div', { class: 'lista' }, C.cargando());
    var mas = h('div', { class: 'botones centro' });
    var facturas = h('div', null, C.cargando());
    var lista = [];
    var r = rango.modo === 'otro' && rango.desde ? { desde: rango.desde, hasta: rango.hasta } : rangoDelModo(rango.modo);
    var cargarMovs = function (pagina) {
      return C.pedir('GET', '/billetera/movimientos?desde=' + r.desde + '&hasta=' + r.hasta + '&pagina=' + pagina).then(function (x) {
        if (!v.viva()) return;
        var nuevos = Array.isArray(x) ? x : (x && Array.isArray(x.movimientos) ? x.movimientos : []);
        lista = pagina === 1 ? nuevos : lista.concat(nuevos);
        C.reemplazar(movs, lista.length ? lista.map(filaMovimiento) : h('p', { class: 'nota relleno' }, 'Sin movimientos en estas fechas.'));
        C.reemplazar(mas, x && x.hayMas ? C.boton('Ver más', { class: 'btn borde chico', onclick: function (ev) { C.trabajando(ev.currentTarget, cargarMovs(pagina + 1)).catch(function (e) { C.avisar(e.message, 'mal'); }); } }) : null);
      });
    };
    var exportar = C.boton('Exportar a Excel', { class: 'btn borde chico', onclick: function () {
      if (!lista.length) { C.avisar('No hay movimientos para exportar', 'mal'); return; }
      var filas = [['Fecha', 'Hora', 'Movimiento', 'Monto (Bs)', 'Retenido']];
      lista.forEach(function (m) {
        var f = C.fechaParaCsv(m.fecha || m.createdAt);
        filas.push([f[0], f[1], m.descripcion || m.texto || '', C.num(m.montoBs != null ? m.montoBs : m.amount), m.retenido ? 'Sí' : '']);
      });
      C.descargarCsv('billetera-' + r.desde + '-a-' + r.hasta + '.csv', filas);
      C.avisar('Listo: revisa tus descargas');
    } }, 'descargar');
    var desde = C.entrada({ type: 'date', value: r.desde, max: C.diaCaracas(), 'aria-label': 'Desde' });
    var hasta = C.entrada({ type: 'date', value: r.hasta, max: C.diaCaracas(), 'aria-label': 'Hasta' });
    var aplicarFechas = function () {
      if (!desde.value || !hasta.value || desde.value > hasta.value) { C.avisar('Revisa las fechas', 'mal'); return; }
      rango = { modo: 'otro', desde: desde.value, hasta: hasta.value };
      C.mostrar();
    };
    desde.addEventListener('change', aplicarFechas);
    hasta.addEventListener('change', aplicarFechas);
    C.enContenido(v, [
      C.cabeceraDeSeccion('Billetera', 'Tu dinero en Deliservy.'),
      h('div', { class: 'rejilla dos' },
        h('div', { class: 'tarjeta saldo' },
          h('small', null, 'Disponible para retirar'),
          h('div', { class: 'grande' }, C.bolivares(disponible)),
          C.num(d.retenidoBs) > 0 ? h('div', { class: 'retenido' }, 'Retenido por tarjeta de crédito: ', C.bolivares(d.retenidoBs), d.liberaEn ? [' · se libera ', C.fechaHora(d.liberaEn)] : null) : null,
          h('div', { class: 'botones' }, C.boton('Retirar ahora', {
            class: 'btn blanco', disabled: !!bloqueado || disponible <= 0 || !cuenta,
            onclick: function () { retirar(d, function () { C.mostrar(); }); },
          }, 'banco')),
          bloqueado ? h('p', { class: 'nota' }, 'Por seguridad, el retiro espera 24 horas. Podrás retirar desde el ', C.fechaHora(d.retiroBloqueadoHasta), '.') : null,
          h('p', { class: 'nota' }, 'Pago automático: ', h('span', null, d.pagoAutomatico || 'todos los días a las 11 p. m.'), /\.\s*$/.test(d.pagoAutomatico || 'm.') ? null : '.')),
        tarjetaCuenta),
      h('div', { class: 'etq-fila' }, h('span', { class: 'etq' }, 'Movimientos'), exportar),
      h('div', { class: 'barra-filtros' },
        C.segmentos('Fechas', [['7', '7 días'], ['30', '30 días'], ['mes', 'Este mes'], ['pasado', 'Mes pasado']], rango.modo, function (m) { rango = { modo: m }; C.mostrar(); }),
        h('div', { class: 'fechas-libres' }, desde, h('span', { 'aria-hidden': 'true' }, '–'), hasta)),
      movs, mas,
      h('span', { class: 'etq' }, 'Tus facturas'),
      facturas,
    ]);
    cargarMovs(1).catch(function (e) { if (v.viva()) C.reemplazar(movs, C.tarjetaError(e, C.mostrar)); });
    var hoy = C.diaCaracas();
    C.pedir('GET', '/facturas?desde=' + C.sumarDias(hoy, -365) + '&hasta=' + hoy).then(function (x) {
      if (!v.viva()) return;
      C.reemplazar(facturas, tablaDeFacturas(Array.isArray(x) ? x : (x && x.facturas) || []));
    }, function (e) { if (v.viva()) C.reemplazar(facturas, C.tarjetaError(e)); });
  }

  /** Las facturas (de la comisión y de la flota), con su PDF. */
  function tablaDeFacturas(lista) {
    if (!lista.length) return C.vacio('Aún no tienes facturas', 'Cuando te facturemos, la verás aquí con su PDF.', null, 'pedidos');
    return h('div', { class: 'lista' }, lista.map(function (f) {
      var pdf = C.hrefSeguro(f.pdfUrl) && /^https:/.test(String(f.pdfUrl)) ? f.pdfUrl : null;
      return h('div', { class: 'renglon' },
        h('div', { class: 'icono-mov' }, ico('pedidos')),
        h('div', { class: 'txt' }, h('b', null, 'Factura ', dato('span', null, f.numero || '')), h('small', null, C.fechaCorta(f.fecha), ' · ', TIPOS[f.tipo] || dato('span', null, f.tipo || ''))),
        h('div', { class: 'monto' }, h('b', null, C.bolivares(f.totalBs)), pdf ? h('a', { class: 'enlace-mini', href: pdf, target: '_blank', rel: 'noopener noreferrer' }, ico('descargar'), 'PDF') : null));
    }));
  }
  C.tablaDeFacturas = tablaDeFacturas;

  C.secciones.billetera = {
    id: 'billetera', titulo: 'Billetera', icono: 'billetera',
    visible: function (ctx) { return ctx.esDueno && C.esDeApp(ctx.tienda); },
    mostrar: function (ctx, sub, v) {
      C.pedir('GET', '/billetera').then(function (d) { pintar(ctx, v, d || {}); }, function (e) { C.falloEnVista(v, e); });
    },
  };
})(window);
