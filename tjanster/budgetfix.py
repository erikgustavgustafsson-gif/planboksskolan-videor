"""Budgetfix – gör en personlig budget och sparplan som PDF från kundens formulärsvar.

Användning:  python3 budgetfix.py kund.json  ->  Budgetfix_<namn>.pdf
"""
import json, sys, math, datetime as dt
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, KeepTogether, Flowable)
from reportlab.lib.styles import ParagraphStyle

L = "/usr/share/fonts/truetype/liberation/"
pdfmetrics.registerFont(TTFont("Sans", L + "LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Sans-B", L + "LiberationSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Sans-I", L + "LiberationSans-Italic.ttf"))
pdfmetrics.registerFont(TTFont("Sans-BI", L + "LiberationSans-BoldItalic.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Sans", normal="Sans", bold="Sans-B", italic="Sans-I", boldItalic="Sans-BI")

NAVY = colors.HexColor("#1F3A5F")
TEAL = colors.HexColor("#2A9D8F")
LIGHT = colors.HexColor("#EAF4F3")
SAND = colors.HexColor("#FFF6E0")
GREY = colors.HexColor("#667085")
LINE = colors.HexColor("#D0D5DD")
RED = colors.HexColor("#C0392B")

S = {
    "h1": ParagraphStyle("h1", fontName="Sans-B", fontSize=26, leading=31, textColor=NAVY),
    "h2": ParagraphStyle("h2", fontName="Sans-B", fontSize=16, leading=20, textColor=TEAL, spaceBefore=6, spaceAfter=8),
    "body": ParagraphStyle("b", fontName="Sans", fontSize=10.5, leading=15, textColor=colors.HexColor("#222222")),
    "small": ParagraphStyle("s", fontName="Sans-I", fontSize=8.5, leading=11.5, textColor=GREY),
    "lead": ParagraphStyle("l", fontName="Sans", fontSize=12, leading=17, textColor=GREY),
    "cell": ParagraphStyle("c", fontName="Sans", fontSize=10, leading=13),
    "cellb": ParagraphStyle("cb", fontName="Sans-B", fontSize=10, leading=13),
}

MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti",
          "september", "oktober", "november", "december"]

def kr(v):
    s = f"{abs(round(v)):,}".replace(",", " ")
    return ("−" if v < 0 else "") + s + " kr"

# --------------------------------------------------------------------- beräkning
# Riktmärken (andel av nettolönen) för rörliga kategorier – tumregler, inte regler.
TAK = {"Mat": 0.13, "Nöje och restaurang": 0.08, "Shopping och kläder": 0.06,
       "Transport": 0.08, "Abonnemang och streaming": 0.03, "Övrigt": 0.04}
FASTA = {"Boende", "Räkningar och försäkringar", "Lån och avbetalningar"}

def plan(k):
    lon = k["lon"]
    utg = k["utgifter"]
    ny = {}
    for cat, v in utg.items():
        if cat in FASTA or cat not in TAK:
            ny[cat] = v
        else:
            ny[cat] = min(v, round(lon * TAK[cat] / 50) * 50)
    idag_spar = lon - sum(utg.values())
    ny_utg = sum(ny.values())
    fritt_spar = lon - ny_utg                      # det som kan sparas med ny budget
    kvar_mal = max(0, k["mal_belopp"] - k.get("redan_sparat", 0))
    behov = kvar_mal / k["mal_manader"] if k.get("mal_manader") else 0
    buff_mal = 3 * sum(v for c, v in ny.items() if c in FASTA or c in ("Mat", "Transport"))
    buff_gap = max(0, buff_mal - k.get("buffert", 0))
    till_mal = 0 if kvar_mal == 0 else (min(fritt_spar, behov) if behov else fritt_spar * 0.6)
    rest = max(0, fritt_spar - till_mal)
    till_buff = min(rest * 0.7, buff_gap) if buff_gap else 0
    till_lang = rest - till_buff
    man = math.ceil(kvar_mal / till_mal) if till_mal > 0 else None
    klar = None
    if man:
        d = dt.date.today()
        mm_ = d.month - 1 + man
        klar = f"{MONTHS[mm_ % 12]} {d.year + mm_ // 12}"
    atg = sorted(((c, utg[c] - ny[c]) for c in utg if utg[c] - ny[c] > 0), key=lambda x: -x[1])
    return dict(ny=ny, idag_spar=idag_spar, fritt_spar=fritt_spar, kvar_mal=kvar_mal, behov=behov,
                till_mal=till_mal, till_buff=till_buff, till_lang=till_lang, buff_mal=buff_mal,
                buff_gap=buff_gap, man=man, klar=klar, atg=atg, rimligt=(behov <= fritt_spar or not behov))

