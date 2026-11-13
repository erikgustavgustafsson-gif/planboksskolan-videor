# Körs i sandlådan (Commons stryper API:t hårt från byggmiljön). python3 sok_sandbox.py fragor.json > kandidater.json
import json, sys, time, re, urllib.parse, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
UA = {"User-Agent": "JamforPrivatleasing-bildverktyg/1.0 (https://jamforprivatleasing.se; kontakt@jamforprivatleasing.se)"}
DALIGT = re.compile(r"interior|interieur|innenraum|cockpit|rear|heck|back|dashboard|detail|logo|engine|motor\b|wheel|seat|trunk|kofferraum|badge|taxi|police|polizei|crash|rally|racing|cabrio|concept|studie|model car|toy|sketch|drawing|render", re.I)
def api(p):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**p, "format": "json"})
    for f in range(6):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(min(int(e.headers.get("Retry-After") or 5), 40))
    return {}
def sok(kq):
    k, q = kq
    d = api({"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 30,
             "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 960})
    ut = []
    for p in (d.get("query", {}).get("pages", {}) or {}).values():
        ii = p["imageinfo"][0]; md = ii.get("extmetadata", {}); t = p["title"]
        lic = md.get("LicenseShortName", {}).get("value", "")
        if not any(x in lic for x in ("CC BY", "CC0", "Public domain")): continue
        if ii["width"] < 1500 or ii["width"] < ii["height"] * 1.15 or DALIGT.search(t): continue
        datum = md.get("DateTimeOriginal", {}).get("value", "")[:4]
        p0 = (5 if re.search(r"DSC|IMG|1X7A", t) else 0) + (int(datum) - 2015 if datum.isdigit() else 0) - p.get("index", 30) / 5
        ut.append({"t": t[5:], "u": ii.get("thumburl"), "lic": lic, "av": re.sub(r"<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip()[:60], "ar": datum, "p": round(p0, 1)})
    ut.sort(key=lambda x: -x["p"])
    return k, ut[:8]
F = json.load(open(sys.argv[1]))
with ThreadPoolExecutor(3) as ex: res = dict(ex.map(sok, F.items()))
json.dump(res, open("kandidater.json", "w"), ensure_ascii=False)
for k, v in res.items(): print(k, len(v), "|".join(x["t"][:48] + " " + x["ar"] for x in v[:5]))
