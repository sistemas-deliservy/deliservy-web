#!/usr/bin/env python3
"""Pone (o quita) la capa de idioma en las páginas de la web.

    python3 herramientas/idioma/aplicar.py            # la pone en index.html, privacidad.html, terminos.html, vendedor/ y comercio/
    python3 herramientas/idioma/aplicar.py --quitar   # deja los archivos como estaban, byte a byte

La capa son DOS bloques pegados justo antes de </body>: el diccionario
(`capa-idioma-datos`, solo las entradas que esa página usa) y el motor
(`capa-idioma`, `motor.js`). No se toca nada más del archivo.

La página de los vendedores (`vendedor/index.html`, 24-oct-2026) va aparte:
- sus textos están en su guion (`vendedor/app.js`), y también se miran ahí;
- lleva su propio diccionario (`diccionario-vendedor.json`, encima del de siempre) y su lista de textos que manda el
  servidor (`siempre-vendedor.json`): así las otras tres páginas quedan igual que antes;
- lleva CSP (ningún guion escrito dentro de la página): el motor va en un archivo, `vendedor/idioma.js` (copia de
  `motor.js`, que este guion escribe), y el diccionario sigue dentro, como datos JSON (eso la CSP sí lo deja).

El panel del comercio (`comercio/index.html`, 24-oct-2026) va igual que la del vendedor: sus textos en sus guiones
(`comercio/*.js`), `diccionario-comercio.json`, `siempre-comercio.json` y el motor en `comercio/idioma.js`.
"""
import hashlib, json, os, re, sys, html

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))  # herramientas/idioma → la raíz de la web
HUECO = '⟦⟧'
INI, FIN = '<!-- capa-idioma: inicio -->', '<!-- capa-idioma: fin -->'
BLOQUE = re.compile(re.escape(INI) + r'.*?' + re.escape(FIN) + r'\r?\n', re.S)

PAGINAS = [
    {'archivo': 'index.html'},
    {'archivo': 'privacidad.html'},
    {'archivo': 'terminos.html'},
    {'archivo': 'vendedor/index.html', 'textos': ['vendedor/app.js'],
     'diccionarios': ['diccionario.json', 'diccionario-vendedor.json'], 'siempre': 'siempre-vendedor.json',
     'motor_aparte': 'vendedor/idioma.js'},
    # El panel del comercio (24-oct-2026): igual que la página del vendedor, con sus guiones repartidos en varios
    # archivos (todos se miran), su diccionario y su lista de textos que manda la API.
    {'archivo': 'comercio/index.html',
     'textos': ['comercio/' + n + '.js' for n in ('base', 'mapa', 'fotos', 'graficas', 'pedidos', 'productos', 'vendedores',
                                                  'billetera', 'flota', 'estadisticas', 'tienda', 'app')],
     'diccionarios': ['diccionario.json', 'diccionario-comercio.json'], 'siempre': 'siempre-comercio.json',
     'motor_aparte': 'comercio/idioma.js'},
]


def quitar(s):
    return BLOQUE.sub('', s)


def armar(s, dic, motor, siempre=frozenset(), extra='', motor_src=None):
    plano = re.sub(r'\s+', ' ', html.unescape(s + '\n' + extra))
    f, p = {}, []
    for es, en in dic.items():
        if not en or en == es:
            continue
        partes = [x.strip() for x in es.split(HUECO) if x.strip()]
        # `siempre.json`: textos que no están escritos en el archivo (los manda el servidor: motivos, permisos…).
        if es not in siempre and not all(x in plano for x in partes):
            continue
        if HUECO in es:
            p.append([es, en])
        else:
            f[es] = en
    p.sort(key=lambda par: -len(par[0]))  # el más largo primero: gana el más concreto
    datos = json.dumps({'f': f, 'p': p}, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    nl = '\r\n' if '\r\n' in s else '\n'
    if motor_src:
        guion = '<script id="capa-idioma" src="' + motor_src + '"></script>' + nl
    else:
        guion = '<script id="capa-idioma">' + nl + motor.replace('\r\n', '\n').replace('\n', nl) + '</script>' + nl
    bloque = (INI + nl + '<script id="capa-idioma-datos" type="application/json">' + datos + '</script>' + nl +
              guion + FIN + nl)
    i = s.rfind('</body>')
    assert i > 0, 'sin </body>'
    return s[:i] + bloque + s[i:], len(f), len(p)


def leer_json(nombre):
    return json.load(open(os.path.join(AQUI, nombre), encoding='utf-8'))


def main():
    motor = open(os.path.join(AQUI, 'motor.js'), encoding='utf-8').read()
    # El título y la descripción van en <head>, sin unescape de por medio: se incluyen siempre.
    assert '</script' not in motor
    quitar_todo = '--quitar' in sys.argv
    for pagina in PAGINAS:
        nombre = pagina['archivo']
        ruta = os.path.join(RAIZ, nombre)
        s = open(ruta, 'rb').read().decode('utf-8')
        base = quitar(s)
        aparte = pagina.get('motor_aparte')
        if quitar_todo:
            nuevo, nota = base, 'sin capa'
            if aparte and os.path.exists(os.path.join(RAIZ, aparte)):
                os.remove(os.path.join(RAIZ, aparte))
        else:
            dic = {}
            for d in pagina.get('diccionarios', ['diccionario.json']):
                dic.update(leer_json(d))
            siempre = frozenset(leer_json(pagina.get('siempre', 'siempre.json')))
            extra = '\n'.join(open(os.path.join(RAIZ, t), encoding='utf-8').read() for t in pagina.get('textos', []))
            motor_src = None
            if aparte:
                # El motor en su archivo, con su huella (para que el navegador no se quede con uno viejo).
                open(os.path.join(RAIZ, aparte), 'wb').write(motor.encode('utf-8'))
                motor_src = '/' + aparte + '?v=' + hashlib.md5(motor.encode('utf-8')).hexdigest()[:10]
            nuevo, nf, np_ = armar(base, dic, motor, siempre, extra, motor_src)
            assert quitar(nuevo) == base
            nota = '%d textos, %d patrones' % (nf, np_)
        open(ruta, 'wb').write(nuevo.encode('utf-8'))
        print('%s: %s, %d bytes' % (nombre, nota, len(nuevo.encode('utf-8'))))


if __name__ == '__main__':
    main()
