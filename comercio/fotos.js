/*
 * EL PANEL DEL COMERCIO — las fotos (24-oct-2026).
 *
 * Arrastrar y soltar o elegir. En el navegador se recortan cuadradas al centro y se achican con canvas, como la app:
 * producto 2000 px, logo/banner/marcador 1200, opción 400; se guardan en JPEG 0,9 y SOLO entonces se suben
 * (`POST fotos`, multipart `archivo` + `tipo` + `companyId`). En el servidor no hay librería de imágenes: valida los
 * bytes, el peso y las medidas, y devuelve `{url}`. Si la subida falla, se dice claro (nunca queda vacío en silencio,
 * que es lo que hace `uploadFile` en la app).
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var documento = raiz.document;
  var h = C.h;
  var MAX = { producto: 2000, logo: 1200, banner: 1200, marcador: 1200, opcion: 400 };
  var TIPOS_OK = /^image\/(jpeg|png|webp|gif|avif)$/i;
  var NO_SE_LEE = 'No se pudo leer esa foto. Usa JPG, PNG o WebP.';
  var NO_SE_SUBE = 'No se pudo subir la foto. Intenta de nuevo.';

  /** Las medidas de salida: el lado del cuadrado del centro, sin agrandar nunca la foto. */
  function medidas(ancho, alto, maxLado) {
    var lado = Math.min(ancho, alto);
    var salida = Math.max(1, Math.min(lado, maxLado));
    return { sx: Math.round((ancho - lado) / 2), sy: Math.round((alto - lado) / 2), lado: lado, salida: salida };
  }

  function decodificar(archivo) {
    if (typeof raiz.createImageBitmap === 'function') {
      return raiz.createImageBitmap(archivo, { imageOrientation: 'from-image' }).catch(function () { return conImagen(archivo); });
    }
    return conImagen(archivo);
  }
  function conImagen(archivo) {
    return new Promise(function (ok, mal) {
      var url = raiz.URL.createObjectURL(archivo);
      var img = new raiz.Image();
      img.onload = function () { ok({ imagen: img, width: img.naturalWidth, height: img.naturalHeight, liberar: function () { raiz.URL.revokeObjectURL(url); } }); };
      img.onerror = function () { raiz.URL.revokeObjectURL(url); mal(new Error(NO_SE_LEE)); };
      img.src = url;
    });
  }

  /** Recorta y achica: devuelve { blob, lado } (un JPEG cuadrado de calidad 0,9). */
  function preparar(archivo, tipo) {
    var maxLado = MAX[tipo] || 1200;
    if (!archivo || (archivo.type && !TIPOS_OK.test(archivo.type))) return Promise.reject(new Error(NO_SE_LEE));
    if (archivo.size > 40 * 1024 * 1024) return Promise.reject(new Error('Esa foto pesa demasiado (más de 40 MB).'));
    return decodificar(archivo).then(function (fuente) {
      var dibujo = fuente.imagen || fuente;
      var ancho = fuente.width, alto = fuente.height;
      if (!ancho || !alto) throw new Error(NO_SE_LEE);
      var m = medidas(ancho, alto, maxLado);
      var lienzo = documento.createElement('canvas');
      lienzo.width = m.salida;
      lienzo.height = m.salida;
      var g = lienzo.getContext('2d');
      // Fondo blanco: una foto PNG con transparencia no queda negra en JPEG.
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, m.salida, m.salida);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.drawImage(dibujo, m.sx, m.sy, m.lado, m.lado, 0, 0, m.salida, m.salida);
      if (fuente.close) fuente.close();
      if (fuente.liberar) fuente.liberar();
      return new Promise(function (ok, mal) {
        lienzo.toBlob(function (b) { if (b) ok({ blob: b, lado: m.salida }); else mal(new Error(NO_SE_LEE)); }, 'image/jpeg', 0.9);
      });
    });
  }

  /** Sube el JPEG ya listo. Devuelve la URL (https) o falla con una frase clara. */
  function subir(blob, tipo, companyId) {
    var fd = new raiz.FormData();
    fd.append('archivo', blob, tipo + '.jpg');
    fd.append('tipo', tipo);
    fd.append('companyId', String(companyId));
    return C.pedir('POST', '/fotos', fd, { espera: 60000 }).then(function (r) {
      var url = C.fotoSegura(r && r.url);
      if (!url) throw new Error(NO_SE_SUBE);
      return url;
    }, function (e) {
      if (e && e.status === 401) throw e;
      var err = new Error(e && e.message && e.message !== C.ALGO_MAL ? e.message : NO_SE_SUBE);
      err.status = e && e.status;
      throw err;
    });
  }

  /**
   * Un espacio para una foto: vista previa, «Cambiar», «Quitar», arrastrar y soltar. `o`: { tipo, companyId, url,
   * rotulo, alCambiar(url|''), pequena, sinQuitar }. Devuelve { caja, valor(), ocupada() }.
   */
  function zona(o) {
    var url = C.fotoSegura(o.url) || '';
    var ocupada = false;
    var input = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'sr', tabindex: '-1', 'aria-hidden': 'true' });
    var vista = h('div', { class: 'zona-vista' });
    var error = h('p', { class: 'error-campo', role: 'alert', hidden: true });
    var caja = h('div', {
      class: 'zona-foto' + (o.pequena ? ' pequena' : ''), tabindex: '0', role: 'button',
      'aria-label': o.rotulo || 'Foto',
    }, vista);
    var envoltura = h('div', { class: 'zona-foto-caja' }, caja, input, error);

    function pintar(estado, previa) {
      C.vaciar(vista);
      caja.classList.toggle('con-foto', !!(previa || url));
      caja.classList.toggle('subiendo', estado === 'subiendo');
      var img = null;
      if (previa) { img = h('img', { alt: '' }); img.src = previa; } // un blob: nuestro (la vista previa local)
      else if (url) img = h('img', { src: url, alt: '', loading: 'lazy' });
      if (img) vista.appendChild(img);
      if (estado === 'subiendo') vista.appendChild(h('div', { class: 'zona-estado' }, h('span', { class: 'rueda', 'aria-hidden': 'true' }), h('span', null, 'Subiendo…')));
      else if (!img) vista.appendChild(h('div', { class: 'zona-vacia' }, C.ico('foto'), h('span', null, o.pequena ? 'Foto' : 'Arrastra o toca para elegir')));
      if (img && estado !== 'subiendo') {
        vista.appendChild(h('div', { class: 'zona-botones' },
          h('button', { type: 'button', class: 'mini', onclick: function (ev) { ev.stopPropagation(); elegir(); } }, C.ico('foto'), h('span', null, 'Cambiar')),
          o.sinQuitar ? null : h('button', { type: 'button', class: 'mini peligro', onclick: function (ev) { ev.stopPropagation(); url = ''; pintar(); if (o.alCambiar) o.alCambiar(''); }, 'aria-label': 'Quitar foto' }, C.ico('borrar'))));
      }
    }
    function mostrarError(t) { error.textContent = t || ''; error.hidden = !t; caja.classList.toggle('mal', !!t); }
    function elegir() { input.value = ''; input.click(); }
    function usar(archivo) {
      if (!archivo || ocupada) return;
      mostrarError('');
      ocupada = true;
      var previa = null;
      preparar(archivo, o.tipo).then(function (r) {
        previa = raiz.URL.createObjectURL(r.blob);
        pintar('subiendo', previa);
        return subir(r.blob, o.tipo, o.companyId);
      }).then(function (u) {
        url = u;
        ocupada = false;
        pintar(null, previa);
        if (o.alCambiar) o.alCambiar(u);
      }, function (e) {
        ocupada = false;
        if (previa) raiz.URL.revokeObjectURL(previa);
        pintar();
        mostrarError((e && e.message) || NO_SE_SUBE);
      });
    }
    caja.addEventListener('click', function () { if (!ocupada && !caja.classList.contains('con-foto')) elegir(); });
    caja.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && !ocupada) { ev.preventDefault(); elegir(); } });
    input.addEventListener('change', function () { if (input.files && input.files[0]) usar(input.files[0]); });
    ['dragenter', 'dragover'].forEach(function (n) { caja.addEventListener(n, function (ev) { ev.preventDefault(); caja.classList.add('encima'); }); });
    ['dragleave', 'dragend'].forEach(function (n) { caja.addEventListener(n, function () { caja.classList.remove('encima'); }); });
    caja.addEventListener('drop', function (ev) {
      ev.preventDefault();
      caja.classList.remove('encima');
      var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f) usar(f);
    });
    pintar();
    return { caja: envoltura, valor: function () { return url; }, ocupada: function () { return ocupada; }, input: input };
  }

  // Que una foto soltada fuera de un espacio no abra la imagen en la pestaña (y se pierda el panel).
  documento.addEventListener('dragover', function (ev) { if (!ev.target.closest || !ev.target.closest('.zona-foto')) ev.preventDefault(); });
  documento.addEventListener('drop', function (ev) { if (!ev.target.closest || !ev.target.closest('.zona-foto')) ev.preventDefault(); });

  C.fotos = { preparar: preparar, subir: subir, zona: zona, medidas: medidas, MAX: MAX };
})(window);
