# Körs i Higgsfield-sandlådan: hämtar telefon och e-post som handlarna själva visar i sina annonser.
# En annons per säljare (Bilweb: data-fs-phone/-custemail, Hedin: car_sellers). Utdata: kontakt.tsv (säljare, tel, e-post, namn, url).
# Nyckel: Bilweb = säljarens namn, Hedin = "Hedin Automotive <ort>|<märke>". För över med gzip-PNG som vanligt och kör gen_kontakt.py.
import re, json, html, urllib.request, time, sys
from concurrent.futures import ThreadPoolExecutor
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36", "Accept-Language": "sv-SE"}
src = urllib.request.urlopen("https://raw.githubusercontent.com/erikgustavgustafsson-gif/planboksskolan-videor/main/jamforprivatleasing/kalla/app.js", timeout=60).read().decode()
redan = set(json.loads(sys.argv[1])) if len(sys.argv) > 1 else set()     # nycklar som redan finns i saljare.json
jobb = {}
for m in re.finditer(r'^\s*BW\("([^"]+)", "[^"]*", "[^"]*", [^,]+, "[^"]*", \d+, \d+, "([^"]+)", "([^"]*)", "([^"]+)"', src, re.M):
    jobb.setdefault(m.group(2), ("bw", m.group(2), "https://bilweb.se/" + m.group(4)))
for m in re.finditer(r'^\s*HD\("([^"]+)", "[^"]*", "[^"]*", [^,]+, "[^"]*", \d+, \d+, \d+, \d+, "([^"]+)", (?:\[[^\]]*\]|null), "([^"]+)"', src, re.M):
    k = "Hedin Automotive " + m.group(2) + "|" + m.group(1)
    jobb.setdefault(k, ("hd", k, "https://hedinautomotive.se/bilar/kop-bil/" + m.group(3)))
jobb = {k: v for k, v in jobb.items() if k not in redan}
def hamta(j):
    typ, k, u = j
    h = None
    for f in range(3):
        try: h = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read().decode("utf-8", "replace"); break
        except Exception: time.sleep(3)
    if not h: return k, "", "", "FEL", u
    if typ == "bw":
        m = re.search(r'data-fs-phone="([^"]*)"[^>]*data-fs-custname="([^"]*)"[^>]*data-fs-custemail="([^"]*)"', h)
        return (k, html.unescape(m.group(1)), html.unescape(m.group(3)), html.unescape(m.group(2)), u) if m else (k, "", "", "SAKNAS", u)
    m = re.search(r'__NEXT_DATA__[^>]*>(.*?)</script>', h, re.S)
    if not m: return k, "", "", "SAKNAS", u
    car = [None]
    def find(o):
        if isinstance(o, dict):
            if "car_sellers" in o: car[0] = o; return
            for v in o.values(): find(v)
        elif isinstance(o, list):
            for v in o: find(v)
    find(json.loads(m.group(1)))
    s = (car[0] or {}).get("car_sellers") or [{}]
    return k, s[0].get("phone", ""), (s[0].get("email") or "").lower(), (car[0] or {}).get("car_site_city", ""), u
with ThreadPoolExecutor(6) as ex, open("kontakt.tsv", "w") as ut:
    for r in ex.map(hamta, jobb.values()): ut.write("\t".join(r) + "\n")
print(len(jobb), "säljare hämtade")
