"""Hämtar alla nya bilar med privatleasingpris från Hedin Automotive (sidans egen inbäddade data).  python3 skord_hedin.py hedin.json"""
import re, json, subprocess, sys, time, urllib.parse
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
B = "https://hedinautomotive.se/bilar/kop-bil/alla-bilar"
def page(u):
    for f in range(3):
        s = subprocess.run(["curl", "-sL", "-m", "90", "-A", UA, u], capture_output=True, text=True).stdout
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', s, re.S)
        if m:
            d = json.loads(m.group(1))
            for k, v in d["props"]["pageProps"]["componentProps"].items():
                if isinstance(v, dict) and "dehydratedState" in v:
                    for q in v["dehydratedState"]["queries"]:
                        if q["queryKey"][0] == "cars": return q["state"]["data"]["pages"][0]
        time.sleep(3)
    return None
p0 = page(B + "?car_condition=Ny")
marken = next(f["value"] for f in p0["facet"] if f.get("name") == "car_brand>car_model" or (f["value"] and f["value"][0].get("key") == "car_brand"))
ut, sedda = [], set()
for m in marken:
    n = m["count"]; u = f"{B}?car_condition=Ny&car_brand={urllib.parse.quote(m['text'])}&page={max(0, (n - 1) // 48)}"
    pg = page(u)
    if not pg: print(m["text"], "MISSLYCKADES", flush=True); continue
    pl = 0
    for c in pg["content"]:
        o = c.get("car_private_leasing_option")
        if not o or c["car_id"] in sedda or c.get("car_vehicle_type_code") != "PC": continue
        sedda.add(c["car_id"]); pl += 1
        ut.append({k: c.get(k) for k in ("slug", "car_id", "car_brand", "car_model", "car_model_text", "car_fuel", "car_year", "car_condition", "car_mileage_text", "car_site_city", "car_price_text", "car_body", "elbilspremie_leasing", "car_is_factory_vehicle")} | {"pl": {k: o.get(k) for k in ("monthly_cost", "start_fee", "invoice_fee", "months", "mileage", "sales_text", "disclaimer", "is_campaign")}})
    print(m["text"], n, "hämtade", len(pg["content"]), "av", pg["total_items"], "med PL", pl, flush=True)
    json.dump(ut, open(sys.argv[1], "w"), ensure_ascii=False); time.sleep(0.5)
print("KLAR", len(ut))
