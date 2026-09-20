#!/usr/bin/env python3
"""
Genera los datos de comunas de Chile que usa el filtro "Cerca de mí":

  src/features/events/data/comunas.ts             lista de comunas (nombre y región)
  src/features/events/data/comunas-geometry.json  límites simplificados (carga diferida)

Fuente: https://github.com/caracena/chile-geojson (1.geojson ... 16.geojson).
Ese repositorio no declara licencia; los límites provienen de la división
político-administrativa oficial, así que conviene citar la fuente original.

Uso:  python3 scripts/build-comunas-data.py <carpeta con 1.geojson ... 16.geojson>
Los polígonos se simplifican (Douglas-Peucker, ~1 km) y se descartan islotes
menores para que el archivo pese ~330 KB.
"""
import glob
import json
import math
import os
import sys
import unicodedata

TOLERANCE = 0.01   # grados (~1,1 km)
MIN_AREA = 0.002   # grados²; islas/huecos menores se descartan (siempre se conserva el polígono mayor)
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'features', 'events', 'data')


def douglas_peucker(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        length2 = dx * dx + dy * dy
        max_d, max_i = -1, -1
        for i in range(a + 1, b):
            x, y = pts[i]
            if length2 == 0:
                d = math.hypot(x - x1, y - y1)
            else:
                t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / length2))
                d = math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
            if d > max_d:
                max_d, max_i = d, i
        if max_d > tol:
            keep[max_i] = True
            stack += [(a, max_i), (max_i, b)]
    return [p for p, k in zip(pts, keep) if k]


def sort_key(name):
    return ''.join(ch for ch in unicodedata.normalize('NFD', name) if not unicodedata.combining(ch)).lower()


def area(ring):
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]))) / 2


def simplify(ring):
    r = ring[:-1] if ring[0] == ring[-1] else ring
    s = douglas_peucker(r + [r[0]], TOLERANCE)[:-1]
    if len(s) < 3:
        return None
    flat = []
    for lng, lat in s:  # GeoJSON viene como [lng, lat]; se guarda [lat, lng] plano
        flat += [round(lat, 3), round(lng, 3)]
    return flat


def main(src_dir):
    comunas = []
    for path in sorted(glob.glob(os.path.join(src_dir, '[0-9]*.geojson')), key=lambda p: int(os.path.basename(p).split('.')[0])):
        with open(path, encoding='utf-8') as fh:
            for feature in json.load(fh)['features']:
                geom, props = feature['geometry'], feature['properties']
                polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
                polys = sorted(polys, key=lambda pl: -area(pl[0]))
                kept = []
                for i, poly in enumerate(polys):
                    if i > 0 and area(poly[0]) < MIN_AREA:
                        continue
                    outer = simplify(poly[0])
                    if not outer:
                        continue
                    holes = [h for h in (simplify(h) for h in poly[1:] if area(h) >= MIN_AREA) if h]
                    kept.append([outer] + holes)
                comunas.append({'n': props['Comuna'], 'r': props['Region'], 'p': kept})

    comunas.sort(key=lambda c: sort_key(c['n']))
    with open(os.path.join(OUT_DIR, 'comunas-geometry.json'), 'w', encoding='utf-8') as fh:
        json.dump([{'n': c['n'], 'p': c['p']} for c in comunas], fh, ensure_ascii=False, separators=(',', ':'))

    lines = [
        "// Archivo generado por scripts/build-comunas-data.py; no editar a mano.",
        "// Fuente: https://github.com/caracena/chile-geojson (límites comunales de Chile).",
        "",
        "export interface Comuna {",
        "  name: string;",
        "  region: string;",
        "}",
        "",
        "export const COMUNAS: Comuna[] = [",
    ]
    for c in comunas:
        lines.append("  { name: %s, region: %s }," % (json.dumps(c['n'], ensure_ascii=False), json.dumps(c['r'], ensure_ascii=False)))
    lines.append("];")
    with open(os.path.join(OUT_DIR, 'comunas.ts'), 'w', encoding='utf-8') as fh:
        fh.write("\n".join(lines) + "\n")
    print('comunas:', len(comunas))


if __name__ == '__main__':
    main(sys.argv[1])
