"""Gör om Hedin Automotives lagerbilar med privatleasingpris (hedin.json från verktyg/skord_hedin.py) till HD(...)-rader i kalla/app.js.

   python3 gen_hedin.py hedin.json app.js

Ersätter allt mellan '// --- HEDIN START' och '// --- HEDIN SLUT ---'. Regler (gissa aldrig):
  - bara nya personbilar, 36 månader, pris och körsträcka från Hedins egna uppgifter
  - uppläggnings- och aviavgift tas med som de står
  - nämns elbilspremie i texten, eller står ett annat pris i rubriken än i leasinguppgiften, hoppas bilen över
  - samma ort, variant och pris räknas som ett erbjudande (lagerbilar i olika färg är inte olika erbjudanden)
"""
import json, re, sys, unicodedata, os
HJ, APP = sys.argv[1], sys.argv[2]
def norm(t):
    t = unicodedata.normalize("NFD", t.lower()); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", t)
g2 = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "gen_bilweb2.py"), encoding="utf-8").read()
ns = {"re": re}
exec(g2[g2.index("STAD = {"):g2.index("# Varianter")], ns)
STAD = ns["STAD"]
exec(g2[g2.index("def modellfamilj"):g2.index("SLUGMAP[")], ns)
modellfamilj = ns["modellfamilj"]
MARKESNAMN = {"Mercedes": "Mercedes-Benz", "Škoda": "Skoda", "Mini": "MINI", "Citroen": "Citroën"}
KAR = {"suv": "SUV", "kombi": "Kombi", "halvkombi": "Halvkombi/sedan", "sedan": "Halvkombi/sedan", "coupé": "Halvkombi/sedan", "cabriolet": "Halvkombi/sedan", "mpv": "Familjebuss"}
DRIV = {"el": "El", "laddhybrid": "Laddhybrid", "hybrid": "Hybrid", "bensin": "Bensin", "diesel": "Diesel"}

app = open(APP, encoding="utf-8").read()
mn = json.loads(re.search(r"const MODELLNAMN = (\{.*?\});", app).group(1))
foto = {}
for m in re.finditer(r'^\s*B\("([^"]+)", "([^"]+)", "([a-z0-9]+)", "(\w+)"', app, re.M):
    foto.setdefault(m.group(1) + "|" + (mn.get(m.group(3)) or m.group(2).split(" ")[0]), m.group(3))
kanon = {norm(k): k for k in foto}

def variant(t):
    t = re.split(r"\||\bPL\b|privatleasing|kampanj|\bfrån\b|\bfr\.|\d[\d ]{2,6}\s?(kr|:-|/mån)|fast ränta|omgående|\bdemo\w*|lagerbil\w*|leverans|räntekampanj|\bränta\b|erbjudande", t or "", flags=re.I)[0]
    return re.sub(r"\s+", " ", t).strip(" -,*!/.")[:60].strip()

rader, sedda, stat = [], set(), {"ok": 0, "ej36": 0, "premie": 0, "dubblett": 0, "driv": 0, "ejny": 0}
for c in sorted(json.load(open(HJ)), key=lambda c: (c["car_brand"], c["car_model"], c["pl"]["monthly_cost"] or 0)):
    o = c["pl"]
    if c.get("car_condition") != "Ny": stat["ejny"] += 1; continue
    if o.get("months") != 36 or not o.get("monthly_cost") or not o.get("mileage"): stat["ej36"] += 1; continue
    mt = c.get("car_model_text") or ""
    if re.search(r"elbilspremie|premie", mt + " " + (o.get("disclaimer") or ""), re.I): stat["premie"] += 1; continue
    # Står ett annat månadspris i rubriken än i Hedins leasinguppgift är det oklart vilket som gäller -> hoppa över
    tp = [int(re.sub(r"\D", "", x)) for x in re.findall(r"(\d[\d ,.]{2,6})\s?(?:kr|:-|/mån)", mt)]
    tp = [x for x in tp if 1500 <= x <= 25000]
    if tp and o["monthly_cost"] not in tp: stat["premie"] += 1; continue
    premie = 1 if c.get("elbilspremie_leasing") else 0
    dm = DRIV.get((c.get("car_fuel") or "").lower())
    if not dm: stat["driv"] += 1; continue
    marke = MARKESNAMN.get(c["car_brand"], c["car_brand"])
    mnamn = modellfamilj(marke, c["car_model"])
    k = kanon.get(norm(marke + mnamn), marke + "|" + mnamn); marke, mnamn = k.split("|", 1)
    var = variant(c.get("car_model_text")) or mnamn
    nyckel = (c.get("car_site_city"), norm(k), norm(var), o["monthly_cost"])
    if nyckel in sedda: stat["dubblett"] += 1; continue
    sedda.add(nyckel)
    txt = (o.get("sales_text") or "") + " " + (o.get("disclaimer") or "")
    service = 1 if re.search(r"service(paket|avtal)?\s*ingår|inkl\.?\s*service", txt, re.I) else 0
    ort = c.get("car_site_city") or ""
    # HD(märke, modellnamn, variant, bild, drivmedel, kr/mån, mil/år, uppläggning, avi/mån, ort, [lat, lon], id/slug, service ingår (1/0), karosstyp)
    rader.append("      HD(" + ", ".join(json.dumps(x, ensure_ascii=False) for x in
        [marke, mnamn, (mnamn + " " + var) if not norm(var).startswith(norm(mnamn)) else var, foto.get(k), dm, o["monthly_cost"], o["mileage"], o.get("start_fee") or 0, o.get("invoice_fee") or 0,
         ort, STAD.get(ort), f"{c['car_id']}/{c['slug']}", service, KAR.get((c.get("car_body") or "").lower(), ""), premie]) + "),")
    stat["ok"] += 1
block = ("      // --- HEDIN START: Hedin Automotives lagerbilar med privatleasingpris (genereras av verktyg/gen_hedin.py – ändra inte för hand) ---\n"
         + "\n".join(rader) + "\n      // --- HEDIN SLUT ---")
assert "// --- HEDIN START" in app
app = re.sub(r"      // --- HEDIN START.*?// --- HEDIN SLUT ---", lambda m: block, app, flags=re.S)
open(APP, "w", encoding="utf-8").write(app)
print(json.dumps(stat), len(rader), "erbjudanden", len({r.split('", "')[0] + r.split('", "')[1] for r in rader}), "modeller")
