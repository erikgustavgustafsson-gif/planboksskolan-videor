"""Gör om insamlade Bilweb-annonser (bw.json från verktyg/skord_bilweb.py) till B(...)-rader i kalla/app.js.

   python3 gen_bilweb.py bw.json app.js 2026-11-11

Ersätter allt mellan '// --- BILWEB START' och '// --- BILWEB SLUT ---'.
Regler (gissa aldrig):
  - bara nya bilar (årsmodell >= förra året, högst 100 mil på mätaren)
  - annonsen uppdaterad senast 45 dagar sedan
  - avtalstid 36 mån (annonser som bara nämner annan avtalstid hoppas över)
  - pris vid 0 kr insats om annonsen har flera nivåer; annars läggs insats/förhöjd hyra i 'forhojd'
  - oklara insatsnivåer eller saknat pris -> hoppas över
  - högst en annons per säljare och variant, högst 8 per modell (billigast först)
"""
import json, re, sys, datetime, unicodedata, html

BW, APP, IDAG = sys.argv[1], sys.argv[2], datetime.date.fromisoformat(sys.argv[3])
MAN = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "maj": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dec": 12}

LAN = {  # bilweb-län -> (namn, ungefärlig mittpunkt)
    "stockholms-lan": ("Stockholm", [59.33, 18.07]), "uppsala-lan": ("Uppsala", [59.86, 17.64]), "sodermanlands-lan": ("Södermanland", [59.20, 16.70]),
    "ostergotlands-lan": ("Östergötland", [58.41, 15.62]), "jonkopings-lan": ("Jönköping", [57.78, 14.16]), "kronobergs-lan": ("Kronoberg", [56.88, 14.81]),
    "kalmar-lan": ("Kalmar", [56.66, 16.36]), "gotlands-lan": ("Gotland", [57.64, 18.30]), "blekinge-lan": ("Blekinge", [56.16, 15.59]),
    "skane-lan": ("Skåne", [55.80, 13.40]), "hallands-lan": ("Halland", [56.90, 12.70]), "vastra-gotalands-lan": ("Västra Götaland", [57.90, 12.60]),
    "varmlands-lan": ("Värmland", [59.38, 13.50]), "orebro-lan": ("Örebro", [59.27, 15.21]), "vastmanlands-lan": ("Västmanland", [59.61, 16.55]),
    "dalarnas-lan": ("Dalarna", [60.60, 15.40]), "gavleborgs-lan": ("Gävleborg", [61.00, 16.80]), "vasternorrlands-lan": ("Västernorrland", [62.60, 17.60]),
    "jamtlands-lan": ("Jämtland", [63.18, 14.64]), "vasterbottens-lan": ("Västerbotten", [64.20, 19.50]), "norrbottens-lan": ("Norrbotten", [65.80, 21.90]),
}
STAD = {  # vanliga handlarorter (ungefärligt)
    "Stockholm": [59.33, 18.07], "Solna": [59.36, 18.00], "Sundbyberg": [59.36, 17.97], "Kista": [59.40, 17.94], "Spånga": [59.38, 17.90], "Bromma": [59.34, 17.94],
    "Nacka": [59.31, 18.16], "Handen": [59.17, 18.14], "Haninge": [59.17, 18.14], "Skärholmen": [59.28, 17.91], "Segeltorp": [59.28, 17.94], "Täby": [59.44, 18.07],
    "Danderyd": [59.40, 18.04], "Upplands Väsby": [59.52, 17.91], "Åkersberga": [59.48, 18.30], "Vallentuna": [59.53, 18.08], "Kungsängen": [59.48, 17.75],
    "Järfälla": [59.43, 17.83], "Södertälje": [59.20, 17.63], "Norrtälje": [59.76, 18.70], "Uppsala": [59.86, 17.64], "Enköping": [59.64, 17.08],
    "Västerås": [59.61, 16.55], "Eskilstuna": [59.37, 16.51], "Örebro": [59.27, 15.21], "Linköping": [58.41, 15.62], "Norrköping": [58.59, 16.19],
    "Jönköping": [57.78, 14.16], "Växjö": [56.88, 14.81], "Kalmar": [56.66, 16.36], "Karlskrona": [56.16, 15.59], "Karlshamn": [56.17, 14.86],
    "Malmö": [55.60, 13.00], "Lund": [55.70, 13.19], "Helsingborg": [56.05, 12.69], "Kristianstad": [56.03, 14.16], "Ystad": [55.43, 13.82],
    "Halmstad": [56.67, 12.86], "Varberg": [57.11, 12.25], "Kungsbacka": [57.49, 12.08], "Göteborg": [57.71, 11.97], "Hisings Backa": [57.75, 11.93],
    "Mölndal": [57.66, 12.01], "Askim": [57.63, 11.94], "Kungälv": [57.87, 11.98], "Borås": [57.72, 12.94], "Trollhättan": [58.28, 12.29],
    "Uddevalla": [58.35, 11.94], "Skövde": [58.39, 13.85], "Lidköping": [58.50, 13.16], "Karlstad": [59.38, 13.50], "Falun": [60.61, 15.63],
    "Borlänge": [60.48, 15.43], "Gävle": [60.67, 17.14], "Sundsvall": [62.39, 17.31], "Östersund": [63.18, 14.64], "Umeå": [63.83, 20.26],
    "Skellefteå": [64.75, 20.95], "Luleå": [65.58, 22.15], "Piteå": [65.32, 21.48], "Visby": [57.64, 18.30], "Nyköping": [58.75, 17.01],
}
# Varianter: modeller som delar Bilweb-sida skiljs åt på titeln (första träffen vinner)
VARIANT = {
    "Volvo|EX30": [(r"cross country|\bcc\b", "Volvo|EX30 Cross Country"), (r".", "Volvo|EX30")],
    "Volkswagen|Golf": [(r"sportscombi|\bsc\b|kombi", "Volkswagen|Golf Sportscombi"), (r".", "Volkswagen|Golf")],
    "Volkswagen|ID.7": [(r"tourer", "Volkswagen|ID.7 Tourer"), (r".", "Volkswagen|ID.7")],
    "Audi|A5": [(r"avant", "Audi|A5 Avant"), (r".", "Audi|A5")],
    "Audi|A3": [(r"sedan|limousine", "Audi|A3 Sedan"), (r"sportback", "Audi|A3 Sportback")],
    "Cupra|Leon": [(r"sportstourer|\bst\b", "Cupra|Leon Sportstourer"), (r".", "Cupra|Leon")],
    "Skoda|Enyaq": [(r"coup", "Skoda|Enyaq Coupé"), (r".", "Skoda|Enyaq")],
    "Skoda|Octavia": [(r"combi|kombi", "Skoda|Octavia Combi")],
    "Skoda|Superb": [(r"combi|kombi", "Skoda|Superb Combi")],
    "Toyota|bZ4X": [(r"touring", "Toyota|bZ4X Touring"), (r".", "Toyota|bZ4X")],
    "Toyota|Corolla": [(r"cross", "Toyota|Corolla Cross"), (r"touring|\bts\b", "Toyota|Corolla Touring Sports"), (r".", "Toyota|Corolla")],
    "Toyota|C-HR": [(r"c-hr\+|chr\+|c-hr plus", "Toyota|C-HR+"), (r".", "Toyota|C-HR")],
    "Volkswagen|Polo": [(r"\bid\.?\s?polo", "Volkswagen|ID.Polo"), (r".", "Volkswagen|Polo")],
    "Volkswagen|Tiguan": [(r"\bid\.?\s?tiguan|tiguan id\b|tiguan id\.", "Volkswagen|ID.Tiguan"), (r".", "Volkswagen|Tiguan")],
    "Toyota|Yaris": [(r"cross", "Toyota|Yaris Cross"), (r".", "Toyota|Yaris")],
}

