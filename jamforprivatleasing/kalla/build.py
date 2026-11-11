#!/usr/bin/env python3
"""Bygger alla sidor för Jämföra Privatleasing.

Källfiler i den här mappen:
  original-index.html  – den gamla ensidiga versionen (här hämtas textblocken)
  stil.css, app.js     – gemensam stil och logik för alla sidor
  marken.json          – antal bilar och lägsta pris per märke (för texterna på märkessidorna)
Resultatet skrivs till ../site/.
"""
import json, re, shutil, subprocess, unicodedata, html, datetime
from pathlib import Path

HIT = Path(__file__).parent
UT = HIT.parent / "site"
DOMAN = "https://jamforprivatleasing.se/"
DATUM = datetime.date.today().isoformat()
_MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"]
MANAD = f"{_MAN[datetime.date.today().month - 1]} {datetime.date.today().year}"   # t.ex. "november 2026" – står i sidtitlarna
ORIG = (HIT / "original-index.html").read_text(encoding="utf-8")
# All bildata läses direkt ur app.js (dump.js kör datadelen i Node) – inga siffror skrivs för hand här.
DATA = json.loads(subprocess.run(["node", str(HIT / "dump.js")], capture_output=True, text=True, check=True).stdout)
BILAR, KONTROLL = DATA["bilar"], DATA["kontroll"]
MARKEN = {}
for _b in BILAR:
    _m = MARKEN.setdefault(_b["marke"], {"n": 0, "min": None, "mod": "", "driv": []})
    _m["n"] += 1
    if _b["drivmedel"] not in _m["driv"]: _m["driv"].append(_b["drivmedel"])
    if not _b["milokand"] and (_m["min"] is None or _b["manad"] < _m["min"]): _m["min"], _m["mod"] = _b["manad"], _b["mnamn"]
for _k, _m in MARKEN.items():
    if _m["min"] is None:
        _x = min((b for b in BILAR if b["marke"] == _k), key=lambda b: b["manad"]); _m["min"], _m["mod"] = _x["manad"], _x["mnamn"]
(HIT / "marken.json").write_text(json.dumps(MARKEN, ensure_ascii=False, indent=1), encoding="utf-8")
SALJARE = lambda b: re.split(r" \(|,", b["kalla"])[0]


def slug(t):
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def block(start, slut):
    """Klipp ut ett textblock ur originalsidan, från start-markören till och med slut-markören."""
    i = ORIG.index(start)
    j = ORIG.index(slut, i) + len(slut)
    return ORIG[i:j]


def kr(n):
    return f"{n:,}".replace(",", " ") + " kr"


ICON = re.search(r'<link rel="icon"[^>]*>', ORIG).group(0)
HERO = block('<header class="hero">', "</header>")
TOPP = block('<section class="topp" id="kampanjer"', "</section>")
TOPP = TOPP.replace('<div class="topplista" id="topp"></div>', '<div class="topplista" id="topp"></div><p class="sveptips">Svep för att se alla fem →</p>')
STEG = block('<section class="steg2" id="sa-funkar-det">', "</section>")
INGAR = block('<section class="ingar" id="vad-ingar">', "</section>")
VILLKOR = block('<p class="villkor" id="villkor">', "</p>")
EJBIL = block('<section class="ejbil" id="hittar-inte">', "</section>")
INFOKORT = block('<section class="infokort">', "</section>")
FRAGOR = block('<section class="info" id="fragor">', "</section>")
KONF = block('<dialog id="konf"', "</dialog>").replace('<span class="klogo">Jämföra <b>Privatleasing</b></span>', '<span class="klogo"><b>JÄMFÖRA</b><br>PRIVATLEASING</span>')
FAQ_LD = block('{"@type":"FAQPage"', "]}")

# ---- Ren jämförelsesajt (nov 2026): kunden går vidare till handlarens erbjudande, ingen beställning här ----
STEG = (STEG.replace("<h2><b>Beställ</b> steg för steg</h2>", "<h2><b>Så funkar</b> det</h2>")
  .replace("<li><span>2</span><div><b>Välj färg och tillval</b>Lägg till vinterhjul, dragkrok eller paket och se det nya priset direkt.</div></li>",
           "<li><span>2</span><div><b>Jämför säljarna</b>Samma bil kan kosta olika hos märket och hos olika handlare. Vi listar alla erbjudanden på modellen, billigast överst.</div></li>")
  .replace("<li><span>3</span><div><b>Skicka beställningen</b>Fyll i dina uppgifter, så skickar vi beställningen till handlaren åt dig.</div></li>",
           "<li><span>3</span><div><b>Gå till erbjudandet</b>Klicka dig vidare till märket eller handlaren och välj färg, tillval och leverans där.</div></li>")
  .replace("<li><span>4</span><div><b>Signera avtalet</b>Handlaren skickar avtalet till dig. Du godkänner det med BankID, och inget är bindande innan dess.</div></li>",
           "<li><span>4</span><div><b>Leasa hos säljaren</b>Avtalet tecknar du direkt med handlaren eller leasingbolaget. Inget är bindande förrän du har signerat.</div></li>"))
assert "Gå till erbjudandet" in STEG and "Leasa hos säljaren" in STEG
_gammal_f = "<details><summary>Är beställningen bindande?</summary><p>Nej. Vi skickar din beställning till handlaren, som skickar avtalet till dig. Först när du har godkänt avtalet med BankID är det bindande. Handlaren och leasingbolaget gör en vanlig kreditprövning.</p></details>"
assert _gammal_f in FRAGOR
FRAGOR = FRAGOR.replace(_gammal_f, "<details><summary>Kan jag leasa bilen hos er?</summary><p>Nej. Jämföra Privatleasing är en oberoende jämförelsetjänst. Du klickar dig vidare till märket eller handlaren och tecknar avtalet direkt med dem. Där väljer du färg och tillval, och leasingbolaget gör en vanlig kreditprövning. Inget är bindande förrän du har signerat avtalet.</p></details>")
FAQ_LD = FAQ_LD.replace('{"@type":"Question","name":"Är beställningen bindande?","acceptedAnswer":{"@type":"Answer","text":"Nej. Vi skickar beställningen till handlaren, som skickar avtalet till dig. Först när du godkänner avtalet med BankID är det bindande."}}',
  '{"@type":"Question","name":"Kan jag leasa bilen hos er?","acceptedAnswer":{"@type":"Answer","text":"Nej. Jämföra Privatleasing är en oberoende jämförelsetjänst. Du klickar dig vidare till märket eller handlaren och tecknar avtalet direkt med dem."}}')
assert "Kan jag leasa bilen hos er?" in FAQ_LD
EJBIL = ""   # formuläret "Hittar du inte din bil?" används inte när vi bara jämför

