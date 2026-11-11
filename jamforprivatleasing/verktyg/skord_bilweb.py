"""Hämtar aktuella privatleasingannonser från Bilweb per modell.
   python3 skord_bilweb.py modeller.json bw.json   (modeller.json = [{"marke","mnamn"}], fortsätter där den slutade)"""
import json, re, sys, html, time, subprocess, unicodedata, os
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
def get(u):
    for f in range(3):
        r = subprocess.run(["curl", "-sL", "-m", "30", "-A", UA, "-w", "\n%{url_effective}", u], capture_output=True, text=True)
        if r.returncode == 0 and len(r.stdout) > 2000:
            body, _, eff = r.stdout.rpartition("\n"); return body, eff
        time.sleep(2)
    return "", u
def norm(t):
    t = unicodedata.normalize("NFD", t.lower()); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", t)
def text(s):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S); t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"</(p|div|h\d|li|span|dd|dt|a|button)>", "\n", t); t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"\n\s*\n+", "\n", t)
MAKESLUG = {"Mercedes-Benz": "mercedes", "Skoda": "skoda", "MG": "mg"}
modeller = json.load(open(sys.argv[1])); ut = sys.argv[2]
res = json.load(open(ut)) if os.path.exists(ut) else {}
slugs = {}
for m in modeller:
    k = m["marke"] + "|" + m["mnamn"]
    if k in res: continue
    ms = MAKESLUG.get(m["marke"], norm(m["marke"]))
    if ms not in slugs:
        b, _ = get(f"https://bilweb.se/sok/{ms}")
        slugs[ms] = sorted(set(re.findall(rf'href="/sok/{ms}/([a-z0-9-]+)"', b)))
    want = norm(m["mnamn"]); kand = [s for s in slugs[ms] if norm(s) == want] or [s for s in slugs[ms] if norm(s) == norm(m["marke"] + m["mnamn"])]
    if not kand: kand = [s for s in slugs[ms] if norm(s) == norm(m["mnamn"].split(" ")[0])]
    if not kand: res[k] = {"fel": "ingen modellslug", "slugs": [s for s in slugs[ms] if not s[:2].isdigit()][:80]}; json.dump(res, open(ut, "w"), ensure_ascii=False); print(k, "ingen slug", flush=True); continue
    lista, eff = get(f"https://bilweb.se/sok/{ms}/{kand[0]}?q=privatleasing")
    lankar = list(dict.fromkeys(re.findall(r'href="(/[a-z-]+-lan/[^"]+-\d{5,})"', lista)))
    annonser = []
    for l in lankar[:20]:
        s, e = get("https://bilweb.se" + l)
        if "/sok" in e or not s: continue
        t = text(s)
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S); h1 = html.unescape(re.sub(r"<[^>]+>", "", h1.group(1))).strip() if h1 else ""
        sel = re.search(r"\n([^\n]{3,80})\n([^\n]{2,40})\n-\n([^\n]{3,20})\n(?:MRF-ansluten\n)?([\d  ]+) kr/mån", t)
        pris = re.search(r"([\d  ]+) kr/mån", t)
        def falt(n):
            x = re.search(rf"\n{n}\n([^\n]+)", t); return x.group(1).strip() if x else ""
        i = t.find("Beskrivning\n"); j = t.find("Kostnadsfritt via Bilweb", i)
        besk = t[i + 12:j].strip()[:2500] if i >= 0 else ""
        annonser.append({"url": "https://bilweb.se" + l, "titel": h1, "saljare": sel.group(1).strip() if sel else "", "ort": sel.group(2).strip() if sel else "",
            "datum": sel.group(3).strip() if sel else "", "manad": int(re.sub(r"\D", "", (sel or pris).group(4 if sel else 1))) if (sel or pris) else None,
            "ar": falt("Årsmodell"), "driv": falt("Drivmedel"), "matare": falt("Mätarställning"), "lan": l.split("/")[1], "besk": besk})
        time.sleep(0.4)
    res[k] = {"slug": kand[0], "foralder": norm(kand[0]) != want, "antal_lankar": len(lankar), "annonser": annonser}
    json.dump(res, open(ut, "w"), ensure_ascii=False)
    print(k, kand[0], len(lankar), len(annonser), flush=True)
