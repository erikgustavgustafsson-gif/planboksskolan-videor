# Poängsätter friläggningarna, väljer bästa kandidat per modell, gör studiobild och ett översiktsblad.
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
import hamta
def analysera(f):
    a = np.array(Image.open(f).convert("RGBA"))[:, :, 3]; m = a > 128
    lab, n = ndimage.label(m)
    if n == 0: return None
    stor = ndimage.sum(m, lab, range(1, n + 1)); o = np.argsort(stor)[::-1]
    huvud = lab == o[0] + 1; ys, xs = np.where(huvud); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    h, w = m.shape
    kant = sum([x0 <= 2, x1 >= w - 3, y1 >= h - 3, y0 <= 2])
    andra = stor[o[1]] / stor[o[0]] if n > 1 else 0
    tack = huvud.sum() / ((x1 - x0 + 1) * (y1 - y0 + 1)); andel = huvud.sum() / m.size
    form = (x1 - x0 + 1) / (y1 - y0 + 1)              # 3/4 framifrån ≈ 1,6–2,3; rakt framifrån < 1,4; ren sida > 2,6
    p = 100 - kant * 40 - min(andra, .5) * 120 - max(0, .55 - tack) * 150 - max(0, .12 - andel) * 300 - max(0, 1.45 - form) * 60 - max(0, form - 2.5) * 40
    return {"p": round(float(p)), "kant": int(kant), "andra": round(float(andra), 2), "tack": round(float(tack), 2), "form": round(float(form), 2)}
def studio(png, ut, W=1200, H=750):
    im = Image.open(png).convert("RGBA"); a = np.array(im)[:, :, 3]
    lab, n = ndimage.label(a > 128)
    if n > 1:
        stor = ndimage.sum(a > 128, lab, range(1, n + 1)); hv = int(np.argmax(stor)) + 1
        ys, xs = np.where(lab == hv); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        beh = np.zeros_like(a, bool)
        for i in range(1, n + 1):
            yy, xx = np.where(lab == i)
            if i == hv or (xx.min() >= x0 and xx.max() <= x1 and yy.min() >= y0 - 10 and yy.max() <= y1): beh |= lab == i
        beh = ndimage.binary_dilation(beh, iterations=3); arr = np.array(im); arr[:, :, 3] = np.where(beh, arr[:, :, 3], 0); im = Image.fromarray(arr)
    car = im.crop(im.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox())
    s = min(W * 0.86 / car.width, H * 0.72 / car.height)
    car = car.resize((max(1, int(car.width * s)), max(1, int(car.height * s))), Image.LANCZOS)
    bg = Image.new("RGB", (W, H), (245, 247, 250))
    g = Image.linear_gradient("L").resize((W, H)).point(lambda v: int(v * 0.12))
    bg = Image.composite(Image.new("RGB", (W, H), (224, 229, 237)), bg, g)
    x = (W - car.width) // 2; y = int(H * 0.88) - car.height
    sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).ellipse([x + car.width * 0.05, y + car.height - 20, x + car.width * 0.95, y + car.height + 24], fill=130)
    bg = Image.composite(Image.new("RGB", (W, H), (150, 158, 170)), bg, sh.filter(ImageFilter.GaussianBlur(20)))
    bg.paste(car, (x, y), car); bg.save(ut, quality=86, optimize=True, progressive=True)
if __name__ == "__main__":
    tvinga = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}       # {"leaf": 1} = välj kandidat 1 för hand
    os.makedirs("studio", exist_ok=True); val = {}; alla = {}
    for r in hamta.rader():
        f = f"ut/{r['k']}_{r['i']}.png"
        if not os.path.exists(f): continue
        q = analysera(f)
        if not q: continue
        alla.setdefault(r["k"], []).append({**r, **q})
    for k, v in alla.items():
        b = next((x for x in v if x["i"] == tvinga.get(k)), None) or max(v, key=lambda x: x["p"] - x["i"] * 4)
        studio(f"ut/{k}_{b['i']}.png", f"studio/{k}.jpg"); val[k] = b
    json.dump(val, open("val.json", "w"), ensure_ascii=False, indent=1); json.dump(alla, open("poang.json", "w"), ensure_ascii=False)
    ks = sorted(val); n = 30
    for s in range(0, len(ks), n):
        blad = Image.new("RGB", (6 * 320, 5 * 220), "white"); d = ImageDraw.Draw(blad)
        for j, k in enumerate(ks[s:s + n]):
            t = Image.open(f"studio/{k}.jpg").resize((320, 200)); blad.paste(t, (j % 6 * 320, j // 6 * 220))
            d.text((j % 6 * 320 + 6, j // 6 * 220 + 202), f"{k} #{val[k]['i']} p{val[k]['p']}", fill=(200, 0, 0) if val[k]["p"] < 70 else (0, 0, 0))
        blad.save(f"blad{s // n}.jpg", quality=80)
    print(len(val), "valda;", "svaga:", [k for k in ks if val[k]["p"] < 70])
