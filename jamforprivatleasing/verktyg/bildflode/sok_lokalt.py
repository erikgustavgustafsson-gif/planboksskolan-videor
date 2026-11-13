# Långsam reserv: söker på Commons härifrån (API:t stryps, ~30 s per fråga). python3 sok_lokalt.py '{"c10":"Leapmotor C10"}' >> val.tsv
import json, sys, time, re, subprocess, urllib.parse
UA = "JamforPrivatleasing-bildverktyg/1.0 (https://jamforprivatleasing.se; kontakt@jamforprivatleasing.se)"
DALIGT = re.compile(r"interior|interieur|innenraum|cockpit|\brear\b|heck|dashboard|detail|logo|engine|wheel|trunk|kofferraum|badge|taxi|police|polizei|crash|rally|racing|concept|studie|– h ", re.I)
def api(p):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**p, "format": "json"})
    for f in range(8):
        r = subprocess.run(["curl", "-sS", "-A", UA, url], capture_output=True, text=True).stdout
        try: return json.loads(r)
        except Exception: time.sleep(32)
    return {}
for k, q in json.loads(sys.argv[1]).items():
    d = api({"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 30, "prop": "imageinfo", "iiprop": "size|extmetadata"})
    ut = []
    for p in (d.get("query", {}).get("pages", {}) or {}).values():
        ii = p["imageinfo"][0]; md = ii.get("extmetadata", {}); t = p["title"][5:]
        lic = md.get("LicenseShortName", {}).get("value", "")
        if not any(x in lic for x in ("CC BY", "CC0", "Public domain")) or ii["width"] < 1500 or ii["width"] < ii["height"] * 1.15 or DALIGT.search(t): continue
        ar = md.get("DateTimeOriginal", {}).get("value", "")[:4]
        av = re.sub(r"<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip().split("\n")[0][:40].replace("|", " ")
        ut.append(((5 if re.search(r"DSC|IMG|1X7A", t) else 0) + (int(ar) - 2015 if ar.isdigit() else 0) - p.get("index", 30) / 5, f"{k}|{t}|{av}|{lic}"))
    for _, rad in sorted(ut, reverse=True)[:3]: print(rad, flush=True)
    time.sleep(3)