HERO = """<header class="hero foto">
    <div class="wrap herotext">
      <h1>Jämför privatleasing och hitta bästa kampanjen</h1>
      <p class="heroslogan">Alla märken. Alla avgifter. Ett pris.</p>
      <p class="heroingress">Vi jämför märkenas och handlarnas privatleasing på nya bilar – med insats och avgifter inräknade, billigast överst och kontrollerat varje dag.</p>
      <form class="startsok" id="startsok" role="search"><input name="q" type="search" list="modellforslag" placeholder="Sök bil, t.ex. Volvo EX30" aria-label="Sök bil"><datalist id="modellforslag"></datalist><button type="submit">Jämför</button></form>
      <div class="heroknappar"><a class="knapp" href="kampanjer.html">Se kampanjerna</a><a class="knapp ljus" href="alla-bilar.html">Jämför alla bilar</a></div>
      <div class="trust" id="trust"></div>
    </div>
  </header>"""

MENY = [("index.html", "Start"), ("kampanjer.html", "Kampanjer"), ("alla-bilar.html", "Alla bilar"),
        ("marken.html", "Märken"), ("jamfor-bilar.html", "Jämför bilar"), ("rakna.html", "Räkna"), ("guide.html", "Guide"), ("fragor.html", "Frågor & svar")]


def sida(fil, titel, beskr, innehall, aktiv="", sida_typ="", marke="", ld=None, ogtitel=None, modell="", forval=None):
    url = DOMAN + ("" if fil == "index.html" else fil)
    graf = ld or []
    ldtext = json.dumps({"@context": "https://schema.org", "@graph": graf}, ensure_ascii=False) if graf else ""
    meny = "".join(f'<a href="{f}"{" class=\"aktiv\" aria-current=\"page\"" if f == aktiv else ""}>{html.escape(n)}</a>' for f, n in MENY)
    data = f' data-sida="{sida_typ}"' + (f' data-marke="{html.escape(marke)}"' if marke else "") + (f' data-modell="{modell}"' if modell else "") + "".join(f' data-{k}="{html.escape(str(v))}"' for k, v in (forval or {}).items())
    return f"""<!DOCTYPE html>
<!-- Jämföra Privatleasing – byggs av kalla/build.py. Stil: stil.css, logik: app.js, bilar och priser: i app.js (BILAR) och konfig.js. -->
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(titel)}</title>
  <meta name="description" content="{html.escape(beskr)}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#0E2A47">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Jämföra Privatleasing">
  <meta property="og:title" content="{html.escape(ogtitel or titel)}">
  <meta property="og:description" content="{html.escape(beskr)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{DOMAN}bilder/delning.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="bilder/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="bilder/app-ikon.png">
  <link rel="stylesheet" href="stil.css">
  {f'<script type="application/ld+json">{ldtext}</script>' if ldtext else ''}
</head>
<body{data}>
  <nav class="topnav">
    <div class="wrap navrad">
      <a class="logo" href="index.html" aria-label="Jämföra Privatleasing – till startsidan"><span><b>Jämföra</b> <i>privatleasing</i></span></a>
      <button type="button" class="menyknapp" id="menyKnapp" aria-label="Meny" aria-expanded="false">☰</button>
      <div class="navlankar">{meny}</div>
    </div>
  </nav>
{innehall}
  {KONF}

  <footer class="sidfot">
    <div class="wrap fotrad">
      <div><a class="logo" href="index.html" aria-label="Jämföra Privatleasing – till startsidan"><span><b>Jämföra</b> <i>privatleasing</i></span></a><p>Oberoende jämförelse av privatleasing på nya bilar i Sverige.</p></div>
      <div><b>Information</b><a href="sa-jamfor-vi.html">Så jämför vi</a><a href="om-oss.html">Om oss och kontakt</a><a href="integritetspolicy.html">Integritetspolicy</a><a href="villkor.html">Användarvillkor</a><a href="fragor.html">Frågor &amp; svar</a></div>
      <div><b>Jämför</b><a href="privatleasing-elbil.html">Privatleasing elbil</a><a href="privatleasing-suv.html">Privatleasing SUV</a><a href="billigaste-privatleasing.html">Billigaste privatleasingen</a><a href="privatleasing-under-3000.html">Under 3 000 kr/mån</a><a href="jamfor-bilar.html">Jämför bilar sida vid sida</a><a href="rakna.html">Räkna på kostnaden</a></div>
      <div><b>Företag</b><span id="fotforetag"></span></div>
    </div>
  </footer>
  <section class="wrap kallor" style="padding: 0 16px;">
    <details>
      <summary>Bildkällor</summary>
      <ul id="kallor"></ul>
    </details>
  </section>
  <footer>Jämföra Privatleasing · priser kontrollerade {KONTROLL} · nybilspriser från Skatteverket · foton från Wikimedia Commons</footer>

  <script src="foretag.js"></script>
  <script src="konfig.js"></script>
  <script src="affiliate.js"></script>
  <script src="bildkalla.js"></script>
  <script src="prishistorik.js"></script>
  <script src="app.js"></script>
</body>
</html>
"""


def sidhuvud(h1, text, brod=None):
    b = f'<div class="brodsmula">{brod}</div>' if brod else ""
    return f"""
  <header class="sidhuvud">
    <div class="wrap">{b}
      <h1>{h1}</h1>
      <p>{text}</p>
    </div>
  </header>"""


def filter_html(med_marke=True):
    marke = '<div><label for="marke">Märke</label><select id="marke"><option value="alla">Alla märken</option></select></div>' if med_marke else ""
    tak = "".join(f'<option value="{v}">{kr(v)}</option>' for v in (3000, 3500, 4000, 5000, 6000, 8000))
    return f"""
    <section class="controls">
      <div class="hel narabox"><label for="postnr">Nära dig</label>
        <div class="narad">
          <input id="postnr" inputmode="numeric" autocomplete="postal-code" maxlength="6" placeholder="Postnummer">
          <button type="button" id="minPlats">📍 Använd min plats</button>
          <select id="radie" aria-label="Avstånd"><option value="0">Hela Sverige</option><option value="50">Inom 5 mil</option><option value="100">Inom 10 mil</option><option value="250" selected>Inom 25 mil</option><option value="500">Inom 50 mil</option></select>
        </div>
        <small id="plattext"></small>
      </div>
      <div class="sokfalt"><label for="sok">Sök modell</label><input id="sok" type="search" placeholder="t.ex. EX30 eller Tiguan"></div>
      {marke}
      <div><label for="maxpris">Max per månad</label><select id="maxpris"><option value="0">Inget tak</option>{tak}</select></div>
      <div class="sorterafalt"><label for="sortera">Sortera</label><select id="sortera">
        <option value="andel">Bästa erbjudande</option><option value="total">Billigast totalt</option>
        <option value="manad">Lägst månadspris</option><option value="marke">Märke A–Ö</option></select></div>
      <div class="hel"><label>Drivmedel</label>
        <div class="chips" id="drivchips"><button type="button" class="vald" data-v="alla">Alla</button><button type="button" data-v="El">El</button><button type="button" data-v="Laddhybrid">Laddhybrid</button><button type="button" data-v="Hybrid">Hybrid</button><button type="button" data-v="Bensin">Bensin</button></div>
        <input type="hidden" id="drivmedel" value="alla"></div>
      <div class="hel"><label>Tillval</label>
        <div class="chips" id="tillvalchips"><button type="button" class="vald" data-v="alla">Alla <small></small></button><button type="button" data-v="bygg">🛠 Bygg din bil <small></small></button><button type="button" data-v="fardig">Färdiga erbjudanden <small></small></button></div>
        <small class="hjalp">🛠 = märkets egen konfigurator, där du väljer färg och tillval. Färdiga erbjudanden = bilen som handlaren har den i lager eller på kampanj.</small>
        <input type="hidden" id="tillval" value="alla"></div>
      <details class="flerfilter"><summary>Fler val: körsträcka och försäkring</summary>
        <div class="rad">
          <div><label for="mil">Körsträcka per år</label><select id="mil"><option value="1000">1 000 mil</option><option value="1500">1 500 mil</option><option value="2000">2 000 mil</option></select></div>
          <div><label for="forsakring">Din försäkring (kr/mån)</label><input id="forsakring" type="number" min="0" step="50" value="0"></div>
        </div>
      </details>
    </section>"""