FAM = {m: f for f, regler in VARIANT.items() for _, m in regler}
FAM.update({f: f for f in VARIANT})

def tal(t):
    return int(re.sub(r"[^\d]", "", t)) if t and re.search(r"\d", t) else None

def datum(d):
    m = re.match(r"(\d{1,2}) (\w{3})", d.lower())
    if d.lower().startswith(("idag", "igår")): return IDAG
    if not m or m.group(2)[:3] not in MAN: return None
    dt = datetime.date(IDAG.year, MAN[m.group(2)[:3]], int(m.group(1)))
    return dt if dt <= IDAG else dt.replace(year=IDAG.year - 1)

def driv(a):
    d, t = (a.get("driv") or "").lower(), (a["titel"] + " " + a["besk"][:300]).lower()
    if d == "el" or "elektrisk" in d: return "El"
    if "diesel" in d: return None
    if "laddhybrid" in d or "plug" in d or re.search(r"e-?hybrid|phev|plug-in|laddhybrid|\bt8\b|\bt6\b|\bp\.?hev\b|\bdm-i\b", t): return "Laddhybrid"
    if "hybrid" in d or "el/bensin" in d or "hybrid" in t: return "Hybrid"
    if "bensin" in d or "etsi" in t or "tsi" in t: return "Bensin"
    return None