# --------------------------------------------------------------------- grafik
class Bar(Flowable):
    def __init__(self, frac, w=170 * mm, h=9 * mm, col=TEAL):
        super().__init__(); self.frac, self.w, self.h, self.col = max(0, min(1, frac)), w, h, col
    def wrap(self, *a): return self.w, self.h
    def draw(self):
        c = self.canv
        c.setFillColor(colors.HexColor("#E2E8F0")); c.roundRect(0, 0, self.w, self.h, self.h / 2, stroke=0, fill=1)
        if self.frac * self.w > self.h:
            c.setFillColor(self.col); c.roundRect(0, 0, self.frac * self.w, self.h, self.h / 2, stroke=0, fill=1)

class Stats(Flowable):
    """Tre stora nyckeltal i rutor."""
    def __init__(self, items, w=170 * mm, h=30 * mm):
        super().__init__(); self.items, self.w, self.h = items, w, h
    def wrap(self, *a): return self.w, self.h
    def draw(self):
        c = self.canv; n = len(self.items); gap = 5 * mm
        bw = (self.w - gap * (n - 1)) / n
        for i, (lab, val, col) in enumerate(self.items):
            x = i * (bw + gap)
            c.setFillColor(col); c.roundRect(x, 0, bw, self.h, 4 * mm, stroke=0, fill=1)
            c.setFillColor(colors.white)
            c.setFont("Sans", 9.5); c.drawString(x + 5 * mm, self.h - 9 * mm, lab)
            fs = 19
            while fs > 10 and c.stringWidth(val, "Sans-B", fs) > bw - 10 * mm: fs -= 0.5
            c.setFont("Sans-B", fs); c.drawString(x + 5 * mm, 7 * mm, val)

def page_deco(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(TEAL); canvas.rect(0, A4[1] - 6 * mm, A4[0], 6 * mm, stroke=0, fill=1)
    canvas.setFont("Sans-B", 9); canvas.setFillColor(NAVY)
    canvas.drawString(20 * mm, 12 * mm, "Plånboksskolan · Budgetfix")
    canvas.setFont("Sans", 9); canvas.setFillColor(GREY)
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"Sida {doc.page}")
    canvas.restoreState()