def lista_html(rubrik, med_marke=True, ejbil=True):
    return f"""
  <main class="wrap" style="padding: 0 16px;" id="alla">
    {filter_html(med_marke)}
    <section class="summary" id="summary"></section>
    <h2 class="allarubrik">{rubrik}</h2>
    <section class="list" id="lista"></section>
    <button type="button" class="visamer" id="visaMer" hidden>Visa fler modeller</button>
    {VILLKOR}
    {EJBIL if ejbil else ""}
  </main>"""


MARKE_BLOCK = """
  <section class="block" id="marken">
    <div class="wrap">
      <h2>Privatleasing per märke</h2>
      <div class="markegrid" id="markelankar"></div>
    </div>
  </section>"""

ORG_LD = [{"@type": "WebSite", "name": "Jämföra Privatleasing", "url": DOMAN, "inLanguage": "sv-SE",
           "description": "Jämför privatleasing på nya bilar i Sverige med alla avgifter inräknade."},
          {"@type": "Organization", "name": "Jämföra Privatleasing", "url": DOMAN}]


def brod(*delar):
    lankar = ['<a href="index.html">Start</a>'] + [f'<a href="{f}">{n}</a>' if f else n for f, n in delar]
    return " › ".join(lankar)


def brod_ld(*delar):
    items = [("Start", DOMAN)] + [(n, DOMAN + f) for f, n in delar]
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}


# ---------- Hjälp: statistik ur datan ----------
def kanda(lst):
    k = [b for b in lst if not b["milokand"]]
    return k or lst

def stats(lst):
    k = kanda(lst)
    bast = min(k, key=lambda b: (b["eff"], b["manad"]))
    return {"n": len(lst), "min": bast["eff"], "max": max(b["eff"] for b in k), "snitt": round(sum(b["eff"] for b in k) / len(k)),
            "bast": bast, "saljare": len({SALJARE(b) for b in lst}), "modeller": len({b["mkey"] for b in lst})}

MOD = {}
for _b in BILAR:
    MOD.setdefault(_b["mkey"], []).append(_b)
ALLT = stats(BILAR)
KAROSS_AV = {k: next((b.get("kaross") for b in v if b.get("kaross")), "") for k, v in MOD.items()}

CHECKLISTA = """
    <section class="kollruta">
      <h2>Kolla det här innan du skriver på</h2>
      <ul>
        <li><b>Körsträckan.</b> Räkna på hur långt du faktiskt kör. Övermil betalas per mil när bilen lämnas tillbaka, och du kan normalt inte ändra körsträckan under avtalet.</li>
        <li><b>Fast eller rörlig avgift.</b> Fråga om månadskostnaden kan höjas om räntan stiger, och be om ett räkneexempel.</li>
        <li><b>Vad som ingår.</b> Service ingår ofta. Försäkring, vinterhjul och fordonsskatt tillkommer oftast – be om pris på dem.</li>
        <li><b>Avgifter vid start.</b> Uppläggningsavgift, aviavgift och förhöjd första hyra syns inte alltid i annonspriset. Hos oss är de inräknade i den faktiska kostnaden.</li>
        <li><b>Du kan normalt inte säga upp avtalet i förtid.</b> Går leasingbolaget med på det kan det bli dyrt. Fråga vad som gäller innan du signerar.</li>
        <li><b>Återlämningen.</b> Be om leasingbolagets regler för normalt slitage, och fotografera bilen när du hämtar den och när du lämnar den.</li>
      </ul>
      <p>Källa: Konsumentverkets och M Sveriges råd om privatleasing. <a href="guide.html#checklista">Hela checklistan →</a></p>
    </section>"""

# ---------- Kategorisidor (elbil, SUV, under 3 000 kr …) ----------
KATEGORIER = [
    ("privatleasing-elbil.html", "Privatleasing elbil", "elbilar", {"driv": "El", "sort": "total"}, lambda b: b["drivmedel"] == "El",
     "Elbilar är de mest privatleasade bilarna i Sverige. Här jämför vi alla elbilar hos märkena och handlarna, med billigast överst."),
    ("privatleasing-laddhybrid.html", "Privatleasing laddhybrid", "laddhybrider", {"driv": "Laddhybrid", "sort": "total"}, lambda b: b["drivmedel"] == "Laddhybrid",
     "En laddhybrid kör korta sträckor på el och långa på bensin. Här är alla laddhybrider du kan privatleasa just nu."),
    ("privatleasing-hybrid.html", "Privatleasing hybrid", "hybrider", {"driv": "Hybrid", "sort": "total"}, lambda b: b["drivmedel"] == "Hybrid",
     "Hybrider laddar sig själva och behöver ingen laddbox. Här är alla hybrider du kan privatleasa just nu."),
    ("privatleasing-bensin.html", "Privatleasing bensinbil", "bensinbilar", {"driv": "Bensin", "sort": "total"}, lambda b: b["drivmedel"] == "Bensin",
     "Bensinbilar har ofta de lägsta månadspriserna. Här är alla bensinbilar du kan privatleasa just nu."),
    ("privatleasing-suv.html", "Privatleasing SUV", "SUV:ar", {"kaross": "SUV", "sort": "total"}, lambda b: b.get("kaross") == "SUV",
     "Hög sittställning och gott om plats. Här jämför vi alla SUV:ar och crossovers du kan privatleasa just nu."),
    ("privatleasing-kombi.html", "Privatleasing kombi", "kombibilar", {"kaross": "Kombi", "sort": "total"}, lambda b: b.get("kaross") == "Kombi",
     "Kombin är familjebilen med störst bagage. Här är alla kombibilar du kan privatleasa just nu."),
    ("privatleasing-smabil.html", "Privatleasing småbil", "småbilar", {"kaross": "Småbil", "sort": "total"}, lambda b: b.get("kaross") == "Småbil",
     "Småbilar är billigast att leasa och lättast att parkera. Här är alla småbilar du kan privatleasa just nu."),
    ("privatleasing-under-3000.html", "Privatleasing under 3 000 kr/mån", "bilar under 3 000 kr/mån", {"tak": 3000, "sort": "total"}, lambda b: not b["milokand"] and b["eff"] <= 3000,
     "Här visar vi bara bilar där den faktiska kostnaden är högst 3 000 kr i månaden – med insats och avgifter utslagna på 36 månader. Annonspriser som bara ser billiga ut kommer inte med."),
    ("privatleasing-under-4000.html", "Privatleasing under 4 000 kr/mån", "bilar under 4 000 kr/mån", {"tak": 4000, "sort": "total"}, lambda b: not b["milokand"] and b["eff"] <= 4000,
     "Här visar vi bara bilar där den faktiska kostnaden är högst 4 000 kr i månaden – med insats och avgifter utslagna på 36 månader."),
    ("billigaste-privatleasing.html", "Billigaste privatleasingen just nu", "bilar", {"sort": "total"}, lambda b: True,
     "Alla bilar, sorterade efter vad de faktiskt kostar på 36 månader. Insats, uppläggningsavgift och aviavgift är inräknade, så att ett lågt annonspris inte kan gömma en dyr start."),
]
KATLANKAR = '<div class="katlankar">' + "".join(
    f'<a href="{f}">{html.escape(h.replace("Privatleasing ", "").replace(" just nu", "").capitalize())}</a>' for f, h, *_ in KATEGORIER) + "</div>"

