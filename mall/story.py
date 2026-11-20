#!/usr/bin/env python3
"""Plånboksskolan – "story chart" video: one continuous, self-drawing value chart
with a big live counter, callouts, punch-in zooms, word-by-word subtitles and SFX.

Usage:
    python3 mall/story.py SPEC.json VOICE.mp3 OUT_DIR

SPEC keys: slug, title, label (small line above the counter), data ("YYYY-MM-DD:value ..."),
start_value, scenes: [{say, to: "YYYY-MM-DD" (chart position reached at end of scene) or "end"/"hold",
callout: {date, text, color}, stamp: "×10", stamp_at: 0.6 (fraction of scene), cta: bool}],
footnote, cover.
"""
import json, math, os, subprocess, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render as R  # noqa: E402
import engine as E  # noqa: E402
from render import text_layer, paste, ease_out, ease_back, prog, clamp, W, H, FPS, WHITE, DARK, YEL, RED, GREEN  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

CL, CR, CT, CB = 70, 1010, 700, 1330          # chart box
GRID = (60, 75, 110)


def kr(v):
    return f"{int(round(v, -2)):,}".replace(",", " ") + " kr"


def sfx(path, dur, events):
    """Synthesise a light SFX track: whoosh at 0 and at each ('whoosh', t); bell at ('ding', t)."""
    parts = []
    for kind, t in events:
        if kind == "whoosh":
            parts.append(f"anoisesrc=d=0.45:c=pink:a=0.35,highpass=f=700,lowpass=f=5000,"
                         f"afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.2,adelay={int(t*1000)}|{int(t*1000)}")
        elif kind == "ding":
            parts.append(f"sine=f=1318:d=0.9,volume=0.25,afade=t=out:st=0.05:d=0.85,adelay={int(t*1000)}|{int(t*1000)}")
        elif kind == "pop":
            parts.append(f"sine=f=660:d=0.12,volume=0.3,afade=t=out:st=0.02:d=0.1,adelay={int(t*1000)}|{int(t*1000)}")
    inputs, filt = [], []
    for i, p in enumerate(parts):
        inputs += ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono" if False else p.split(",")[0]]
        filt.append(f"[{i}:a]{','.join(p.split(',')[1:])}[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{dur}[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt) + ";" + mix,
                    "-map", "[out]", "-ar", "44100", path], check=True)


