/*
 * EL PANEL DEL COMERCIO — «Hoy» y «Pedidos» (24-oct-2026).
 *
 * Hoy: los pedidos en curso, las ventas de hoy, el saldo y, si es de flota, «Debes 12,23 $ · vence el jueves».
 * Pedidos: en curso (con las devoluciones y su código), el historial por día, semana o mes, el calendario del mes y
 * el detalle de cada pedido: productos con sus opciones y notas, los datos para la factura con «Copiar», el
 * repartidor (en el mapa mientras va), lo que pasó, y la ganancia DE VERDAD. Las acciones son las de la app:
 * «Listo para recoger» y «No puedo preparar este pedido» (con su 10 %). La tienda no acepta ni rechaza pedidos.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var h = C.h, dato = C.dato, ico = C.ico;

  function q(ctx) { return 'storeId=' + encodeURIComponent(ctx.tienda.storeId); }

  // ── Un pedido en una lista ─────────────────────────────────────────────────

  function filaDePedido(x, o) {
    o = o || {};
    var p = C.resumenDePedido(x);
    var visto = C.pedidoVisto(p.id) && C.pedidosPendientes().indexOf(p.id) < 0;
    var est = C.estadoDelPedido(p.estado, p.paraRecoger, visto);
    var lineas = String(p.comanda || '').split('\n').filter(Boolean);
    var cartel = p.cartel && p.cartel.titulo && (p.repartidor || p.estado >= 100) ? h('span', { class: 'cartel-linea' }, ico('moto'), dato('span', null, p.cartel.titulo)) : null;
    return h('a', { class: 'fila-pedido' + (est[0] === 'Nuevo' ? ' es-nuevo' : ''), href: '#pedidos/' + p.id },
      h('div', { class: 'fp-cab' },
        h('b', { class: 'fp-num' }, '#' + p.id),
        C.pill(est[0], est[1]),
        p.paraRecoger ? C.pill('Para recoger', 'azul') : null,
        p.canalTexto ? h('span', { class: 'pill' }, p.canalTexto) : null,
        h('span', { class: 'fp-hora' }, o.conFecha ? C.fechaHora(p.creadoEn) : C.hora(p.creadoEn))),
      h('div', { class: 'fp-cuerpo' },
        h('div', { class: 'fp-comanda' }, lineas.slice(0, 3).map(function (l) { return dato('span', null, l); }),
          lineas.length > 3 ? h('span', { class: 'mas-lineas' }, '+' + (lineas.length - 3) + ' más') : null),
        h('div', { class: 'fp-monto' }, h('b', null, C.dolares(p.totalUsd)),
          p.gananciaUsd != null && p.estado < 400 ? h('small', null, 'Ganas ', C.dolares(p.gananciaUsd)) : null)),
      h('div', { class: 'fp-pie' }, p.cliente ? dato('span', { class: 'fp-cliente' }, p.cliente) : null, cartel,
        !cartel && p.repartidor ? h('span', { class: 'cartel-linea' }, ico('moto'), dato('span', null, p.repartidor)) : null));
  }

  // ── Hoy ────────────────────────────────────────────────────────────────────

  function tarjetaDeuda(ctx, f) {
    if (!f) return null;
    var debe = C.num(f.debeUsd);
    var alDia = debe <= 0.004;
    return h('div', { class: 'tarjeta deuda' + (f.pausado ? ' pausada' : alDia ? ' al-dia' : '') },
      h('div', { class: 'deuda-txt' },
        h('small', null, 'Flota'),
        alDia ? h('b', { class: 'grande' }, 'Estás al día') : h('b', { class: 'grande' }, 'Debes ', h('span', { class: 'sin-cortes' }, C.dolares(debe))),
        f.pausado ? h('p', null, 'Tu servicio está pausado. Paga para seguir pidiendo.')
          : !alDia && f.venceEn ? h('p', null, 'Vence el ', C.diaYFecha(f.venceEn)) : null),
      h('div', { class: 'botones' },
        !alDia && ctx.esDueno ? h('a', { class: 'btn blanco chico', href: '#flota/pagar' }, 'Pagar') : null,
        h('a', { class: 'btn borde-blanco chico', href: '#flota' }, 'Ver flota')));
  }

  function tarjetaSaldo(s) {
    if (!s) return null;
    return h('div', { class: 'tarjeta saldo-hoy' },
      h('small', null, 'Disponible para retirar'),
      h('b', { class: 'grande' }, C.bolivares(s.disponibleBs)),
      C.num(s.retenidoBs) > 0 ? h('p', { class: 'nota' }, 'Retenido: ', C.bolivares(s.retenidoBs), s.liberaEn ? [' · se libera ', C.fechaHora(s.liberaEn)] : null) : null,
      h('div', { class: 'botones' }, h('a', { class: 'btn borde chico', href: '#billetera' }, ico('billetera'), 'Ir a Billetera')));
  }

  function pintarHoy(ctx, v, d) {
    var nombre = String((ctx.cuenta && ctx.cuenta.nombre) || '').split(' ')[0];
    var deApp = C.esDeApp(ctx.tienda);
    var verPedidos = ctx.puede('pedidos') && deApp;
    var vh = d.ventasHoy || {};
    var enCurso = Array.isArray(d.pedidosEnCurso) ? d.pedidosEnCurso : [];
    var lista;
    if (verPedidos) {
      lista = [
        h('div', { class: 'etq-fila' }, h('span', { class: 'etq' }, 'Pedidos en curso'), enCurso.length ? h('a', { class: 'enlace-mini', href: '#pedidos' }, 'Ver todos') : null),
        enCurso.length ? h('div', { class: 'lista-pedidos' }, enCurso.map(function (p) { return filaDePedido(p); }))
          : C.vacio('No tienes pedidos en curso', 'Cuando llegue uno, suena y lo ves aquí.', null, 'pedidos'),
      ];
    }
    C.enContenido(v, [
      C.cabeceraDeSeccion(['Hola, ', dato('span', null, nombre)], [dato('span', null, ctx.tienda.nombre), ' · ', C.diaYFecha(new Date())]),
      C.tarjetaPermisoDeAvisos(),
      h('div', { class: 'rejilla-hoy' },
        tarjetaDeuda(ctx, d.flota),
        deApp ? h('div', { class: 'tarjeta' },
          h('h2', null, 'Ventas de hoy'),
          h('div', { class: 'cifras' },
            C.cifra('Vendido', C.dolares(vh.ventasUsd)),
            C.cifra('Pedidos', String(Math.round(C.num(vh.pedidos)))),
            C.cifra('Tu ganancia', C.dolares(vh.gananciaUsd), 'verde'))) : null,
        tarjetaSaldo(d.saldo),
        !deApp && ctx.tienda.flota && ctx.puede('flota_pedir') ? h('div', { class: 'tarjeta accion-flota' },
          h('div', { class: 'icono-grande' }, ico('moto')),
          h('div', { class: 'txt' }, h('b', null, 'Pide un motorizado'), h('p', { class: 'nota' }, 'Marca el punto en el mapa o escríbele a Alisa.')),
          h('a', { class: 'btn chico', href: '#flota/pedir' }, 'Pedir motorizado')) : null,
        !deApp ? h('div', { class: 'tarjeta accion-flota' },
          h('div', { class: 'icono-grande' }, ico('productos')),
          h('div', { class: 'txt' }, h('b', null, 'Prepara tu catálogo'), h('p', { class: 'nota' }, 'Carga productos y fotos. Cuando quieras, muéstrate en la app.')),
          ctx.puede('productos') ? h('a', { class: 'btn borde chico', href: '#productos' }, 'Ver productos') : null) : null),
      lista,
    ]);
  }

  C.secciones.hoy = {
    id: 'hoy', titulo: 'Hoy', icono: 'hoy',
    visible: function () { return true; },
    mostrar: function (ctx, sub, v) {
      var cargar = function () {
        C.pedir('GET', '/hoy?' + q(ctx)).then(function (d) { pintarHoy(ctx, v, d || {}); }, function (e) { C.falloEnVista(v, e); });
      };
      cargar();
      this._recargar = cargar;
      // Los pedidos en curso cambian solos (el repartidor los toma, se entregan): cada 30 s.
      v.cada(30000, cargar);
    },
    refrescar: function () { if (this._recargar) this._recargar(); },
  };

  // ── Pedidos: en curso, historial y calendario ──────────────────────────────

  var hist = { modo: 'dia', ancla: null, estado: 'todos', pagina: 1, lista: [], datos: null };

  function pestanasDePedidos(actual) {
    var t = function (id, texto, icono) {
      return h('a', { href: '#pedidos' + (id === 'curso' ? '' : '/' + id), class: 'pestana', 'aria-current': actual === id ? 'page' : null }, ico(icono), h('span', null, texto));
    };
    return h('nav', { class: 'pestanas', 'aria-label': 'Pedidos' }, t('curso', 'En curso', 'reloj'), t('historial', 'Historial', 'pedidos'), t('calendario', 'Calendario', 'calendario'));
  }

  function enCurso(ctx, v) {
    var cargar = function (primera) {
      C.pedir('GET', '/pedidos/en-curso?' + q(ctx)).then(function (d) {
        d = d || {};
        var lista = Array.isArray(d) ? d : Array.isArray(d.requests) ? d.requests : Array.isArray(d.pedidos) ? d.pedidos : [];
        var dev = Array.isArray(d.devoluciones) ? d.devoluciones : [];
        var enCamino = dev.filter(function (x) { return x && (x.pin || x.codigo) && x.estado !== 'recibida' && x.estado !== 'devuelta'; });
        C.enContenido(v, [
          C.cabeceraDeSeccion('Pedidos', ['En curso ahora en ', dato('span', null, ctx.tienda.nombre)]),
          pestanasDePedidos('curso'),
          enCamino.length ? h('div', { class: 'tarjeta devoluciones' },
            h('h2', null, ico('alerta'), 'Devoluciones que vuelven a tu tienda'),
            enCamino.map(function (x) {
              return h('div', { class: 'devolucion' },
                h('div', { class: 'txt' }, h('b', null, 'Pedido #' + Math.round(C.num(x.orderId))), x.titulo ? dato('small', null, x.titulo) : null,
                  x.repartidor ? h('small', null, 'Lo trae ', dato('span', null, x.repartidor)) : null),
                h('div', { class: 'codigo-devolucion' }, h('small', null, 'Código para recibirla'), dato('b', null, String(x.pin || x.codigo))));
            })) : null,
          lista.length ? h('div', { class: 'lista-pedidos' }, lista.map(function (p) { return filaDePedido(p); }))
            : C.vacio('No tienes pedidos en curso', 'Cuando llegue uno, suena y lo ves aquí.', null, 'pedidos'),
        ]);
      }, function (e) { if (primera) C.falloEnVista(v, e); });
    };
    cargar(true);
    v.cada(20000, function () { cargar(false); });
  }

  function historial(ctx, v) {
    if (!hist.ancla) hist.ancla = C.diaCaracas();
    var r = C.rangoDe(hist.modo, hist.ancla);
    var hoy = C.diaCaracas();
    var lista = h('div', { class: 'lista-pedidos' });
    var cifras = h('div', { class: 'cifras cuatro' });
    var mas = h('div', { class: 'botones centro' });
    var cargar = function (pagina) {
      var url = '/pedidos?desde=' + r.desde + '&hasta=' + (r.hasta > hoy ? hoy : r.hasta) + '&' + q(ctx) + '&estado=' + hist.estado + '&pagina=' + pagina;
      return C.pedir('GET', url).then(function (d) {
        if (!v.viva()) return;
        d = d || {};
        var nuevos = Array.isArray(d) ? d : Array.isArray(d.pedidos) ? d.pedidos : [];
        hist.lista = pagina === 1 ? nuevos : hist.lista.concat(nuevos);
        hist.pagina = pagina;
        var t = d.totales || {};
        C.reemplazar(cifras, [
          C.cifra('Entregados', String(Math.round(C.num(t.pedidos)))),
          C.cifra('Vendido', C.dolares(t.ventasUsd)),
          C.cifra('Tu ganancia', C.dolares(t.gananciaUsd), 'verde'),
          C.cifra('Cancelados', String(Math.round(C.num(t.cancelados))), C.num(t.cancelados) ? 'ambar' : ''),
        ]);
        C.reemplazar(lista, hist.lista.length ? hist.lista.map(function (p) { return filaDePedido(p, { conFecha: hist.modo !== 'dia' }); })
          : C.vacio('Sin pedidos en estas fechas', 'Prueba con otro día, semana o mes.', null, 'calendario'));
        lista.classList.toggle('sin-borde', !hist.lista.length);
        var hayMas = d.hayMas === true || (d.total != null && hist.lista.length < C.num(d.total));
        C.reemplazar(mas, hayMas ? C.boton('Ver más', { class: 'btn borde chico', onclick: function (ev) { C.trabajando(ev.currentTarget, cargar(pagina + 1)).catch(function (e) { C.avisar(e.message, 'mal'); }); } }) : null);
      });
    };
    var mover = function (paso) {
      if (hist.modo === 'dia') hist.ancla = C.sumarDias(r.desde, paso);
      else if (hist.modo === 'semana') hist.ancla = C.sumarDias(r.desde, paso * 7);
      else hist.ancla = C.sumarMeses(r.desde.slice(0, 7), paso) + '-01';
      C.mostrar();
    };
    var selEstado = h('select', { class: 'campo chico', 'aria-label': 'Estado' },
      [['todos', 'Todos'], ['entregado', 'Entregados'], ['cancelado', 'Cancelados']].map(function (x) { var o = h('option', { value: x[0] }, x[1]); if (x[0] === hist.estado) o.selected = true; return o; }));
    selEstado.addEventListener('change', function () { hist.estado = selEstado.value; C.mostrar(); });
    var exportar = C.boton('Exportar a Excel', { class: 'btn borde chico', onclick: function (ev) {
      var url = '/pedidos/exportar?desde=' + r.desde + '&hasta=' + (r.hasta > hoy ? hoy : r.hasta) + '&' + q(ctx) + '&formato=csv';
      C.trabajando(ev.currentTarget, C.pedir('GET', url, undefined, { archivo: true })).then(function (a) {
        C.guardarArchivo(a.blob, a.nombre || ('pedidos-' + r.desde + '-a-' + r.hasta + '.csv'));
        C.avisar('Listo: revisa tus descargas');
      }, function (e) { C.avisar(e.message, 'mal'); });
    } }, 'descargar');
    C.enContenido(v, [
      C.cabeceraDeSeccion('Pedidos', 'Lo que vendiste, por fechas.'),
      pestanasDePedidos('historial'),
      h('div', { class: 'barra-filtros' },
        C.segmentos('Ver por', [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']], hist.modo, function (m) { hist.modo = m; C.mostrar(); }),
        h('div', { class: 'navegar-fechas' },
          h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Anterior', onclick: function () { mover(-1); } }, ico('atras')),
          h('b', { class: 'rango' }, C.textoDelRango(hist.modo, r)),
          h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Siguiente', disabled: r.hasta >= hoy, onclick: function () { mover(1); } }, ico('adelante'))),
        h('div', { class: 'filtros-dcha' }, h('div', { class: 'con-flecha' }, selEstado, ico('abajo')), exportar)),
      cifras, h('span', { class: 'etq' }, 'Pedidos'), lista, mas,
    ]);
    C.reemplazar(lista, C.cargando());
    cargar(1).catch(function (e) { if (v.viva()) C.reemplazar(lista, C.tarjetaError(e, C.mostrar)); });
  }

  function calendario(ctx, v) {
    if (!hist.ancla) hist.ancla = C.diaCaracas();
    var mes = hist.ancla.slice(0, 7);
    var hoy = C.diaCaracas();
    C.pedir('GET', '/pedidos/calendario?mes=' + mes + '&' + q(ctx)).then(function (d) {
      var dias = {};
      (d && Array.isArray(d.dias) ? d.dias : []).forEach(function (x) { if (x && x.fecha) dias[String(x.fecha).slice(0, 10)] = x; });
      var primero = mes + '-01';
      var ultimo = C.ultimoDelMes(primero);
      var hueco = (C.diaDeLaSemana(primero) + 6) % 7; // lunes primero
      var celdas = [];
      for (var i = 0; i < hueco; i++) celdas.push(h('span', { class: 'cal-dia vacio', 'aria-hidden': 'true' }));
      var totalP = 0, totalV = 0, max = 0;
      Object.keys(dias).forEach(function (k) { max = Math.max(max, C.num(dias[k].ventasUsd)); });
      for (var dia = primero; dia <= ultimo; dia = C.sumarDias(dia, 1)) {
        var x = dias[dia];
        var n = x ? Math.round(C.num(x.pedidos)) : 0;
        totalP += n; totalV += x ? C.num(x.ventasUsd) : 0;
        var intensidad = x && max ? Math.ceil((C.num(x.ventasUsd) / max) * 4) : 0;
        (function (diaFijo) {
          celdas.push(h('button', {
            type: 'button', class: 'cal-dia nivel-' + intensidad + (diaFijo === hoy ? ' hoy' : '') + (diaFijo > hoy ? ' futuro' : ''),
            disabled: diaFijo > hoy, 'aria-label': diaFijo,
            onclick: function () { hist.modo = 'dia'; hist.ancla = diaFijo; C.ir('#pedidos/historial'); },
          }, h('span', { class: 'cal-num' }, String(Number(diaFijo.slice(8, 10)))),
          n ? h('span', { class: 'cal-ped' }, C.plural(n, 'pedido', 'pedidos')) : null,
          n ? h('span', { class: 'cal-ped-corto', 'aria-hidden': 'true' }, String(n)) : null,
          n ? h('span', { class: 'cal-usd' }, C.dolares(x.ventasUsd)) : null));
        })(dia);
      }
      var mover = function (paso) { hist.ancla = C.sumarMeses(mes, paso) + '-01'; C.mostrar(); };
      C.enContenido(v, [
        C.cabeceraDeSeccion('Pedidos', 'Toca un día para ver sus pedidos.'),
        pestanasDePedidos('calendario'),
        h('div', { class: 'tarjeta calendario' },
          h('div', { class: 'cal-cab' },
            h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Mes anterior', onclick: function () { mover(-1); } }, ico('atras')),
            h('b', null, C.nombreDelMes(mes)),
            h('button', { class: 'boton-icono', type: 'button', 'aria-label': 'Mes siguiente', disabled: mes >= hoy.slice(0, 7), onclick: function () { mover(1); } }, ico('adelante'))),
          h('div', { class: 'cal-semana', 'aria-hidden': 'true' }, ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(function (s) { return h('span', null, s); })),
          h('div', { class: 'cal-rejilla' }, celdas),
          h('p', { class: 'nota cal-total' }, C.plural(totalP, 'pedido entregado', 'pedidos entregados'), ' · ', C.dolares(totalV)))]);
    }, function (e) { C.falloEnVista(v, e); });
  }

  // ── El detalle ─────────────────────────────────────────────────────────────

  function textoDeFactura(df) {
    if (!df) return '';
    var id = df.identificacion && df.identificacion.valor ? (df.identificacion.rotulo || 'RIF') + ': ' + df.identificacion.valor : '';
    return [df.nombre ? 'Nombre: ' + df.nombre : '', id, df.telefono ? 'Teléfono: ' + df.telefono : '', df.direccion ? 'Dirección: ' + df.direccion : ''].filter(Boolean).join('\n');
  }

  function productosDelDetalle(d) {
    var lista = Array.isArray(d.productos) ? d.productos : Array.isArray(d.products) ? d.products : [];
    return lista.map(function (p) {
      var n = Math.max(1, Math.round(C.num(p.cantidad != null ? p.cantidad : p.quantity)));
      var ops = Array.isArray(p.opciones) ? p.opciones : Array.isArray(p.selectedModifiers) ? p.selectedModifiers : [];
      var nota = p.nota != null ? p.nota : p.note;
      var total = p.totalUsd != null ? p.totalUsd : p.total;
      return h('div', { class: 'linea-producto' },
        h('span', { class: 'cantidad' }, n + '×'),
        h('div', { class: 'txt' }, dato('b', null, p.nombre || p.name || 'Producto'),
          ops.length ? h('ul', { class: 'opciones-elegidas' }, ops.map(function (o) {
            var precio = C.num(o.precioUsd != null ? o.precioUsd : o.price);
            return h('li', null, (o.grupo || o.groupName) ? [dato('span', { class: 'grupo-op' }, (o.grupo || o.groupName) + ':'), ' '] : null,
              dato('span', null, o.nombre || o.name || ''), precio ? h('span', { class: 'extra' }, ' +' + C.dolares(precio)) : null);
          })) : null,
          nota ? h('p', { class: 'nota-producto' }, ico('info'), h('span', null, 'Nota: '), dato('span', null, nota)) : null),
        total != null ? h('span', { class: 'monto' }, C.dolares(total)) : null);
    });
  }

  function seccionGanancia(g) {
    if (!g) return null;
    var lineas = Array.isArray(g.detalle) ? g.detalle : [];
    return h('div', { class: 'tarjeta ganancia' },
      h('h2', null, 'Tu ganancia'),
      h('b', { class: 'grande verde' }, C.dolares(g.usd)),
      g.abonada && g.bs != null ? h('p', { class: 'nota' }, 'Ya está en tu billetera: ', C.bolivares(g.bs)) : h('p', { class: 'nota' }, 'Se abona al entregarse.'),
      lineas.length ? h('dl', { class: 'desglose' }, lineas.map(function (l) {
        return [h('dt', null, l.texto || ''), h('dd', { class: C.num(l.usd) < 0 ? 'resta' : '' }, C.conSigno(l.usd))];
      })) : null);
  }

  function tarjetaRepartidor(d, enCurso) {
    var r = d.repartidor;
    if (!r || !(r.nombre || r.fullName)) return null;
    var nombre = r.nombre || r.fullName;
    var tel = r.telefono || r.phone;
    var digitos = String(tel || '').replace(/\D/g, '');
    if (digitos.length === 11 && digitos.charAt(0) === '0') digitos = '58' + digitos.slice(1);
    var foto = C.fotoSegura(r.foto || r.image);
    return h('div', { class: 'repartidor' },
      foto ? h('img', { class: 'foto-redonda', src: foto, alt: '', loading: 'lazy' }) : dato('span', { class: 'inicial' }, C.inicial(nombre)),
      h('div', { class: 'txt' }, h('small', null, 'Repartidor'), dato('b', null, nombre), enCurso && tel ? dato('span', { class: 'sin-cortes' }, C.telefonoParaVer(tel)) : null),
      enCurso && /^58\d{10}$/.test(digitos) ? h('div', { class: 'botones-repartidor' },
        h('a', { class: 'boton-icono', href: 'tel:+' + digitos, 'aria-label': 'Llamar' }, ico('telefono')),
        h('a', { class: 'boton-icono', href: 'https://wa.me/' + digitos, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'WhatsApp' }, ico('whatsapp'))) : null);
  }

  function detalle(ctx, v, id) {
    C.marcarVisto(id);
    C.pedir('GET', '/pedidos/' + encodeURIComponent(id)).then(function (x) {
      var d = x && x.request ? x.request : x || {};
      var p = C.resumenDePedido(d);
      var est = C.estadoDelPedido(p.estado, p.paraRecoger, true);
      var enCurso = p.estado >= 1 && p.estado < 200;
      var acciones = ctx.puede('pedidos_acciones') && enCurso;
      var df = d.datosFactura;
      var dev = d.devolucion;
      var cartel = d.cartel && d.cartel.titulo ? d.cartel : null;
      var eventos = Array.isArray(d.eventos) ? d.eventos : Array.isArray(d.bitacora) ? d.bitacora : [];
      var cupon = d.cupon;
      var mapaCaja = null;
      if (d.tieneRepartidorEnVivo || (p.estado >= 100 && p.estado < 200 && d.repartidor)) mapaCaja = h('div', { class: 'mapa mapa-detalle' });
      var g = d.ganancia && typeof d.ganancia === 'object' ? d.ganancia : (d.gananciaUsd != null ? { usd: d.gananciaUsd } : null);
      C.enContenido(v, [
        h('a', { class: 'volver', href: '#pedidos' }, ico('atras'), 'Pedidos'),
        h('div', { class: 'cab-pedido' },
          h('h1', null, 'Pedido #' + p.id),
          h('div', { class: 'chips' }, C.pill(est[0], est[1]), p.paraRecoger ? C.pill('Para recoger', 'azul') : null,
            d.canalTexto ? h('span', { class: 'pill' }, d.canalTexto) : null),
          h('p', { class: 'sub' }, C.fechaHora(p.creadoEn), p.cliente ? [' · ', dato('span', null, p.cliente)] : null)),
        cartel && enCurso ? h('div', { class: 'cartel tono-' + (cartel.tono || 'normal') }, ico('moto'), h('div', null, dato('b', null, cartel.titulo), cartel.linea ? dato('span', null, cartel.linea) : null)) : null,
        acciones ? h('div', { class: 'acciones-pedido' },
          p.paraRecoger && p.estado === 1 ? C.boton('Listo para recoger', { class: 'btn', onclick: function (ev) { listo(ev.currentTarget, p.id); } }, 'check') : null,
          p.estado < 101 ? C.boton('No puedo preparar este pedido', { class: 'btn borde peligro-texto', onclick: function () { noPuedo(p.id); } }, 'x') : null) : null,
        dev && (dev.codigo || dev.pin) ? h('div', { class: 'tarjeta devoluciones' }, h('h2', null, ico('alerta'), 'Este pedido vuelve a tu tienda'),
          h('div', { class: 'devolucion' }, h('div', { class: 'txt' }, h('b', null, 'Recíbelo con este código')),
            h('div', { class: 'codigo-devolucion' }, h('small', null, 'Código para recibirla'), dato('b', null, String(dev.codigo || dev.pin))))) : null,
        h('div', { class: 'rejilla-detalle' },
          h('div', { class: 'col' },
            h('div', { class: 'tarjeta' },
              h('h2', null, 'Productos'),
              h('div', { class: 'lineas-producto' }, productosDelDetalle(d)),
              h('dl', { class: 'desglose totales' },
                d.productosUsd != null ? [h('dt', null, 'Productos'), h('dd', null, C.dolares(d.productosUsd))] : null,
                C.num(d.envioUsd) ? [h('dt', null, 'Envío'), h('dd', null, C.dolares(d.envioUsd))] : null,
                C.num(d.propinaUsd) ? [h('dt', null, 'Propina'), h('dd', null, C.dolares(d.propinaUsd))] : null,
                cupon && cupon.codigo ? [h('dt', null, 'Cupón ', dato('span', null, cupon.codigo)), h('dd', { class: 'resta' }, C.conSigno(-C.num(cupon.descuentoUsd)))] : null,
                [h('dt', { class: 'total' }, 'Total'), h('dd', { class: 'total' }, C.dolares(p.totalUsd))])),
            eventos.length ? h('div', { class: 'tarjeta' }, h('h2', null, 'Lo que pasó'),
              h('ol', { class: 'linea-tiempo' }, eventos.map(function (e) {
                return h('li', null, h('span', { class: 'hora-evento' }, C.fechaHora(e.fecha || e.creadoEn || e.createdAt)), dato('span', null, e.texto || e.descripcion || e.tipo || ''));
              }))) : null),
          h('div', { class: 'col' },
            seccionGanancia(g),
            d.repartidor ? h('div', { class: 'tarjeta' }, tarjetaRepartidor(d, enCurso), mapaCaja) : null,
            df ? h('div', { class: 'tarjeta' },
              h('div', { class: 'cab-tarjeta' }, h('h2', null, 'Datos para la factura'),
                C.boton('Copiar', { class: 'btn chico suave', onclick: function () { C.copiar(textoDeFactura(df)); } }, 'copiar')),
              h('dl', { class: 'datos-lista' },
                df.nombre ? [h('dt', null, 'Nombre'), dato('dd', null, df.nombre)] : null,
                df.identificacion && df.identificacion.valor ? [dato('dt', null, df.identificacion.rotulo || 'RIF'), dato('dd', null, df.identificacion.valor)] : null,
                df.telefono ? [h('dt', null, 'Teléfono'), dato('dd', null, df.telefono)] : null,
                df.direccion ? [h('dt', null, 'Dirección'), dato('dd', null, df.direccion)] : null)) : null)),
      ]);
      if (mapaCaja && C.mapa) seguirRepartidor(v, mapaCaja, p.id, d);
    }, function (e) {
      if (e.status === 404) C.enContenido(v, [h('a', { class: 'volver', href: '#pedidos' }, ico('atras'), 'Pedidos'), C.vacio('No encontramos ese pedido', 'Puede ser de otra tienda o de otra cuenta.', null, 'buscar')]);
      else C.falloEnVista(v, e);
    });
  }

  /** El repartidor en el mapa, cada 10 s, mientras el pedido va en camino. */
  function seguirRepartidor(v, caja, id, d) {
    var tienda = d.tiendaUbicacion && isFinite(d.tiendaUbicacion.lat) ? d.tiendaUbicacion : null;
    var destino = d.destino && isFinite(d.destino.lat) ? d.destino : null;
    C.mapa.crear(caja, { centro: tienda || destino || null, zoom: 14 }).then(function (m) {
      if (!v.viva()) { m.quitar(); return; }
      v.alSalir(function () { m.quitar(); });
      if (tienda) m.marcador('a', 'a', tienda);
      if (destino) m.marcador('b', 'b', destino);
      var primera = true;
      var leer = function () {
        C.pedir('GET', '/pedidos/' + encodeURIComponent(id) + '/repartidor').then(function (r) {
          if (!v.viva() || !r || !isFinite(Number(r.lat)) || !isFinite(Number(r.lng))) return;
          m.marcador('moto', 'moto', { lat: Number(r.lat), lng: Number(r.lng) }, { rumbo: r.rumbo });
          if (primera) { m.encuadrar([tienda, destino, { lat: Number(r.lat), lng: Number(r.lng) }]); primera = false; }
        }, function () { /* sin posición todavía */ });
      };
      leer();
      v.cada(10000, leer);
    }, function () { /* el mapa ya dice que no cargó */ });
  }

  function listo(boton, id) {
    C.confirmar({ titulo: '¿Listo para recoger?', texto: 'Le avisamos al cliente que ya puede buscar su pedido #' + id + '.', si: 'Sí, está listo' }).then(function (si) {
      if (!si) return;
      C.trabajando(boton, C.pedir('POST', '/pedidos/' + id + '/listo')).then(function (r) {
        if (r && r.ok === false) { C.avisar('No se pudo marcar como listo.', 'mal'); return; }
        C.avisar('Listo: le avisamos al cliente');
        C.mostrar();
      }, function (e) { C.avisar(e.message, 'mal'); });
    });
  }

  /** «No puedo preparar este pedido»: 1) lo que cuesta; 2) el motivo. */
  function noPuedo(id) {
    C.pedir('GET', '/pedidos/' + id + '/cancelar').then(function (o) {
      o = o || {};
      if (!o.puedeCancelar) {
        C.abrirDialogo({ titulo: 'No se puede cancelar', cuerpo: h('p', { class: 'nota' }, o.razon || 'Ahora mismo no se puede cancelar.'), pie: C.boton('Entendido', { class: 'btn borde', onclick: function () { C.cerrarDialogos(); } }) });
        return;
      }
      var seguir = C.boton('Seguir', { class: 'btn peligro' });
      var volver = C.boton('Volver', { class: 'btn borde' });
      var d = C.abrirDialogo({
        titulo: '¿No puedes prepararlo?',
        cuerpo: [
          h('p', { class: 'paso' }, 'Paso 1 de 2'),
          !o.esPrueba && C.num(o.penalidadUsd) > 0 ? h('div', { class: 'costo-cancelar' }, h('small', null, 'Te cuesta'), h('b', null, C.dolares(o.penalidadUsd)), h('span', null, '(' + C.porcentaje(o.porcentaje || 10) + ' del pedido)')) : null,
          h('p', { class: 'nota' }, o.aviso || ''),
        ],
        pie: [volver, seguir],
      });
      volver.addEventListener('click', d.cerrar);
      seguir.addEventListener('click', function () { d.cerrar(); motivos(id, o); });
    }, function (e) { C.avisar(e.message, 'mal'); });
  }
  function motivos(id, o) {
    var lista = Array.isArray(o.motivos) && o.motivos.length ? o.motivos : [{ codigo: 'cliente_cancelo', etiqueta: 'El cliente canceló' }, { codigo: 'sin_producto', etiqueta: 'No tenemos el producto' }, { codigo: 'otro', etiqueta: 'Otro' }];
    var detalleTxt = h('textarea', { class: 'campo', id: 'cancel-detalle', rows: '2', maxlength: '500', placeholder: C.segunIdioma('Cuéntanos qué pasó (opcional)', 'Tell us what happened (optional)') });
    var error = h('p', { class: 'error', role: 'alert', hidden: true });
    var radios = h('div', { class: 'opciones-lista', role: 'radiogroup', 'aria-label': 'Motivo' }, lista.map(function (m, i) {
      return h('label', { class: 'opcion-radio' }, h('input', { type: 'radio', name: 'motivo', value: m.codigo, checked: i === 0 }), h('span', null, m.etiqueta || m.codigo));
    }));
    var cancelar = C.boton('Cancelar pedido', { class: 'btn peligro' });
    var volver = C.boton('Volver', { class: 'btn borde' });
    var d = C.abrirDialogo({
      titulo: '¿Por qué no puedes?',
      cuerpo: [h('p', { class: 'paso' }, 'Paso 2 de 2'), radios, C.campo('cancel-detalle', 'Detalle', detalleTxt), error],
      pie: [volver, cancelar],
    });
    volver.addEventListener('click', d.cerrar);
    cancelar.addEventListener('click', function () {
      var elegido = radios.querySelector('input:checked');
      var motivo = elegido ? elegido.value : '';
      var det = String(detalleTxt.value || '').trim();
      if (!motivo) { error.textContent = 'Elige un motivo.'; error.hidden = false; return; }
      if (motivo === 'otro' && det.length < 3) { error.textContent = 'Cuéntanos qué pasó.'; error.hidden = false; detalleTxt.focus(); return; }
      error.hidden = true;
      var cuerpo = { motivo: motivo };
      if (det) cuerpo.detalle = det.slice(0, 500);
      C.trabajando(cancelar, C.pedir('POST', '/pedidos/' + id + '/cancelar', cuerpo)).then(function (r) {
        d.cerrar();
        C.avisar((r && r.texto) || 'Pedido cancelado');
        C.mostrar();
      }, function (e) { error.textContent = e.message; error.hidden = false; });
    });
  }

  C.secciones.pedidos = {
    id: 'pedidos', titulo: 'Pedidos', icono: 'pedidos',
    visible: function (ctx) { return ctx.puede('pedidos') && C.esDeApp(ctx.tienda); },
    mostrar: function (ctx, sub, v) {
      var s = sub[0];
      if (s === 'historial') historial(ctx, v);
      else if (s === 'calendario') calendario(ctx, v);
      else if (/^\d+$/.test(s || '')) detalle(ctx, v, Number(s));
      else enCurso(ctx, v);
    },
    refrescar: function () { C.mostrar(); },
  };
  C.filaDePedido = filaDePedido;
})(window);