GUIDE_CHECK = """
  <section class="block" id="checklista">
    <div class="wrap checklista">
      <h2>Checklista: innan, under och efter leasingen</h2>
      <p>Privatleasing är en tjänst och omfattas inte av konsumentköplagen. Det är avtalet som gäller – läs det innan du signerar.</p>
      <h3>Innan du skriver på</h3>
      <ul>
        <li><b>Välj rätt körsträcka från början.</b> Övermil betalas per mil när bilen lämnas tillbaka, och körsträckan går normalt inte att ändra under avtalet.</li>
        <li><b>Fråga om avgiften är fast eller rörlig.</b> Vid rörlig avgift kan månadskostnaden höjas när räntan stiger. Du har rätt att få se hur leasingbolagets kostnader har ökat.</li>
        <li><b>Be om alla kostnader skriftligt:</b> uppläggningsavgift, aviavgift, förhöjd första hyra, vinterhjul, försäkring och fordonsskatt.</li>
        <li><b>Du kan normalt inte säga upp avtalet i förtid.</b> Går leasingbolaget med på det kan det bli dyrt. Fråga vad som gäller vid till exempel flytt, sjukdom eller separation.</li>
        <li><b>Be om reglerna för normalt slitage</b> innan du signerar, inte när bilen ska lämnas tillbaka.</li>
      </ul>
      <h3>Under tiden</h3>
      <ul>
        <li><b>Fotografera bilen</b> noga när du hämtar den – utsida, fälgar och inredning.</li>
        <li><b>Gör service i tid</b> enligt tillverkarens intervall. Missad service kan bli dyr.</li>
        <li><b>Håll koll på mätaren.</b> Ser du att du kommer att köra för långt – kontakta leasingbolaget i god tid.</li>
      </ul>
      <h3>När bilen ska lämnas tillbaka</h3>
      <ul>
        <li><b>Kontakta handlaren i god tid</b>, gärna ett halvår innan avtalet går ut, och boka tid för återlämning.</li>
        <li><b>Normalt slitage ska du inte betala för:</b> mindre stenskott, lätt slitage i inredningen och små repor som inte kräver omlackering. Djupare repor, bucklor, fälgskador och saknad utrustning kan du få betala för.</li>
        <li><b>Fotografera bilen igen</b> och se till att nycklar, laddkablar och annan utrustning följer med.</li>
        <li><b>Inte nöjd med slutfakturan?</b> Klaga först hos företaget. Kommer ni inte överens kan du anmäla till Allmänna reklamationsnämnden (ARN).</li>
      </ul>
      <p class="kalla">Källor: Konsumentverket, M Sverige och Motorbranschens Riksförbund (MRF). Läs mer hos <a href="https://www.konsumentverket.se/" target="_blank" rel="noopener">Konsumentverket</a> och <a href="https://www.arn.se/" target="_blank" rel="noopener">ARN</a>.</p>
    </div>
  </section>"""

sidor = {}
antal_bilar = sum(m["n"] for m in MARKEN.values())

# ---------- Startsidan ----------
sidor["index.html"] = sida(
    "index.html",
    f"Jämför privatleasing – {len({b['mkey'] for b in BILAR})} bilmodeller, billigast först ({MANAD}) | Jämföra Privatleasing",
    f"Jämför {antal_bilar} privatleasingerbjudanden från märken och handlare på {len({b['mkey'] for b in BILAR})} nya bilmodeller. Insats och avgifter inräknade, billigast överst, kontrollerat varje dag.",
    f"""
  {HERO}
  {TOPP.replace('</small>', '</small><p style="text-align:center;margin:18px 0 0"><a class="knapp" href="kampanjer.html">Se alla kampanjer →</a></p>', 1)}
  <section class="block">
    <div class="wrap">
      <h2>Vad letar du efter?</h2>
      <div class="genvagar katkort">
        <a href="privatleasing-elbil.html"><b>⚡ Elbil →</b><span>Alla elbilar, billigast först.</span></a>
        <a href="privatleasing-suv.html"><b>SUV →</b><span>Hög sittställning och gott om plats.</span></a>
        <a href="privatleasing-kombi.html"><b>Kombi →</b><span>Familjebilar med stort bagage.</span></a>
        <a href="privatleasing-smabil.html"><b>Småbil →</b><span>Billigast att leasa.</span></a>
        <a href="privatleasing-under-3000.html"><b>Under 3 000 kr/mån →</b><span>Faktisk kostnad, inte bara annonspris.</span></a>
        <a href="billigaste-privatleasing.html"><b>Billigast just nu →</b><span>Alla bilar efter verklig kostnad.</span></a>
      </div>
    </div>
  </section>
  <section class="block ljus">
    <div class="wrap">
      <h2>Därför kan du lita på jämförelsen</h2>
      <div class="darfor">
        <div><b>Hela kostnaden</b><p>Insats, uppläggningsavgift och aviavgift räknas in. Ett lågt annonspris kan inte gömma en dyr start.</p></div>
        <div><b>Bara riktig privatleasing</b><p>Inga billån, ingen företagsleasing och inga begagnade bilar blandas in.</p></div>
        <div><b>Vi gissar aldrig</b><p>Saknas en uppgift hos säljaren står det "fråga handlaren" – inte ett påhittat värde.</p></div>
        <div><b>Ingen köper sig en plats</b><p>Ordningen bestäms bara av priset. Annonslänkar är alltid märkta.</p></div>
      </div>
      <p style="margin:16px 0 0"><a href="sa-jamfor-vi.html">Så jämför vi →</a></p>
    </div>
  </section>
  <section class="block">
    <div class="wrap">
      <h2>Verktyg som hjälper dig välja</h2>
      <div class="genvagar">
        <a href="jamfor-bilar.html"><b>Jämför sida vid sida →</b><span>Ställ två till fyra bilar bredvid varandra.</span></a>
        <a href="rakna.html"><b>Räkna på hela kostnaden →</b><span>Med försäkring, vinterhjul och övermil.</span></a>
        <a href="rakna.html#kopa"><b>Leasa eller köpa? →</b><span>Se vad som blir billigast för dig.</span></a>
        <a href="guide.html#checklista"><b>Checklista →</b><span>Det här ska du kolla innan du skriver på.</span></a>
      </div>
    </div>
  </section>
  {MARKE_BLOCK.replace('class="block"', 'class="block ljus"')}
  {STEG}
  <div class="wrap" style="padding:0 16px">{VILLKOR}</div>""",
    aktiv="index.html", sida_typ="start", ld=ORG_LD,
    ogtitel="Jämför privatleasing – hitta bästa leasingkampanjen 2026")