def table(rows, widths, header=True, total_last=False, red_col=None):
    t = Table(rows, colWidths=widths)
    st = [("FONT", (0, 0), (-1, -1), "Sans", 10), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
          ("ALIGN", (1, 0), (-1, -1), "RIGHT"), ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
          ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]
    if header:
        st += [("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
               ("FONT", (0, 0), (-1, 0), "Sans-B", 10)]
    if total_last:
        st += [("BACKGROUND", (0, -1), (-1, -1), LIGHT), ("FONT", (0, -1), (-1, -1), "Sans-B", 10)]
    if red_col is not None:
        for r in range(1, len(rows)):
            v = rows[r][red_col]
            if isinstance(v, str) and v.startswith("−"):
                st.append(("TEXTCOLOR", (red_col, r), (red_col, r), TEAL))
                st.append(("FONT", (red_col, r), (red_col, r), "Sans-B", 10))
    t.setStyle(TableStyle(st))
    return t

# --------------------------------------------------------------------- rapport
def build(k, out):
    p = plan(k)
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                          topMargin=20 * mm, bottomMargin=22 * mm,
                          title=f"Budgetfix – {k['namn']}", author="Plånboksskolan")
    doc.addPageTemplates([PageTemplate("p", [Frame(20 * mm, 22 * mm, 170 * mm, A4[1] - 44 * mm, id="f")], onPage=page_deco)])
    s = []
    namn = k["namn"]

    # Sida 1 – sammanfattning
    s += [Paragraph(f"Din Budgetfix, {namn}", S["h1"]), Spacer(1, 4),
          Paragraph(f"Personlig budget och sparplan · {dt.date.today().strftime('%Y-%m-%d')}", S["lead"]), Spacer(1, 16)]
    s.append(Stats([("Din lön efter skatt", kr(k["lon"]), NAVY),
                    ("Spara till målet varje månad", kr(p["till_mal"]), TEAL),
                    ("Du når målet", (p["klar"] or "–").capitalize(), colors.HexColor("#E76F51"))]))
    s += [Spacer(1, 18), Paragraph("Sammanfattning", S["h2"])]
    sparbar = p["fritt_spar"] - p["idag_spar"]
    punkter = [
        f"Idag blir det <b>{kr(p['idag_spar'])}</b> över varje månad. Med din nya budget blir det <b>{kr(p['fritt_spar'])}</b> – "
        f"alltså <b>{kr(sparbar)} mer</b> i månaden, eller <b>{kr(sparbar * 12)} per år</b>.",
        f"Ditt mål <b>{k['mal_namn']}</b> ({kr(k['mal_belopp'])}) når du genom att lägga undan <b>{kr(p['till_mal'])}</b> i månaden"
        + (f", klart i <b>{p['klar']}</b>." if p["klar"] else "."),
    ]
    if p["buff_gap"] > 0:
        punkter.append(f"Bygg också en buffert för oväntade utgifter. Målet är cirka <b>{kr(p['buff_mal'])}</b> "
                       f"(tre månaders nödvändiga utgifter). Lägg <b>{kr(p['till_buff'])}</b> i månaden på ett separat sparkonto.")
    else:
        punkter.append("Din buffert är redan på en bra nivå – snyggt! Fortsätt låta den ligga orörd.")
    if not p["rimligt"]:
        punkter.append(f"<font color='#C0392B'><b>Obs:</b> målet på {k['mal_manader']} månader kräver {kr(p['behov'])} i månaden, "
                       f"mer än budgeten klarar. Med planen nedan tar det i stället cirka {p['man']} månader.</font>")
    for t in punkter:
        s += [Paragraph("•&nbsp;&nbsp;" + t, S["body"]), Spacer(1, 7)]
    if k.get("kommentar"):
        s += [Spacer(1, 8), Paragraph("Personlig kommentar", S["h2"])]
        box = Table([[Paragraph(k["kommentar"], S["body"])]], colWidths=[170 * mm])
        box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SAND), ("LEFTPADDING", (0, 0), (-1, -1), 12),
                                 ("RIGHTPADDING", (0, 0), (-1, -1), 12), ("TOPPADDING", (0, 0), (-1, -1), 10),
                                 ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
        s.append(box)
    s.append(PageBreak())

    # Sida 2 – ny budget
    s += [Paragraph("Din nya budget", S["h2"]),
          Paragraph("Så här ser dina utgifter ut idag jämfört med budgeten vi föreslår. Fasta kostnader som hyra lämnas orörda.", S["body"]),
          Spacer(1, 10)]
    rows = [["Kategori", "Idag", "Ny budget", "Skillnad"]]
    for cat, v in k["utgifter"].items():
        rows.append([cat, kr(v), kr(p["ny"][cat]), kr(p["ny"][cat] - v) if p["ny"][cat] != v else "–"])
    rows.append(["Summa utgifter", kr(sum(k["utgifter"].values())), kr(sum(p["ny"].values())),
                 kr(sum(p["ny"].values()) - sum(k["utgifter"].values()))])
    s.append(table(rows, [70 * mm, 33 * mm, 33 * mm, 34 * mm], total_last=True, red_col=3))
    s += [Spacer(1, 18), Paragraph("Så fördelas det som blir över", S["h2"])]
    rows = [["Vart pengarna går", "Per månad"],
            [f"Sparmål: {k['mal_namn']}", kr(p["till_mal"])],
            ["Buffert", kr(p["till_buff"])],
            ["Långsiktigt sparande", kr(p["till_lang"])],
            ["Totalt sparande", kr(p["till_mal"] + p["till_buff"] + p["till_lang"])]]
    s.append(table(rows, [120 * mm, 50 * mm], total_last=True))
    s += [Spacer(1, 6), Paragraph("Tips: Sätt upp automatiska överföringar dagen efter lönen, så sparar du innan du hinner spendera.", S["small"])]
    s.append(PageBreak())

    # Sida 3 – åtgärder + sparmål
    s.append(Paragraph("Dina tre viktigaste steg", S["h2"]))
    tips = {
        "Mat": "Planera veckans middagar och handla en gång i veckan med lista. Ta med lunch några dagar.",
        "Nöje och restaurang": "Bestäm en fast nöjesbudget och flytta den till ett eget kort eller konto vid lönen.",
        "Shopping och kläder": "Inför en 48-timmarsregel: vänta två dygn innan du köper något som inte är nödvändigt.",
        "Transport": "Se över pendlingen – månadskort, samåkning eller cykel några dagar i veckan.",
        "Abonnemang och streaming": "Gå igenom alla abonnemang och behåll bara de du faktiskt använt senaste månaden.",
        "Övrigt": "Skriv upp småköp i en vecka – de är ofta större än man tror.",
    }
    steg = p["atg"][:3]
    if not steg:
        steg = [("Automatisera", 0)]
    for i, (cat, diff) in enumerate(steg, 1):
        txt = tips.get(cat, "Sätt upp automatiska överföringar till sparandet direkt när lönen kommer.")
        head = f"{i}. {cat}" + (f" – spara {kr(diff)} i månaden" if diff else "")
        blk = Table([[Paragraph(f"<b>{head}</b>", S["body"])], [Paragraph(txt, S["body"])]], colWidths=[170 * mm])
        blk.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT), ("LEFTPADDING", (0, 0), (-1, -1), 12),
                                 ("TOPPADDING", (0, 0), (-1, 0), 10), ("BOTTOMPADDING", (0, -1), (-1, -1), 10)]))
        s += [blk, Spacer(1, 8)]

    s += [Spacer(1, 10), Paragraph(f"Ditt sparmål: {k['mal_namn']}", S["h2"])]
    redan = k.get("redan_sparat", 0)
    s += [Paragraph(f"Du har {kr(redan)} av {kr(k['mal_belopp'])} idag.", S["body"]), Spacer(1, 6),
          Bar(redan / k["mal_belopp"] if k["mal_belopp"] else 0), Spacer(1, 10)]
    if p["till_mal"] > 0:
        steps = [3, 6, max(1, p["man"] or 1)] if (p["man"] or 0) > 6 else [max(1, (p["man"] or 1) // 2), p["man"] or 1]
        rows = [["Efter", "Sparat", "Kvar"]]
        for m_ in steps:
            sp = min(k["mal_belopp"], redan + p["till_mal"] * m_)
            rows.append([f"{m_} månader", kr(sp), kr(max(0, k['mal_belopp'] - sp))])
        s.append(table(rows, [60 * mm, 55 * mm, 55 * mm]))
    s += [Spacer(1, 26),
          Paragraph("Budgetfix är budget- och sparcoachning och inte finansiell rådgivning. Vi ger inga råd om enskilda "
                    "fonder, aktier, lån eller försäkringar. Siffrorna bygger på uppgifterna du lämnat och vanliga tumregler.",
                    S["small"])]
    doc.build(s)
    return p

if __name__ == "__main__":
    k = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2] if len(sys.argv) > 2 else f"Budgetfix_{k['namn']}.pdf"
    p = build(k, out)
    print(out, {x: round(p[x]) if isinstance(p[x], (int, float)) else p[x] for x in ("idag_spar", "fritt_spar", "till_mal", "till_buff", "till_lang", "man", "klar")})
