/*
 * EL PANEL DEL COMERCIO — las gráficas (24-oct-2026).
 *
 * Barras simples en SVG, dibujadas con createElementNS (sin librerías). Se dibujan al ancho real de su caja, así las
 * letras se leen igual en el teléfono que en la computadora, y se vuelven a dibujar al cambiar el tamaño.
 */
(function (raiz) {
  'use strict';

  var C = raiz.Comercio;
  var svg = C.svg;

  /** Un número redondo para el tope del eje (1, 2, 2,5, 5 × 10ⁿ). */
  function topeRedondo(max) {
    if (!(max > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(max)));
    var pasos = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < pasos.length; i++) if (pasos[i] * p >= max) return pasos[i] * p;
    return 10 * p;
  }

  /**
   * Barras verticales. `datos`: [{ etiqueta, valor, titulo }]. `o.formato(valor)` para el eje y las cifras.
   * Devuelve la caja (un div) que se redibuja sola al cambiar de ancho.
   */
  function barras(datos, o) {
    o = o || {};
    var caja = C.h('div', { class: 'grafica', role: 'img', 'aria-label': o.rotulo || 'Gráfica' });
    var dibujar = function () {
      var ancho = Math.max(260, Math.round(caja.clientWidth || 600));
      var alto = o.alto || 220;
      var izq = 46, der = 8, arriba = 14, abajo = 28;
      var w = ancho - izq - der, hh = alto - arriba - abajo;
      var mayor = Math.max.apply(null, datos.map(function (d) { return C.num(d.valor); }).concat([0]));
      var max = mayor > 0 ? topeRedondo(mayor / 3) * 3 : 3;
      var n = Math.max(1, datos.length);
      var paso = w / n;
      var anchoBarra = Math.max(2, Math.min(42, paso * 0.68));
      var fmt = o.formato || function (x) { return String(x); };
      var hijos = [];
      for (var g = 0; g <= 3; g++) {
        var y = arriba + hh - (hh * g) / 3;
        hijos.push(svg('line', { x1: izq, x2: ancho - der, y1: y, y2: y, class: 'g-linea' + (g === 0 ? ' base' : '') }));
        hijos.push(svg('text', { x: izq - 6, y: y + 4, class: 'g-eje', 'text-anchor': 'end' }, fmt((max * g) / 3, true)));
      }
      // Etiquetas abajo: las que quepan (una de cada `cada`).
      var cada = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(w / 46))));
      if (o.cada) cada = Math.max(o.cada, Math.ceil(cada / o.cada) * o.cada);
      var mejor = -1, valMejor = -Infinity;
      datos.forEach(function (d, i) { if (C.num(d.valor) > valMejor) { valMejor = C.num(d.valor); mejor = i; } });
      datos.forEach(function (d, i) {
        var v = C.num(d.valor);
        var bh = max ? (hh * v) / max : 0;
        var x = izq + paso * i + (paso - anchoBarra) / 2;
        var barra = svg('rect', { x: x.toFixed(1), y: (arriba + hh - bh).toFixed(1), width: anchoBarra.toFixed(1), height: Math.max(v > 0 ? 1.5 : 0, bh).toFixed(1), rx: Math.min(4, anchoBarra / 3), class: 'g-barra' + (i === mejor && v > 0 ? ' mejor' : '') },
          svg('title', {}, (d.titulo || d.etiqueta) + ': ' + fmt(v)));
        hijos.push(barra);
        if (i % cada === 0 || i === n - 1 && n <= 12) hijos.push(svg('text', { x: (x + anchoBarra / 2).toFixed(1), y: alto - 9, class: 'g-etiqueta', 'text-anchor': 'middle' }, d.etiqueta));
      });
      if (mejor >= 0 && valMejor > 0 && n <= 40) {
        var xm = izq + paso * mejor + paso / 2;
        var ym = arriba + hh - (hh * valMejor) / max;
        hijos.push(svg('text', { x: xm.toFixed(1), y: Math.max(11, ym - 5).toFixed(1), class: 'g-valor', 'text-anchor': 'middle' }, fmt(valMejor)));
      }
      C.vaciar(caja);
      caja.appendChild(svg('svg', { viewBox: '0 0 ' + ancho + ' ' + alto, width: ancho, height: alto, class: 'g-svg', 'aria-hidden': 'true' }, hijos));
    };
    var reloj = null;
    var alCambiar = function () {
      if (!caja.isConnected) { raiz.removeEventListener('resize', alCambiar); return; }
      clearTimeout(reloj);
      reloj = setTimeout(dibujar, 120);
    };
    raiz.addEventListener('resize', alCambiar);
    // Se dibuja cuando ya está en la página (para medir su ancho).
    var intentos = 0;
    var cuandoEste = function () { if (caja.isConnected || intentos++ > 40) dibujar(); else raiz.requestAnimationFrame(cuandoEste); };
    raiz.requestAnimationFrame(cuandoEste);
    return caja;
  }

  /** Barras horizontales (los más vendidos): HTML con su ancho por CSSOM (la CSP no deja estilos escritos). */
  function horizontales(datos, o) {
    o = o || {};
    var max = Math.max.apply(null, datos.map(function (d) { return C.num(d.valor); }).concat([1]));
    return C.h('div', { class: 'barras-h' }, datos.map(function (d, i) {
      var lleno = C.h('span', { class: 'lleno' });
      lleno.style.width = Math.max(2, Math.round((C.num(d.valor) * 100) / max)) + '%';
      return C.h('div', { class: 'barra-h' },
        C.h('span', { class: 'pos' }, String(i + 1)),
        C.h('div', { class: 'txt' }, C.dato('span', { class: 'nombre' }, d.etiqueta), C.h('span', { class: 'fondo' }, lleno)),
        C.h('span', { class: 'n' }, o.formato ? o.formato(d.valor, d) : String(d.valor)));
    }));
  }

  C.graficas = { barras: barras, horizontales: horizontales, topeRedondo: topeRedondo };
})(window);