def pris_och_insats(a):
    """Returnerar (månadspris vid lägst insats, insats/förhöjd hyra) eller None om oklart."""
    t = html.unescape(a["besk"]).replace(" ", " ")
    t = re.sub(r"(\d)[ .](\d{3})", r"\1\2", t)
    niv = {}
    for m in re.finditer(r"(\d{3,5})\s?(?:kr|:-)?/?\s?(?:kr/)?mån[^\n]{0,25}?(?:insats|förhöjd[a-zåäö ]*?)\s*(?:om|på|av|:)?\s*(\d{1,6})\s?kr", t, re.I):
        niv[int(m.group(2))] = int(m.group(1))
    for m in re.finditer(r"(\d{1,6})\s?kr (?:i )?(?:första )?(?:förhöjd[a-zåäö ]*|insats)[^:\n]{0,25}:\s*(\d{3,5})\s?kr/mån", t, re.I):
        niv[int(m.group(1))] = int(m.group(2))
    m = re.search(r"utan (?:första )?förhöjd[^:\n]{0,30}:\s*(\d{3,5})\s?kr/mån", t, re.I)
    if m: niv[0] = int(m.group(1))
    if niv:
        lagst = min(niv)
        return niv[lagst], lagst
    belopp = {int(x) for x in re.findall(r"(?:förhöjd[a-zåäö ]*(?:hyra|avgift|leasingavgift)?|insats)\D{0,20}?(\d{4,6})\s?kr", t, re.I)}
    belopp |= {int(x) for x in re.findall(r"(\d{4,6})\s?kr (?:i )?(?:första )?(?:förhöjd|insats)", t, re.I)}
    belopp = {b for b in belopp if b > 0}
    if len(belopp) > 1: return None
    return a["manad"], (belopp.pop() if belopp else 0)

def bas_mil(a):
    t = (a["titel"] + " " + html.unescape(a["besk"])).replace(" ", " ")
    t = re.sub(r"(\d) (\d{3})", r"\1\2", t)
    for m in re.finditer(r"(\d{3,4})\s?mil(?:/år| per år| om året|/ år|/år)", t):
        before = t[max(0, m.start() - 12):m.start()]
        if "+" in before or re.search(r"\+\s*\d", t[m.end():m.end() + 6]): continue
        v = int(m.group(1))
        if v in (1000, 1500, 2000, 2500, 3000): return v
    # "1500 mil/år: +247 kr/mån" betyder att 1 000 mil ingår
    if re.search(r"1500\s?mil[^\n]{0,12}\+\s?\d", t): return 1000
    return None

def man(a):
    t = a["besk"]
    v = {int(x) for x in re.findall(r"(\d{2})\s?(?:mån\b|månader|mån\.|mnd)", t)}
    v &= {12, 18, 24, 36, 48, 60}
    if not v or 36 in v: return 36
    return None

