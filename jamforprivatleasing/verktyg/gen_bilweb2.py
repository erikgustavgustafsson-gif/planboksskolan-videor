"""Gör om ALLA insamlade Bilweb-annonser (bw2.json från verktyg/skord_bilweb2.py) till BW(...)-rader i kalla/app.js.

   python3 gen_bilweb2.py bw2.json app.js 2026-11-12 slugmap.json

Ersätter allt mellan '// --- BILWEB START' och '// --- BILWEB SLUT ---'.
Regler (gissa aldrig):
  - bara nya bilar (årsmodell >= förra året, högst 100 mil på mätaren)
  - annonsen uppdaterad senast 180 dagar sedan (datumet visas på erbjudandet)
  - avtalstid 36 mån (annonser som bara nämner annan avtalstid hoppas över)
  - pris vid 0 kr insats om annonsen har flera nivåer; annars läggs insats/förhöjd hyra i 'forhojd'
  - oklara insatsnivåer eller saknat pris -> hoppas över
  - priset måste stå i annonsens rubrik/adress eller text (Bilwebs eget "kr/mån" kan vara en lånekalkyl) -> annars hoppas annonsen över
  - samma säljare, variant och pris räknas som ett erbjudande (inga dubbletter)
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
    "Kia|K4": [(r"sportswagon|\bsw\b|kombi", "Kia|K4 Sportswagon"), (r".", "Kia|K4")],
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
    if "diesel" in d: return "Diesel"
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

GILTIG = (1000, 1250, 1500, 2000, 2500, 3000)
def bas_mil(a):
    """Körsträcka per år som ingår i priset. None = framgår inte (gissa aldrig)."""
    t = (a["titel"] + " \n " + html.unescape(a["besk"])).replace(" ", " ")
    t = re.sub(r"(\d)[ .](\d{3})(?!\d)", r"\1\2", t)
    t = re.sub(r"(körsträcka[^\n]{0,15}?)(\d{3,4})\s*,\s*\d{3,4}(?:\s*(?:,|eller|och)\s*\d{3,4})*\s*mil", r"\1\2 mil per år", t, flags=re.I)
    hittat = []
    for m in re.finditer(r"(\d{3,5})\s?(mil|km)\b", t, re.I):
        v, enh = int(m.group(1)), m.group(2).lower()
        fore, efter = t[max(0, m.start() - 30):m.start()], t[m.end():m.end() + 30]
        if re.search(r"\+\s*$|tillägg[^\n]{0,15}$|max\w*\s*$|upp till\s*$|räckvidd[^\n]{0,20}$|mätar\w*[^\n]{0,10}$", fore, re.I): continue
        if re.match(r"\s*(?:/\s*år|per år)?\s*[:=]?\s*\+\s*\d", efter, re.I): continue   # "1500 mil/år: +247 kr" = tillägg
        if re.match(r"\s*(/\s*h|per timme|/100)", efter, re.I): continue
        if enh == "km":
            if not re.match(r"\s*(/\s*år|per år|om året|årlig)", efter, re.I): continue
            v //= 10
        per_ar = re.match(r"\s*(/\s*år|/år|per\s*/?\s*år|om året|i året|årlig)", efter, re.I) or re.search(r"(årlig körsträcka|körsträcka per år)[^\n]{0,15}$", fore, re.I)
        avtal = re.match(r"\s*(/|på|under|i)?\s*36\s*(mån|månader)", efter, re.I) or re.search(r"36\s*(mån|månader)\s*(/|,|och|med)?\s*$", fore, re.I)
        ingar = re.search(r"(inkl\.?|ink\.?|inklusive|ingår|med)\s*$", fore, re.I) or re.search(r"(service|serviceavtal)\w*\s+och\s*$", fore, re.I)
        if avtal and not per_ar and v in (3000, 3750, 4500, 6000, 7500, 9000):
            hittat.append(v // 3)                                                   # total över 36 mån
        elif (per_ar or ingar) and v in GILTIG:
            hittat.append(v)
    if hittat: return min(hittat)
    if re.search(r"1500\s?mil[^\n]{0,8}\+\s?\d", t): return 1000          # bara tilläggspriser för 1500/2000 mil -> 1000 ingår
    return None

def ej_privatleasing(a):
    t = (a["titel"] + " " + a["besk"][:600]).lower()
    if re.search(r"billån|choice lån|choice billån|gäller endast vid finansiering via \w+ billån", t): return "billån"
    m = re.search(r"\b(\d{1,2})\s?(?:månaders|mån\.?)\s*privatleasing", t)
    if m and int(m.group(1)) != 36: return "avtalstid " + m.group(1)
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


def norm(t):
    t = unicodedata.normalize("NFD", t.lower()); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", t)

SLUGMAP = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}    # "märkesslug/modellslug" hos Bilweb -> "Märke|Modell" hos oss
MARKESNAMN = {"Mercedes": "Mercedes-Benz", "Mercedes Benz": "Mercedes-Benz", "Škoda": "Skoda", "VW": "Volkswagen", "Mg": "MG", "Byd": "BYD", "Bmw": "BMW", "Citroen": "Citroën"}
KAR = {"suv": "SUV", "kombi": "Kombi", "halvkombi": "Halvkombi/sedan", "sedan": "Halvkombi/sedan", "coupé": "Halvkombi/sedan", "sportkupé": "Halvkombi/sedan", "cab": "Halvkombi/sedan", "småbil": "Småbil", "crossover": "SUV", "familjebuss": "Familjebuss"}
EJ_KAROSS = re.compile(r"transport|lastbil|skåp|pickup|husbil|buss(?!.*familj)|flak", re.I)

app = open(APP, encoding="utf-8").read()
mn = json.loads(re.search(r"const MODELLNAMN = (\{.*?\});", app).group(1))
foto, kanddriv = {}, {}
for m in re.finditer(r'^\s*B\("([^"]+)", "([^"]+)", "([a-z0-9]+)", "(\w+)"', app, re.M):
    nyckel = m.group(1) + "|" + (mn.get(m.group(3)) or m.group(2).split(" ")[0])
    foto.setdefault(nyckel, m.group(3)); kanddriv.setdefault(nyckel, set()).add(m.group(4))

BLOCK = re.compile(r"\n([A-ZÅÄÖ][A-Za-zåäö ]+): \\1\n([\d  ]+) kr/mån[^\n]*(?:\n[^\n]*)?")
def finansblock(a):
    """Bilweb lägger ibland in egna kalkyler i annonsen ("Billån: Billån / 1 754 kr/mån"). Returnerar ({etikett: kr/mån}, texten utan lån- och företagsblock)."""
    t = html.unescape(a.get("besk") or ""); block = {}
    for m in BLOCK.finditer(t): block[m.group(1)] = int(re.sub(r"\D", "", m.group(2)))
    ren = BLOCK.sub(lambda m: m.group(0) if m.group(1) == "Privatleasing" else "\n", t)
    return block, ren

def verifierat_pris(a, block):
    """Sidans "kr/mån" är ibland Bilwebs lånekalkyl, inte leasingpriset. Returnerar leasingpriset, eller None om det inte går att belägga (gissa aldrig)."""
    slug = re.sub(r"-\d{4}-[a-z-]+-\d{5,}$", "", a["url"].rsplit("/", 1)[-1])
    slug = re.sub(r"(?<!\d)(\d{1,2})-(\d{3})(?=-?kr|-?man|-?sek)", r"\1\2", slug)
    sn = {int(x) for x in re.findall(r"(?<!\d)(\d{4,5})(?=-?kr|-?man|-?manad|-?sek)", slug)}
    sn |= {int(x) for x in re.findall(r"(?:fr|fran|pl|privatleasing|leasing|manad|man)-(\d{4,5})(?!\d)", slug)}
    sn = {x for x in sn if 1500 <= x <= 25000}
    m = a.get("manad")
    if "Privatleasing" in block: return block["Privatleasing"]
    if m in sn: return m
    lan = {v for k, v in block.items() if k != "Privatleasing"}
    if m in lan: return min(sn) if sn else None          # sidans pris är lånekalkylen
    if sn: return None                                   # rubriken säger ett annat pris än sidan – oklart
    return m                                             # handlarens eget angivna månadspris i en privatleasingannons

kanon = {norm(k): k for k in foto}
def modellfamilj(marke, m):
    """Bilweb anger ibland motorvarianten som modell (CLA250, 120). Slå ihop till modellen."""
    if marke == "Mercedes-Benz":
        x = re.match(r"^(AMG )?(CLA|CLE|GLA|GLB|GLC|GLE|GLS|EQA|EQB|EQE|EQS)\s?\d{2,3}\+?", m, re.I)
        if x: return x.group(2).upper()
        x = re.match(r"^([ABCES])\s?\d{3}", m)
        if x: return x.group(1) + "-Klass"
    if marke == "BMW":
        x = re.match(r"^M?([1-8])\d{2}[a-z]{0,2}$", m, re.I)
        if x: return x.group(1) + "-serie"
    return m
SLUGMAP["kia/k4"] = "Kia|K4"
data = json.load(open(BW))["annonser"]
modeller, stat = {}, {"ok": 0, "borta": 0, "gammal": 0, "begagnad": 0, "avtal": 0, "pris": 0, "driv": 0, "dubblett": 0, "ej_personbil": 0, "ingen_modell": 0, "obelagt_pris": 0}
for a in data.values():
    if a.get("borta"): stat["borta"] += 1; continue
    marke = MARKESNAMN.get(a.get("marke", ""), a.get("marke", "")).strip()
    if not marke or not a.get("modell"): stat["ingen_modell"] += 1; continue
    if EJ_KAROSS.search(a.get("kaross", "")): stat["ej_personbil"] += 1; continue
    k = SLUGMAP.get(a["ms"] + "/" + a["mods"])
    if not k:
        mnamn = re.sub(rf"^{re.escape(a['marke'])}\s+", "", a["modell"], flags=re.I).strip() or a["modell"]
        mnamn = modellfamilj(marke, mnamn)
        k = marke + "|" + mnamn
        k = kanon.get(norm(k), k)
    if k in VARIANT:
        k = next((m for regex, m in VARIANT[k] if re.search(regex, a["titel"].lower())), k)
    modeller.setdefault(k, []).append(a)

rader, orter = [], {}
for mal, annonser in sorted(modeller.items()):
    marke, mnamn = mal.split("|", 1)
    bra = []
    for a in annonser:
        aorig = a
        d = datum(a.get("datum", "") or next((h for h in a.get("huvud", []) if re.match(r"(idag|igår|\d{1,2} [a-zå]{3})", h.lower())), ""))
        if not d or (IDAG - d).days > 180: stat["gammal"] += 1; continue
        ar, km = tal(a.get("ar")), tal(a.get("matare"))
        if not ar or ar < IDAG.year - 1 or (km or 0) > 100: stat["begagnad"] += 1; continue
        if not a.get("saljare") or not a.get("manad"): stat["pris"] += 1; continue
        a = {**a, "besk": finansblock(a)[1]}
        if man(a) != 36 or ej_privatleasing(a): stat["avtal"] += 1; continue
        if re.search(r"premie|bidrag|förmånsvärde|tjänstebil|företag|operationell|exkl\.? moms|ex\.? moms", a["titel"] + " " + a["url"], re.I): stat["pris"] += 1; continue
        if re.search(r"exkl\.? moms|ex\.? moms|företagsleasing", a["besk"][:400], re.I) and not re.search(r"privatleasing", a["titel"] + a["url"], re.I): stat["pris"] += 1; continue
        block = finansblock(aorig)[0]
        vp = verifierat_pris(a, block)
        if not vp: stat["obelagt_pris"] += 1; continue
        a = {**a, "manad": vp}
        pi = pris_och_insats(a)
        if not pi or not pi[0] or pi[0] < 1500 or pi[0] > 25000 or pi[1] > 50000: stat["pris"] += 1; continue
        dm = driv(a)
        if not dm and not a.get("driv") and len(kanddriv.get(mal, ())) == 1 and "El" in kanddriv[mal]: dm = "El"
        if not dm: stat["driv"] += 1; continue
        if mal == "Toyota|C-HR" and dm == "El": stat["driv"] += 1; continue
        bra.append({**a, "pris": pi[0], "forhojd": pi[1], "drivm": dm, "mil": bas_mil(a), "d": d, "namn": rensa_modell(a["titel"], marke) or mnamn})
    sedda = set()
    for a in sorted(bra, key=lambda x: (x["pris"] + x["forhojd"] / 36, -x["d"].toordinal())):
        nyckel = (a["saljare"], norm(a["namn"]), a["pris"], a["drivm"])
        if nyckel in sedda: stat["dubblett"] += 1; continue
        sedda.add(nyckel)
        lan_namn, lan_pos = LAN.get(a["lan"], ("", None))
        ort = a["ort"] or lan_namn
        pos = STAD.get(ort) or lan_pos
        if ort and pos: orter[ort] = [pos, lan_namn]
        saljare = re.sub(r" - [Nn]ya (person)?bilar$", "", a["saljare"]).strip()
        kar = KAR.get(a.get("kaross", "").lower(), "")
        # BW(märke, modellnamn, variant, bild, drivmedel, kr/mån, mil/år (0 = okänt), säljare, ort, sökväg hos Bilweb, datum, insats, karosstyp)
        rader.append("      BW(" + ", ".join(json.dumps(x, ensure_ascii=False) for x in
            [marke, mnamn, a["namn"], foto.get(mal), a["drivm"], a["pris"], a["mil"] or 0, saljare, ort, a["url"].replace("https://bilweb.se/", ""), f"{a['d'].day} {list(MAN)[a['d'].month - 1]}", a["forhojd"], kar]) + "),")
        stat["ok"] += 1

block = ("      // --- BILWEB START: handlarnas egna annonser från Bilweb (genereras av verktyg/gen_bilweb2.py – ändra inte för hand) ---\n"
         + "\n".join(rader) + "\n      // --- BILWEB SLUT ---")
ortblock = "    // --- BWORT START (genereras av verktyg/gen_bilweb2.py) ---\n    const BWORT = " + json.dumps(orter, ensure_ascii=False, separators=(",", ":")) + ";\n    // --- BWORT SLUT ---"
assert "// --- BILWEB START" in app and "// --- BWORT START" in app
app = re.sub(r"      // --- BILWEB START.*?// --- BILWEB SLUT ---", lambda m: block, app, flags=re.S)
app = re.sub(r"    // --- BWORT START.*?// --- BWORT SLUT ---", lambda m: ortblock, app, flags=re.S)
open(APP, "w", encoding="utf-8").write(app)
nya = sorted({r.split('", "')[0][10:] + " " + r.split('", "')[1] for r in rader if ", null, " in r[:120]})
print(json.dumps(stat), "|", len(rader), "erbjudanden på", len({tuple(json.loads("[" + r.strip()[3:-2] + "]")[:2]) for r in rader}), "modeller |", len(nya), "modeller utan bild")
