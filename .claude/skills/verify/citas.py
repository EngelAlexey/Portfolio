# -*- coding: utf-8 -*-
import io, re, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'D:/GitHub/Personal/Portfolio/src/content/articles/primeros-pasos-programar-con-ia/es.mdx'
t = io.open(path, encoding='utf-8').read()

body, refs_block = t.split('<References', 1)

cites = [(m.start(), int(m.group(1)), 'repeat' in m.group(0)) for m in re.finditer(r'<Cite n=\{(\d+)\}([^/]*)/>', t)]
titles = re.findall(r"title: '([^']*)'", refs_block) + re.findall(r'title: "([^"]*)"', refs_block)
sources = re.findall(r"source: '([^']*)'", refs_block)

print('citas totales: %d | referencias: %d' % (len(cites), len(sources)))

ok = True

# every n has a reference
maxn = max(n for _, n, _ in cites)
if maxn != len(sources):
    print('ERROR: la cita mas alta es %d y hay %d referencias' % (maxn, len(sources)))
    ok = False

used = sorted(set(n for _, n, _ in cites))
missing = [n for n in range(1, len(sources) + 1) if n not in used]
if missing:
    print('ERROR: referencias sin ninguna cita: %s' % missing)
    ok = False

# first occurrence order must be ascending 1,2,3...
first_seen = []
for _, n, _ in cites:
    if n not in first_seen:
        first_seen.append(n)
if first_seen != sorted(first_seen):
    print('ERROR: el orden de primera aparicion no es ascendente: %s' % first_seen)
    ok = False

# exactly one non-repeat per n, and it must be the first
for n in used:
    occ = [(pos, rep) for pos, m, rep in cites if m == n]
    non_repeat = [p for p, rep in occ if not rep]
    if len(non_repeat) != 1:
        print('ERROR: la cita %d tiene %d apariciones sin `repeat` (debe ser 1)' % (n, len(non_repeat)))
        ok = False
    elif non_repeat[0] != occ[0][0]:
        print('ERROR: la cita %d marca `repeat` en su primera aparicion' % n)
        ok = False

print()
for i, (s, ti) in enumerate(zip(sources, titles), 1):
    count = sum(1 for _, n, _ in cites if n == i)
    print('%2d  x%-2d  %s - %s' % (i, count, s[:38], ti[:55]))

print()
print('OK' if ok else 'HAY ERRORES')
