#!/usr/bin/env python3
"""Plånboksskolan – 3 TikTok videos, drawn with PIL, piped to ffmpeg per scene."""
import math, os, subprocess, sys
from functools import lru_cache
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)

FD = "/usr/share/fonts/opentype/inter/InterDisplay-"
NAVY = (22, 33, 58)
NAVY2 = (31, 46, 80)
DARK = (27, 34, 56)
YEL = (247, 197, 72)
GREEN = (72, 170, 122)
MINTTXT = (124, 205, 166)
RED = (226, 76, 76)
WHITE = (255, 255, 255)
GREY = (90, 100, 120)


@lru_cache(None)
def font(size, w="Black"):
    return ImageFont.truetype(FD + w + ".otf", size)


# ---------------------------------------------------------------- backgrounds
def grad(top, bot):
    a = np.linspace(0, 1, H)[:, None, None]
    arr = (np.array(top)[None, None, :] * (1 - a) + np.array(bot)[None, None, :] * a)
    arr = np.repeat(arr, W, axis=1).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


BG_NAVY = grad((20, 30, 54), (34, 50, 86))
BG_MINT = grad((236, 246, 239), (204, 231, 214))
# soft decorative circles on mint
_d = ImageDraw.Draw(BG_MINT, "RGBA")
_d.ellipse((-220, 1250, 380, 1850), fill=(150, 205, 175, 60))
_d.ellipse((760, 180, 1300, 720), fill=(255, 255, 255, 90))
_d = ImageDraw.Draw(BG_NAVY, "RGBA")
_d.ellipse((700, -200, 1400, 500), fill=(255, 255, 255, 10))
_d.ellipse((-300, 1300, 400, 2000), fill=(255, 255, 255, 8))


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, start, dur=0.35):
    return clamp((t - start) / dur)


def ease_out(p):
    return 1 - (1 - p) ** 3


def ease_back(p):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2


# ---------------------------------------------------------------- text layers
@lru_cache(None)
def text_layer(txt, size, color, w="Black", stroke=0, stroke_col=DARK, shadow=True, max_w=940):
    f = font(size, w)
    while f.getlength(txt) + 2 * stroke > max_w and size > 20:
        size -= 2
        f = font(size, w)
    bbox = f.getbbox(txt, stroke_width=stroke)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = stroke + 16
    img = Image.new("RGBA", (tw + 2 * pad, th + 2 * pad + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ox, oy = pad - bbox[0], pad - bbox[1]
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((ox, oy + 7), txt, font=f, fill=(0, 0, 0, 90),
                                stroke_width=stroke, stroke_fill=(0, 0, 0, 90))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(5)))
        d = ImageDraw.Draw(img)
    d.text((ox, oy), txt, font=f, fill=color, stroke_width=stroke, stroke_fill=stroke_col)
    return img


def paste(base, layer, cx, cy, scale=1.0, alpha=1.0, rot=0):
    if alpha <= 0.001 or scale <= 0.01:
        return
    L = layer
    if rot:
        L = L.rotate(rot, resample=Image.BICUBIC, expand=True)
    if abs(scale - 1) > 0.005:
        L = L.resize((max(1, int(L.width * scale)), max(1, int(L.height * scale))), Image.BICUBIC)
    if alpha < 0.999:
        a = L.getchannel("A").point(lambda v: int(v * alpha))
        L = L.copy()
        L.putalpha(a)
    base.alpha_composite(L, (int(cx - L.width / 2), int(cy - L.height / 2)))


def T(base, t, start, txt, size, color, cy, cx=W / 2, mode="pop", **kw):
    """Animated text. mode: pop | up | fade"""
    p = prog(t, start, 0.4)
    if p <= 0:
        return
    L = text_layer(txt, size, color, **kw)
    if mode == "pop":
        paste(base, L, cx, cy, scale=0.4 + 0.6 * ease_back(p), alpha=clamp(p * 3))
    elif mode == "up":
        paste(base, L, cx, cy + 60 * (1 - ease_out(p)), alpha=ease_out(p))
    else:
        paste(base, L, cx, cy, alpha=ease_out(p))


