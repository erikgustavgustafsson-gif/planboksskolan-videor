"""Investeringsfix – personlig startguide för att investera (utbildning, inte rådgivning).

Användning: python3 investeringsfix.py kund.json [ut.pdf]
Inga namngivna fonder, aktier eller andra instrument nämns som lämpliga för kunden.
"""
import json, sys, math, datetime as dt
sys.path.insert(0, __import__("os").path.dirname(__file__))
from budgetfix import (S, NAVY, TEAL, LIGHT, SAND, GREY, LINE, RED, kr, Stats, Bar, table, A4, mm, colors,
                       Paragraph, Spacer, Table, TableStyle, PageBreak, BaseDocTemplate, PageTemplate, Frame, ParagraphStyle)

ORANGE = colors.HexColor("#E76F51")

# Fakta som rapporten bygger på – uppdatera när reglerna ändras.
ISK_FRITT = 300_000          # skattefri nivå ISK + KF, 2026 (Skatteverket)
ISK_SKATT = 0.01065          # skatt på belopp över gränsen, inkomstår 2026 (Skatteverket)
KALLA_ISK = "Skatteverket: Skatt på investeringssparkonto (inkomstår 2026)"

HORISONT = {"Mindre än 2 år": 1.5, "2–5 år": 3.5, "5–10 år": 7.5, "Mer än 10 år": 15}

def deco(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY); canvas.rect(0, A4[1] - 6 * mm, A4[0], 6 * mm, stroke=0, fill=1)
    canvas.setFont("Sans-B", 9); canvas.setFillColor(NAVY)
    canvas.drawString(20 * mm, 12 * mm, "Plånboksskolan · Investeringsfix")
    canvas.setFont("Sans", 9); canvas.setFillColor(GREY)
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"Sida {doc.page}")
    canvas.restoreState()

def box(paras, bg=LIGHT):
    t = Table([[p] for p in paras], colWidths=[170 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg), ("LEFTPADDING", (0, 0), (-1, -1), 12),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 12), ("TOPPADDING", (0, 0), (-1, 0), 10),
                           ("BOTTOMPADDING", (0, -1), (-1, -1), 10)]))
    return t

def fv(monthly, years, r):
    """Slutvärde av månadssparande med årlig avkastning r (räkneexempel)."""
    n = int(round(years * 12)); i = r / 12
    return monthly * n if i == 0 else monthly * ((1 + i) ** n - 1) / i

def calc(k):
    lon, over = k["lon"], k["over_per_manad"]
    utg = max(0, lon - over)
    buff_mal = 3 * utg
    buff_gap = max(0, buff_mal - k.get("buffert", 0))
    dyr = k.get("dyra_krediter", 0)
    # förslag på fördelning av överskottet (budget, inte instrument)
    if dyr > 0:
        till_kredit = round(over * 0.5 / 50) * 50
    else:
        till_kredit = 0
    rest = over - till_kredit
    till_buff = min(rest * 0.5, buff_gap / 6) if buff_gap > 0 else 0
    till_buff = round(till_buff / 50) * 50
    kan_investera = max(0, over - till_kredit - till_buff)
    vill = k.get("vill_investera_per_manad", 0)
    man_belopp = min(vill, kan_investera) if vill else kan_investera
    ar = HORISONT.get(k.get("horisont", "5–10 år"), 7.5)
    # avgiftsexempel: 6 % före avgift, avgift 0,2 % vs 1,5 %
    years = max(ar, 5)
    lag = fv(man_belopp, years, 0.06 - 0.002)
    hog = fv(man_belopp, years, 0.06 - 0.015)
    ink = k.get("engangsbelopp", 0) + man_belopp * 12
    return dict(utg=utg, buff_mal=buff_mal, buff_gap=buff_gap, dyr=dyr, till_kredit=till_kredit,
                till_buff=till_buff, kan_investera=kan_investera, man_belopp=man_belopp, ar=ar,
                ex_years=years, ex_lag=lag, ex_hog=hog, ex_diff=lag - hog, ett_ar=ink)

