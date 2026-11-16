# Gör genomskinliga bilbilder: beskär till bilen, samma storlek och placering för alla, sparar -960 och -480 som WebP med alfa.
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage
UT = "/home/claude/site/bilder"
def gor(k, png=None):
    im = Image.open(png or f"alfa/ut/{k}.png").convert("RGBA"); a = np.array(im)[:, :, 3]
    lab, n = ndimage.label(a > 100)
    if n > 1:   # behåll bara bilen (största biten) och sådant som ligger inuti den
        stor = ndimage.sum(a > 100, lab, range(1, n + 1)); hv = int(np.argmax(stor)) + 1
        ys, xs = np.where(lab == hv); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        beh = np.zeros_like(a, bool)
        for i in range(1, n + 1):
            yy, xx = np.where(lab == i)
            if i == hv or (xx.min() >= x0 and xx.max() <= x1 and yy.min() >= y0 and yy.max() <= y1): beh |= lab == i
        beh = ndimage.binary_dilation(beh, iterations=2); arr = np.array(im); arr[:, :, 3] = np.where(beh, arr[:, :, 3], 0); im = Image.fromarray(arr)
    car = im.crop(im.split()[3].point(lambda v: 255 if v > 30 else 0).getbbox())
    W, H = 960, 600
    s = min(W * 0.88 / car.width, H * 0.76 / car.height)
    car = car.resize((max(1, round(car.width * s)), max(1, round(car.height * s))), Image.LANCZOS)
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0)); c.alpha_composite(car, ((W - car.width) // 2, int(H * 0.9) - car.height))
    c.save(f"{UT}/{k}-960.webp", quality=80, alpha_quality=70, method=6)
    c.resize((480, 300), Image.LANCZOS).save(f"{UT}/{k}-480.webp", quality=80, alpha_quality=70, method=6)
if __name__ == "__main__":
    ok = 0
    for k in sys.argv[1:]:
        if os.path.exists(f"alfa/ut/{k}.png"): gor(k); ok += 1
    print(ok, "klara")
