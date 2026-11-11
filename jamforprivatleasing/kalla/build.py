#!/usr/bin/env python3
"""Bygger alla sidor för Jämföra Privatleasing.

Källfiler i den här mappen:
  original-index.html  – den gamla ensidiga versionen (här hämtas textblocken)
  stil.css, app.js     – gemensam stil och logik för alla sidor
  marken.json          – antal bilar och lägsta pris per märke (för texterna på märkessidorna)
Resultatet skrivs till ../site/.
"""
import json, re, shutil, unicodedata, html
from pathlib import Path

HIT = Path(__file__).parent
UT = HIT.parent / "site"
DOMAN = "https://jamforprivatleasing.se/"
DATUM = "2026-11-06"
ORIG = (HIT / "original-index.html").read_text(encoding="utf-8")
MARKEN = json.loads((HIT / "marken.json").read_text(encoding="utf-8"))


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

HERO = """<header class="hero foto">
    <div class="wrap herotext">
      <h1>Jämför privatleasing och hitta bästa kampanjen</h1>
      <p class="heroslogan">Alla märken. Alla avgifter. Ett pris.</p>
      <p class="heroingress">Vi jämför privatleasing på nya bilar hos alla stora märken – med alla avgifter inräknade och priser som kontrolleras varje dag.</p>
      <div class="heroknappar"><a class="knapp" href="kampanjer.html">Se kampanjerna</a><a class="knapp ljus" href="alla-bilar.html">Jämför alla bilar</a></div>
      <div class="trust" id="trust"></div>
    </div>
  </header>"""

MENY = [("index.html", "Start"), ("kampanjer.html", "Kampanjer"), ("alla-bilar.html", "Alla bilar"),
        ("marken.html", "Märken"), ("guide.html", "Guide"), ("fragor.html", "Frågor & svar")]


def sida(fil, titel, beskr, innehall, aktiv="", sida_typ="", marke="", ld=None, ogtitel=None, modell=""):
    url = DOMAN + ("" if fil == "index.html" else fil)
    graf = ld or []
    ldtext = json.dumps({"@context": "https://schema.org", "@graph": graf}, ensure_ascii=False) if graf else ""
    meny = "".join(f'<a href="{f}"{" class=\"aktiv\" aria-current=\"page\"" if f == aktiv else ""}>{html.escape(n)}</a>' for f, n in MENY)
    data = f' data-sida="{sida_typ}"' + (f' data-marke="{html.escape(marke)}"' if marke else "") + (f' data-modell="{modell}"' if modell else "")
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
      <div><b>Information</b><a href="om-oss.html">Om oss och kontakt</a><a href="integritetspolicy.html">Integritetspolicy</a><a href="villkor.html">Användarvillkor</a><a href="fragor.html">Frågor &amp; svar</a></div>
      <div><b>Företag</b><span id="fotforetag"></span></div>
    </div>
  </footer>
  <section class="wrap kallor" style="padding: 0 16px;">
    <details>
      <summary>Bildkällor</summary>
      <ul id="kallor"></ul>
    </details>
  </section>
  <footer>Jämföra Privatleasing · priser insamlade november 2026 · nybilspriser från Skatteverket · foton från Wikimedia Commons</footer>

  <script src="foretag.js"></script>
  <script src="konfig.js"></script>
  <script src="affiliate.js"></script>
  <script src="bildkalla.js"></script>
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
        <div class="chips" id="tillvalchips"><button type="button" class="vald" data-v="alla">Alla <small></small></button><button type="button" data-v="bygg">🛠 Välj alla tillval själv <small></small></button><button type="button" data-v="fardig">Färdiga erbjudanden <small></small></button></div>
        <small class="hjalp">🛠 = du väljer färg, motor och tillval med pris direkt här. Färdiga erbjudanden = bilen som handlaren har den, önskemål skickas med beställningen.</small>
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
    <button type="button" class="visamer" id="visaMer" hidden>Visa fler bilar</button>
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


sidor = {}
antal_bilar = sum(m["n"] for m in MARKEN.values())

