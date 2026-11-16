# kontakt.tsv (från skord_kontakt.py) -> kalla/saljare.json  {säljare: {tel, visa, epost}}. Befintliga rader behålls.
# Bara kanaler som handlaren själv visar i annonsen. Automatiska inläsningsadresser (mailparser m.fl.) tas bort.
import json, re, sys
UT = sys.argv[2] if len(sys.argv) > 2 else "../kalla/saljare.json"
SKRAP = re.compile(r"(mailparser\.io|scancloud|bosbec|bilwebform|leadparser|crm\.)", re.I)
TRE = {"010", "011", "013", "016", "018", "019", "020", "021", "023", "026", "031", "033", "035", "036", "040", "042", "044", "046", "054", "060", "063", "090"}
def tel(t):
    d = re.sub(r"[^\d+]", "", re.sub(r"(?i)[a-zåäö]+:", "", t or ""))
    if d.startswith("+46"): d = "0" + d[3:]
    if d.startswith("0046"): d = "0" + d[4:]
    return d if re.fullmatch(r"0\d{6,10}", d) else None
def visa(t):
    if not t: return None
    r = "08" if t.startswith("08") else (t[:3] if t[:3] in TRE else t[:4]); s = t[len(r):]
    g = {8: [3, 3, 2], 7: [3, 2, 2], 6: [2, 2, 2], 5: [3, 2], 4: [2, 2]}.get(len(s), [len(s)]); o, i = [], 0
    for x in g: o.append(s[i:i + x]); i += x
    return r + "-" + " ".join(o)
try: d = json.load(open(UT, encoding="utf-8"))
except FileNotFoundError: d = {}
for rad in open(sys.argv[1] if len(sys.argv) > 1 else "kontakt.tsv", encoding="utf-8"):
    k, t, e, namn, url = (rad.rstrip("\n").split("\t") + [""] * 5)[:5]
    if not k or namn in ("FEL", "SAKNAS"): continue
    t = tel(t); e = (e or "").strip().lower() or None
    if e and (SKRAP.search(e) or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[a-z]{2,}", e)): e = None
    if t or e: d[k] = {"tel": t, "visa": visa(t), "epost": e}
json.dump(d, open(UT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
print(len(d), "säljare i", UT)
