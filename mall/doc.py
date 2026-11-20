#!/usr/bin/env python3
"""Plånboksskolan – documentary-style company video (Palantir first).

Clean, dark, cinematic: a glowing orb, a data network that wires itself up,
one clean value chart with a live counter, word-by-word subtitles, soft drone
and whooshes. Scenes: orb | network | chart | outro.

Usage: python3 mall/doc.py SPEC.json VOICE.mp3 OUT_DIR
"""
import datetime as dt, json, math, os, random, subprocess, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render as R  # noqa: E402
import engine as E  # noqa: E402
from render import text_layer, paste, ease_out, ease_back, prog, clamp, W, H, FPS, WHITE, DARK, YEL, RED, GREEN  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

random.seed(3)
BG_TOP, BG_BOT = (8, 12, 26), (18, 26, 52)
CYAN = (90, 200, 255)
SOFT = (170, 185, 215)


def kr(v):
    return f"{int(round(v, -2)):,}".replace(",", " ") + " kr"


def background():
    bg = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        u = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * u) for i in range(3)) + (255,))
    return bg


STARS = [(random.uniform(0, W), random.uniform(0, H), random.uniform(0.5, 2.2), random.uniform(0, 6.28)) for _ in range(140)]


def stars(d, t):
    for x, y, s, ph in STARS:
        a = int(60 + 60 * math.sin(ph + t * 1.5))
        yy = (y - t * 12 * s) % H
        d.ellipse([x - s, yy - s, x + s, yy + s], fill=(200, 220, 255, a))


