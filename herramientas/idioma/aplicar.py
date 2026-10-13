#!/usr/bin/env python3
"""Pone (o quita) la capa de idioma en los dos paneles.

    python3 herramientas/idioma/aplicar.py            # la pone en index.html, privacidad.html y terminos.html
    python3 herramientas/idioma/aplicar.py --quitar   # deja los archivos como estaban, byte a byte

La capa son DOS bloques pegados justo antes de </body>: el diccionario
(`capa-idioma-datos`, solo las entradas que ese panel usa) y el motor
(`capa-idioma`, `motor.js`). No se toca nada más del archivo.
"""
import json, os, re, sys, html

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))  # herramientas/idioma → la raíz de la web
HUECO = '⟦⟧'
INI, FIN = '<!-- capa-idioma: inicio -->', '<!-- capa-idioma: fin -->'
BLOQUE = re.compile(re.escape(INI) + r'.*?' + re.escape(FIN) + r'\r?\n', re.S)


def quitar(s):
    return BLOQUE.sub('', s)


def armar(s, dic, motor, siempre=frozenset()):
    plano = re.sub(r'\s+', ' ', html.unescape(s))
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
    bloque = (INI + nl + '<script id="capa-idioma-datos" type="application/json">' + datos + '</script>' + nl +
              '<script id="capa-idioma">' + nl + motor.replace('\r\n', '\n').replace('\n', nl) + '</script>' + nl + FIN + nl)
    i = s.rfind('</body>')
    assert i > 0, 'sin </body>'
    return s[:i] + bloque + s[i:], len(f), len(p)


def main():
    dic = json.load(open(os.path.join(AQUI, 'diccionario.json'), encoding='utf-8'))
    motor = open(os.path.join(AQUI, 'motor.js'), encoding='utf-8').read()
    siempre = frozenset(json.load(open(os.path.join(AQUI, 'siempre.json'), encoding='utf-8')))
    # El título y la descripción van en <head>, sin unescape de por medio: se incluyen siempre.
    assert '</script' not in motor
    for nombre in ('index.html', 'privacidad.html', 'terminos.html'):
        ruta = os.path.join(RAIZ, nombre)
        s = open(ruta, 'rb').read().decode('utf-8')
        base = quitar(s)
        if '--quitar' in sys.argv:
            nuevo, nota = base, 'sin capa'
        else:
            nuevo, nf, np_ = armar(base, dic, motor, siempre)
            assert quitar(nuevo) == base
            nota = '%d textos, %d patrones' % (nf, np_)
        open(ruta, 'wb').write(nuevo.encode('utf-8'))
        print('%s: %s, %d bytes' % (nombre, nota, len(nuevo.encode('utf-8'))))


if __name__ == '__main__':
    main()