# ---------- Kampanjer ----------
sidor["kampanjer.html"] = sida(
    "kampanjer.html",
    f"Privatleasing kampanjer – bästa erbjudandena just nu ({MANAD}) | Jämföra Privatleasing",
    "De bästa privatleasingkampanjerna just nu, kontrollerade varje dag. Bara bilar där du betalar under 45 % av nypriset på 36 månader.",
    sidhuvud("Bästa privatleasingkampanjerna just nu",
             "Här visar vi bara erbjudanden med <b>bra</b> eller <b>mycket bra</b> pris – där du betalar under 45 % av bilens nypris på 36 månader, med alla avgifter inräknade.",
             brod((None, "Kampanjer")))
    + "\n  " + TOPP.replace(' id="kampanjer"', "").replace('<h2 id="toppRubrik" class="sektionsrubrik">Bästa kampanjerna just nu</h2>', '<h2 id="toppRubrik" class="sektionsrubrik">Topp 5 bland de mest leasade bilarna</h2>')
    + lista_html("Alla bra kampanjer", ejbil=True),
    aktiv="kampanjer.html", sida_typ="kampanjer", ld=[brod_ld(("kampanjer.html", "Kampanjer"))])

# ---------- Alla bilar ----------
sidor["alla-bilar.html"] = sida(
    "alla-bilar.html",
    f"Jämför privatleasing på alla bilar ({antal_bilar} st) – sök och filtrera | Jämföra Privatleasing",
    f"Sök bland {antal_bilar} privatleasingerbjudanden. Filtrera på märke, drivmedel och max månadspris och se totalkostnaden på 36 månader.",
    sidhuvud("Jämför alla bilar",
             f"<span data-antal>{antal_bilar}</span> erbjudanden från {len(MARKEN)} märken. Filtrera på pris och drivmedel – vi räknar med alla avgifter.",
             brod((None, "Alla bilar")))
    + f'\n  <div class="wrap" style="padding:0 16px">{KATLANKAR}</div>'
    + lista_html("Bilar som matchar") + f"\n  <div class=\"wrap\" style=\"padding:0 16px\">{INFOKORT}</div>",
    aktiv="alla-bilar.html", sida_typ="alla", ld=[brod_ld(("alla-bilar.html", "Alla bilar"))])

# ---------- Märken ----------
sidor["marken.html"] = sida(
    "marken.html",
    "Privatleasing per bilmärke 2026 – Volvo, Volkswagen, Tesla med flera | Jämföra Privatleasing",
    f"Jämför privatleasing hos {len(MARKEN)} bilmärken. Se alla erbjudanden för ditt märke med totalpris på 36 månader.",
    sidhuvud("Privatleasing per märke", "Välj märke för att se alla erbjudanden, billigaste modellen och bästa kampanjen.", brod((None, "Märken")))
    + MARKE_BLOCK.replace("<h2>Privatleasing per märke</h2>", "").replace('class="block"', 'class="block ljus"'),
    aktiv="marken.html", sida_typ="marken", ld=[brod_ld(("marken.html", "Märken"))])

# ---------- Guide ----------
sidor["guide.html"] = sida(
    "guide.html",
    "Så funkar privatleasing – vad ingår och vad tillkommer? | Jämföra Privatleasing",
    "Guide till privatleasing: så funkar det, vad som ingår i månadskostnaden och vad som tillkommer, som försäkring, fordonsskatt och övermil.",
    sidhuvud("Så funkar privatleasing", "Allt du behöver veta innan du leasar: hur det funkar, vad som ingår och vilka kostnader som tillkommer.", brod((None, "Guide")))
    + "\n  " + STEG + "\n  " + INGAR + GUIDE_CHECK + f"\n  <div class=\"wrap\" style=\"padding:0 16px\">{INFOKORT}</div>"
    + '\n  <section class="block"><div class="wrap"><div class="genvagar"><a href="alla-bilar.html"><b>Jämför alla bilar →</b><span>Hitta rätt bil och pris.</span></a><a href="fragor.html"><b>Frågor &amp; svar →</b><span>Fler svar om privatleasing.</span></a></div></div></section>',
    aktiv="guide.html", sida_typ="guide", ld=[brod_ld(("guide.html", "Guide"))])

# ---------- Frågor & svar ----------
fragor = FRAGOR.replace('class="info" id="fragor"', 'class="info alla" id="fragor"')
fragor = re.sub(r'\s*<button type="button" id="visaFler">Visa fler frågor</button>', "", fragor).replace("<h2>Frågor &amp; svar</h2>", "")
faq = json.loads(FAQ_LD)
sidor["fragor.html"] = sida(
    "fragor.html",
    "Frågor och svar om privatleasing – övermil, ränta, försäkring | Jämföra Privatleasing",
    "Svar på vanliga frågor om privatleasing: vad ingår, var tecknar jag avtalet, vad kostar övermil, kan månadskostnaden ändras och vilken försäkring krävs.",
    sidhuvud("Frågor &amp; svar om privatleasing", "Det folk oftast undrar innan de leasar en ny bil.", brod((None, "Frågor &amp; svar")))
    + f'\n  <main class="wrap" style="padding: 0 16px;">{fragor}\n  {EJBIL}\n  </main>',
    aktiv="fragor.html", sida_typ="fragor", ld=[faq, brod_ld(("fragor.html", "Frågor & svar"))])