# ---------- Startsidan ----------
sidor["index.html"] = sida(
    "index.html",
    "Jämför privatleasing 2026 – alla bilar, kampanjer och totalpris | Jämföra Privatleasing",
    f"Jämför privatleasing på {antal_bilar} nya bilar från {len(MARKEN)} märken. Vi räknar med alla avgifter, visar bästa kampanjerna och låter dig välja tillval och beställa direkt.",
    f"""
  {HERO}
  {TOPP.replace('</small>', '</small><p style="text-align:center;margin:18px 0 0"><a class="knapp" href="kampanjer.html">Se alla kampanjer →</a></p>', 1)}
  <section class="block">
    <div class="wrap">
      <h2>Hitta rätt bil snabbare</h2>
      <div class="genvagar">
        <a href="alla-bilar.html"><b>Alla bilar →</b><span>Filtrera på pris, märke och drivmedel.</span></a>
        <a href="kampanjer.html"><b>Kampanjer →</b><span>Bara erbjudanden med bra eller mycket bra pris.</span></a>
        <a href="guide.html"><b>Guide →</b><span>Så funkar privatleasing och vad som ingår.</span></a>
        <a href="fragor.html"><b>Frågor &amp; svar →</b><span>Övermil, ränta, försäkring och mer.</span></a>
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
    "Privatleasing kampanjer 2026 – bästa erbjudandena just nu | Jämföra Privatleasing",
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
    "Guide till privatleasing: så beställer du, vad som ingår i månadskostnaden och vad som tillkommer, som försäkring, fordonsskatt och övermil.",
    sidhuvud("Så funkar privatleasing", "Allt du behöver veta innan du leasar: hur du beställer, vad som ingår och vilka kostnader som tillkommer.", brod((None, "Guide")))
    + "\n  " + STEG + "\n  " + INGAR + f"\n  <div class=\"wrap\" style=\"padding:0 16px\">{INFOKORT}</div>"
    + '\n  <section class="block"><div class="wrap"><div class="genvagar"><a href="alla-bilar.html"><b>Jämför alla bilar →</b><span>Hitta rätt bil och pris.</span></a><a href="fragor.html"><b>Frågor &amp; svar →</b><span>Fler svar om privatleasing.</span></a></div></div></section>',
    aktiv="guide.html", sida_typ="guide", ld=[brod_ld(("guide.html", "Guide"))])

# ---------- Frågor & svar ----------
fragor = FRAGOR.replace('class="info" id="fragor"', 'class="info alla" id="fragor"')
fragor = re.sub(r'\s*<button type="button" id="visaFler">Visa fler frågor</button>', "", fragor).replace("<h2>Frågor &amp; svar</h2>", "")
faq = json.loads(FAQ_LD)
sidor["fragor.html"] = sida(
    "fragor.html",
    "Frågor och svar om privatleasing – övermil, ränta, försäkring | Jämföra Privatleasing",
    "Svar på vanliga frågor om privatleasing: vad ingår, är beställningen bindande, vad kostar övermil, kan månadskostnaden ändras och vilken försäkring krävs.",
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
        f"Privatleasing {marke} 2026 – {m['n']} {bilord} från {kr(m['min'])}/mån | Jämföra Privatleasing",
        f"Jämför privatleasing på {marke}: {m['n']} {bilord}, billigast från {kr(m['min'])}/mån ({marke} {m['mod']}). Alla avgifter inräknade, kontrollerat varje dag.",
        sidhuvud(f"Privatleasing {html.escape(marke)}",
                 f"{m['n']} {bilord} på {html.escape(marke)} – {typtext}. Billigast just nu: <b>{html.escape(marke)} {html.escape(m['mod'])}</b> från <b>{kr(m['min'])}/mån</b>. Vi räknar med alla avgifter på 36 månader.",
                 brod(("marken.html", "Märken"), (None, html.escape(marke))))
        + lista_html(f"Alla {html.escape(marke)}-erbjudanden", med_marke=False, ejbil=False)
        + MARKE_BLOCK.replace("Privatleasing per märke", "Andra märken"),
        aktiv="marken.html", sida_typ="marke", marke=marke,
        ld=[brod_ld(("marken.html", "Märken"), (fil, f"Privatleasing {marke}"))])

# ---------- En sida per modell: jämför handlare ----------
APPJS = (HIT / "app.js").read_text(encoding="utf-8")
MODELLNAMN = json.loads(re.search(r"const MODELLNAMN = (\{.*?\});", APPJS).group(1))
MODELLER = {}
for mm in re.finditer(r'^\s*B\("([^"]+)", "([^"]+)", (?:"([a-z0-9]+)"|null), "([^"]+)", (\d+),', APPJS, re.M):
    marke, modell, foto, driv, manad = mm.group(1), mm.group(2), mm.group(3), mm.group(4), int(mm.group(5))
    namn = MODELLNAMN.get(foto) or modell.split(" ")[0]
    g = MODELLER.setdefault(slug(marke + " " + namn), {"marke": marke, "namn": namn, "n": 0, "min": manad, "foto": foto})
    g["n"] += 1; g["min"] = min(g["min"], manad)
for key, g in sorted(MODELLER.items()):
    fil = f"privatleasing-{key}.html"
    assert fil not in sidor, fil
    marke, namn, hel = g["marke"], g["namn"], html.escape(f"{g['marke']} {g['namn']}")
    mfil = f"privatleasing-{slug(marke)}.html"
    bilord = "erbjudande" if g["n"] == 1 else "erbjudanden"
    sidor[fil] = sida(
        fil,
        f"Privatleasing {marke} {namn} 2026 – jämför {g['n']} {bilord} från {kr(g['min'])}/mån | Jämföra Privatleasing",
        f"Jämför privatleasing på {marke} {namn} hos olika handlare: {g['n']} {bilord} från {kr(g['min'])}/mån. Se pris per månad, per mil och totalt på 36 månader – alla avgifter inräknade.",
        sidhuvud(f"Privatleasing {hel}",
                 f"Jämför handlare och märkets egna priser på {hel}. Billigast överst – med alla avgifter inräknade.",
                 brod(("marken.html", "Märken"), (mfil, html.escape(marke)), (None, html.escape(namn))))
        + f"""
  <main class="wrap jmfsida" style="padding: 0 16px;">
    <div class="jmfbild" id="jmfbild"></div>
    <section id="jamfor"></section>
    <p class="jmfmer"><a href="{mfil}">Alla {html.escape(marke)}-erbjudanden →</a> · <a href="alla-bilar.html">Jämför alla bilar →</a></p>
    {VILLKOR}
  </main>""" + MARKE_BLOCK.replace("Privatleasing per märke", "Andra märken"),
        aktiv="marken.html", sida_typ="modell", marke=marke, modell=key,
        ld=[brod_ld(("marken.html", "Märken"), (mfil, f"Privatleasing {marke}"), (fil, f"{marke} {namn}"))])

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
