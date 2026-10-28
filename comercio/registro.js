/*
 * REGISTRO PÚBLICO DEL COMERCIO (28-oct-2026).
 *
 * El dueño entra con el WhatsApp del paso 1: no se pide otra vez. «El encargado soy yo» copia
 * nombre, teléfono y cédula. El mapa o la dirección: con una basta. Queda en revisión y no
 * recibe sesión hasta que lo aprueben en el panel.
 *
 * Nada de innerHTML con datos: todo con createElement y textContent (C.h).
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  if (!C || !C.h) return;
  var documento = raiz.document;
  var h = C.h;
  var dato = C.dato;

  var reg = {
    telefono: '', telefonoNacional: '', codigo: '', mismaPersona: true, pin: null,
    categorias: [], escrito: {}, enviando: false,
  };

  function pintar(nodo) {
    if (typeof C.pintarPublico === 'function') C.pintarPublico(nodo);
    else {
      var app = documento.getElementById('app');
      C.vaciar(app);
      C.poner(app, nodo);
    }
  }

  function marco(cuerpo) {
    return h('div', { class: 'entrar' },
      h('div', { class: 'marca' },
        h('img', { class: 'logo-entrar', src: '/assets/logo-marca.png', alt: '', width: '40', height: '40' }),
        h('small', null, 'Deliservy · Comercios'),
        h('h1', null, 'Registra tu comercio'),
        h('p', null, 'Queda en revisión. Entras al panel cuando Deliservy lo aprueba.')),
      h('div', { class: 'tarjeta' }, cuerpo),
      h('p', { class: 'pie-entrar' }, '¿Ya tienes tienda? ',
        h('button', { class: 'enlace', type: 'button', onclick: function () {
          try { raiz.history.pushState(null, '', raiz.location.pathname); } catch (_) { /* nada */ }
          if (typeof C.mostrarEntrada === 'function') C.mostrarEntrada();
        } }, 'Entrar')),
      h('img', { class: 'foto-lado', src: '/comercio/foto-registro.jpg?v=2026102803', alt: '' }));
  }

  function leerArchivo(input) {
    return new Promise(function (ok, mal) {
      var f = input && input.files && input.files[0];
      if (!f) { ok(''); return; }
      if (f.size > 8 * 1024 * 1024) { mal('Ese archivo pesa más de 8 MB.'); return; }
      if (f.type === 'application/pdf') {
        if (f.size > 900 * 1024) { mal('El PDF pesa más de 900 KB.'); return; }
        var lector = new FileReader();
        lector.onload = function () { ok(String(lector.result || '')); };
        lector.onerror = function () { mal('No se pudo leer el archivo.'); };
        lector.readAsDataURL(f);
        return;
      }
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { mal('Usa JPG, PNG, WebP o PDF.'); return; }
      var img = new Image();
      var url = URL.createObjectURL(f);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var lado = Math.max(img.width, img.height) || 1;
        var escala = Math.min(1, 1280 / lado);
        var lienzo = documento.createElement('canvas');
        lienzo.width = Math.max(1, Math.round(img.width * escala));
        lienzo.height = Math.max(1, Math.round(img.height * escala));
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
        ok(lienzo.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal('No se pudo leer esa imagen.'); };
      img.src = url;
    });
  }

  function archivoPrevio(input, anterior) {
    if (input && input.files && input.files[0]) return leerArchivo(input);
    return Promise.resolve(anterior || '');
  }

  function vistaPrevia(archivo) {
    if (!archivo) return null;
    if (String(archivo).indexOf('data:application/pdf') === 0) return h('p', { class: 'ayuda' }, 'PDF listo.');
    if (String(archivo).indexOf('data:image/') === 0) {
      var img = documento.createElement('img');
      img.alt = '';
      img.src = archivo;
      img.style.maxWidth = '160px';
      img.style.maxHeight = '120px';
      img.style.borderRadius = '8px';
      return img;
    }
    return null;
  }

  function pasoTelefono(d) {
    d = d || {};
    var tel = C.campoDeWhatsapp('reg-telefono', d.telefono || reg.telefonoNacional || '');
    return marco(h('form', {
      novalidate: true,
      onsubmit: function (ev) {
        ev.preventDefault();
        var leido = tel.leer();
        var nacional = String(tel.input.value || '');
        if (leido.error) { pintar(pasoTelefono({ telefono: nacional, error: leido.error })); return; }
        reg.telefonoNacional = nacional;
        var boton = ev.target.querySelector('button[type="submit"]');
        if (boton) boton.disabled = true;
        C.pedir('POST', '/registro/codigo', { telefono: leido.telefono }, { sinSesion: true }).then(function () {
          reg.telefono = leido.telefono;
          pintar(pasoCodigo());
        }, function (e) {
          pintar(pasoTelefono({ telefono: nacional, error: e.message }));
        });
      },
    },
    h('p', { class: 'paso' }, 'Paso 1 de 3'),
    h('label', { class: 'etq-campo', for: 'reg-telefono' }, 'WhatsApp del dueño'),
    tel.fila,
    h('p', { class: 'ayuda' }, 'Con este número entra al panel. No lo pedimos otra vez.'),
    d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
    h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Enviarme el código'))));
  }

  function pasoCodigo(d) {
    d = d || {};
    var casillas = C.casillasDeCodigo('reg-codigo', function (cod) {
      if (cod.length !== 6) return;
      reg.codigo = cod;
      cargarDatos();
    });
    return marco(h('form', {
      novalidate: true,
      onsubmit: function (ev) {
        ev.preventDefault();
        var cod = String((documento.getElementById('reg-codigo') || {}).value || '').replace(/\D/g, '');
        if (cod.length !== 6) { pintar(pasoCodigo({ error: 'El código tiene 6 números.' })); return; }
        reg.codigo = cod;
        cargarDatos();
      },
    },
    h('p', { class: 'paso' }, 'Paso 2 de 3'),
    h('p', { class: 'bien' }, 'Te enviamos un código por WhatsApp al ', dato('span', { class: 'sin-cortes' }, C.telefonoParaVer(reg.telefono)), '.'),
    h('label', { class: 'etq-campo', for: 'reg-codigo' }, 'Código de 6 números'),
    casillas.caja,
    d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
    h('div', { class: 'botones' }, h('button', { class: 'btn', type: 'submit' }, 'Seguir')),
    h('div', { class: 'botones' }, h('button', { class: 'btn borde chico', type: 'button', onclick: function () { pintar(pasoTelefono({ telefono: reg.telefonoNacional })); } }, 'Cambiar número'))));
  }

  function cargarDatos() {
    pintar(C.cargando());
    C.pedir('GET', '/registro/categorias', undefined, { sinSesion: true }).then(function (r) {
      reg.categorias = (r && r.categorias) || [];
      pintar(pasoDatos());
      ponerMapa();
    }, function () {
      reg.categorias = [];
      pintar(pasoDatos({ error: 'No se pudieron cargar las categorías. Intenta de nuevo.' }));
      ponerMapa();
    });
  }

  function ponerMapa() {
    var caja = documento.getElementById('reg-mapa');
    if (!caja || !C.mapa) return;
    var centro = reg.pin || C.mapa.VALENCIA;
    C.mapa.crear(caja, { centro: centro, zoom: 14 }).then(function (m) {
      var marcar = function (lat, lng) {
        reg.pin = { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
        m.marcador('tienda', 'tienda', reg.pin, { arrastrable: true, alSoltar: function (a, b) { reg.pin = { lat: a, lng: b }; } });
      };
      if (reg.pin) marcar(reg.pin.lat, reg.pin.lng);
      m.alTocar(function (lat, lng) { marcar(lat, lng); });
    }, function () { /* el mapa lo dice; la dirección escrita sigue */ });
  }

  function pasoDatos(d) {
    d = d || {};
    var v = reg.escrito || {};
    var e = d.errores || {};
    var nombre = h('input', { class: 'campo', id: 'reg-tienda', name: 'nombreTienda', maxlength: '80', value: v.nombreTienda || '' });
    var razon = h('input', { class: 'campo', id: 'reg-razon', name: 'razonSocial', maxlength: '150', value: v.razonSocial || '' });
    var telComercio = h('input', { class: 'campo', id: 'reg-tel-comercio', name: 'telefonoComercio', type: 'tel', inputmode: 'tel', maxlength: '20', placeholder: '0414-555-0198', value: v.telefonoComercio || '' });
    var dueno = h('input', { class: 'campo', id: 'reg-dueno', name: 'duenoNombre', maxlength: '60', autocomplete: 'name', value: v.duenoNombre || '' });
    var cedulaDueno = h('input', { class: 'campo', id: 'reg-cedula-dueno', name: 'cedulaDueno', type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf' });
    var misma = C.interruptor('reg-misma', reg.mismaPersona !== false, 'El encargado soy yo');
    var encargado = h('input', { class: 'campo', id: 'reg-encargado', name: 'encargadoNombre', maxlength: '60', value: v.encargadoNombre || '' });
    var telEncargado = h('input', { class: 'campo', id: 'reg-tel-encargado', name: 'encargadoTelefono', type: 'tel', inputmode: 'tel', maxlength: '20', placeholder: '0412-555-0198', value: v.encargadoTelefono || '' });
    var cedulaEncargado = h('input', { class: 'campo', id: 'reg-cedula-encargado', name: 'cedulaEncargado', type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf' });
    var grupoEncargado = h('div', { id: 'reg-grupo-encargado' },
      C.campo('reg-encargado', 'Nombre del encargado', encargado, { error: e.encargadoNombre }),
      C.campo('reg-tel-encargado', 'WhatsApp del encargado', telEncargado, { error: e.encargadoTelefono }),
      C.campo('reg-cedula-encargado', 'Cédula del encargado', cedulaEncargado, { error: e.cedulaEncargado }),
      vistaPrevia(v.cedulaEncargado));
    grupoEncargado.hidden = reg.mismaPersona !== false;
    misma.input.addEventListener('change', function () {
      reg.mismaPersona = misma.input.checked;
      grupoEncargado.hidden = misma.input.checked;
    });
    var rif = h('input', { class: 'campo', id: 'reg-rif', name: 'rif', maxlength: '20', placeholder: 'J-504754129', value: v.rif || '' });
    var rifArchivo = h('input', { class: 'campo', id: 'reg-rif-archivo', name: 'rifArchivo', type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf' });
    var correo = h('input', { class: 'campo', id: 'reg-correo', name: 'correo', type: 'email', maxlength: '120', autocomplete: 'email', value: v.correo || '' });
    var direccion = h('textarea', { class: 'campo', id: 'reg-direccion', name: 'direccion', rows: '2', maxlength: '300' });
    direccion.value = v.direccion || '';
    var mapa = h('div', { class: 'mapa-tienda', id: 'reg-mapa' });
    var cat = h('select', { class: 'campo', id: 'reg-cat', name: 'categoriaId' });
    cat.appendChild(h('option', { value: '' }, 'Elige…'));
    (reg.categorias || []).forEach(function (c) {
      var o = h('option', { value: String(c.id) }, c.nombre || '');
      if (String(v.categoriaId || '') === String(c.id)) o.selected = true;
      cat.appendChild(o);
    });
    var boton = h('button', { class: 'btn', type: 'submit' }, 'Enviar registro');
    var form = h('form', {
      novalidate: true,
      onsubmit: function (ev) {
        ev.preventDefault();
        if (reg.enviando) return;
        var f = ev.target;
        boton.disabled = true;
        reg.enviando = true;
        Promise.all([
          archivoPrevio(f.elements.cedulaDueno, v.cedulaDueno),
          reg.mismaPersona === false ? archivoPrevio(f.elements.cedulaEncargado, v.cedulaEncargado) : Promise.resolve(''),
          archivoPrevio(f.elements.rifArchivo, v.rifArchivo),
        ]).then(function (archivos) {
          reg.escrito = {
            nombreTienda: f.elements.nombreTienda.value,
            razonSocial: f.elements.razonSocial.value,
            telefonoComercio: f.elements.telefonoComercio.value,
            duenoNombre: f.elements.duenoNombre.value,
            cedulaDueno: archivos[0],
            encargadoNombre: f.elements.encargadoNombre.value,
            encargadoTelefono: f.elements.encargadoTelefono.value,
            cedulaEncargado: archivos[1],
            rif: f.elements.rif.value,
            rifArchivo: archivos[2],
            correo: f.elements.correo.value,
            direccion: f.elements.direccion.value,
            categoriaId: f.elements.categoriaId.value,
          };
          reg.mismaPersona = misma.input.checked;
          var cuerpo = {
            telefono: reg.telefono, codigo: reg.codigo,
            nombreTienda: reg.escrito.nombreTienda, razonSocial: reg.escrito.razonSocial,
            telefonoComercio: reg.escrito.telefonoComercio, duenoNombre: reg.escrito.duenoNombre,
            cedulaDueno: reg.escrito.cedulaDueno, mismaPersona: reg.mismaPersona,
            rif: reg.escrito.rif, rifArchivo: reg.escrito.rifArchivo, correo: reg.escrito.correo,
            direccion: reg.escrito.direccion, categoriaId: Number(reg.escrito.categoriaId) || 0,
          };
          if (!reg.mismaPersona) {
            cuerpo.encargadoNombre = reg.escrito.encargadoNombre;
            cuerpo.encargadoTelefono = reg.escrito.encargadoTelefono;
            cuerpo.cedulaEncargado = reg.escrito.cedulaEncargado;
          }
          if (reg.pin) { cuerpo.lat = reg.pin.lat; cuerpo.lng = reg.pin.lng; }
          return C.pedir('POST', '/registro', cuerpo, { sinSesion: true });
        }).then(function (r) {
          reg.enviando = false;
          if (!r || r.estado !== 'pendiente') {
            boton.disabled = false;
            pintar(pasoDatos({ error: 'Algo salió mal. Intenta de nuevo.' }));
            ponerMapa();
            return;
          }
          pintar(enRevision());
        }, function (err) {
          reg.enviando = false;
          var campo = err.datos && err.datos.campo;
          var errores = {};
          if (campo) errores[campo] = err.message;
          pintar(pasoDatos({ error: campo ? '' : err.message, errores: errores }));
          ponerMapa();
        });
      },
    },
    h('p', { class: 'paso' }, 'Paso 3 de 3'),
    h('h2', null, 'Tu comercio'),
    C.campo('reg-tienda', 'Nombre de la tienda', nombre, { error: e.nombreTienda }),
    C.campo('reg-razon', 'Razón social', razon, { error: e.razonSocial }),
    C.campo('reg-tel-comercio', 'Teléfono del comercio', telComercio, { error: e.telefonoComercio, ayuda: 'WhatsApp de Venezuela.' }),
    C.campo('reg-dueno', 'Nombre del dueño', dueno, { error: e.duenoNombre, ayuda: 'Administra el panel con el WhatsApp del paso 1.' }),
    C.campo('reg-cedula-dueno', 'Cédula del dueño', cedulaDueno, { error: e.cedulaDueno }),
    vistaPrevia(v.cedulaDueno),
    misma.caja,
    grupoEncargado,
    C.campo('reg-rif', 'RIF', rif, { error: e.rif, ayuda: 'Letra y 9 números, por ejemplo J-504754129.' }),
    C.campo('reg-rif-archivo', 'Fotocopia del RIF', rifArchivo, { error: e.rifArchivo }),
    vistaPrevia(v.rifArchivo),
    C.campo('reg-correo', 'Correo del dueño', correo, { error: e.correo }),
    C.campo('reg-cat', 'Categoría', cat, { error: e.categoria }),
    h('p', { class: 'etq-campo' }, 'Dónde está'),
    h('p', { class: 'ayuda' }, 'Marca el mapa o escribe la dirección. Con una de las dos basta.'),
    mapa,
    C.campo('reg-direccion', 'Dirección', direccion, { error: e.direccion || e.donde || e.punto }),
    d.error ? h('p', { class: 'error', role: 'alert' }, d.error) : null,
    h('div', { class: 'botones' }, boton));
    return marco(form);
  }

  function enRevision() {
    return marco(h('div', null,
      h('h2', null, 'Tu comercio está en revisión'),
      h('p', { class: 'nota' }, 'Cuando lo aprueben, entra con este WhatsApp. Hasta entonces esta página no abre el panel.'),
      h('p', { class: 'bien' }, dato('span', { class: 'sin-cortes' }, C.telefonoParaVer(reg.telefono)))));
  }

  C.abrirRegistro = function () {
    if (C.sesion && C.sesion.leer()) return;
    pintar(reg.telefono && reg.codigo ? pasoDatos() : (reg.telefono ? pasoCodigo() : pasoTelefono()));
    if (reg.telefono && reg.codigo) ponerMapa();
  };
})(window);
