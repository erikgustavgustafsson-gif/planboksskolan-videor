"""Gör om prod/*.json (från hamta_vwfs.js) till konfig.js och BILAR-rader.
   python3 gen_vwfs.py prod/ ../index.html ../konfig.js
   Ersätter allt mellan '// --- VWFS START' och '// --- VWFS SLUT ---' i index.html."""
import json, glob, re, html, sys, os
PROD, INDEX, KONFIG = sys.argv[1], sys.argv[2], sys.argv[3]
MIL = [1000, 1500, 2000]
MAR = {'volkswagen': 'Volkswagen', 'skoda': 'Skoda', 'cupraofficial': 'Cupra', 'audi': 'Audi'}
KON = {'volkswagen': 'VW', 'skoda': 'SKODA', 'cupraofficial': 'CUPRA', 'audi': 'AUDI'}
# slug-del -> bildnyckel i bilder/ (saknas en ny modell: lägg till en bild och en rad här)
FOTO = [('id_cross','idcross'),('id_tiguan','idtiguan'),('id_polo','idpolo'),('id_3','id3'),('id_4','id4'),('id_7_tourer','id7t'),('id_7','id7'),('polo_life','polo'),('taigo','taigo'),('golf_sportscombi','golfsc'),('golf_life','golf'),('t-roc','troc'),('tiguan','tiguan'),('tayron','tayron'),('passat','passat'),
 ('epiq','epiq'),('peaq','peaq'),('elroq','elroq'),('enyaq_coupe','enyaqc'),('enyaq','enyaq'),('fabia','fabia'),('kamiq','kamiq'),('karoq','karoq'),('kodiaq','kodiaq'),('octavia','octaviac'),('superb','superb'),
 ('raval','raval'),('born','born'),('tavascan','tavascan'),('terramar','terramar'),('formentor','formentor'),('leon_sportstourer','cupraleon'),('cupra_leon','leon'),
 ('a3_sportback','a3'),('a3_sedan','a3sedan'),('a5_avant','a5avant'),('a5_e-hybrid','a5'),('q4','q4'),('q6','q6')]
def pmap(pl): return {p['distance']: round(p['price']) for p in pl or [] if p.get('contractPeriod') in (36, None) and p.get('distance') in MIL}
def ptot(pl):
    for p in pl or []:
        if p.get('totalNetPrice'): return round(p['totalNetPrice'])
def foto(s): return next((v for k, v in FOTO if k in s), None)
def driv(t, s):
    if re.search(r'e-hybrid|ehybrid|_iv|\biv\b', s + ' ' + t, re.I): return 'Laddhybrid'
    if re.search(r'e-tron|id_|epiq|peaq|elroq|enyaq|raval|born|tavascan', s): return 'El'
    return 'Bensin'
K, rader = {}, []
for f in sorted(glob.glob(os.path.join(PROD, '*.json'))):
    J = json.load(open(f)); d = J['data']; s = J['url'].split('/tillval/')[1]
    G = []
    for g in d['optionGroups']:
        if g['id'].split('_')[0] in ('SERVICE', 'contractPeriod', 'distance'): continue
        V = []
        for o in g['options'] or []:
            pl = o.get('price') or (o['optionValues'][0].get('price') if o.get('optionValues') else None)
            desc = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html.unescape(o.get('description') or ''))).strip()
            v = {'n': o['name'].strip(), 'p': pmap(pl)}
            if desc and desc != v['n']: v['d'] = desc[:220]
            if ptot(pl): v['t'] = ptot(pl)
            if o.get('isSelected'): v['s'] = 1
            if o.get('isIncluded'): v['i'] = 1
            V.append(v)
        if V: G.append({'g': g['name'], 'm': int(bool(g['isMultiSelect'])), 'o': int(bool(g['isOptional'])), 'v': V})
    bas = pmap(d['basePrice']); nyp = ptot(d['basePrice'])
    if 1000 not in bas or not nyp: print('HOPPAR ÖVER', s); continue
    key = J['site'] + '/' + s
    K[key] = {'bas': bas, 'nypris': nyp, 'G': G}
    t = re.sub(r'\s+', ' ', re.sub(r'^(Nya |CUPRA |Audi )+', '', re.sub(r'[*/]+', '', J['title']).strip())).strip()
    t = re.sub(r'^(CUPRA |Audi )', '', t)
    fo = foto(s)
    rader.append('      B("%s", "%s", %s, "%s", %d, 1000, %d, { ...%s, url: "%s", cfg: "%s", mer: {1500: %d, 2000: %d} }),' % (
        MAR[J['site']], t, '"%s"' % fo if fo else 'null', driv(t, s), bas[1000], nyp, KON[J['site']], J['url'], key,
        bas.get(1500, bas[1000]) - bas[1000], bas.get(2000, bas[1000]) - bas[1000]))
    if not fo: print('BILD SAKNAS för', key)
open(KONFIG, 'w').write('// Tillval och priser från märkenas privatleasingsidor (VW Finans). Genereras av verktyg/gen_vwfs.py\nconst KONFIG = ' + json.dumps(K, ensure_ascii=False, separators=(',', ':')) + ';\n')
x = open(INDEX).read()
a = x.index('      // --- VWFS START'); a = x.index('\n', a) + 1; b = x.index('      // --- VWFS SLUT ---')
open(INDEX, 'w').write(x[:a] + '\n'.join(rader) + '\n' + x[b:])
print(len(rader), 'bilar från VW Finans')