# ---------- En sida per märke ----------
DRIV = {"El": "elbilar", "Laddhybrid": "laddhybrider", "Hybrid": "hybrider", "Bensin": "bensinbilar"}
for marke, m in sorted(MARKEN.items(), key=lambda x: x[0]):
    fil = f"privatleasing-{slug(marke)}.html"
    typer = [DRIV.get(d, d.lower()) for d in m["driv"]]
    typtext = typer[0] if len(typer) == 1 else ", ".join(typer[:-1]) + " och " + typer[-1]
    bilord = "erbjudande" if m["n"] == 1 else "erbjudanden"
    sidor[fil] = sida(
        fil,
        f"Privatleasing {marke} – {m['n']} {bilord} från {kr(m['min'])}/mån ({MANAD}) | Jämföra Privatleasing",
        f"Jämför privatleasing på {marke}: {m['n']} {bilord}, billigast från {kr(m['min'])}/mån ({marke} {m['mod']}). Alla avgifter inräknade, kontrollerat varje dag.",
        sidhuvud(f"Privatleasing {html.escape(marke)}",
                 f"{m['n']} {bilord} på {html.escape(marke)} – {typtext}. Billigast just nu: <b>{html.escape(marke)} {html.escape(m['mod'])}</b> från <b>{kr(m['min'])}/mån</b>. Vi räknar med alla avgifter på 36 månader.",
                 brod(("marken.html", "Märken"), (None, html.escape(marke))))
        + lista_html(f"Alla {html.escape(marke)}-erbjudanden", med_marke=False, ejbil=False)
        + MARKE_BLOCK.replace("Privatleasing per märke", "Andra märken"),
        aktiv="marken.html", sida_typ="marke", marke=marke,
        ld=[brod_ld(("marken.html", "Märken"), (fil, f"Privatleasing {marke}"))])

for fil, h1, ord_, forval, villkor_f, intro in KATEGORIER:
    urval = [b for b in BILAR if villkor_f(b)]
    if not urval:
        continue
    st = stats(urval); bb = st["bast"]
    svar = (f'<b>{st["modeller"]} modeller och {st["n"]} erbjudanden</b> just nu. Billigast är <a href="privatleasing-{bb["mkey"]}.html">{html.escape(bb["marke"])} {html.escape(bb["mnamn"])}</a> '
            f'för <b>{kr(bb["eff"])}/mån</b> i faktisk kostnad hos {html.escape(SALJARE(bb))}. Kontrollerat {KONTROLL}.')
    sidor[fil] = sida(
        fil,
        f"{h1} – {st['modeller']} modeller från {kr(st['min'])}/mån ({MANAD}) | Jämföra Privatleasing",
        f"Jämför {ord_} med privatleasing: {st['n']} erbjudanden på {st['modeller']} modeller, billigast {bb['marke']} {bb['mnamn']} från {kr(st['min'])}/mån med alla avgifter inräknade. Kontrollerat {KONTROLL}.",
        sidhuvud(html.escape(h1), intro, brod(("alla-bilar.html", "Alla bilar"), (None, html.escape(h1))))
        + f'\n  <div class="wrap" style="padding:0 16px"><p class="direktsvar">{svar}</p>{KATLANKAR}</div>'
        + lista_html(f"{html.escape(h1)} – billigast först", ejbil=False)
        + f'\n  <div class="wrap" style="padding:0 16px">{CHECKLISTA}</div>',
        aktiv="alla-bilar.html", sida_typ="kategori", forval=forval,
        ld=[brod_ld(("alla-bilar.html", "Alla bilar"), (fil, h1))])

# ---------- Jämför bilar sida vid sida ----------
sidor["jamfor-bilar.html"] = sida(
    "jamfor-bilar.html",
    "Jämför bilar sida vid sida – privatleasing | Jämföra Privatleasing",
    "Ställ två till fyra bilar bredvid varandra och jämför faktisk månadskostnad, totalpris, pris per mil, körsträcka och vad som ingår.",
    sidhuvud("Jämför bilar sida vid sida", "Välj två till fyra modeller. Vi ställer det billigaste erbjudandet på varje bil bredvid varandra och markerar vilken som är bäst på varje rad.", brod((None, "Jämför bilar")))
    + '\n  <main class="wrap" style="padding: 0 16px;"><section id="sidavid"></section></main>',
    aktiv="jamfor-bilar.html", sida_typ="jamforbilar", ld=[brod_ld(("jamfor-bilar.html", "Jämför bilar"))])

# ---------- Räkna: hela kostnaden + leasa eller köpa ----------
def falt(id_, text, hjalp="", varde="", ph=""):
    return f'<div><label for="{id_}">{text}{f" <small>{hjalp}</small>" if hjalp else ""}</label><input id="{id_}" type="number" inputmode="numeric" min="0" value="{varde}" placeholder="{ph}"></div>'

sidor["rakna.html"] = sida(
    "rakna.html",
    "Räkna på privatleasing – faktisk månadskostnad och leasa eller köpa | Jämföra Privatleasing",
    "Två kalkylatorer: vad leasingen kostar på riktigt med försäkring, vinterhjul, skatt och övermil – och om det blir billigare att leasa eller köpa bilen.",
    sidhuvud("Räkna på privatleasing", "Annonspriset är aldrig hela kostnaden. Här räknar du ut vad bilen kostar dig på riktigt – och om det lönar sig att köpa i stället.", brod((None, "Räkna")))
    + f"""
  <main class="wrap raknasida" style="padding: 0 16px;" id="rakna">
    <section class="raknare" id="hela">
      <h2>1. Vad kostar leasingen på riktigt?</h2>
      <p><span class="raknabil"></span>Fyll i siffrorna från erbjudandet och dina egna kostnader. Tomma fält räknas som 0 kr.</p>
      <div class="rform">
        {falt("rLeasing", "Månadshyra, kr", ph="t.ex. 3 995")}
        {falt("rStart", "Betalas vid start, kr", "insats, förhöjd hyra, uppläggning")}
        {falt("rFors", "Försäkring, kr/mån", "om den inte ingår")}
        {falt("rHjul", "Vinterhjul, kr", "engångskostnad om de inte ingår")}
        {falt("rSkatt", "Fordonsskatt, kr/år", "om den inte ingår")}
        {falt("rIngar", "Mil per år som ingår", varde="1000")}
        {falt("rKor", "Mil per år du kör", varde="1000")}
        {falt("rOver", "Pris per övermil, kr", "står i säljarens villkor")}
      </div>
      <div class="rsvar" id="rSvar"></div>
    </section>
    <section class="raknare" id="kopa">
      <h2>2. Leasa eller köpa?</h2>
      <p><span class="raknabil"></span>Vi jämför tre års leasing med att köpa samma bil på lån och sälja den efter tre år.</p>
      <div class="rform">
        {falt("kPris", "Bilens pris, kr", ph="t.ex. 450 000")}
        {falt("kInsats", "Din kontantinsats, kr", "resten lånas")}
        {falt("kRanta", "Ränta på billånet, %", "exempel – skriv din egen", varde="6")}
        {falt("kRest", "Bilens värde efter 3 år, % av priset", "exempel – ingen vet säkert", varde="55")}
        {falt("kService", "Service, kr/år", "ingår ofta i leasing")}
        {falt("kLeasing", "Leasingens månadshyra, kr", ph="t.ex. 4 995")}
        {falt("kStart", "Leasing: betalas vid start, kr")}
      </div>
      <div class="rsvar" id="kSvar"></div>
    </section>
    {CHECKLISTA}
  </main>""",
    aktiv="rakna.html", sida_typ="rakna", ld=[brod_ld(("rakna.html", "Räkna"))])