def ytxt(base, t, start, txt, size, cy, mode="pop", **kw):
    """Signature yellow text with dark outline."""
    T(base, t, start, txt, size, YEL, cy, mode=mode, stroke=max(4, size // 14), **kw)


def rrect(d, box, r, fill, outline=None, width=0):
    d.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)


def card(base, t, start, y, h, num, title, sub, accent=YEL):
    p = prog(t, start, 0.45)
    if p <= 0:
        return
    e = ease_out(p)
    layer = Image.new("RGBA", (920, h + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rrect(d, (6, 10, 914, h + 10), 34, (0, 0, 0, 40))
    rrect(d, (0, 0, 908, h), 34, (255, 255, 255, 255))
    d.ellipse((34, h / 2 - 50, 134, h / 2 + 50), fill=NAVY)
    nf = font(60)
    d.text((84, h / 2), str(num), font=nf, fill=accent, anchor="mm")
    tf = font(52, "ExtraBold")
    sf = font(40, "SemiBold")
    d.text((170, h / 2 - 30), title, font=tf, fill=DARK, anchor="lm")
    d.text((170, h / 2 + 34), sub, font=sf, fill=GREY, anchor="lm")
    paste(base, layer, W / 2 + 300 * (1 - e), y, alpha=e)


def badge(base):
    L = badge_layer()
    paste(base, L, W / 2, 190)


@lru_cache(None)
def badge_layer():
    f = font(34)
    txt = "PLÅNBOKSSKOLAN"
    tw = f.getlength(txt)
    img = Image.new("RGBA", (int(tw) + 80, 76), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rrect(d, (0, 0, img.width - 1, 75), 38, YEL)
    d.text((img.width / 2, 38), txt, font=f, fill=DARK, anchor="mm")
    return img


def follow_cta(base, t, start):
    T(base, t, start, "Följ @planboksskolan", 56, WHITE, 1300, mode="up", w="ExtraBold")
    T(base, t, start + 0.3, "Ny lektion varje dag", 44, MINTTXT, 1385, mode="up", w="SemiBold")


# ---------------------------------------------------------------- icons
def price_tag(base, cx, cy, txt, label, txt_col=DARK, shake=0.0, scale=1.0):
    tag = Image.new("RGBA", (700, 380), (0, 0, 0, 0))
    d = ImageDraw.Draw(tag)
    pts = [(120, 20), (680, 20), (680, 360), (120, 360), (10, 190)]
    sh = [(x + 8, y + 12) for x, y in pts]
    d.polygon(sh, fill=(0, 0, 0, 45))
    d.polygon(pts, fill=WHITE, outline=DARK, width=8)
    d.ellipse((70, 165, 120, 215), fill=(205, 232, 216), outline=DARK, width=6)
    f = font(120)
    while f.getlength(txt) > 500:
        f = font(f.size - 6)
    d.text((410, 165), txt, font=f, fill=txt_col, anchor="mm")
    d.text((410, 290), label, font=font(42, "SemiBold"), fill=GREY, anchor="mm")
    rot = math.sin(shake * 40) * 6 * (1 if shake > 0 else 0)
    paste(base, tag, cx, cy, scale=scale, rot=rot)


def stamp(base, cx, cy, txt, p):
    if p <= 0:
        return
    L = text_layer(txt, 96, WHITE, stroke=0, shadow=False)
    box = Image.new("RGBA", (L.width + 60, L.height + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(box)
    rrect(d, (0, 0, box.width - 1, box.height - 1), 24, RED)
    box.alpha_composite(L, (30, 15))
    s = 2.2 - 1.2 * ease_out(p)
    paste(base, box, cx, cy, scale=s, alpha=clamp(p * 2), rot=-12)


def shield(base, cx, cy, s, alpha=1.0):
    img = Image.new("RGBA", (400, 460), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pts = [(200, 10), (380, 80), (370, 250), (200, 450), (30, 250), (20, 80)]
    d.polygon([(x + 8, y + 10) for x, y in pts], fill=(0, 0, 0, 40))
    d.polygon(pts, fill=NAVY)
    inner = [(200, 50), (345, 105), (337, 245), (200, 405), (63, 245), (55, 105)]
    d.polygon(inner, fill=GREEN)
    d.line([(125, 230), (185, 295), (290, 165)], fill=WHITE, width=34, joint="curve")
    paste(base, img, cx, cy, scale=s, alpha=alpha)


def gift(base, cx, cy, s, alpha=1.0):
    img = Image.new("RGBA", (440, 460), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rrect(d, (48, 190, 408, 450), 20, (0, 0, 0, 40))
    rrect(d, (40, 180, 400, 440), 20, RED)
    rrect(d, (20, 120, 420, 200), 18, (240, 96, 96))
    d.rectangle((195, 120, 245, 440), fill=YEL)
    d.ellipse((110, 40, 220, 130), outline=YEL, width=22)
    d.ellipse((220, 40, 330, 130), outline=YEL, width=22)
    d.ellipse((195, 95, 245, 140), fill=YEL)
    paste(base, img, cx, cy, scale=s, alpha=alpha)


def coin(d, cx, cy, r):
    d.ellipse((cx - r, cy - r + 8, cx + r, cy + r + 8), fill=(200, 140, 30))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=YEL, outline=(200, 140, 30), width=5)
    d.ellipse((cx - r * 0.6, cy - r * 0.6, cx + r * 0.6, cy + r * 0.6), outline=(230, 170, 50), width=4)


def bank_card(base, cx, cy, p, rate_txt, rate_col):
    if p <= 0:
        return
    img = Image.new("RGBA", (820, 460), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rrect(d, (12, 18, 812, 452), 40, (0, 0, 0, 45))
    rrect(d, (0, 0, 800, 440), 40, NAVY)
    rrect(d, (50, 60, 160, 140), 14, YEL)
    d.text((50, 190), "LÖNEKONTO", font=font(56), fill=WHITE)
    d.text((50, 290), "Ränta:", font=font(56, "SemiBold"), fill=(170, 185, 210))
    d.text((750, 330), rate_txt, font=font(130), fill=rate_col, anchor="rm")
    paste(base, img, cx, cy + 80 * (1 - ease_out(p)), alpha=ease_out(p))


# ---------------------------------------------------------------- scene engine
def render_scene(name, dur, bg, fn):
    n = int(round(dur * FPS))
    tmp = os.path.join(OUT, name + ".part.mp4")
    final = os.path.join(OUT, name + ".mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast",
           "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        t = i / FPS
        img = bg.convert("RGBA")
        fn(img, t)
        badge(img)
        pr.stdin.write(img.convert("RGB").tobytes())
    pr.stdin.close()
    if pr.wait() == 0:
        os.replace(tmp, final)
    else:
        sys.exit("ffmpeg failed: " + name)
    return final


def frame(bg, fn, t):
    img = bg.convert("RGBA")
    fn(img, t)
    badge(img)
    return img.convert("RGB")


def fmt(n):
    return f"{int(round(n)):,}".replace(",", " ")


# ================================================================= VIDEO 1: BLACK FRIDAY
def v1a(b, t):
    T(b, t, 0.0, "27 NOVEMBER", 50, WHITE, 640, w="ExtraBold")
    ytxt(b, t, 0.15, "BLACK FRIDAY", 150, 780)
    T(b, t, 0.9, "Butikerna har redan", 76, WHITE, 1010, mode="up", w="ExtraBold")
    ytxt(b, t, 1.2, "höjt priserna.", 92, 1110, mode="up")


def v1b(b, t):
    T(b, t, 0.0, "FÄLLAN", 110, DARK, 380)
    if t < 1.3:
        price_tag(b, W / 2, 800, "500 kr", "september", scale=0.5 + 0.5 * ease_back(prog(t, 0.1, 0.4)))
    elif t < 2.7:
        price_tag(b, W / 2, 800, "1 500 kr", "oktober", txt_col=RED, shake=max(0, 0.3 - (t - 1.3)))
        T(b, t, 1.4, "Priset höjs i smyg", 60, RED, 1080, mode="up", w="ExtraBold")
    else:
        price_tag(b, W / 2, 800, "750 kr", "Black Friday")
        stamp(b, 800, 610, "–50%", prog(t, 2.75, 0.35))
        T(b, t, 3.4, "…och sen ”sänks” det.", 64, DARK, 1080, mode="up", w="ExtraBold")
        T(b, t, 4.1, "Dyrare än i september!", 64, RED, 1170, mode="up", w="ExtraBold")


def v1c(b, t):
    ytxt(b, t, 0.0, "LAGEN SÄGER", 110, 430)
    T(b, t, 0.5, "Butiken måste visa", 66, WHITE, 610, mode="up", w="ExtraBold")
    T(b, t, 0.7, "lägsta priset från de", 66, WHITE, 695, mode="up", w="ExtraBold")
    T(b, t, 0.9, "senaste 30 dagarna.", 66, WHITE, 780, mode="up", w="ExtraBold")
    ytxt(b, t, 2.3, "MEN:", 110, 970)
    T(b, t, 2.8, "Höjs priset tidigare än", 66, WHITE, 1130, mode="up", w="ExtraBold")
    T(b, t, 3.0, "så är det helt lagligt.", 66, WHITE, 1215, mode="up", w="ExtraBold")


def v1d(b, t):
    T(b, t, 0.0, "GÖR SÅ HÄR", 110, DARK, 400)
    card(b, t, 0.5, 640, 210, 1, "Kolla prishistoriken", "minst 3 månader bakåt")
    card(b, t, 1.7, 890, 210, 2, "Bevaka priset nu", "Prisjakt eller PriceRunner")
    card(b, t, 2.9, 1140, 210, 3, "Köp bara det du", "ändå tänkte köpa")


def v1e(b, t):
    T(b, t, 0.0, "Spara videon", 96, WHITE, 760, w="ExtraBold")
    ytxt(b, t, 0.3, "INFÖR BLACK FRIDAY", 90, 880)
    follow_cta(b, t, 1.0)


V1 = [("v1a", 3.0, BG_NAVY, v1a), ("v1b", 5.5, BG_MINT, v1b), ("v1c", 5.0, BG_NAVY, v1c),
      ("v1d", 6.0, BG_MINT, v1d), ("v1e", 3.5, BG_NAVY, v1e)]


# ================================================================= VIDEO 2: LÖNEKONTOT
def v2a(b, t):
    ytxt(b, t, 0.0, "DIN BANK", 150, 680)
    T(b, t, 0.6, "tjänar pengar på", 84, WHITE, 850, mode="up", w="ExtraBold")
    ytxt(b, t, 1.1, "DINA PENGAR", 140, 1010)


def v2b(b, t):
    T(b, t, 0.0, "Har du sparpengar", 76, DARK, 400, mode="up", w="ExtraBold")
    T(b, t, 0.2, "på lönekontot?", 76, DARK, 490, mode="up", w="ExtraBold")
    p0 = prog(t, 0.7, 0.5)
    if t < 1.6:
        bank_card(b, W / 2, 820, p0, "…", WHITE)
    else:
        pr = ease_back(prog(t, 1.6, 0.4))
        bank_card(b, W / 2, 820, 1, "", RED)
        L = text_layer("0 %", 130, RED, shadow=False)
        paste(b, L, W / 2 + 220, 820 + 110 - 40, scale=0.4 + 0.6 * pr)
    T(b, t, 2.8, "Då lånar banken dem", 66, DARK, 1140, mode="up", w="ExtraBold")
    T(b, t, 3.0, "gratis av dig.", 72, RED, 1230, mode="up", w="Black")


def bar(b, x, y, w, h, frac, col):
    ov = Image.new("RGBA", b.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    rrect(d, (x, y, x + w, y + h), h // 2, (255, 255, 255, 40))
    if frac > 0.01:
        rrect(d, (x, y, x + max(h, int(w * frac)), y + h), h // 2, col)
    b.alpha_composite(ov)


def v2c(b, t):
    T(b, t, 0.0, "EXEMPEL", 56, MINTTXT, 380, w="ExtraBold")
    ytxt(b, t, 0.1, "50 000 kr i ett år", 96, 480)
    # row 1
    T(b, t, 0.6, "0 % ränta", 60, WHITE, 680, cx=330, mode="fade", w="ExtraBold")
    if t > 0.9:
        T(b, t, 0.9, "0 kr", 80, RED, 680, cx=820, mode="pop")
        bar(b, 90, 760, 900, 44, 0, RED)
    # row 2
    T(b, t, 1.8, "2 % ränta", 60, WHITE, 940, cx=330, mode="fade", w="ExtraBold")
    p = ease_out(prog(t, 2.1, 1.8))
    if t > 2.1:
        val = 1000 * p
        L = text_layer("+" + fmt(val) + " kr", 80, MINTTXT, shadow=True)
        paste(b, L, 820, 940)
        bar(b, 90, 1020, 900, 44, p, GREEN)
    T(b, t, 4.2, "Samma pengar. Bara ett annat konto.", 50, WHITE, 1200, mode="up", w="SemiBold")
    T(b, t, 4.4, "Räntor varierar – jämför själv.", 38, (160, 175, 200), 1290, mode="fade", w="Medium")


def v2d(b, t):
    p = ease_back(prog(t, 0.0, 0.5))
    shield(b, W / 2, 560, 0.3 + 0.5 * p, alpha=clamp(p * 2))
    T(b, t, 0.5, "Är det tryggt?", 80, DARK, 840, mode="up", w="Black")
    T(b, t, 1.2, "Insättningsgarantin skyddar", 56, DARK, 970, mode="up", w="ExtraBold")
    ytxt(b, t, 1.7, "1 150 000 kr", 130, 1100)
    T(b, t, 2.3, "per person och bank", 56, DARK, 1230, mode="up", w="ExtraBold")
    T(b, t, 3.2, "Kolla att banken finns hos Riksgälden", 40, GREY, 1330, mode="fade", w="SemiBold")


def v2e(b, t):
    T(b, t, 0.0, "Kolla din sparränta", 90, WHITE, 760, w="ExtraBold")
    ytxt(b, t, 0.3, "IDAG", 150, 900)
    follow_cta(b, t, 1.0)


V2 = [("v2a", 3.0, BG_NAVY, v2a), ("v2b", 4.5, BG_MINT, v2b), ("v2c", 6.0, BG_NAVY, v2c),
      ("v2d", 5.5, BG_MINT, v2d), ("v2e", 3.5, BG_NAVY, v2e)]


# ================================================================= VIDEO 3: JULKLAPP
def v3a(b, t):
    ytxt(b, t, 0.0, "JULKLAPPEN", 150, 680)
    T(b, t, 0.6, "som växer", 96, WHITE, 840, mode="up", w="ExtraBold")
    ytxt(b, t, 1.1, "i 18 år", 130, 990)


def v3b(b, t):
    p = ease_back(prog(t, 0.0, 0.5))
    gift(b, W / 2, 560, 0.3 + 0.45 * p, alpha=clamp(p * 2))
    T(b, t, 0.6, "Alla har ett eget", 66, DARK, 830, mode="up", w="ExtraBold")
    T(b, t, 0.8, "skattefritt belopp på ISK:", 66, DARK, 915, mode="up", w="ExtraBold")
    ytxt(b, t, 1.5, "300 000 kr", 150, 1060)
    pp = prog(t, 2.6, 0.4)
    if pp > 0:
        L = text_layer("ÄVEN BARN", 76, WHITE, shadow=False)
        box = Image.new("RGBA", (L.width + 70, L.height + 30), (0, 0, 0, 0))
        rrect(ImageDraw.Draw(box), (0, 0, box.width - 1, box.height - 1), 40, GREEN)
        box.alpha_composite(L, (35, 15))
        paste(b, box, W / 2, 1230, scale=0.4 + 0.6 * ease_back(pp), alpha=clamp(pp * 3))


def fv_curve(months):
    i = 1.07 ** (1 / 12) - 1
    return 500 * ((1 + i) ** months - 1) / i


def v3c(b, t):
    ytxt(b, t, 0.0, "500 kr i månaden", 100, 380)
    T(b, t, 0.3, "från födseln till 18 år", 56, WHITE, 480, mode="up", w="ExtraBold")
    # chart
    x0, y0, cw, ch = 110, 1130, 860, 520
    ov = Image.new("RGBA", b.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    pa = prog(t, 0.6, 0.3)
    if pa > 0:
        d.line([(x0, y0), (x0 + cw, y0)], fill=(255, 255, 255, int(80 * pa)), width=4)
    p = ease_out(prog(t, 0.9, 3.0))
    if p <= 0:
        b.alpha_composite(ov)
    maxv = fv_curve(216)
    if p > 0:
        m_end = int(216 * p)
        pts_fv, pts_in = [], []
        for m in range(0, m_end + 1, 2):
            x = x0 + cw * m / 216
            pts_fv.append((x, y0 - ch * fv_curve(m) / maxv))
            pts_in.append((x, y0 - ch * (500 * m) / maxv))
        if len(pts_fv) > 1:
            poly = pts_fv + [(pts_fv[-1][0], y0), (x0, y0)]
            d.polygon(poly, fill=(247, 197, 72, 60))
            d.line(pts_in, fill=(124, 205, 166, 255), width=10, joint="curve")
            d.line(pts_fv, fill=YEL, width=12, joint="curve")
            ex, ey = pts_fv[-1]
            d.ellipse((ex - 16, ey - 16, ex + 16, ey + 16), fill=YEL, outline=DARK, width=4)
        b.alpha_composite(ov)
        yr = int(18 * p)
        L = text_layer(f"{yr} år", 44, WHITE, w="ExtraBold", shadow=False)
        paste(b, L, x0 + cw * p, y0 + 45)
        cur_fv = fv_curve(216 * p)
        cur_in = 500 * 216 * p
        L1 = text_layer("Insatt: " + fmt(round(cur_in / 1000) * 1000) + " kr", 52, MINTTXT, w="ExtraBold")
        L2 = text_layer("Kan bli: ca " + fmt(round(cur_fv / 10000) * 10000 if p >= 1 else round(cur_fv / 1000) * 1000) + " kr", 64, YEL, stroke=5)
        paste(b, L1, W / 2, 1270)
        paste(b, L2, W / 2, 1360)
    T(b, t, 4.4, "Exempel: 7 % årlig avkastning. Ingen garanti.", 36, (160, 175, 200), 1450, mode="fade", w="Medium")


def v3d(b, t):
    T(b, t, 0.0, "TIPS INFÖR JUL", 100, DARK, 400)
    card(b, t, 0.4, 640, 210, 1, "Be släkten ge en slant", "i stället för fler prylar")
    card(b, t, 1.5, 890, 210, 2, "Öppna ett ISK", "i barnets namn")
    card(b, t, 2.6, 1140, 210, 3, "Starta ett månadsspar", "i en billig indexfond")


def v3e(b, t):
    T(b, t, 0.0, "Spara videon", 96, WHITE, 760, w="ExtraBold")
    ytxt(b, t, 0.3, "TILL JULHANDELN", 100, 880)
    follow_cta(b, t, 1.0)


V3 = [("v3a", 3.0, BG_NAVY, v3a), ("v3b", 5.0, BG_MINT, v3b), ("v3c", 6.5, BG_NAVY, v3c),
      ("v3d", 5.0, BG_MINT, v3d), ("v3e", 3.5, BG_NAVY, v3e)]


# ================================================================= VIDEO 4: USA-AKTIER AVGIFTER
def v4a(b, t):
    ytxt(b, t, 0.0, "AMERIKANSKA", 140, 640)
    ytxt(b, t, 0.3, "AKTIER", 170, 800)
    T(b, t, 2.1, "kostar mer än du tror", 80, WHITE, 980, mode="up", w="ExtraBold")


def chip(b, t, start, txt, cx, cy, col=GREEN):
    pp = prog(t, start, 0.4)
    if pp <= 0:
        return
    L = text_layer(txt, 60, WHITE, shadow=False, w="ExtraBold")
    box = Image.new("RGBA", (L.width + 60, L.height + 26), (0, 0, 0, 0))
    rrect(ImageDraw.Draw(box), (0, 0, box.width - 1, box.height - 1), 36, col)
    box.alpha_composite(L, (30, 13))
    paste(b, box, cx, cy, scale=0.4 + 0.6 * ease_back(pp), alpha=clamp(pp * 3))


def v4b(b, t):
    T(b, t, 0.0, "DOLD AVGIFT", 110, DARK, 400)
    T(b, t, 0.3, "Courtage", 80, GREY, 600, mode="up", w="ExtraBold")
    T(b, t, 5.2, "+ valutaväxling", 84, DARK, 720, mode="up", w="Black")
    ytxt(b, t, 6.7, "0,25 %", 190, 900)
    chip(b, t, 8.3, "vid köp", W / 2 - 190, 1110)
    chip(b, t, 9.3, "vid sälj", W / 2 + 190, 1110)


def v4c(b, t):
    T(b, t, 0.0, "EXEMPEL", 56, MINTTXT, 360, w="ExtraBold")
    ytxt(b, t, 0.1, "Köp för 10 000 kr", 96, 460)
    T(b, t, 0.5, "Avanza, Mini-klassen", 46, (170, 185, 210), 550, mode="fade", w="SemiBold")
    pc = prog(t, 4.4, 0.4)
    if pc > 0:
        e = ease_out(pc)
        card_ = Image.new("RGBA", (880, 560), (0, 0, 0, 0))
        d = ImageDraw.Draw(card_)
        rrect(d, (10, 14, 870, 554), 36, (0, 0, 0, 60))
        rrect(d, (0, 0, 860, 540), 36, WHITE)
        rows = [(4.7, "Courtage, köp", "25 kr"), (6.2, "Växling, köp", "25 kr"),
                (8.4, "Courtage, sälj", "25 kr"), (9.6, "Växling, sälj", "25 kr")]
        f1, f2 = font(50, "SemiBold"), font(54, "ExtraBold")
        for i, (st, a, v) in enumerate(rows):
            pr = prog(t, st, 0.3)
            if pr > 0:
                col = tuple(int(c) for c in DARK) + (int(255 * pr),)
                y = 70 + i * 90
                d.text((50, y), a, font=f1, fill=(90, 100, 120, int(255 * pr)), anchor="lm")
                d.text((810, y), v, font=f2, fill=col, anchor="rm")
        pt = prog(t, 10.8, 0.35)
        if pt > 0:
            d.line([(50, 420), (810, 420)], fill=(200, 205, 215), width=4)
            d.text((50, 480), "Totalt", font=font(62), fill=DARK, anchor="lm")
            d.text((810, 480), "100 kr", font=font(72), fill=RED, anchor="rm")
        paste(b, card_, W / 2, 900 + 60 * (1 - e), alpha=e)
    ytxt(b, t, 13.0, "Aktien måste upp 1 %", 84, 1290, mode="up")
    T(b, t, 15.0, "innan du ens går plus", 64, WHITE, 1390, mode="up", w="ExtraBold")


def v4d(b, t):
    T(b, t, 0.0, "Varje månad?", 96, DARK, 560, w="Black")
    p = ease_out(prog(t, 2.5, 1.2))
    if t > 2.5:
        L = text_layer(fmt(1200 * p) + " kr", 180, RED, stroke=10, stroke_col=DARK)
        paste(b, L, W / 2, 790)
    T(b, t, 3.8, "om året", 74, DARK, 960, mode="up", w="ExtraBold")
    T(b, t, 5.05, "Bara i avgifter.", 74, RED, 1090, mode="up", w="Black")


def v4e(b, t):
    T(b, t, 0.0, "SÅ SLIPPER DU", 100, DARK, 400)
    card(b, t, 1.4, 640, 210, 1, "Handla mer sällan", "och behåll längre")
    card(b, t, 4.4, 890, 210, 2, "Valutakonto", "Nordnet: 0,075 % i växling")
    card(b, t, 11.1, 1140, 210, 3, "Global indexfond", "courtagefri fondhandel")


def v4f(b, t):
    T(b, t, 0.3, "Hur ofta handlar du?", 84, WHITE, 740, w="ExtraBold")
    ytxt(b, t, 1.2, "SKRIV I KOMMENTARERNA", 76, 860)
    follow_cta(b, t, 2.6)


V4 = [("v4a", 4.0667, BG_NAVY, v4a), ("v4b", 10.5, BG_MINT, v4b), ("v4c", 17.0333, BG_NAVY, v4c),
      ("v4d", 6.7, BG_MINT, v4d), ("v4e", 15.7667, BG_MINT, v4e), ("v4f", 5.6333, BG_NAVY, v4f)]


# ================================================================= VIDEO 5: BETALA DIG SJÄLV FÖRST
def v5a(b, t):
    T(b, t, 0.0, "DÄRFÖR BLIR DU ALDRIG RIK", 56, WHITE, 560, w="ExtraBold")
    ytxt(b, t, 0.1, "SLUTA SPARA", 150, 700)
    T(b, t, 0.5, "det som blir över", 84, WHITE, 840, mode="up", w="ExtraBold")
    T(b, t, 1.6, "Det blir aldrig", 80, RED, 1020, mode="up", w="Black")
    T(b, t, 1.8, "något över.", 80, RED, 1110, mode="up", w="Black")


def v5b(b, t):
    T(b, t, 0.0, "SÅ GÖR DE FLESTA", 96, DARK, 400)
    card(b, t, 0.4, 640, 210, 1, "Räkningar", "hyra, el, mobil")
    card(b, t, 1.2, 890, 210, 2, "Mat & shopping", "nöjen, streaming, kaffe")
    card(b, t, 2.4, 1140, 210, 3, "Sparande", "det som blir över…", accent=RED)
    stamp(b, 840, 1060, "0 kr", prog(t, 3.2, 0.35))


def arrow(b, cx, y0, y1, p, col=YEL):
    if p <= 0:
        return
    ov = Image.new("RGBA", b.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    ye = y0 + (y1 - y0) * ease_out(p)
    d.line([(cx, y0), (cx, ye)], fill=col, width=14)
    if p > 0.6:
        d.polygon([(cx - 34, ye - 10), (cx + 34, ye - 10), (cx, ye + 36)], fill=col)
    b.alpha_composite(ov)


def v5c(b, t):
    ytxt(b, t, 0.0, "VÄND PÅ DET", 120, 400)
    T(b, t, 0.8, "Lönen kommer", 76, WHITE, 580, mode="up", w="ExtraBold")
    arrow(b, W / 2, 640, 760, prog(t, 1.4, 0.5))
    ytxt(b, t, 1.9, "10 % → sparkonto", 96, 850)
    T(b, t, 2.6, "automatiskt, samma dag", 56, MINTTXT, 950, mode="up", w="ExtraBold")
    chip(b, t, 4.6, "2 min i bankappen", W / 2, 1110, col=GREEN)


def v5d(b, t):
    T(b, t, 0.0, "Lön: 30 000 kr", 84, DARK, 520, w="Black")
    p = ease_out(prog(t, 0.6, 1.0))
    if t > 0.6:
        L = text_layer(fmt(3000 * p) + " kr/mån", 120, GREEN, stroke=8, stroke_col=DARK)
        paste(b, L, W / 2, 700)
    p2 = ease_out(prog(t, 2.2, 1.2))
    if t > 2.2:
        L = text_layer(fmt(36000 * p2) + " kr", 180, YEL, stroke=12, stroke_col=DARK)
        paste(b, L, W / 2, 930)
        T(b, t, 2.4, "om året", 74, DARK, 1100, mode="up", w="ExtraBold")


def v5e(b, t):
    T(b, t, 0.0, "Betala dig själv", 96, WHITE, 640, w="ExtraBold")
    ytxt(b, t, 0.3, "FÖRST.", 190, 800)
    T(b, t, 1.0, "Inte sist.", 80, WHITE, 960, mode="up", w="ExtraBold")
    follow_cta(b, t, 1.8)


V5 = [("v5a", 3.5, BG_NAVY, v5a), ("v5b", 5.0, BG_MINT, v5b), ("v5c", 7.5, BG_NAVY, v5c),
      ("v5d", 4.5, BG_MINT, v5d), ("v5e", 4.0, BG_NAVY, v5e)]

VIDEOS = {"1_black_friday_fallan": V1, "2_lonekontot": V2, "3_julklapp_isk_barn": V3}


def build(name, scenes):
    files = [render_scene(n, d, bg, fn) for n, d, bg, fn in scenes]
    lst = os.path.join(OUT, name + ".txt")
    with open(lst, "w") as f:
        for p in files:
            f.write(f"file '{p}'\n")
    joined = os.path.join(OUT, name + "_v.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", joined], check=True)
    final = os.path.join(OUT, f"plånboksskolan_{name}.mp4")
    tmp = final.replace(".mp4", ".part.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", joined, "-f", "lavfi", "-i",
                    "anullsrc=r=44100:cl=stereo", "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-c:a", "aac", "-shortest", "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, final)
    print("done", final)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        # key frames for inspection
        shots = [("v1b", V1[1], 4.8), ("v1d", V1[3], 5.0), ("v2c", V2[2], 5.5), ("v2d", V2[3], 5.0),
                 ("v3c", V3[2], 6.0), ("v3b", V3[1], 4.0), ("v1a", V1[0], 2.5), ("v3d", V3[3], 4.5)]
        for nm, (n, d, bg, fn), t in shots:
            frame(bg, fn, t).save(os.path.join(OUT, f"prev_{nm}.jpg"), quality=85)
        print("previews ok")
    else:
        for name, sc in VIDEOS.items():
            build(name, sc)
