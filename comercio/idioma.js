/* Capa de idioma de deliservy.com (Gilberth, 13-oct-2026).
 *
 * La portada, privacidad y términos se abren en inglés si el navegador está en
 * inglés, y en español en cualquier otro caso. El panel del comercio y la página
 * del promotor se abren en español (26-oct-2026), aunque el navegador esté en
 * inglés. Una preferencia guardada antes, en la clave vieja, no les cambia ese
 * defecto. El botón «English» / «Español» sigue: lo que la persona elija ahí
 * manda desde entonces en ese navegador.
 *
 * No cambia el HTML de la página: en español esta capa solo pinta el botón. En
 * inglés traduce lo que se VE a partir del diccionario. Lo que la persona le
 * escribe a Alisa no se toca.
 */
(function () {
  'use strict';
  var propio = document.currentScript;
  // Solo estos dos guiones: el panel y promotores. La portada lleva el motor escrito en la página.
  var esPanel = /\/(comercio|vendedor)\/idioma\.js(?:\?|$)/.test((propio && propio.src) || '');
  var CLAVE = esPanel ? 'deliservy_idioma_panel' : 'deliservy_idioma';
  var idioma = 'es';
  var elegido = null;
  try { elegido = localStorage.getItem(CLAVE); } catch (_) {}
  if (elegido === 'en' || elegido === 'es') idioma = elegido;
  // Sin elección guardada: en la portada, el idioma del navegador. En el panel y
  // en promotores el defecto es español (la clave vieja no cuenta).
  else if (!esPanel && /^en\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '')) idioma = 'en';

  function cambiarIdioma() {
    try { localStorage.setItem(CLAVE, idioma === 'en' ? 'es' : 'en'); } catch (_) {}
    location.reload();
  }

  // ── El botón ───────────────────────────────────────────────────────────────
  function ponerBotones() {
    var rotulo = idioma === 'en' ? '🌐 Español' : '🌐 English';
    var titulo = idioma === 'en' ? 'Cambiar a español' : 'Switch to English';
    function boton(clase, id) {
      if (document.getElementById(id)) return null;
      var b = document.createElement('button');
      b.type = 'button'; b.id = id; b.className = clase;
      b.setAttribute('data-idioma', 'no');
      b.textContent = rotulo; b.title = titulo; b.onclick = cambiarIdioma;
      return b;
    }
    var b = boton('btn-idioma', 'idioma-btn');
    if (!b) return;
    b.style.cssText = 'background:transparent;border:1px solid rgba(255,255,255,.28);color:inherit;border-radius:999px;padding:8px 14px;font:600 13px/1 inherit;cursor:pointer;white-space:nowrap;';
    // Portada: en la barra, antes de «Descargar App» (y visible también en el teléfono).
    var derecha = document.querySelector('nav .nav-right');
    if (derecha) { derecha.insertBefore(b, derecha.firstChild); return; }
    // Privacidad y Términos: al final de la barra.
    var barra = document.querySelector('nav .nav-inner');
    if (barra) { b.style.marginLeft = '12px'; barra.appendChild(b); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ponerBotones); else ponerBotones();

  if (idioma !== 'en') return; // En español no se toca NADA más.

  // ── El diccionario ─────────────────────────────────────────────────────────
  var datos = { f: {}, p: [] };
  try { datos = JSON.parse(document.getElementById('capa-idioma-datos').textContent); } catch (_) {}
  var HUECO = '⟦⟧';
  var fijos = new Map();
  Object.keys(datos.f).forEach(function (k) { fijos.set(k, datos.f[k]); });
  function escapar(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'); }
  var patrones = (datos.p || []).map(function (par) {
    var partes = par[0].split(HUECO);
    var ancla = partes.reduce(function (a, b) { return b.trim().length > a.length ? b.trim() : a; }, '');
    // Un hueco pegado a una letra es la terminación del plural («paquete⟦⟧» = paquete/paquetes;
    // «devuelto⟦⟧», «lleg⟦⟧»): puede venir vacío y en inglés queda en «s» o en nada.
    var fuente = '^', sufijo = [];
    for (var i = 0; i < partes.length; i++) {
      fuente += escapar(partes[i]);
      if (i < partes.length - 1) {
        var pegado = /[A-Za-zÁÉÍÓÚÑáéíóúñ]$/.test(partes[i]);
        sufijo.push(pegado);
        fuente += pegado ? '([a-záéíóúñ]{0,3})' : '(.+?)';
      }
    }
    return { re: new RegExp(fuente + '$'), en: par[1].split(HUECO), ancla: ancla, sufijo: sufijo };
  }).filter(function (p) { return p.ancla.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '').length >= 3; });

  var MESES = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', sept: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec',
    enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', setiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December' };
  var DIAS = { lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', jueves: 'Thursday', viernes: 'Friday', 'sábado': 'Saturday', domingo: 'Sunday',
    lun: 'Mon', mié: 'Wed', jue: 'Thu', vie: 'Fri', sáb: 'Sat', dom: 'Sun' };
  var RE_MES = new RegExp('(\\d{1,2})(\\s+de\\s+|\\s+|[-/])(' + Object.keys(MESES).sort(function (a, b) { return b.length - a.length; }).join('|') + ')\\b\\.?(\\s+de(?=\\s+\\d{4}))?', 'gi');
  var RE_DIA = new RegExp('(^|[^A-Za-zÁÉÍÓÚÑáéíóúñ])(' + Object.keys(DIAS).join('|') + ')(?=[.,]?\\s+\\d|,)', 'gi');
  function mayuscula(original, en) { return original.charAt(0) === original.charAt(0).toUpperCase() && original.charAt(0) !== original.charAt(0).toLowerCase() ? en : en; }
  /** Fechas y horas sueltas dentro de un texto: «13 oct», «3 de octubre de 2026», «1:05 p. m.», «hace 5 min». */
  function fechas(t) {
    var r = t;
    if (/\d/.test(r)) {
      r = r.replace(RE_MES, function (_, d, sep, mes, de) { return d + (/[-/]/.test(sep) ? sep : ' ') + mayuscula(mes, MESES[mes.toLowerCase()]) + (de ? '' : ''); });
      r = r.replace(RE_DIA, function (_, antes, dia) { return antes + DIAS[dia.toLowerCase()]; });
      r = r.replace(/(\d)\s*a\.\s?m\.?/gi, '$1 AM').replace(/(\d)\s*p\.\s?m\.?/gi, '$1 PM');
      r = r.replace(/\bhace\s+(\d+)\s*(min|h|s|d)\b/gi, '$1 $2 ago').replace(/\bhace\s+(\d+)\s+minutos?\b/gi, '$1 min ago')
           .replace(/\bhace\s+(\d+)\s+horas?\b/gi, '$1 h ago').replace(/\bhace\s+(\d+)\s+d[ií]as?\b/gi, '$1 d ago');
    }
    return r;
  }

  var cache = new Map();
  var faltan = new Set();
  var LETRAS = /[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/;
  var SEPARADORES = [' · ', ' — ', ' – ', ' | ', ' • ', ' → '];

  function exacto(t) {
    var v = fijos.get(t);
    if (v !== undefined) return v;
    for (var i = 0; i < patrones.length; i++) {
      var p = patrones[i];
      if (t.indexOf(p.ancla) < 0) continue;
      var m = p.re.exec(t);
      if (!m) continue;
      var s = p.en[0];
      for (var g = 1; g < m.length; g++) {
        var cap = m[g];
        if (p.sufijo[g - 1]) cap = (cap === 's' || cap === 'es') && /[A-Za-z]$/.test(s) ? 's' : '';
        else cap = trozo(cap, 1);
        s += cap + (p.en[g] || '');
      }
      return s;
    }
    return undefined;
  }
  /** Un trozo: exacto; si no, quitando adornos (emoji, número, dos puntos) o partiéndolo por sus separadores. */
  function trozo(t, nivel) {
    if (!LETRAS.test(t)) return t;
    var v = exacto(t);
    if (v !== undefined) return v;
    if (nivel > 3) return fechas(t);
    var m;
    // «📦 Pedidos», «3 pedidos», «Estado:», «(vencido)»
    if ((m = /^([^A-Za-zÁÉÍÓÚÑáéíóúñ¿¡]+)(.*[A-Za-zÁÉÍÓÚÑáéíóúñ?!.)%])([^A-Za-zÁÉÍÓÚÑáéíóúñ?!.)%]*)$/.exec(t)) && (m[1] || m[3])) {
      v = exacto(m[2]);
      if (v !== undefined) return m[1] + v + m[3];
    }
    if ((m = /^(.*[A-Za-zÁÉÍÓÚÑáéíóúñ)])([:.…!?]+)$/.exec(t))) {
      v = exacto(m[1]);
      if (v !== undefined) return v + m[2];
    }
    for (var i = 0; i < SEPARADORES.length; i++) {
      if (t.indexOf(SEPARADORES[i]) < 0) continue;
      var partes = t.split(SEPARADORES[i]);
      var hecho = partes.map(function (x) { return trozo(x, nivel + 1); });
      if (hecho.some(function (x, k) { return x !== partes[k]; })) return hecho.join(SEPARADORES[i]);
    }
    if ((m = /^(.+?): (.+)$/.exec(t))) {
      var a = exacto(m[1] + ':'), a2 = a === undefined ? exacto(m[1]) : undefined, b = trozo(m[2], nivel + 1);
      if (a !== undefined || a2 !== undefined || b !== m[2]) return (a !== undefined ? a : (a2 !== undefined ? a2 + ':' : m[1] + ':')) + ' ' + b;
    }
    if ((m = /^(.+?) \((.+)\)$/.exec(t))) {
      var c = trozo(m[1], nivel + 1), d = trozo(m[2], nivel + 1);
      if (c !== m[1] || d !== m[2]) return c + ' (' + d + ')';
    }
    return fechas(t);
  }
  /** Texto de pantalla → inglés, o el mismo texto si no está en el diccionario. */
  function traducir(texto) {
    if (!texto || !LETRAS.test(texto)) return texto;
    var c = cache.get(texto);
    if (c !== undefined) return c;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);
    var limpio = m[2].replace(/\s+/g, ' ');
    var en = trozo(limpio, 0);
    var r = en === limpio ? texto : m[1] + en + m[3];
    if (en === limpio && /[áéíóúñ¿¡]|\b(de|la|el|los|las|del|para|por|con|sin|que|no|un|una|en)\b/i.test(limpio) && faltan.size < 5000) faltan.add(limpio);
    if (cache.size > 30000) cache.clear();
    cache.set(texto, r);
    return r;
  }
  window.idiomaTraducir = traducir;
  /** Lo que se vio en español y no está en el diccionario (para completarlo). */
  window.idiomaFaltantes = function () { return Array.from(faltan); };

  // ── Lo que no se toca ──────────────────────────────────────────────────────
  // `.alisa-msg.de-ti`: lo que la persona le escribió a Alisa.
  var NO_TOCAR = '.alisa-msg.de-ti, [data-idioma="no"], script, style, textarea, code, pre, [contenteditable=""], [contenteditable="true"], .maplibregl-canvas-container, .leaflet-pane';
  var ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];
  var puestos = new WeakMap(); // nodo → el inglés que le puse (para no volver a entrar)

  function prohibido(el) { return !el || el.nodeType !== 1 ? false : !!el.closest(NO_TOCAR); }

  function texto(n) {
    var v = n.nodeValue;
    if (!v || puestos.get(n) === v) return;
    var p = n.parentNode;
    if (!p || p.nodeType !== 1 || prohibido(p)) return;
    var en = traducir(v);
    if (en === v) return;
    // Un <option> sin value manda su texto: se le fija el de siempre antes de traducir lo que se ve.
    if (p.tagName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', p.textContent);
    puestos.set(n, en);
    n.nodeValue = en;
  }
  function atributos(el) {
    for (var i = 0; i < ATRIBUTOS.length; i++) {
      var a = ATRIBUTOS[i], v = el.getAttribute(a);
      if (!v) continue;
      var en = traducir(v);
      if (en !== v) el.setAttribute(a, en);
    }
    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) {
      var e2 = traducir(el.value);
      if (e2 !== el.value) el.value = e2;
    }
  }
  function recorrer(raiz) {
    if (raiz.nodeType === 3) return texto(raiz);
    if (raiz.nodeType !== 1 || prohibido(raiz)) return;
    atributos(raiz);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) return n.matches(NO_TOCAR) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) texto(n); else atributos(n); }
  }

  function arrancar() {
    document.documentElement.lang = 'en';
    document.title = traducir(document.title);
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', traducir(desc.getAttribute('content') || ''));
    recorrer(document.body);
    new MutationObserver(function (cambios) {
      for (var i = 0; i < cambios.length; i++) {
        var c = cambios[i];
        try {
          if (c.type === 'characterData') texto(c.target);
          else if (c.type === 'attributes') { if (!prohibido(c.target)) atributos(c.target); }
          else for (var k = 0; k < c.addedNodes.length; k++) recorrer(c.addedNodes[k]);
        } catch (_) {}
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  }
  if (document.body) arrancar(); else document.addEventListener('DOMContentLoaded', arrancar);

  // ── Los avisos del navegador ───────────────────────────────────────────────
  function porLineas(s) {
    if (typeof s !== 'string') return s;
    var entero = traducir(s);
    if (entero !== s) return entero;
    return s.split('\n').map(function (l) { return traducir(l); }).join('\n');
  }
  ['alert', 'confirm', 'prompt'].forEach(function (nombre) {
    var original = window[nombre];
    if (typeof original !== 'function') return;
    window[nombre] = function (mensaje) {
      var args = Array.prototype.slice.call(arguments);
      try { args[0] = porLineas(mensaje); } catch (_) {}
      return original.apply(window, args);
    };
  });
})();