def rensa_modell(titel, marke):
    t = re.sub(r"\s*[\|–\-]\s*(privatleasing|kampanj|p\.?leasing).*$", "", titel, flags=re.I)
    t = re.sub(r"\b(privatleasing|p\.?leasing|kampanj\w*|superkampanj\w*|erbjudande\w*|helgerbjudande\w*|fr\.?|från|nu|just nu|lagerbil\w*|snabb leverans|leasing)\b.*$", "", t, flags=re.I)
    t = re.sub(r"\b(bilia|din bil|hedin|rejmes)\b", "", t, flags=re.I)
    t = re.sub(r"\d[\d .]*\s?(kr|:-).*$", "", t).strip(" -|*,")
    t = re.sub(rf"^{re.escape(marke)}\s+", "", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip(" -|*,.:!/") [:60].strip()
    return t

data = json.load(open(BW))
modeller = {}
sedda = set()
for k, v in data.items():
    for a in v.get("annonser", []):
        if a["url"] in sedda: continue
        sedda.add(a["url"])
        titel = a["titel"]
        fam = FAM.get(k)
        if fam:
            mal = next((m for regex, m in VARIANT[fam] if re.search(regex, titel.lower())), None)
            if not mal: continue
        else:
            mal = k
        modeller.setdefault(mal, []).append(a)

app = open(APP, encoding="utf-8").read()
mn = json.loads(re.search(r"const MODELLNAMN = (\{.*?\});", app).group(1))
foto, kanddriv = {}, {}
for m in re.finditer(r'^\s*B\("([^"]+)", "([^"]+)", "([a-z0-9]+)", "(\w+)"', app, re.M):
    if "bilweb" in m.group(0): continue
    nyckel = m.group(1) + "|" + (mn.get(m.group(3)) or m.group(2).split(" ")[0])
    foto.setdefault(nyckel, m.group(3)); kanddriv.setdefault(nyckel, set()).add(m.group(4))

rader, stat = [], {"ok": 0, "gammal": 0, "begagnad": 0, "avtal": 0, "pris": 0, "driv": 0, "dubblett": 0}
for mal, annonser in sorted(modeller.items()):
    marke = mal.split("|")[0]
    if mal not in foto: continue
    bra = []
    for a in annonser:
        d = datum(a.get("datum", ""))
        if not d or (IDAG - d).days > 45: stat["gammal"] += 1; continue
        ar, km = tal(a.get("ar")), tal(a.get("matare"))
        if not ar or ar < IDAG.year - 1 or (km or 0) > 100: stat["begagnad"] += 1; continue
        if not a.get("saljare") or not a.get("manad"): stat["pris"] += 1; continue
        if man(a) != 36: stat["avtal"] += 1; continue
        if re.search(r"premie|bidrag|förmånsvärde|tjänstebil|företag", a["titel"] + " " + a["url"], re.I): stat["pris"] += 1; continue   # villkorade priser
        pi = pris_och_insats(a)
        if not pi or not pi[0] or pi[0] < 1000 or pi[1] > 50000: stat["pris"] += 1; continue
        dm = driv(a)
        if not dm and not a.get("driv") and len(kanddriv.get(mal, ())) == 1 and "El" in kanddriv[mal]:
            dm = "El"   # äldre insamling utan drivmedelsfält: modellen finns bara som elbil
        if not dm: stat["driv"] += 1; continue
        if mal == "Toyota|C-HR" and dm == "El": stat["driv"] += 1; continue   # C-HR+ är en annan bil
        mil = bas_mil(a)
        bra.append({**a, "pris": pi[0], "forhojd": pi[1], "drivm": dm, "mil": mil, "d": d})
    # en per säljare och variant, billigast (inkl. insats utslagen på 36 mån)
    bast = {}
    for a in sorted(bra, key=lambda x: x["pris"] + x["forhojd"] / 36):
        nyckel = (a["saljare"], a["pris"], a["drivm"])
        if nyckel in bast: stat["dubblett"] += 1; continue
        bast[nyckel] = a
    per_saljare, urval = {}, []
    for a in bast.values():
        per_saljare[a["saljare"]] = per_saljare.get(a["saljare"], 0) + 1
        if per_saljare[a["saljare"]] <= 2: urval.append(a)
    for a in urval[:8]:
        lan_namn, lan_pos = LAN.get(a["lan"], ("", None))
        ort = a["ort"] or lan_namn
        pos = STAD.get(ort) or lan_pos
        saljare = a["saljare"].replace(" - nya bilar", "").replace(" - Nya bilar", "").replace(" - Nya personbilar", "").strip()
        noter = [f"Annons hos {saljare}, uppdaterad {a['d'].day} {list(MAN)[a['d'].month - 1]}"]
        if not a["mil"]: noter.append("Körsträckan framgår inte av annonsen – 1 000 mil/år antas, kontrollera hos handlaren")
        if a["forhojd"]: noter.append(f"Priset förutsätter {a['forhojd']:,} kr i insats/förhöjd första hyra".replace(",", " "))
        extra = {"kalla": f"{saljare} (via Bilweb)", "url": a["url"], "ort": ort, "ortpos": pos, "ortlan": lan_namn,
                 "service": None, "not": ". ".join(noter), "tillval": "inga", "bilweb": True}
        if a["forhojd"]: extra["forhojd"] = a["forhojd"]
        namn = rensa_modell(a["titel"], marke) or mal.split("|")[1]
        rader.append(f'      B({json.dumps(marke, ensure_ascii=False)}, {json.dumps(namn, ensure_ascii=False)}, "{foto[mal]}", "{a["drivm"]}", {a["pris"]}, {a["mil"] or 1000}, null, {json.dumps(extra, ensure_ascii=False)}),')
        stat["ok"] += 1

block = "      // --- BILWEB START: handlarnas egna annonser från Bilweb (genereras av verktyg/gen_bilweb.py – ändra inte för hand) ---\n" + "\n".join(rader) + "\n      // --- BILWEB SLUT ---"
if "// --- BILWEB START" in app:
    app = re.sub(r"      // --- BILWEB START.*?// --- BILWEB SLUT ---", lambda m: block, app, flags=re.S)
else:
    app = app.replace("    const BILAR = [\n", "    const BILAR = [\n" + block + "\n", 1)
open(APP, "w", encoding="utf-8").write(app)
print(json.dumps(stat), len(rader), "annonser i", len({r.split('", "')[2] for r in rader}), "bilder/modeller")
