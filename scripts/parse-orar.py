"""Turn the official FMI timetable PDF (aSc Orare export) into lib/orar/orar.json.

The PDF on Google Drive has downloads disabled, so it is read through the Drive viewer:
  .playwright-mcp/presspages.json  -- the viewer's per-page text layer (word boxes)
  .playwright-mcp/imgs.json        -- base64 PNG renders of each page at 2000px width
Each class is a cell enclosed by the grid's black borders; words inside a cell are split
into teacher (top-left), subject (centre) and room / semigroup (bottom line).
SI / SP in a label mean odd / even weeks; "Gr 1", "Gr_2", "sgr_11" mark semigroups.

Requires pillow, numpy, scipy.  Usage:  python scripts/parse-orar.py
"""
import json, re, io, base64, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = '.playwright-mcp/'
raw = json.load(open(ROOT + 'presspages.json'))
imgs = json.load(open(ROOT + 'imgs.json'))
pages = [json.loads(p[p.index('\n') + 1:]) for p in raw]

ROOM_RE = re.compile(r'^(Amf\.?\s?\d+\w*|[SL][.\-]\d+\w*|ONLINE|Online|online)$')
GR_RE = re.compile(r'^(Gr_?\d+|sgr_\d+|s_\d+)$')
DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']


def words_of(p):
    out = []
    for blk in p[3]:
        for ln in blk[1]:
            for w in ln[1]:
                t, l, h, wd = w[0]
                m = re.match(r'^([A-Z])([SL][.\-]\d+\w*)$', w[1])
                if m:
                    cw = wd / len(w[1])
                    out.append({'t': t, 'l': l, 'h': h, 'w': cw, 's': m.group(1)})
                    out.append({'t': t, 'l': l + cw * 1.5, 'h': h, 'w': wd - cw * 1.5, 's': m.group(2)})
                    continue
                out.append({'t': t, 'l': l, 'h': h, 'w': wd, 's': w[1]})
    return out


def lines_of(ws):
    ws = sorted(ws, key=lambda w: (w['t'] + w['h'] / 2, w['l']))
    lines = []
    for w in ws:
        cy = w['t'] + w['h'] / 2
        if lines and abs(lines[-1]['cy'] - cy) < 4:
            lines[-1]['ws'].append(w)
        else:
            lines.append({'cy': cy, 'ws': [w]})
    for ln in lines:
        ln['ws'].sort(key=lambda w: w['l'])
    return lines


def join_text(parts):
    s = ''
    for p in parts:
        if not s:
            s = p
        elif p[:1].islower() and not s.endswith(')'):
            s += p  # word broken across narrow cell lines
        else:
            s += ' ' + p
    return s.strip()


