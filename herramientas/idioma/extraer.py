# Saca del HTML de un panel los textos que se ven: los fijos del HTML y los que arma el JavaScript.
import re, sys, json, html
from html.parser import HTMLParser

ATR = ('placeholder', 'title', 'aria-label', 'alt', 'data-tip', 'data-label')
PH = '⟦⟧'  # ⟦⟧ = un hueco ${…}

def norm(t):
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out = []; s.skip = 0; s.scripts = []; s.buf = None
    def handle_starttag(s, tag, attrs):
        if tag in ('script', 'style'):
            s.skip += 1; s.buf = [] if tag == 'script' else None
        for k, v in attrs:
            if v and (k in ATR or (k == 'value' and tag in ('input', 'button') and dict(attrs).get('type') in ('button', 'submit'))):
                s.out.append(norm(v))
    def handle_endtag(s, tag):
        if tag in ('script', 'style'):
            s.skip = max(0, s.skip - 1)
            if tag == 'script' and s.buf is not None: s.scripts.append(''.join(s.buf)); s.buf = None
    def handle_data(s, d):
        if s.skip:
            if s.buf is not None: s.buf.append(d)
        else:
            s.out.append(norm(d))

def literales(js):
    """Cadenas '…', "…" y `…` del JavaScript; los ${…} de las plantillas quedan como hueco."""
    i, n, res = 0, len(js), []
    prev = ''
    while i < n:
        c = js[i]
        if c == '/' and i + 1 < n and js[i+1] == '/':
            j = js.find('\n', i); i = n if j < 0 else j; continue
        if c == '/' and i + 1 < n and js[i+1] == '*':
            j = js.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c == '/' and prev in '(,=:[!&|?{};\n' + '':
            # expresión regular: saltarla
            j = i + 1; cls = False
            while j < n and js[j] != '\n':
                if js[j] == '\\': j += 2; continue
                if js[j] == '[': cls = True
                elif js[j] == ']': cls = False
                elif js[j] == '/' and not cls: break
                j += 1
            if j < n and js[j] == '/': i = j + 1; prev = 'x'; continue
        if c in '\'"':
            j = i + 1; b = []
            while j < n and js[j] != c and js[j] != '\n':
                if js[j] == '\\' and j + 1 < n:
                    e = js[j+1]; b.append({'n': '\n', 't': ' '}.get(e, e)); j += 2; continue
                b.append(js[j]); j += 1
            res.append(''.join(b)); i = j + 1; prev = 'x'; continue
        if c == '`':
            j = i + 1; b = []
            while j < n and js[j] != '`':
                if js[j] == '\\' and j + 1 < n: b.append(js[j+1] if js[j+1] not in 'nt' else ' '); j += 2; continue
                if js[j] == '$' and j + 1 < n and js[j+1] == '{':
                    d = 1; k = j + 2; ini = k
                    while k < n and d:
                        ch = js[k]
                        if ch in '\'"`':
                            # cadena o plantilla anidada: saltar hasta su cierre (aprox.)
                            q = ch; k += 1; dd = 0
                            while k < n and (js[k] != q or dd):
                                if js[k] == '\\': k += 1
                                elif q == '`' and js[k] == '$' and k + 1 < n and js[k+1] == '{': dd += 1; k += 1
                                elif q == '`' and js[k] == '}' and dd: dd -= 1
                                k += 1
                        elif ch == '{': d += 1
                        elif ch == '}': d -= 1
                        k += 1
                    res.extend(literales(js[ini:k-1]))  # lo de dentro del hueco también trae textos
                    b.append(PH); j = k; continue
                b.append(js[j]); j += 1
            res.append(''.join(b)); i = j + 1; prev = 'x'; continue
        if not c.isspace(): prev = c
        i += 1
    return res

TAG = re.compile(r'<[^<>]*>')
ATRRE = re.compile(r'\b(?:%s)\s*=\s*"([^"]*)"|\b(?:%s)\s*=\s*\'([^\']*)\'' % ('|'.join(ATR), '|'.join(ATR)))

def trozos(lit):
    out = []
    if '<' in lit and re.search(r'</?[a-zA-Z]', lit):
        for m in ATRRE.finditer(lit): out.append(norm(m.group(1) or m.group(2) or ''))
        for t in TAG.split(lit): out.append(norm(t))
        # etiqueta sin cerrar al final o al principio del literal
    else:
        out.append(norm(lit))
    return out

LETRAS = re.compile(r'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}')
def vale(t, de_js):
    if not t or len(t) > 400: return False
    s = t.replace(PH, ' ')
    if not LETRAS.search(s): return False
    if '<' in s or '>' in s and '=>' in s: return False
    if de_js:
        if re.search(r'[{};]|=>|\|\||&&|==|\$\(|function\b|\bvar\(|rgba?\(|px\b|^\s*[.#][\w-]+', s) and not re.search(r'[áéíóúñ¿¡]', s): return False
        if ' ' not in s.strip():
            w = s.strip()
            # una sola palabra: solo si parece palabra de pantalla (Mayúscula inicial o con tilde/ñ o termina en : ! .)
            if not re.fullmatch(r'[¿¡]?[A-ZÁÉÍÓÚÑ][a-záéíóúüñ]+[:.!?…]*|[a-záéíóúüñ]*[áéíóúñ][a-záéíóúüñ]*[:.!?…]*', w): return False
        else:
            # con espacios: descartar selectores, clases y estilos
            if re.fullmatch(r'[\w\-\s.#:,\[\]="\'()>+*%/]+', s) and not re.search(r'[A-ZÁÉÍÓÚ]|[áéíóúñ]', s) and re.search(r'[-_#.=\[\]/:%]', s): return False
            if re.search(r'^(?:[a-z-]+:\s*[^;]+;?\s*)+$', s) and ':' in s and not re.search(r'[áéíóúñ¿¡]', s) and re.search(r'\b(px|solid|flex|none|auto|var|bold|center|#[0-9a-f]{3,6})\b', s): return False
    return True

src = open(sys.argv[1], encoding='utf-8').read()
p = P(); p.feed(src)
est = {t for t in p.out if vale(t, False)}
din = set()
for sc in p.scripts:
    for lit in literales(sc):
        for t in trozos(lit):
            t = t.strip()
            if vale(t, True): din.add(t)
todo = sorted(est | din)
fijos = [t for t in todo if PH not in t]
patr = [t for t in todo if PH in t]
json.dump({'fijos': fijos, 'patrones': patr}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(sys.argv[1], 'fijos', len(fijos), 'patrones', len(patr), 'caracteres', sum(map(len, todo)), 'scripts', len(p.scripts))