# ---------- Så jämför vi ----------
sidor["sa-jamfor-vi.html"] = sida(
    "sa-jamfor-vi.html",
    "Så jämför vi privatleasing – metod, källor och hur vi tjänar pengar | Jämföra Privatleasing",
    "Så räknar vi fram priserna, var erbjudandena kommer ifrån, vad vi inte tar med och hur Jämföra Privatleasing tjänar pengar.",
    sidhuvud("Så jämför vi", "Du ska kunna lita på siffrorna. Här står exakt hur vi räknar, var uppgifterna kommer ifrån och vad vi inte vet.", brod((None, "Så jämför vi")))
    + f"""
  <main class="wrap textsida" style="padding: 0 16px;">
    <h2>Vi räknar på hela kostnaden</h2>
    <p>Ett annonspris på 2 995 kr/mån kan gömma en insats på 30 000 kr, en uppläggningsavgift och en aviavgift varje månad. Därför rangordnar vi efter <b>faktisk månadskostnad</b>: allt du betalar till säljaren på 36 månader – hyra, insats eller förhöjd första hyra, uppläggningsavgift, aviavgift och obligatorisk försäkring – delat på 36.</p>
    <p>Försäkring, vinterhjul, fordonsskatt och drivmedel ingår sällan i priset. När något av det ingår står det på erbjudandet. På varje modellsida kan du lägga till din egen försäkring och välja din körsträcka, så räknas priserna om.</p>
    <h2>Var erbjudandena kommer ifrån</h2>
    <p>Just nu jämför vi <b><span data-tal="erbjudanden">{ALLT['n']}</span> erbjudanden</b> på <b><span data-tal="modeller">{ALLT['modeller']}</span> modeller</b> från <b><span data-tal="saljare">{ALLT['saljare']}</span> säljare</b>. Uppgifterna hämtas från märkenas egna sidor och från handlarnas annonser, och kontrolleras varje dag. Senaste kontroll: <span data-tal="kontroll">{KONTROLL}</span>.</p>
    <h2>Det här tar vi inte med</h2>
    <ul>
      <li><b>Företagsleasing</b> och priser utan moms.</li>
      <li><b>Billån och avbetalning</b> som annonseras som "månadskostnad".</li>
      <li><b>Begagnade bilar</b> och korta avtal. Vi jämför nya bilar på 36 månader, så att priserna går att ställa mot varandra.</li>
      <li><b>Priser som kräver elbilspremie eller annan rabatt</b> som inte alla får.</li>
      <li><b>Samma annons flera gånger.</b> Vi visar högst två erbjudanden per säljare och modell.</li>
    </ul>
    <h2>När vi inte vet</h2>
    <p>Står körsträckan inte i handlarens annons gissar vi inte. Då står det "Körsträcka: fråga handlaren", vi räknar inget pris per mil och erbjudandet kan inte bli märkt Billigast. Saknas uppgift om service står det "fråga säljaren".</p>
    <h2>Betyget</h2>
    <p>För erbjudanden där vi vet bilens nypris visar vi hur stor del av nypriset du betalar på 36 månader: under 40 % är Mycket bra, under 45 % Bra, under 55 % OK och däröver Dyrt.</p>
    <h2>Hur vi tjänar pengar</h2>
    <p>Jämföra Privatleasing är oberoende. Vissa länkar till säljare kan vara annonslänkar – då står det "Annonslänk" vid knappen, och vi kan få ersättning om du går vidare. <b>Ingen kan betala för att hamna högre upp.</b> Ordningen bestäms bara av priset.</p>
    <h2>Hittar du ett fel?</h2>
    <p>Kampanjer ändras ofta. Stämmer inte ett pris med säljarens sida vill vi veta det: <a href="mailto:kontakt@jamforprivatleasing.se">kontakt@jamforprivatleasing.se</a>. Det är alltid säljarens avtal som gäller.</p>
  </main>""",
    sida_typ="metod", ld=[brod_ld(("sa-jamfor-vi.html", "Så jämför vi"))])

# ---------- En sida per modell: jämför handlare ----------
def lista_ord(n, en, fl):
    return f"{n} {en if n == 1 else fl}"