result = []
problems = []
for n, p in enumerate(pages):
    ws = words_of(p)
    title = max(lines_of(ws), key=lambda ln: max(w['h'] for w in ln['ws']))
    title_text = ' '.join(w['s'] for w in title['ws'])
    # grid from labels
    hours = {}
    for w in ws:
        m = re.match(r'^(\d{1,2}):00$', w['s'])
        if m and w['h'] <= 9:
            hours[int(m.group(1))] = w['l']
    days = {w['s']: w for w in ws if w['s'] in DAYS and w['l'] < 70}
    if len(hours) < 6 or len(days) < 5:
        problems.append((n, title_text, 'no grid'))
        continue
    hs = sorted(hours)
    colw = (hours[hs[-1]] - hours[hs[0]]) / (hs[-1] - hs[0])
    # time label is centered in the column; its left edge ~ col_left + pad. derive left edge of first column from image instead.
    img = Image.open(io.BytesIO(base64.b64decode(imgs[n]))).convert('RGB')
    a = np.asarray(img).astype(int)
    H, W = a.shape[:2]
    sc = W / p[2] if p[2] > p[1] else W / p[1]
    sc = W / 842.0
    mx, mn = a.max(2), a.min(2)
    dark = mx < 150
    horiz = ndimage.binary_opening(dark, structure=np.ones((1, 45)))
    vert = ndimage.binary_opening(dark, structure=np.ones((40, 1)))
    lab, k = ndimage.label(~(horiz | vert))
    boxes = ndimage.find_objects(lab)
    dc = [days[d]['t'] + days[d]['h'] / 2 for d in DAYS]
    rowh = (dc[-1] - dc[0]) / 4
    rowc = [days[d]['t'] for d in DAYS]
    grid_top = rowc[0] - rowh / 2
    lw = [w for w in ws if w['s'] == f'{hs[0]}:00' and w['h'] <= 9][0]
    line8 = [w for w in ws if abs(w['t'] - lw['t']) < 2 and lw['l'] - 1 <= w['l'] <= lw['l'] + colw * 0.8]
    cx8 = (min(w['l'] for w in line8) + max(w['l'] + w['w'] for w in line8)) / 2
    grid_left = cx8 - colw / 2
    # map each word to the region under its center
    region_words = {}
    for i, w in enumerate(ws):
        cy, cx = int((w['t'] + w['h'] / 2) * sc), int((w['l'] + w['w'] / 2) * sc)
        if not (grid_top - 12 < w['t'] < grid_top + 5 * rowh and w['l'] > grid_left - 2):
            continue
        # word centers may sit on a text pixel; search a small neighbourhood for a region id
        rid = 0
        for dy in (0, -2, 2, -4, 4):
            for dx in (0, -2, 2, -4, 4):
                y, x = cy + dy, cx + dx
                if 0 <= y < H and 0 <= x < W and lab[y, x]:
                    rid = lab[y, x]; break
            if rid: break
        if rid:
            region_words.setdefault(rid, []).append(i)
    events = []
    used = set()
    for rid, idxs in region_words.items():
        sl = boxes[rid - 1]
        y0, y1 = sl[0].start / sc, sl[0].stop / sc
        x0, x1 = sl[1].start / sc, sl[1].stop / sc
        if (x1 - x0) > colw * 13 or (y1 - y0) > rowh * 1.2:
            continue
        used.update(idxs)
        bw = [ws[i] for i in idxs]
        day = int((((y0 + y1) / 2) - grid_top) // rowh)
        start = hs[0] + round((x0 - grid_left) / colw)
        end = hs[0] + round((x1 - grid_left) / colw)
        rt = grid_top + day * rowh
        top = max(0, round((y0 - rt) / rowh, 2))
        bot = min(1, round((y1 - rt) / rowh, 2))
        grpnum = None
        drop = set()
        for j, w in enumerate(bw):
            m = re.match(r'^(?:Gr_?|sgr_|s_)(\d+)$', w['s'])
            if m:
                grpnum = m.group(1); drop.add(j)
            elif w['s'] == 'Gr':
                nxt = [q for q, v in enumerate(bw) if abs(v['t'] - w['t']) < 3 and -1 <= v['l'] - (w['l'] + w['w']) < 15 and v['s'].isdigit()]
                if nxt:
                    grpnum = bw[nxt[0]]['s']; drop.update([j, nxt[0]])
        rest = [w for j, w in enumerate(bw) if j not in drop]
        lines = lines_of(rest)
        bh = y1 - y0
        teacher, subject, location = '', '', ''
        def txt(ln): return ' '.join(w['s'] for w in ln['ws'])
        def split_loc(ln):
            ri = next((q for q, w in enumerate(ln['ws']) if ROOM_RE.match(w['s'])), None)
            if ri is None:
                return '', txt(ln)
            return ' '.join(w['s'] for w in ln['ws'][:ri]), ' '.join(w['s'] for w in ln['ws'][ri:])
        if (bot - top) < 0.3 and len(lines) == 2:
            subject = txt(lines[0])
            teacher, location = split_loc(lines[1])
        else:
            body = list(lines)
            if len(body) >= 2 and body[0]['ws'][0]['l'] - x0 < 15 and (body[0]['cy'] - y0) < bh * 0.35:
                teacher = txt(body.pop(0))
            if len(body) >= 2 and (body[-1]['cy'] - y0) > bh * 0.62:
                last = body.pop()
                pre, loc = split_loc(last)
                location = (pre + ' ' + loc).strip() if not loc else loc
                if pre and loc:
                    location = loc
                    body.append({'cy': last['cy'], 'ws': [w for w in last['ws'] if w['s'] in pre.split()]})
            subject = join_text([txt(ln) for ln in body])
            if not location and len(body) == 1:
                pre, loc = split_loc(body[0])
                if loc:
                    location = loc
                    m = re.match(r'^(.*?)\s+((?:[A-Z][\w.-]+\s+[A-Z][A-Za-z]{0,2}\.?(?:\s*/\s*)?)+)$', pre)
                    if m and not teacher:
                        subject, teacher = m.group(1), m.group(2)
                    else:
                        subject = pre
        if not subject and location and not ROOM_RE.match(location.split()[0]):
            subject, location = location, ''
        if not teacher and (bot - top) < 0.3:
            m = re.match(r'^(.*?\S)\s+((?:[A-Z][a-z][\w.-]*\s+[A-Z][A-Za-z]{0,2}\.?(?:\s*/\s*)?)+)$', subject)
            if m:
                subject, teacher = m.group(1), m.group(2)
        parity = None
        if re.search(r'\bSI\b', subject):
            parity = 'odd'
        elif re.search(r'\bSP\b', subject):
            parity = 'even'
        weeks = None
        m = re.search(r'\[sapt\s*(\d+)\s*-\s*(\d+)', subject)
        if m:
            weeks = [int(m.group(1)), int(m.group(2))]
        sl_ = subject.lower()
        kind = None
        if re.search(r'\(\s*lab', sl_): kind = 'lab'
        elif re.search(r'\(\s*(seminar|sem)\b', sl_): kind = 'seminar'
        elif 'proiect' in sl_: kind = 'proiect'
        elif re.search(r'\(\s*curs', sl_): kind = 'curs'
        name = re.sub(r'\s*\[.*$', '', re.sub(r'\s*\(.*?\)\s*', ' ', subject)).strip()
        region = a[sl[0], sl[1]][lab[sl] == rid]
        sat = region[(region.max(1) - region.min(1)) > 22]
        color = '#%02x%02x%02x' % tuple(int(v) for v in (np.median(sat, axis=0) if len(sat) > 20 else (255, 255, 255)))
        events.append({
            'day': day, 'start': start, 'end': end, 'top': top, 'bottom': bot,
            'subject': name, 'label': subject, 'kind': kind, 'teacher': teacher,
            'room': location, 'group': grpnum, 'parity': parity,
            'weeks': weeks, 'color': color,
        })
    # text left in grid but not in any colored box
    stray = [w['s'] for i, w in enumerate(ws) if i not in used and w['t'] > grid_top + 2 and w['l'] > grid_left + 2 and w['t'] < grid_top + 5 * rowh - 2]
    if stray:
        problems.append((n, title_text, 'stray', stray[:20]))
    events.sort(key=lambda e: (e['day'], e['start'], e['top']))
    result.append({'page': n, 'title': title_text, 'events': events})

SPEC = {
    'MATE': ('mate', 'Mathematics'), 'MATE-INFO': ('mate-info', 'Mathematics & Computer Science'),
    'MATE APL.': ('mate-apl', 'Applied Mathematics'), 'INFO': ('info', 'Computer Science'),
    'INFO-EN': ('info-en', 'Computer Science (English)'), 'CTI': ('cti', 'Computers & Information Technology'),
}
MASTER_EN = {
    'BDTS': 'Databases and Software Technologies', 'IS': 'Software Engineering',
    'MD': 'Mathematics Education', 'PSFS': 'Probability and Statistics in Finance and Science',
    'SD': 'Distributed Systems', 'ASM': 'Advanced Studies in Mathematics',
}
groups = []
for pg in result:
    t = pg['title']
    m = re.match(r'^(.*?) Grupa (\d{3})$', t)
    m2 = re.match(r'^(MATE|INFO) Master (\d{3}) \((\w+) - (.*)\)$', t)
    if m:
        (key, label), g, level = SPEC[m.group(1)], m.group(2), 'licenta'
        year = int(g[0])
    elif m2:
        g, level = m2.group(2), 'master'
        year = 1 if g[0] == '4' else 2
        key, label = 'm-' + m2.group(3).lower(), f'{MASTER_EN.get(m2.group(3), m2.group(4))} ({m2.group(3)})'
    else:
        continue  # optional / facultative / guest pages
    evs = []
    for e in pg['events']:
        ev = {k: e[k] for k in ['day', 'start', 'end', 'subject', 'teacher', 'room']}
        for src, dst in [('kind', 'kind'), ('group', 'semi'), ('parity', 'parity'), ('weeks', 'weeks')]:
            if e[src]:
                ev[dst] = e[src]
        evs.append(ev)
    groups.append({'id': g, 'level': level, 'year': year, 'spec': key, 'specLabel': label, 'events': evs})
json.dump({'source': 'https://drive.google.com/file/d/1p3TfdskI1gIGjakvMhrhskoH3uAjk4SB/view',
           'generated': '2026-10-04', 'groups': groups},
          open('lib/orar/orar.json', 'w'), ensure_ascii=False, separators=(',', ':'))
for pr in problems:
    print(pr)
print(len(result), 'pages parsed')
