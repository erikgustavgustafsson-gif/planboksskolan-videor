# Lägger in valda bilder på sajten: python3 lagg_in.py '{"c10":"Leapmotor|C10", ...}'  (nyckel -> "Märke|Modell" som i app.js)
import json, re, shutil, sys, urllib.parse
val = json.load(open("val.json")); namn = json.loads(sys.argv[1])
p = "/home/claude/kalla/app.js"; s = open(p, encoding="utf-8").read()
m = re.search(r"const FOTOALIAS = (\{.*?\});", s); A = json.loads(m.group(1)); A.update({v: k for k, v in namn.items()})
s = s.replace(m.group(0), "const FOTOALIAS = " + json.dumps(A, ensure_ascii=False) + ";")
for k in namn:
    v = val[k]; s = re.sub(rf"      {k}: \{{ av: .*\n", "", s)
    s = s.replace("    const FOTON = {\n", f'    const FOTON = {{\n      {k}: {{ av: {json.dumps(v["av"], ensure_ascii=False)}, lic: "{v["lic"]}", fil: "{urllib.parse.quote(v["t"].replace(" ", "_"))}" }},\n', 1)
    m = re.search(r"const FRILAGDA = new Set\(\[(.*?)\]\);", s)
    if f'"{k}"' not in m.group(1): s = s.replace(m.group(1), m.group(1) + f', "{k}"')
    shutil.copy(f"studio/{k}.jpg", f"/home/claude/site/bilder/{k}.jpg")
    for b in (480, 960):
        import os; f = f"/home/claude/site/bilder/{k}-{b}.webp"
        if os.path.exists(f): os.remove(f)          # byggs om av build.py
open(p, "w", encoding="utf-8").write(s); print(len(namn), "inlagda")
