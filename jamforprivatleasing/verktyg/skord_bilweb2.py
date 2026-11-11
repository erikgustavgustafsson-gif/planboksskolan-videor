"""Hämtar ALLA privatleasingannonser på Bilweb (alla märken) via den allmänna sökningen.
   python3 skord_bilweb2.py bw2.json     – fortsätter där den slutade (nyckel = annonsens adress)"""
import json, re, sys, html, time, subprocess, os, threading
from concurrent.futures import ThreadPoolExecutor
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
def get(u):
    for f in range(3):
        r = subprocess.run(["curl", "-sL", "-m", "30", "-A", UA, "-w", "\n%{url_effective}", u], capture_output=True, text=True)
        if r.returncode == 0 and len(r.stdout) > 2000:
            body, _, eff = r.stdout.rpartition("\n"); return body, eff
        time.sleep(2)
    return "", u
def text(s):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S); t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"</(p|div|h\d|li|span|dd|dt|a|button)>", "\n", t); t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"\n\s*\n+", "\n", t)
ut = sys.argv[1]
res = json.load(open(ut)) if os.path.exists(ut) else {"lankar": [], "annonser": {}}
if not res["lankar"]:
    b, _ = get("https://bilweb.se/sok?q=privatleasing")
    n = int((re.search(r'data-total-pages="(\d+)"', b) or [0, 1])[1]); lank = []
    for p in range(1, n + 1):
        if p > 1: b, _ = get(f"https://bilweb.se/sok?q=privatleasing&page={p}")
        lank += re.findall(r'href="(/[a-z-]+-lan/[^"]+-\d{5,})"', b)
        if p % 20 == 0: print("sida", p, len(set(lank)), flush=True)
        time.sleep(0.2)
    res["lankar"] = list(dict.fromkeys(lank)); json.dump(res, open(ut, "w"), ensure_ascii=False)
print("länkar:", len(res["lankar"]), flush=True)
las = threading.Lock(); klara = [0]
def en(l):
    s, e = get("https://bilweb.se" + l)
    if "/sok" in e or not s: a = {"borta": True}
    else:
        t = text(s)
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S); h1 = html.unescape(re.sub(r"<[^>]+>", "", h1.group(1))).strip() if h1 else ""
        def falt(n):
            x = re.search(rf"\n{n}\n([^\n]+)", t); return x.group(1).strip() if x else ""
        i = t.rfind("bilder\n", 0, t.find("Kom i kontakt") if "Kom i kontakt" in t else len(t)); j = t.find("Kom i kontakt", i)
        huvud = [x.strip() for x in t[i + 7:j].split("\n") if x.strip()] if i >= 0 and j > i else []
        saljare = huvud[0] if huvud else ""; ort = huvud[1] if len(huvud) > 1 and huvud[1] != "-" else ""
        dat = huvud[huvud.index("-") + 1] if "-" in huvud and huvud.index("-") + 1 < len(huvud) else ""
        pm = re.search(r"([\d  ]{4,7}) kr/mån", " ".join(huvud)) or re.search(r"([\d  ]{4,7}) kr/mån", t)
        slugs = re.findall(r'href="/sok/([a-z0-9-]+)/([a-z0-9-]+)" class="text-base', s)
        bi = t.find("Beskrivning\n"); bj = t.find("Kostnadsfritt via Bilweb", bi)
        a = {"url": "https://bilweb.se" + l, "titel": h1, "saljare": saljare, "ort": ort, "datum": dat, "huvud": huvud[:8],
             "manad": int(re.sub(r"\D", "", pm.group(1))) if pm else None, "marke": falt("Märke"), "modell": falt("Modell"), "ms": slugs[0][0] if slugs else "", "mods": slugs[0][1] if slugs else "",
             "ar": falt("Årsmodell"), "driv": falt("Drivmedel"), "matare": falt("Mätarställning"), "kaross": falt("Kaross"), "lan": l.split("/")[1],
             "besk": t[bi + 12:bj].strip()[:12000] if bi >= 0 else "", "hel": True}
    with las:
        res["annonser"][l] = a; klara[0] += 1
        if klara[0] % 100 == 0: json.dump(res, open(ut, "w"), ensure_ascii=False); print("klara", len(res["annonser"]), flush=True)
kvar = [l for l in res["lankar"] if l not in res["annonser"]]
with ThreadPoolExecutor(5) as ex: list(ex.map(en, kvar))
json.dump(res, open(ut, "w"), ensure_ascii=False); print("KLAR", len(res["annonser"]), flush=True)