for key, lst in sorted(MOD.items()):
    fil = f"privatleasing-{key}.html"
    assert fil not in sidor, fil
    st = stats(lst); bb = st["bast"]
    marke, namn = bb["marke"], bb["mnamn"]
    hel = html.escape(f"{marke} {namn}")
    mfil = f"privatleasing-{slug(marke)}.html"
    erb = lista_ord(st["n"], "erbjudande", "erbjudanden")
    driv = sorted({b["drivmedel"] for b in lst})
    okanda = sum(1 for b in lst if b["milokand"])
    # Direkt svar – står i sidans HTML så att det går att läsa utan JavaScript
    if st["n"] == 1:
        svar = f'Just nu finns <b>ett erbjudande</b> på {hel}: <b>{kr(st["min"])}/mån</b> i faktisk kostnad hos {html.escape(SALJARE(bb))}.'
    else:
        svar = (f'Just nu finns <b>{erb}</b> på {hel} från {lista_ord(st["saljare"], "säljare", "säljare")}. '
                f'Billigast är {html.escape(SALJARE(bb))} med <b>{kr(st["min"])}/mån</b> i faktisk kostnad. Snittet är {kr(st["snitt"])}/mån och det dyraste kostar {kr(st["max"])}/mån.')
    svar += f' Insats och avgifter är inräknade. Kontrollerat {KONTROLL}.'
    rutor = (f'<div class="jmfstats"><div><small>Lägst</small><b>{kr(st["min"])}</b></div><div><small>Snitt</small><b>{kr(st["snitt"])}</b></div>'
             f'<div><small>Högst</small><b>{kr(st["max"])}</b></div><div><small>Säljare</small><b>{st["saljare"]}</b></div></div>') if st["n"] > 1 else ""
    statisk = "".join(
        f'<li><b>{kr(b["m"])}/mån</b> – {html.escape(b["marke"])} {html.escape(b["modell"])}, {html.escape(SALJARE(b))}'
        f'{", " + html.escape(b["ort"]) if b["ort"] else ""} · {"körsträcka: fråga handlaren" if b["milokand"] else f"""{b["mil"]:,}""".replace(",", " ") + " mil/år"}</li>'
        for b in sorted(lst, key=lambda b: (b["milokand"], b["eff"])))
    # Vanliga frågor om modellen – svaren bygger bara på datan ovan
    fr = [(f"Vad kostar privatleasing av {marke} {namn}?",
           f"Det billigaste erbjudandet just nu kostar {kr(st['min'])} per månad i faktisk kostnad på 36 månader, hos {SALJARE(bb)}. Då är insats, uppläggningsavgift och aviavgift inräknade."
           + (f" Det dyraste av de {st['n']} erbjudandena kostar {kr(st['max'])} per månad." if st["n"] > 1 else "")),
          (f"Vad ingår när jag privatleasar {marke} {namn}?",
           ("Service ingår i " + ("alla" if all(b["service"] for b in lst) else "en del av") + " erbjudandena här. " if any(b["service"] for b in lst) else "")
           + "Försäkring, vinterhjul och fordonsskatt tillkommer oftast. På varje erbjudande står vad som ingår, och under \"Hela kostnaden och villkor\" ser du alla avgifter."),
          (f"Var hämtar jag bilen?",
           "Märkets egna erbjudanden gäller i hela Sverige och hämtas hos närmaste märkeshandlare. Handlarnas erbjudanden hämtas på orten som står på erbjudandet. Välj region för att se det som finns nära dig.")]
    if okanda:
        fr.append(("Varför står det \"fråga handlaren\" vid körsträckan?",
                   "Handlarens annons anger inte hur många mil per år som ingår. Vi gissar inte, så de erbjudandena får inget pris per mil och kan inte bli märkta Billigast."))
    faqhtml = '<section class="info alla modellfaq"><h2>Frågor om ' + hel + '</h2>' + "".join(f"<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>" for q, a in fr) + "</section>"
    faqld = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in fr]}
    # Andra modeller: samma märke + liknande bilar (samma karosstyp, närmast i pris)
    def kortlank(k):
        s2 = stats(MOD[k]); b2 = s2["bast"]
        return f'<a href="privatleasing-{k}.html"><b>{html.escape(b2["marke"])} {html.escape(b2["mnamn"])}</b><small>från {kr(s2["min"])}/mån</small></a>'
    samma = [k for k in sorted(MOD) if k != key and MOD[k][0]["marke"] == marke][:8]
    kar = KAROSS_AV.get(key)
    lika = sorted((k for k in MOD if k != key and MOD[k][0]["marke"] != marke and kar and KAROSS_AV.get(k) == kar), key=lambda k: abs(stats(MOD[k])["min"] - st["min"]))[:6]
    relaterat = ""
    if lika:
        relaterat += f'<section class="block"><div class="wrap"><h2>Liknande bilar i samma prisklass</h2><div class="markegrid">{"".join(kortlank(k) for k in lika)}</div></div></section>'
    if samma:
        relaterat += f'<section class="block ljus"><div class="wrap"><h2>Fler modeller från {html.escape(marke)}</h2><div class="markegrid">{"".join(kortlank(k) for k in samma)}</div></div></section>'
    sidor[fil] = sida(
        fil,
        f"Privatleasing {marke} {namn} – {erb} från {kr(st['min'])}/mån ({MANAD}) | Jämföra Privatleasing",
        f"Jämför privatleasing på {marke} {namn}: {erb} från {lista_ord(st['saljare'], 'säljare', 'säljare')}, billigast {kr(st['min'])}/mån med insats och avgifter inräknade. Se pris per mil, totalkostnad och vad som ingår. Kontrollerat {KONTROLL}.",
        sidhuvud(f"Privatleasing {hel}",
                 f"Alla erbjudanden på {hel} hos märket och handlarna – billigast överst, med alla avgifter inräknade.",
                 brod(("marken.html", "Märken"), (mfil, html.escape(marke)), (None, html.escape(namn))))
        + f"""
  <main class="wrap jmfsida" style="padding: 0 16px;">
    <div class="jmfbild" id="jmfbild"></div>
    <p class="direktsvar">{svar}</p>
    {rutor}
    <section id="jamfor"><h2 class="jmfrub">{erb} på {html.escape(namn)}</h2><ol class="jmfstatisk">{statisk}</ol></section>
    <p class="jmfmer"><a href="{mfil}">Alla {html.escape(marke)}-erbjudanden →</a> · <a href="alla-bilar.html">Jämför alla bilar →</a> · <a href="sa-jamfor-vi.html">Så jämför vi →</a></p>
    {CHECKLISTA}
    {faqhtml}
    {VILLKOR}
  </main>""" + relaterat,
        aktiv="marken.html", sida_typ="modell", marke=marke, modell=key,
        ld=[brod_ld(("marken.html", "Märken"), (mfil, f"Privatleasing {marke}"), (fil, f"{marke} {namn}")), faqld])

# ---------- Prishistorik: lägsta faktiska månadskostnad per modell och kontrolldag ----------
# kalla/prishistorik.json fylls på vid varje bygge med dagens värde (datum = KONTROLL i app.js). Ändra aldrig filen för hand.
_km = {"jan": 1, "feb": 2, "mar": 3, "mars": 3, "apr": 4, "maj": 5, "jun": 6, "juni": 6, "jul": 7, "juli": 7, "aug": 8, "sep": 9, "sept": 9, "okt": 10, "nov": 11, "dec": 12}
_d, _m, _y = KONTROLL.split()
KDATUM = f"{int(_y):04d}-{_km[_m.lower().rstrip('.')]:02d}-{int(_d):02d}"
HISTFIL = HIT / "prishistorik.json"
HIST = json.loads(HISTFIL.read_text(encoding="utf-8")) if HISTFIL.exists() else {}
for key, lst in MOD.items():
    rad = [KDATUM, stats(lst)["min"], len(lst)]
    h = [x for x in HIST.get(key, []) if x[0] != KDATUM] + [rad]
    HIST[key] = sorted(h)[-120:]
HISTFIL.write_text(json.dumps(HIST, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(UT / "prishistorik.js").write_text("// Genereras av kalla/build.py – lägsta faktiska månadskostnad per modell och dag\nconst PRISHIST = "
    + json.dumps({k: [[d, v] for d, v, *_ in h] for k, h in HIST.items() if k in MOD}, separators=(",", ":")) + ";\n", encoding="utf-8")

# ---------- Skriv ut ----------
for fil, text in sidor.items():
    (UT / fil).write_text(text, encoding="utf-8")
shutil.copy(HIT / "stil.css", UT / "stil.css")
shutil.copy(HIT / "app.js", UT / "app.js")

ovriga = ["om-oss.html", "villkor.html", "integritetspolicy.html"]
prio = {"index.html": "1.0", "alla-bilar.html": "0.9", "kampanjer.html": "0.9", "marken.html": "0.7", "guide.html": "0.6", "fragor.html": "0.6"}
rader = []
for fil in list(sidor) + ovriga:
    loc = DOMAN + ("" if fil == "index.html" else fil)
    p = prio.get(fil, "0.8" if fil.startswith("privatleasing-") else "0.2")
    rader.append(f"  <url><loc>{loc}</loc><lastmod>{DATUM}</lastmod><priority>{p}</priority></url>")
(UT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rader) + "\n</urlset>\n", encoding="utf-8")
print(len(sidor), "sidor byggda:", ", ".join(sidor))