def orb(img, t, cx, cy, r, glow=1.0, eye=0.0):
    """Glowing crystal sphere with swirling inner light; eye>0 morphs a pupil in."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for k in range(22, 0, -1):
        rr = r * (1 + k * 0.06)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=CYAN + (int(6 * glow),))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(18)))
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(14, 30, 60, 255), outline=CYAN + (220,), width=5)
    for j in range(7):
        ph = t * (0.8 + j * 0.15) + j
        pts = []
        for s in range(60):
            a = s / 59 * 2 * math.pi
            rr = r * (0.25 + 0.55 * (0.5 + 0.5 * math.sin(a * (2 + j % 3) + ph)))
            pts.append((cx + rr * math.cos(a + ph * 0.3), cy + rr * math.sin(a + ph * 0.3) * 0.85))
        d.line(pts + [pts[0]], fill=(120 + 15 * j, 210, 255, 90), width=3)
    if eye > 0:
        pr = r * 0.32 * eye
        d.ellipse([cx - r * 0.75, cy - r * 0.42 * eye, cx + r * 0.75, cy + r * 0.42 * eye], fill=(230, 245, 255, int(200 * eye)))
        d.ellipse([cx - pr, cy - pr, cx + pr, cy + pr], fill=(10, 20, 40, int(255 * eye)))
        d.ellipse([cx - pr * 0.35 + pr * 0.3, cy - pr * 0.35 - pr * 0.3, cx + pr * 0.35 + pr * 0.3, cy + pr * 0.35 - pr * 0.3],
                  fill=(255, 255, 255, int(220 * eye)))
    # highlight
    d.ellipse([cx - r * 0.55, cy - r * 0.75, cx - r * 0.05, cy - r * 0.45], fill=(255, 255, 255, 40))
    img.alpha_composite(lay)


NODES = [(random.uniform(110, 970), random.uniform(760, 1380)) for _ in range(46)]
EDGES = []
for i, a in enumerate(NODES):
    near = sorted(range(len(NODES)), key=lambda j: (NODES[j][0] - a[0]) ** 2 + (NODES[j][1] - a[1]) ** 2)[1:4]
    for j in near:
        if (j, i) not in EDGES:
            EDGES.append((i, j))
ORDER = sorted(range(len(NODES)), key=lambda i: (NODES[i][0] - 540) ** 2 + (NODES[i][1] - 1070) ** 2)
RANK = {n: k for k, n in enumerate(ORDER)}


def network(img, t, p):
    """p 0..1: how much of the network is wired up."""
    d = ImageDraw.Draw(img, "RGBA")
    shown = p * len(NODES)
    for i, j in EDGES:
        a = clamp(shown - max(RANK[i], RANK[j]))
        if a > 0:
            d.line([NODES[i], NODES[j]], fill=CYAN + (int(110 * a),), width=3)
            # travelling pulse
            u = (t * 0.7 + (i * 7 + j) * 0.13) % 1
            x = NODES[i][0] + (NODES[j][0] - NODES[i][0]) * u
            y = NODES[i][1] + (NODES[j][1] - NODES[i][1]) * u
            d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(220, 245, 255, int(200 * a)))
    for k, (x, y) in enumerate(NODES):
        a = clamp(shown - RANK[k])
        if a > 0:
            r = 7 + 3 * math.sin(t * 3 + k)
            d.ellipse([x - r - 6, y - r - 6, x + r + 6, y + r + 6], fill=CYAN + (int(50 * a),))
            d.ellipse([x - r, y - r, x + r, y + r], fill=(200, 240, 255, int(255 * a)))


def tag(img, t, start, txt, cx, cy, col=CYAN):
    if t < start:
        return
    a = ease_back(prog(t, start, 0.3))
    L = text_layer(txt, 46, DARK, w="Black", shadow=False)
    pad = 22
    b = Image.new("RGBA", (L.width + 2 * pad, L.height + 2 * pad - 10), (0, 0, 0, 0))
    ImageDraw.Draw(b).rounded_rectangle([0, 0, b.width - 1, b.height - 1], 26, fill=col + (255,))
    b.alpha_composite(L, (pad, pad - 6))
    paste(img, b, cx, cy, scale=a)


def make_audio(path, dur, whooshes):
    parts = [(f"aevalsrc=exprs='0.05*sin(2*PI*55*t)+0.035*sin(2*PI*82.4*t)+0.025*sin(2*PI*110*t+sin(t))':d={dur}:s=44100",
              f"afade=t=in:d=1.5,afade=t=out:st={max(0, dur-1.5)}:d=1.5")]
    for t in whooshes:
        ms = int(max(0, t) * 1000)
        parts.append(("anoisesrc=d=0.6:c=pink:a=0.35", f"highpass=f=500,lowpass=f=5000,afade=t=in:d=0.35,afade=t=out:st=0.35:d=0.25,adelay={ms}|{ms}"))
    inputs, filt = [], []
    for i, (src, fx) in enumerate(parts):
        inputs += ["-f", "lavfi", "-i", src]
        filt.append(f"[{i}:a]aformat=channel_layouts=mono:sample_rates=44100,{fx}[a{i}]")
    n = len(parts)
    mix = "".join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,apad,atrim=0:{dur}[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt) + ";" + mix,
                    "-map", "[out]", "-ar", "44100", "-ac", "1", path], check=True)


def build(spec, audio, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    scenes = spec["scenes"]
    cuts, adur = E.cuts_for(audio, [s["say"] for s in scenes])
    total = round((adur + 0.8) * FPS) / FPS
    bounds = [0.0] + cuts + [total]
    words = []
    for s, a, b in zip(scenes, bounds, bounds[1:]):
        words += E.word_times(audio, s["say"], a, b)
    groups = E.chunks(words, 3)
    gstart = [g[0][1] for g in groups]

    def word_t(word, after=0.0):
        for w, t in words:
            if t >= after and w.lower().strip(".,!?:").startswith(word.lower()):
                return t
        return after

    # chart data
    rows = [(a, float(b)) for a, b in (x.split(":") for x in spec["data"].split())]
    vals = [v for _, v in rows]
    dates = [d for d, _ in rows]
    n = len(vals)
    v0 = vals[0]

    def idx_of(key):
        k = dt.date.fromisoformat(key)
        return min(range(n), key=lambda i: abs((dt.date.fromisoformat(dates[i]) - k).days))

    ci = [i for i, s in enumerate(scenes) if s["kind"] == "chart"][0]
    ca, cb = bounds[ci], bounds[ci + 1]
    low, peak = idx_of(spec["low"]), idx_of(spec["peak"])
    t_low = word_t(spec.get("low_word", "tretusen"), ca)
    t_peak = word_t(spec.get("peak_word", "hundratusen"), ca)

    def chart_pos(t):
        def sm(u):
            u = clamp(u)
            return u * u * (3 - 2 * u)
        if t < t_low + 0.3:
            st = max(ca + 0.3, t_low - 1.3)
            return low * sm((t - st) / max(0.3, t_low + 0.3 - st))
        return low + (peak - low) * sm((t - t_low - 0.5) / max(0.4, t_peak + 0.5 - t_low - 0.5))

    def val_at(p):
        i = int(p)
        return vals[-1] if i >= n - 1 else vals[i] + (vals[i + 1] - vals[i]) * (p - i)

    bg = background()
    title = text_layer("PALANTIR", 120, WHITE, w="Black", stroke=0, shadow=True)
    founded = text_layer("GRUNDAT 2003", 40, SOFT, w="ExtraBold", shadow=False)
    foot = text_layer(spec.get("footnote", ""), 26, (120, 135, 165), w="Medium", shadow=False, max_w=1000)
    whooshes = [b - 0.25 for b in bounds[1:-1]]

    work = tempfile.mkdtemp(prefix="doc_")
    vid = os.path.join(work, "v.mp4")
    pr = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "17",
                           "-pix_fmt", "yuv420p", vid], stdin=subprocess.PIPE)
    vm = v0 * 1.5
    t_cia = word_t("CIA")
    t_ring = word_t("Sagan")
    for fi in range(int(round(total * FPS))):
        t = fi / FPS
        if fi == 0:
            t = max(t_cia + 0.4, 0.0)  # readable first frame
        si = max(i for i, a in enumerate(bounds[:-1]) if a <= t)
        a, b = bounds[si], bounds[si + 1]
        kind = scenes[si]["kind"]
        lt = t - a
        img = bg.copy()
        d = ImageDraw.Draw(img, "RGBA")
        stars(d, t)

        if kind == "orb":
            r = 250 * (0.85 + 0.15 * ease_out(prog(lt, 0, 1.2)))
            orb(img, t, W / 2, 1090, r, glow=1 + 0.6 * clamp(1 - abs(t - t_ring) / 0.8))
            paste(img, title, W / 2, 420, alpha=ease_out(prog(lt, 0, 0.4)))
            paste(img, founded, W / 2, 520, alpha=ease_out(prog(lt, 0.2, 0.4)))
            if t >= t_cia - 0.05:
                p = ease_back(prog(t, t_cia - 0.05, 0.25))
                L = text_layer("CIA", 210, RED, w="Black", stroke=14, stroke_col=DARK)
                paste(img, L, W / 2, 1090, scale=0.6 + 0.4 * p, alpha=clamp(1 - (t - t_ring + 0.2) / 0.3) if t > t_ring - 0.2 else 1)
                tag(img, t, t_cia + 0.25, "CIA:s riskkapitalbolag", W / 2, 1300, col=(240, 240, 240))
            tag(img, t, t_ring, "SAGAN OM RINGEN", W / 2, 760, col=YEL)

        elif kind == "network":
            network(img, t, ease_out(prog(lt, 0.0, (b - a) * 0.8)))
            paste(img, text_layer("DATA", 170, WHITE, w="Black", stroke=12, stroke_col=DARK), W / 2, 470,
                  alpha=ease_out(prog(lt, 0, 0.3)))
            tag(img, t, word_t("mönster", a), "hittar mönster", W / 2, 640, col=CYAN)
            tag(img, t, word_t("militärer", a), "MILITÄRER", 300, 1450, col=(240, 240, 240))
            tag(img, t, word_t("storföretag", a), "STORFÖRETAG", 760, 1450, col=YEL)

        elif kind == "chart":
            p = chart_pos(t)
            v = val_at(p)
            col = GREEN if v >= v0 else RED
            tgt = max(v0 * 1.5, max(vals[:int(p) + 1] + [v]) * 1.25)
            vm += (tgt - vm) * 0.12
            CL, CR, CT, CB = 80, 1000, 760, 1380
            X = lambda i: CL + (CR - CL) * i / (n - 1)
            Y = lambda val: CB - (CB - CT) * val / vm
            paste(img, text_layer("10 000 KR I PALANTIR · 2021", 46, SOFT, w="ExtraBold", shadow=False), W / 2, 330)
            paste(img, text_layer(kr(v), 180, col, stroke=12, stroke_col=DARK), W / 2, 480)
            if v > v0 * 1.05:
                paste(img, text_layer(f"×{v / v0:.1f}".replace(".", ","), 60, YEL, w="Black", stroke=6, stroke_col=DARK), W / 2, 610)
            elif v < v0 * 0.95:
                paste(img, text_layer(f"−{(1 - v / v0) * 100:.0f} %", 60, RED, w="Black", stroke=6, stroke_col=DARK), W / 2, 610)
            yb = Y(v0)
            for x in range(CL, CR, 28):
                d.line([(x, yb), (x + 14, yb)], fill=SOFT + (180,), width=3)
            k = int(p)
            pts = [(X(i), Y(vals[i])) for i in range(k + 1)] + [(X(p), Y(v))]
            if len(pts) >= 2:
                area = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                ImageDraw.Draw(area).polygon([(CL, CB)] + pts + [(pts[-1][0], CB)], fill=col + (50,))
                img.alpha_composite(area)
                gl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                ImageDraw.Draw(gl).line(pts, fill=col + (170,), width=22, joint="curve")
                img.alpha_composite(gl.filter(ImageFilter.GaussianBlur(10)))
                d = ImageDraw.Draw(img, "RGBA")
                d.line(pts, fill=col + (255,), width=8, joint="curve")
            dx, dy = X(p), Y(v)
            d.ellipse([dx - 14, dy - 14, dx + 14, dy + 14], fill=WHITE + (255,))
            d.ellipse([dx - 8, dy - 8, dx + 8, dy + 8], fill=col + (255,))
            paste(img, text_layer(dates[min(n - 1, int(round(p)))][:4], 40, WHITE, w="Black", stroke=5, stroke_col=DARK),
                  min(CR - 50, max(CL + 60, dx)), dy - 58)
            if p >= low - 0.01:
                tag(img, t, t_low + 0.2, "3 400 kr", max(CL + 110, X(low)), Y(vals[low]) + 80, col=RED)
            if p >= peak - 0.3:
                tag(img, t, t_peak + 0.3, "över 100 000 kr", min(CR - 190, X(peak)), max(CT - 10, Y(vals[peak]) - 80), col=GREEN)

        elif kind == "outro":
            eye = ease_out(prog(lt, 0.2, 0.8))
            orb(img, t, W / 2, 900, 210, eye=eye)
            paste(img, text_layer("VAD VET DE", 110, WHITE, w="Black", stroke=10, stroke_col=DARK), W / 2, 420,
                  alpha=ease_out(prog(lt, 0.1, 0.3)))
            paste(img, text_layer("OM OSS?", 140, YEL, w="Black", stroke=12, stroke_col=DARK), W / 2, 560,
                  alpha=ease_out(prog(lt, 0.3, 0.3)))
            tf = word_t("Följ", a)
            if t >= tf - 0.1:
                R.T(img, t, tf - 0.1, "Följ @planboksskolan", 66, WHITE, 1270, w="ExtraBold")
                R.T(img, t, tf + 0.1, "Inget köp- eller säljråd.", 42, SOFT, 1350, mode="up", w="Bold")

        # subtitles
        gi = max([i for i, s0 in enumerate(gstart) if s0 <= t + 0.04] or [-1])
        if gi >= 0 and t < total - 0.4:
            grp = groups[gi]
            f = R.font(84, "Black")
            gap = 30
            widths = [f.getlength(w_) + 22 + gap for w_, _ in grp]
            sc = min(1.0, 990 / max(1, sum(widths) - gap))
            size, gap = int(84 * sc), int(30 * sc)
            f = R.font(size, "Black")
            widths = [f.getlength(w_) + 22 * sc + gap for w_, _ in grp]
            x = W / 2 - (sum(widths) - gap) / 2
            popg = ease_back(prog(t, gstart[gi], 0.15))
            for j, ((w_, wt), ww) in enumerate(zip(grp, widths)):
                active = wt <= t + 0.04 and (j == len(grp) - 1 or grp[j + 1][1] > t + 0.04)
                Lw = text_layer(w_, size, YEL if active else WHITE, stroke=11, stroke_col=DARK)
                paste(img, Lw, x + (ww - gap) / 2, 1640, scale=0.9 + 0.1 * popg)
                x += ww
        paste(img, foot, W / 2, 1810, alpha=0.85)
        R.badge(img)

        # gentle push-in per scene + crossfade-in
        z = 1.0 + 0.04 * clamp(lt / max(0.1, b - a))
        zw, zh = int(W / z), int(H / z)
        img = img.crop(((W - zw) // 2, (H - zh) // 2, (W - zw) // 2 + zw, (H - zh) // 2 + zh)).resize((W, H), Image.BICUBIC)
        if si > 0 and lt < 0.2:
            img.alpha_composite(Image.new("RGBA", (W, H), (8, 12, 26, int(255 * (1 - lt / 0.2)))))
        pr.stdin.write(img.convert("RGB").tobytes())
    pr.stdin.close()
    if pr.wait() != 0:
        sys.exit("ffmpeg failed")
    bed = os.path.join(work, "bed.wav")
    make_audio(bed, total, whooshes)
    out = os.path.join(out_dir, spec["slug"] + ".mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", audio, "-i", bed, "-filter_complex",
                    "[1:a]apad[v];[v][2:a]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(total),
                    "-movflags", "+faststart", out], check=True)
    cover = E.make_cover(spec, os.path.join(out_dir, spec["slug"] + ".jpg"))
    print(json.dumps({"video": out, "cover": cover, "duration": total, "cuts": cuts}))


if __name__ == "__main__":
    build(json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3])