def build(k, out):
    p = calc(k)
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm,
                          bottomMargin=22 * mm, title=f"Investeringsfix – {k['namn']}", author="Plånboksskolan")
    doc.addPageTemplates([PageTemplate("p", [Frame(20 * mm, 22 * mm, 170 * mm, A4[1] - 44 * mm)], onPage=deco)])
    s = []
    b = S["body"]

    # ---------------- Sida 1: startläge
    s += [Paragraph(f"Din Investeringsfix, {k['namn']}", S["h1"]), Spacer(1, 4),
          Paragraph(f"Personlig startguide för att börja investera · {dt.date.today().isoformat()}", S["lead"]),
          Spacer(1, 16)]
    s.append(Stats([("Blir över varje månad", kr(k["over_per_manad"]), NAVY),
                    ("Utrymme att investera / mån", kr(p["kan_investera"]), TEAL),
                    ("Din tidshorisont", k.get("horisont", "–"), ORANGE)]))
    s += [Spacer(1, 16), Paragraph("1. Är du redo att investera?", S["h2"])]
    rader = []
    ok_buff = p["buff_gap"] == 0
    rader.append(("Buffert", f"{'Klart. ' if ok_buff else 'Att göra. '}Målet är cirka {kr(p['buff_mal'])} (tre månaders utgifter). "
                  + ("Du har en buffert på plats." if ok_buff else f"Du har {kr(k.get('buffert', 0))} – det saknas {kr(p['buff_gap'])}.")))
    if p["dyr"] > 0:
        rader.append(("Dyra krediter", f"Att göra. Du har {kr(p['dyr'])} i lån eller krediter med hög ränta. Att betala av dem ger "
                      "en säker \"avkastning\" lika stor som räntan – det är svårt att slå på börsen."))
    else:
        rader.append(("Dyra krediter", "Klart. Inga dyra lån eller krediter – bra utgångsläge."))
    if p["buff_gap"] > 0 and k.get("engangsbelopp", 0) > 0:
        rader.append(("Engångsbeloppet", f"Du har {kr(k['engangsbelopp'])} att sätta in direkt. Fundera på att låta en del "
                      "fylla bufferten först – då slipper du sälja investeringar om något oväntat händer."))
    for lab, txt in rader:
        s += [Paragraph(f"<b>{lab}:</b> {txt}", b), Spacer(1, 6)]
    s += [Spacer(1, 6), Paragraph("Så kan ditt överskott fördelas", S["h2"])]
    rows = [["Vart pengarna går", "Per månad"]]
    if p["till_kredit"]:
        rows.append(["Extra avbetalning på dyra krediter", kr(p["till_kredit"])])
    if p["till_buff"]:
        rows.append(["Buffert (tills den är full)", kr(p["till_buff"])])
    rows.append(["Utrymme att investera", kr(p["kan_investera"])])
    rows.append(["Summa", kr(k["over_per_manad"])])
    s.append(table(rows, [120 * mm, 50 * mm], total_last=True))
    if k.get("vill_investera_per_manad") and k["vill_investera_per_manad"] > p["kan_investera"]:
        s += [Spacer(1, 6), Paragraph(f"<font color='#C0392B'>Du ville investera {kr(k['vill_investera_per_manad'])} i månaden. "
              f"Med buffert och krediter först räcker det till {kr(p['kan_investera'])} just nu – det ökar när de är klara.</font>", b)]
    if k.get("kommentar"):
        s += [Spacer(1, 10), Paragraph("Personlig kommentar", S["h2"]), box([Paragraph(k["kommentar"], b)], SAND)]
    s.append(PageBreak())

    # ---------------- Sida 2: tid, risk, konto
    s += [Paragraph("2. Tid och risk – vad betyder det för dig?", S["h2"])]
    ar = p["ar"]
    if ar < 2:
        tid = ("Du har angett mindre än två år. En vanlig tumregel är att pengar som behövs inom ett par år inte hör hemma "
               "på börsen, eftersom värdet kan vara lägre just när du behöver dem. Ett sparkonto med insättningsgaranti "
               "är det vanliga alternativet för kortsiktiga pengar.")
    elif ar < 5:
        tid = ("Två till fem år är en ganska kort tid på börsen. Historiskt har det funnits perioder på flera år då "
               "börsen gått ner. Ju kortare tid, desto viktigare att du klarar en nedgång utan att behöva sälja.")
    else:
        tid = ("Med fem år eller mer har du tid att rida ut nedgångar. Historiskt har börsen gått upp över långa perioder, "
               "men det finns inga garantier och vissa år går den ner mycket.")
    s += [Paragraph(tid, b), Spacer(1, 10)]
    ned = p["ett_ar"] * 0.25
    reak = k.get("reaktion", "Vet inte")
    reak_txt = {
        "Säljer allt": "Du svarade att du skulle sälja. Det är den vanligaste orsaken till att sparare förlorar pengar: man säljer när det är som lägst. Börja hellre i liten skala så att du lär känna din egen reaktion.",
        "Väntar": "Du svarade att du skulle vänta. Det är ofta det som skiljer långsiktiga sparare från dem som förlorar pengar på panikförsäljningar.",
        "Köper mer": "Du svarade att du skulle köpa mer. Det kräver både is i magen och en buffert så att du aldrig tvingas sälja.",
    }.get(reak, "Du var osäker – det är helt normalt. Tänk igenom det innan du börjar, eftersom det påverkar hur du bör sprida riskerna.")
    s += [box([Paragraph(f"<b>Räkneexempel:</b> Om du investerar {kr(p['ett_ar'])} under första året och börsen faller 25 % "
                         f"är det ungefär <b>{kr(ned)}</b> mindre på kontot. Nedgångar på den nivån har hänt flera gånger.", b),
                Spacer(1, 4), Paragraph(reak_txt, b)])]
    s += [Spacer(1, 14), Paragraph("3. Välj rätt kontoform", S["h2"])]
    rows = [["", "ISK", "Kapitalförsäkring", "Vanlig depå"],
            ["Skatt", "Schablonskatt", "Schablonskatt", "30 % på vinsten"],
            ["Deklarera affärer", "Nej", "Nej", "Ja"],
            ["Förluster dras av", "Nej", "Nej", "Ja"],
            ["Passar ofta", "De flesta", "Vissa specialfall", "Den som vill kvitta förluster"]]
    t = Table(rows, colWidths=[42 * mm, 40 * mm, 44 * mm, 44 * mm])
    t.setStyle(TableStyle([("FONT", (0, 0), (-1, -1), "Sans", 9.5), ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                           ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONT", (0, 0), (-1, 0), "Sans-B", 9.5),
                           ("FONT", (0, 1), (0, -1), "Sans-B", 9.5), ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    s += [t, Spacer(1, 8),
          Paragraph(f"<b>Skatten 2026:</b> Sparande upp till {kr(ISK_FRITT)} på ISK och kapitalförsäkring tillsammans är "
                    f"skattefritt. På det som överstiger betalar du {str(ISK_SKATT * 100).replace('.', ',')} % av värdet per år. "
                    "Nivån för 2027 bestäms av statslåneräntan den 30 november.", b),
          Spacer(1, 4), Paragraph(f"Källa: {KALLA_ISK}", S["small"])]
    if "ISK" not in k.get("har_konto", []):
        s += [Spacer(1, 6), Paragraph("Du har inget ISK i dag. Det öppnar du på några minuter hos de flesta banker och "
                                      "nätmäklare med BankID. Jämför avgifterna för att köpa och sälja (courtage).", b)]
    s.append(PageBreak())

    # ---------------- Sida 3: avgifter och fonder
    s += [Paragraph("4. Avgifterna – den enda kostnad du kan styra", S["h2"]),
          Paragraph(f"Räkneexempel med ditt månadsbelopp på {kr(p['man_belopp'])} i {int(p['ex_years'])} år, om marknaden "
                    "ger 6 % per år före avgifter. Det är ett antagande för att visa skillnaden – ingen prognos.", b),
          Spacer(1, 8)]
    s.append(table([["Årlig avgift", "Ungefärligt värde efter " + str(int(p["ex_years"])) + " år"],
                    ["0,2 % per år", kr(round(p["ex_lag"], -2))],
                    ["1,5 % per år", kr(round(p["ex_hog"], -2))],
                    ["Skillnad", kr(round(p["ex_diff"], -2))]], [90 * mm, 80 * mm], total_last=True))
    s += [Spacer(1, 14), Paragraph("Så jämför du fonder", S["h2"])]
    for t_ in ["<b>Avgift:</b> titta på den årliga avgiften (förvaltningsavgift eller \"årlig avgift\"). Små skillnader blir stora över tid.",
               "<b>Index eller aktiv:</b> en indexfond följer marknaden till låg avgift. En aktiv fond försöker slå marknaden men kostar mer – och de flesta lyckas inte över lång tid.",
               "<b>Spridning:</b> hur många bolag, branscher och länder fonden äger. Mer spridning ger oftast mindre risk.",
               "<b>Risknivå:</b> varje fond har en riskindikator från 1 till 7 i sitt faktablad. Högre siffra = större svängningar.",
               "<b>Överlappning:</b> äger du flera fonder, kolla att de inte köper samma bolag – då blir spridningen sämre än du tror.",
               "<b>Faktabladet:</b> varje fond har ett faktablad (KID). Läs det innan du köper."]:
        s += [Paragraph("•&nbsp;&nbsp;" + t_, b), Spacer(1, 5)]
    s.append(PageBreak())

    # ---------------- Sida 4: bedöma en aktie
    s += [Paragraph("5. Så bedömer du om en aktie är värd att köpa", S["h2"]),
          Paragraph("Det här är frågorna proffsen ställer sig. Använd dem på varje bolag du funderar på – ingen enskild siffra räcker.", b),
          Spacer(1, 8)]
    checks = [
        ("Förstår du hur bolaget tjänar pengar?", "Kan du förklara affärsidén i två meningar? Om inte – vänta."),
        ("Växer försäljningen och vinsten?", "Titta på de senaste fem åren i årsredovisningen eller på börssajter. Jämn tillväxt är bättre än ett enstaka toppår."),
        ("Vad betalar du? (P/E-tal)", "P/E = aktiekurs delat med vinst per aktie. Jämför med bolag i samma bransch och med bolagets egen historik. Högt P/E betyder att marknaden redan räknar med mycket tillväxt."),
        ("Hur mycket skulder har bolaget?", "Mycket lån gör bolaget sårbart när räntorna stiger eller försäljningen minskar. Jämför nettoskulden med vinsten."),
        ("Genererar bolaget pengar på riktigt?", "Kassaflödet visar hur mycket kontanter som faktiskt kommer in. Vinst utan kassaflöde är en varningssignal."),
        ("Utdelning – hållbar eller för hög?", "Delar bolaget ut mer än det tjänar är utdelningen i fara."),
        ("Vad kan gå fel?", "Konkurrenter, regler, beroende av en enda kund eller produkt. Läs avsnittet om risker i årsredovisningen."),
        ("Hur stor del av dina pengar?", "En tumregel många använder är att ingen enskild aktie bör vara mer än en liten del av sparandet, så att ett ras inte förstör allt."),
    ]
    for i, (q, a) in enumerate(checks, 1):
        s += [box([Paragraph(f"<b>{i}. {q}</b>", b), Paragraph(a, b)]), Spacer(1, 6)]
    s += [Paragraph("Varningssignaler: tips om \"säkra\" vinster, stress att köpa nu, bolag du bara hört om i sociala medier, "
                    "och den som tjänar pengar på att du köper.", b)]
    s.append(PageBreak())

    # ---------------- Sida 5: plan
    s += [Paragraph("6. Din plan – steg för steg", S["h2"])]
    steg = []
    if p["dyr"] > 0:
        steg.append(("Betala av dyra krediter", f"Lägg {kr(p['till_kredit'])} extra i månaden tills de är borta."))
    if p["buff_gap"] > 0:
        steg.append(("Fyll bufferten", f"{kr(p['till_buff'])} i månaden till ett sparkonto tills du har cirka {kr(p['buff_mal'])}."))
    if "ISK" not in k.get("har_konto", []):
        steg.append(("Öppna ett ISK", "Jämför avgifter hos några banker och nätmäklare och öppna kontot med BankID."))
    steg += [("Bestäm ditt månadsbelopp", f"Utrymmet är {kr(p['kan_investera'])} i månaden. Börja gärna lägre och öka när det känns tryggt."),
             ("Automatisera", "Sätt upp ett månadssparande dagen efter lönen, så sker det utan att du behöver tänka."),
             ("Sprid riskerna", "Använd checklistorna på sidorna 3 och 4 innan du väljer vad du köper."),
             ("Följ upp en gång per år", "Titta på avgifter, fördelning och om dina mål ändrats. Undvik att kolla kursen varje dag.")]
    for i, (h, t_) in enumerate(steg, 1):
        s += [box([Paragraph(f"<b>Steg {i}: {h}</b>", b), Paragraph(t_, b)]), Spacer(1, 6)]
    s += [Spacer(1, 18), Paragraph(
        "Investeringsfix är utbildning och en personlig startguide. Den innehåller inga rekommendationer om enskilda fonder, "
        "aktier eller andra finansiella instrument och är inte investeringsrådgivning. Historisk avkastning är ingen garanti för "
        "framtida avkastning – pengar som placeras i fonder och aktier kan både öka och minska i värde, och du kan förlora hela "
        "beloppet. Alla beslut om vad du köper fattar du själv.", S["small"])]
    doc.build(s)
    return p

if __name__ == "__main__":
    k = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2] if len(sys.argv) > 2 else f"Investeringsfix_{k['namn']}.pdf"
    p = build(k, out)
    print(out, {x: round(v) if isinstance(v, float) else v for x, v in p.items()})