def build(spec, audio, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    rows = [(a, float(b)) for a, b in (x.split(":") for x in spec["data"].split())]
    n = len(rows)
    dates = [d for d, _ in rows]
    vals = [v for _, v in rows]
    v0 = spec.get("start_value", vals[0])
    vmax = max(vals) * 1.12
    scenes = spec["scenes"]
    cuts, adur = E.cuts_for(audio, [s["say"] for s in scenes])
    total = round((adur + 0.6) * FPS) / FPS
    bounds = [0.0] + cuts + [total]

    def idx_of(key):
        if key in ("end",):
            return n - 1
        return min(range(n), key=lambda i: abs((__import__("datetime").date.fromisoformat(dates[i]) -
                                                __import__("datetime").date.fromisoformat(key)).days))

    # chart progress keyframes (time -> fractional index)
    keys, cur = [(0.0, 0.0)], 0.0
    for s, a, b in zip(scenes, bounds, bounds[1:]):
        to = s.get("to", "hold")
        if to == "hold":
            keys.append((b, cur))
        else:
            tgt = float(idx_of(to))
            lead = s.get("draw_from", 0.08)
            keys.append((a + (b - a) * lead, cur))
            keys.append((a + (b - a) * s.get("draw_until", 0.9), tgt))
            keys.append((b, tgt))
            cur = tgt

    def pos_at(t):
        for (t0, p0), (t1, p1) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                if t1 - t0 < 1e-6:
                    return p1
                u = (t - t0) / (t1 - t0)
                u = u * u * (3 - 2 * u)  # smoothstep
                return p0 + (p1 - p0) * u
        return keys[-1][1]

    def val_at(p):
        i = int(p)
        f = p - i
        if i >= n - 1:
            return vals[-1]
        return vals[i] + (vals[i + 1] - vals[i]) * f

    X = lambda i: CL + (CR - CL) * i / (n - 1)
    scale = {'vm': v0 * 1.5}
    Y = lambda v: CB - (CB - CT) * v / scale['vm']

    # word timings for subtitles
    words = []
    for s, a, b in zip(scenes, bounds, bounds[1:]):
        words += E.word_times(audio, s["say"], a, b)
    groups = E.chunks(words, 3)
    gstart = [g[0][1] for g in groups]

    # callouts / stamps with absolute times
    pops = []
    sfx_ev = [("whoosh", 0.0)]
    for i, (s, a, b) in enumerate(zip(scenes, bounds, bounds[1:])):
        if i > 0:
            sfx_ev.append(("whoosh", a - 0.15))
        c = s.get("callout")
        if c:
            ci = idx_of(c["date"])
            # appears when the line reaches it
            tt = next((t / FPS for t in range(int(a * FPS), int(b * FPS) + 1) if pos_at(t / FPS) >= ci - 0.01), b)
            pops.append(("callout", tt, ci, c))
            sfx_ev.append(("pop", tt))
        if s.get("stamp"):
            tt = a + (b - a) * s.get("stamp_at", 0.6)
            pops.append(("stamp", tt, s["stamp"], s.get("stamp_color", "green")))
            sfx_ev.append(("ding", tt))

    bg = R.BG_NAVY.convert("RGBA")
    fnt_year = R.font(44, "ExtraBold")
    fnt_small = R.font(30, "Bold")
    label = text_layer(spec["label"], 50, (190, 205, 230), w="ExtraBold", shadow=False)
    foot = text_layer(spec.get("footnote", ""), 26, (130, 145, 175), w="Medium", shadow=False, max_w=1000)
    base_line = text_layer("insatsen " + kr(v0), 28, (150, 165, 195), w="Bold", shadow=False)

    work = tempfile.mkdtemp(prefix="story_")
    vid = os.path.join(work, "v.mp4")
    pr = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                           "-pix_fmt", "yuv420p", vid], stdin=subprocess.PIPE)
    nframes = int(round(total * FPS))
    cta_start = bounds[-2] if scenes[-1].get("cta") else total + 1
    for fi in range(nframes):
        t = fi / FPS
        if fi == 0:
            t = min(bounds[1] * 0.9, 1.5)  # readable first frame
        img = bg.copy()
        d = ImageDraw.Draw(img, "RGBA")
        p = pos_at(t)
        v = val_at(p)
        tgt = max(v0 * 1.5, max(vals[:int(p) + 1] + [v]) * 1.22)
        if fi <= 1:
            scale['vm'] = tgt
        else:
            scale['vm'] += (tgt - scale['vm']) * 0.12
        vmax = scale['vm']
        col = GREEN if v >= v0 else RED
        dim = clamp((t - cta_start) / 0.4) if t >= cta_start else 0.0

        # header + counter
        paste(img, label, W / 2, 300, alpha=1 - 0.6 * dim)
        cnt = text_layer(kr(v), 190 if v < 100000 else 176, col, stroke=12, stroke_col=DARK)
        punch = 0.0
        for kind, tt, *rest in pops:
            if kind == "stamp":
                punch = max(punch, 1 - clamp(abs(t - tt) / 0.35))
        paste(img, cnt, W / 2, 470, scale=1 + 0.08 * punch, alpha=1 - 0.6 * dim)

        # grid + baseline
        step = 50000 if vmax > 150000 else 25000 if vmax > 60000 else 10000 if vmax > 25000 else 5000
        for gv in range(0, int(vmax), step):
            if gv == 0:
                continue
            y = Y(gv)
            d.line([(CL, y), (CR, y)], fill=GRID + (int(140 * (1 - dim)),), width=2)
        yb = Y(v0)
        for x in range(CL, CR, 28):
            d.line([(x, yb), (x + 14, yb)], fill=(150, 165, 195, int(200 * (1 - dim))), width=3)
        paste(img, base_line, CR - base_line.width / 2, yb - 26, alpha=1 - dim)

        # line + area
        k = int(p)
        pts = [(X(i), Y(vals[i])) for i in range(k + 1)] + ([(X(p), Y(v))] if p > k else [])
        if len(pts) >= 2:
            area = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ad = ImageDraw.Draw(area)
            ad.polygon([(CL, CB)] + pts + [(pts[-1][0], CB)], fill=col + (60,))
            img.alpha_composite(area)
            glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(glow).line(pts, fill=col + (160,), width=22, joint="curve")
            img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(10)))
            d = ImageDraw.Draw(img, "RGBA")
            d.line(pts, fill=col + (255,), width=9, joint="curve")
        # moving dot + year
        dx, dy = X(p), Y(v)
        pulse = 1 + 0.25 * math.sin(t * 8)
        r = 15 * pulse
        d.ellipse([dx - r - 8, dy - r - 8, dx + r + 8, dy + r + 8], fill=col + (70,))
        d.ellipse([dx - 15, dy - 15, dx + 15, dy + 15], fill=WHITE + (255,))
        d.ellipse([dx - 9, dy - 9, dx + 9, dy + 9], fill=col + (255,))
        yr = dates[min(n - 1, int(round(p)))][:4]
        yl = text_layer(yr, 40, WHITE, w="ExtraBold", shadow=False)
        paste(img, yl, min(CR - 40, max(CL + 50, dx)), dy - 58 if dy > CT + 60 else dy + 58)

        # callouts & stamps
        for kind, tt, *rest in pops:
            if t < tt:
                continue
            a_ = ease_back(prog(t, tt, 0.3))
            if kind == "callout":
                ci, c = rest
                ccol = {"red": RED, "green": GREEN, "yellow": YEL}.get(c.get("color", "red"), RED)
                bx, by = X(ci), Y(vals[ci])
                L = text_layer(c["text"], 42, WHITE, w="Black", shadow=False)
                pad = 20
                bub = Image.new("RGBA", (L.width + 2 * pad, L.height + 2 * pad - 10), (0, 0, 0, 0))
                ImageDraw.Draw(bub).rounded_rectangle([0, 0, bub.width - 1, bub.height - 1], 22, fill=ccol + (255,))
                bub.alpha_composite(L, (pad, pad - 6))
                below = c.get("below", by < (CT + CB) / 2 is False)
                cy = by + 80 if c.get("below", True) else by - 80
                cx = min(CR - bub.width / 2, max(CL + bub.width / 2, bx))
                paste(img, bub, cx, cy, scale=a_ * (1 - 0.0 * dim), alpha=1 - 0.7 * dim)
            elif kind == "stamp":
                txt, scol = rest
                S = text_layer(txt, 230, {"green": GREEN, "yellow": YEL, "red": RED}[scol], stroke=14, stroke_col=DARK)
                paste(img, S, 330, 860, scale=a_, rot=-10, alpha=1 - 0.7 * dim)

        # CTA overlay
        if dim > 0:
            ov = Image.new("RGBA", (W, H), (14, 22, 42, int(170 * dim)))
            img.alpha_composite(ov)
            R.T(img, t - cta_start, 0.05, "FÖLJ", 120, YEL, 700, w="Black")
            R.T(img, t - cta_start, 0.2, "@planboksskolan", 80, WHITE, 840, w="ExtraBold")
            R.T(img, t - cta_start, 0.45, "Inget köp- eller säljråd.", 52, (200, 210, 230), 960, mode="up", w="ExtraBold")

        # subtitles
        gi = max([i for i, s0 in enumerate(gstart) if s0 <= t + 0.04] or [-1])
        if gi >= 0 and t < total - 0.3:
            grp = groups[gi]
            f = R.font(88, "Black")
            gap = 34
            widths = [f.getlength(w_) + 22 + gap for w_, _ in grp]
            tw = sum(widths) - gap
            sc = min(1.0, 990 / max(1, tw))
            size = int(88 * sc)
            f = R.font(size, "Black")
            gap = int(34 * sc)
            widths = [f.getlength(w_) + 22 * sc + gap for w_, _ in grp]
            x = W / 2 - (sum(widths) - gap) / 2
            popg = ease_back(prog(t, gstart[gi], 0.16))
            for j, ((w_, wt), ww) in enumerate(zip(grp, widths)):
                active = wt <= t + 0.04 and (j == len(grp) - 1 or grp[j + 1][1] > t + 0.04)
                L = text_layer(w_, size, YEL if active else WHITE, stroke=11, stroke_col=DARK)
                paste(img, L, x + (ww - gap) / 2, 1560, scale=(0.9 + 0.1 * popg))
                x += ww
        paste(img, foot, W / 2, 1790, alpha=0.9)
        R.badge(img)

        # camera: slow push-in + punch at stamps
        z = 1.0 + 0.035 * (t / total) + 0.05 * punch
        if z > 1.001:
            zw, zh = int(W / z), int(H / z)
            x0, y0 = (W - zw) // 2, int((H - zh) * 0.42)
            img = img.crop((x0, y0, x0 + zw, y0 + zh)).resize((W, H), Image.BICUBIC)
        # flash on stamp
        for kind, tt, *rest in pops:
            if kind == "stamp" and 0 <= t - tt < 0.15:
                fl = Image.new("RGBA", (W, H), (255, 255, 255, int(110 * (1 - (t - tt) / 0.15))))
                img.alpha_composite(fl)
        pr.stdin.write(img.convert("RGB").tobytes())
    pr.stdin.close()
    if pr.wait() != 0:
        sys.exit("ffmpeg failed")

    fx = os.path.join(work, "sfx.wav")
    sfx(fx, total, sfx_ev)
    out = os.path.join(out_dir, spec["slug"] + ".mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", audio, "-i", fx, "-filter_complex",
                    "[1:a]apad[v];[v][2:a]amix=inputs=2:normalize=0:duration=first,volume=1.0[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(total),
                    "-movflags", "+faststart", out], check=True)
    cover = E.make_cover(spec, os.path.join(out_dir, spec["slug"] + ".jpg"))
    print(json.dumps({"video": out, "cover": cover, "duration": total, "cuts": cuts}))


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    build(spec, sys.argv[2], sys.argv[3])
