# Snabb hämtning: val.tsv (nyckel|filnamn på Commons|fotograf[|licens]) -> kand/<nyckel>_<n>.jpg, 4 parallellt via curl.
# Tumnagelns adress räknas ut ur filnamnet (md5), så Commons API behövs inte härifrån.
import hashlib, os, subprocess, sys, urllib.parse
from concurrent.futures import ThreadPoolExecutor
UA = "JamforPrivatleasing-bildverktyg/1.0 (https://jamforprivatleasing.se; kontakt@jamforprivatleasing.se)"
KORT = {"A": ("Alexander Migl", "CC BY-SA 4.0"), "B": ("Alexander-93", "CC BY-SA 4.0"), "M": ("M 93", "CC BY-SA 3.0 de")}
def rader(fil="val.tsv"):
    n = {}
    for r in open(fil, encoding="utf-8"):
        d = r.rstrip("\n").split("|")
        if len(d) < 3: continue
        k, t = d[0], d[1]; av, lic = KORT.get(d[2], (d[2], d[3] if len(d) > 3 else "CC BY-SA 4.0"))
        if len(d) > 3: lic = d[3]
        i = n.get(k, 0); n[k] = i + 1
        yield {"k": k, "i": i, "t": t, "av": av, "lic": lic}
def url(t, w=960):
    namn = t.replace(" ", "_"); h = hashlib.md5(namn.encode()).hexdigest(); q = urllib.parse.quote(namn)
    return f"https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/{w}px-{q}"
def ladda(r):
    f = f"kand/{r['k']}_{r['i']}.jpg"
    if os.path.exists(f) and os.path.getsize(f) > 20000: return f, "fanns"
    for forsok in range(4):
        p = subprocess.run(["curl", "-sS", "-L", "-A", UA, "--retry", "3", "--retry-delay", "8", "-o", f, "-w", "%{http_code}", url(r["t"])], capture_output=True, text=True)
        if p.stdout == "200" and os.path.getsize(f) > 20000: return f, "ok"
        if p.stdout == "404": break
    if os.path.exists(f): os.remove(f)
    return f, "FEL " + p.stdout
if __name__ == "__main__":
    os.makedirs("kand", exist_ok=True)
    with ThreadPoolExecutor(4) as ex: res = list(ex.map(ladda, rader(*sys.argv[1:2])))
    fel = [x for x in res if x[1].startswith("FEL")]
    print(len(res) - len(fel), "hämtade,", len(fel), "fel", fel)
