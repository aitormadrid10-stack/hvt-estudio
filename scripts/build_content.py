"""Genera content/ y public/img|qimg a partir de los datos extraídos del curso.

Uso: python3 scripts/build_content.py RUTA_A_hvt-app
(La carpeta hvt-app contiene data.json e imgs1-3.json; no se sube al repo.)
"""
import base64, html, json, os, re, sys, unicodedata

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content')
PUB = os.path.join(ROOT, 'public')

CORTOS = [
    'Seguridad en alto voltaje',
    'Tracción eléctrica e híbrida',
    'Alto voltaje, almacenamiento y recarga',
    'Transmisión, freno y control térmico',
]

def slug(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def safe(h):
    """Escapa todo y solo deja <b> equilibrado."""
    t = html.escape(html.unescape(h), quote=False)
    t = t.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
    out, depth = [], 0
    for part in re.split(r'(</?b>)', t):
        if part == '<b>':
            if depth == 0:
                out.append(part); depth = 1
        elif part == '</b>':
            if depth == 1:
                out.append(part); depth = 0
        else:
            out.append(part)
    if depth:
        out.append('</b>')
    return ''.join(out).strip()

def clean_items(items, titulo):
    res = []
    for kind, h in items:
        h = safe(h)
        if titulo and h.startswith(titulo + ' '):
            h = h[len(titulo) + 1:]
            h = h[:1].upper() + h[1:]
        if h:
            res.append(['li' if kind == 'li' else 'p', h])
    return res

def sec_num(titulo):
    m = re.match(r'\s*(\d+)\.-\s*(.*)', titulo)
    return (int(m.group(1)), m.group(2).strip()) if m else (None, titulo.strip())

def main():
    data = json.load(open(os.path.join(SRC, 'data.json')))
    os.makedirs(os.path.join(OUT, 'temas'), exist_ok=True)
    index, search = {'modulos': []}, []
    used_imgs = set()
    for mi, m in enumerate(data['modulos']):
        mod = {'n': mi + 1, 'nombre': m['nombre'].capitalize(), 'corto': CORTOS[mi], 'temas': []}
        for t in m['temas']:
            ts = slug(t['nombre'])
            tema = {'slug': ts, 'nombre': t['nombre'], 'modulo': mi + 1, 'moduloCorto': CORTOS[mi],
                    'duracion': t.get('duracion') or '', 'objetivos': t.get('objetivos') or [],
                    'secciones': [], 'preguntas': []}
            secmap = {}
            for si, s in enumerate(t['secciones']):
                n, tit = sec_num(s['titulo'])
                n = n or si + 1
                secmap[s['titulo'].strip()] = n
                sec = {'n': n, 'titulo': tit, 'apartados': []}
                for ai, a in enumerate(s['apartados']):
                    aid = f'{n}-{ai + 1}'
                    img = a.get('img')
                    if img:
                        used_imgs.add(img)
                    sec['apartados'].append({
                        'id': aid, 'titulo': a['titulo'], 'grupo': a.get('grupo') if a.get('grupo') != a['titulo'] else None,
                        'resumen': clean_items(a['resumen'], a['titulo']),
                        'completo': clean_items(a['completo'], a['titulo']),
                        'img': '/' + img if img else None,
                        'terminos': [x for x in (a.get('terminos') or []) if len(x) <= 60][:8],
                    })
                    search.append({'t': a['titulo'], 'slug': ts, 's': n, 'a': aid, 'tema': t['nombre']})
                tema['secciones'].append(sec)
            for b in t['test']:
                n = secmap.get(b['apartado'].strip())
                if n is None:
                    n = sec_num(b['apartado'])[0]
                for q in b['preguntas']:
                    q2 = {k: v for k, v in q.items() if v not in (None, [], '')}
                    q2['seccion'] = n
                    q2['actividad'] = b.get('test')
                    if q2.get('imagen'):
                        q2['imagen'] = '/' + q2['imagen']
                    tema['preguntas'].append(q2)
            json.dump(tema, open(os.path.join(OUT, 'temas', ts + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
            mod['temas'].append({
                'slug': ts, 'nombre': t['nombre'], 'duracion': tema['duracion'],
                'nApartados': sum(len(s['apartados']) for s in tema['secciones']),
                'nPreguntas': len(tema['preguntas']),
                'secciones': [{'n': s['n'], 'titulo': s['titulo'], 'nApartados': len(s['apartados']),
                               'nPreguntas': sum(1 for q in tema['preguntas'] if q['seccion'] == s['n'])}
                              for s in tema['secciones']],
            })
            search.append({'t': t['nombre'], 'slug': ts, 's': None, 'a': None, 'tema': CORTOS[mi]})
        index['modulos'].append(mod)
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(search, open(os.path.join(OUT, 'search.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    # imágenes
    n = 0
    for f in ('imgs1.json', 'imgs2.json', 'imgs3.json'):
        for k, v in json.load(open(os.path.join(SRC, f))).items():
            p = os.path.join(PUB, k)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, 'wb').write(base64.b64decode(v)); n += 1
    # módulo de importación de temas
    lines = ['// Generado por scripts/build_content.py', 'export const temaLoaders: Record<string, () => Promise<{ default: unknown }>> = {']
    for mod in index['modulos']:
        for t in mod['temas']:
            lines.append(f"  '{t['slug']}': () => import('./temas/{t['slug']}.json'),")
    lines.append('};')
    open(os.path.join(OUT, 'loaders.ts'), 'w').write('\n'.join(lines) + '\n')
    print('temas', sum(len(m['temas']) for m in index['modulos']), 'imagenes', n, 'busqueda', len(search))

main()
