#!/usr/bin/env python3
"""Plånboksskolan – "story chart" video (v2).

One continuous, self-drawing value chart with a live counter, a payoff-first
teaser that rewinds, crash FX (red vignette + shake), rocket FX (camera follow,
riser, impact, confetti, ×N stamp), word-by-word subtitles, music bed and SFX.

Usage:
    python3 mall/story.py SPEC.json VOICE.mp3 OUT_DIR

SPEC: slug, label, data ("YYYY-MM-DD:value ..."), start_value, footnote, cover,
scenes: [{say (text without audio tags), to: date|"end"|"hold",
          teaser: {peak: date, stamp: "×10"}   # draw fast to peak, slam, rewind to start
          draw_from, draw_until (fractions of the scene),
          callout: {date, text, color}, stamp, stamp_at, cta: bool}]
"""
import datetime as dt, json, math, os, random, subprocess, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render as R  # noqa: E402
import engine as E  # noqa: E402
from render import text_layer, paste, ease_out, ease_back, prog, clamp, W, H, FPS, WHITE, DARK, YEL, RED, GREEN  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

CL, CR, CT, CB = 70, 1010, 700, 1340
GRID = (60, 78, 115)
random.seed(7)


def kr(v):
    return f"{int(round(v, -2)):,}".replace(",", " ") + " kr"


# ------------------------------------------------------------------ audio bed
def make_audio(path, dur, ev, tempo=118):
    """Music bed (kick + pulsing bass + hats) with risers, impacts, whooshes, pops."""
    b = 60.0 / tempo
    parts = [  # (lavfi source, filter chain)
        (f"aevalsrc=exprs='0.55*sin(2*PI*(45+60*exp(-mod(t,{b})*30))*mod(t,{b}))*exp(-mod(t,{b})*9)':d={dur}:s=44100", "anull"),
        (f"aevalsrc=exprs='0.10*sin(2*PI*55*t)*exp(-mod(t+{b/2},{b})*6)':d={dur}:s=44100", "anull"),
        (f"anoisesrc=d={dur}:c=white:a=0.5", f"highpass=f=7000,volume='0.18*exp(-mod(t,{b/2})*40)':eval=frame"),
    ]
    for kind, t in ev:
        ms = int(max(0, t) * 1000)
        dl = f"adelay={ms}|{ms}"
        if kind == "whoosh":
            parts.append(("anoisesrc=d=0.5:c=pink:a=0.5", f"highpass=f=600,lowpass=f=6000,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.2,{dl}"))
        elif kind == "riser":
            d0 = max(0, ms - 1600)
            parts.append(("anoisesrc=d=1.6:c=white:a=0.35", f"highpass=f=1200,afade=t=in:d=1.5,afade=t=out:st=1.5:d=0.1,adelay={d0}|{d0}"))
        elif kind == "boom":
            parts.append(("aevalsrc=exprs='0.9*sin(2*PI*(40+80*exp(-t*12))*t)*exp(-t*3)':d=1.4:s=44100", dl))
        elif kind == "ding":
            parts.append(("sine=f=1568:d=1.0", f"volume=0.22,afade=t=out:st=0.05:d=0.95,{dl}"))
        elif kind == "pop":
            parts.append(("sine=f=700:d=0.12", f"volume=0.35,afade=t=out:st=0.02:d=0.1,{dl}"))
        elif kind == "rewind":
            parts.append(("aevalsrc=exprs='0.25*sin(2*PI*(900-700*t/0.8)*t)':d=0.8:s=44100", f"afade=t=out:st=0.6:d=0.2,{dl}"))
        elif kind == "drop":
            parts.append(("aevalsrc=exprs='0.35*sin(2*PI*(300-250*t/1.2)*t)':d=1.2:s=44100", f"afade=t=out:st=0.9:d=0.3,{dl}"))
    inputs, filt = [], []
    for i, (src, fx) in enumerate(parts):
        inputs += ["-f", "lavfi", "-i", src]
        filt.append(f"[{i}:a]aformat=channel_layouts=mono:sample_rates=44100,{fx}[a{i}]")
    n = len(parts)
    mix = "".join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,apad,atrim=0:{dur}[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt) + ";" + mix,
                    "-map", "[out]", "-ar", "44100", "-ac", "1", path], check=True)


# ------------------------------------------------------------------ video
def build(spec, audio, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    rows = [(a, float(b)) for a, b in (x.split(":") for x in spec["data"].split())]
    n = len(rows)
    dates = [d for d, _ in rows]
    vals = [v for _, v in rows]
    v0 = spec.get("start_value", vals[0])
    scenes = spec["scenes"]
    cuts, adur = E.cuts_for(audio, [s["say"] for s in scenes])
    total = round((adur + 0.7) * FPS) / FPS
    bounds = [0.0] + cuts + [total]

    def idx_of(key):
        if key == "end":
            return n - 1
        k = dt.date.fromisoformat(key)
        return min(range(n), key=lambda i: abs((dt.date.fromisoformat(dates[i]) - k).days))

    keys, cur = [(0.0, 0.0)], 0.0  # replaced by teaser if present
    ev, pops, rewinds, crashes = [], [], [], []
    for si, (s, a, b) in enumerate(zip(scenes, bounds, bounds[1:])):
        L = b - a
        if si > 0:
            ev.append(("whoosh", a - 0.2))
        if s.get("teaser"):
            pk = float(idx_of(s["teaser"]["peak"]))
            t_peak = a + 0.35
            keys = [(0.0, pk), (a + L * 0.74, pk), (b - 0.05, 0.0)]
            pops.append(("stamp", t_peak, s["teaser"].get("stamp", "×10"), "green"))
            ev += [("boom", t_peak), ("ding", t_peak), ("rewind", a + L * 0.74)]
            rewinds.append((a + L * 0.74, b - 0.05))
            cur = 0.0
            continue
        to = s.get("to", "hold")
        if to == "hold":
            keys.append((b, cur))
        else:
            tgt = float(idx_of(to))
            t0, t1 = a + L * s.get("draw_from", 0.05), a + L * s.get("draw_until", 0.9)
            keys += [(t0, cur), (t1, tgt), (b, tgt)]
            if vals[int(tgt)] > vals[int(cur)] * 3:
                ev.append(("riser", t1))
            if vals[int(tgt)] < vals[int(cur)]:
                crashes.append((t0, t1))
                ev.append(("drop", t0))
            cur = tgt
        c = s.get("callout")
        if c:
            pops.append(("callout", None, idx_of(c["date"]), c, a, b))
        if s.get("stamp"):
            tt = a + L * s.get("stamp_at", 0.6)
            pops.append(("stamp", tt, s["stamp"], s.get("stamp_color", "green")))
            ev += [("boom", tt), ("ding", tt)]
    keys.sort(key=lambda k: k[0])

    def pos_at(t):
        for (t0, p0), (t1, p1) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                if t1 - t0 < 1e-6:
                    return p1
                u = (t - t0) / (t1 - t0)
                u = u * u * (3 - 2 * u)
                return p0 + (p1 - p0) * u
        return keys[-1][1]

    fixed = []
    for pp in pops:
        if pp[0] == "callout":
            _, _, ci, c, a, b = pp
            tt = next((f / FPS for f in range(int(a * FPS), int(b * FPS) + 1) if abs(pos_at(f / FPS) - ci) < 0.6), b)
            fixed.append(("callout", tt, ci, c))
            ev.append(("pop", tt))
        else:
            fixed.append(pp)
    pops = fixed
    stamps = [p for p in pops if p[0] == "stamp"]
    teaser_stamps = {st[1] for st in stamps if any(abs(st[1] - r0[0]) < 3 for r0 in rewinds)}

    def val_at(p):
        i = int(p)
        if i >= n - 1:
            return vals[-1]
        return vals[i] + (vals[i + 1] - vals[i]) * (p - i)

    words = []
    for s, a, b in zip(scenes, bounds, bounds[1:]):
        words += E.word_times(audio, s["say"], a, b)
    groups = E.chunks(words, 3)
    gstart = [g[0][1] for g in groups]

    bg0 = R.BG_NAVY.convert("RGBA")
    label = text_layer(spec["label"], 50, (190, 205, 230), w="ExtraBold", shadow=False)
    foot = text_layer(spec.get("footnote", ""), 26, (130, 145, 175), w="Medium", shadow=False, max_w=1000)
    base_line = text_layer("insatsen " + kr(v0), 28, (150, 165, 195), w="Bold", shadow=False)
    vign = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vign)
    for k in range(60):
        vd.rectangle([k * 9, k * 16, W - k * 9, H - k * 16], outline=int(255 * (1 - k / 60) ** 2), width=10)
    vign = vign.filter(ImageFilter.GaussianBlur(40))
    red_v = Image.new("RGBA", (W, H), RED + (0,))
    red_v.putalpha(vign.point(lambda q: int(q * 0.55)))
    confetti = [(random.uniform(0, W), random.uniform(-500, 0), random.uniform(380, 900), random.uniform(-1, 1),
                 random.choice([GREEN, YEL, WHITE, (90, 200, 255)]), random.uniform(0, 6.28)) for _ in range(120)]
    rewind_txt = text_layer("◀◀  5 ÅR TIDIGARE", 64, WHITE, w="Black", stroke=8, stroke_col=DARK)

    work = tempfile.mkdtemp(prefix="story_")
    vid = os.path.join(work, "v.mp4")
    pr = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "17",
                           "-pix_fmt", "yuv420p", vid], stdin=subprocess.PIPE)
    nframes = int(round(total * FPS))
    cta_start = bounds[-2] if scenes[-1].get("cta") else total + 1
    vm = v0 * 1.5
    cam = [W / 2, H * 0.5, 1.0]
    prev_v = v0
    for fi in range(nframes):
        t = fi / FPS
        p = pos_at(t)
        v = val_at(p)
        col = GREEN if v >= v0 else RED
        dim = clamp((t - cta_start) / 0.4) if t >= cta_start else 0.0
        rew = next((clamp((t - a) / (b - a)) for a, b in rewinds if a <= t <= b), None)
        crash = any(a <= t <= b + 0.3 for a, b in crashes)
        falling = v < prev_v - 1
        prev_v = v

        tgt = max(v0 * 1.5, max(vals[:int(p) + 1] + [v]) * 1.22)
        vm = tgt if fi == 0 else vm + (tgt - vm) * (0.35 if rew is not None else 0.12)
        X = lambda i: CL + (CR - CL) * i / (n - 1)
        Y = lambda val: CB - (CB - CT) * val / vm

        img = bg0.copy()
        d = ImageDraw.Draw(img, "RGBA")
        off = (t * 40) % 90
        for gx in range(-90, W + 90, 90):
            d.line([(gx + off, 0), (gx + off, H)], fill=(255, 255, 255, 5), width=2)
        for gy in range(-90, H + 90, 90):
            d.line([(0, gy + off), (W, gy + off)], fill=(255, 255, 255, 5), width=2)

        punch = max([1 - clamp(abs(t - st[1]) / 0.3) for st in stamps] + [0])
        step = 50000 if vm > 150000 else 25000 if vm > 60000 else 10000 if vm > 25000 else 5000
        for gv in range(step, int(vm), step):
            y = Y(gv)
            d.line([(CL, y), (CR, y)], fill=GRID + (int(150 * (1 - dim)),), width=2)
            gl = text_layer(f"{gv // 1000} tkr", 24, (110, 125, 160), w="Bold", shadow=False)
            paste(img, gl, CL + 36, y - 18, alpha=1 - dim)
        yb = Y(v0)
        for x in range(CL, CR, 28):
            d.line([(x, yb), (x + 14, yb)], fill=(170, 185, 215, int(220 * (1 - dim))), width=3)
        paste(img, base_line, CR - base_line.width / 2, yb - 26, alpha=1 - dim)

        k = int(p)
        pts = [(X(i), Y(vals[i])) for i in range(k + 1)] + ([(X(p), Y(v))] if p > k else [])
        if len(pts) >= 2:
            area = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(area).polygon([(CL, CB)] + pts + [(pts[-1][0], CB)], fill=col + (55,))
            img.alpha_composite(area)
            glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(glow).line(pts, fill=col + (190,), width=26, joint="curve")
            img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(12)))
            d = ImageDraw.Draw(img, "RGBA")
            d.line(pts, fill=col + (255,), width=9, joint="curve")
        dx, dy = X(p), Y(v)
        r = 15 * (1 + 0.3 * math.sin(t * 9))
        d.ellipse([dx - r - 10, dy - r - 10, dx + r + 10, dy + r + 10], fill=col + (70,))
        d.ellipse([dx - 15, dy - 15, dx + 15, dy + 15], fill=WHITE + (255,))
        d.ellipse([dx - 9, dy - 9, dx + 9, dy + 9], fill=col + (255,))
        yl = text_layer(dates[min(n - 1, int(round(p)))][:4], 42, WHITE, w="Black", stroke=5, stroke_col=DARK)
        paste(img, yl, min(CR - 50, max(CL + 60, dx)), dy - 62 if dy > CT + 70 else dy + 62)

        for pp in pops:
            kind, tt = pp[0], pp[1]
            if t < tt or rew is not None:
                continue
            a_ = ease_back(prog(t, tt, 0.28))
            if kind == "callout":
                ci, c = pp[2], pp[3]
                ccol = {"red": RED, "green": GREEN, "yellow": YEL}.get(c.get("color", "red"), RED)
                Lt = text_layer(c["text"], 46, WHITE, w="Black", shadow=False)
                pad = 22
                bub = Image.new("RGBA", (Lt.width + 2 * pad, Lt.height + 2 * pad - 10), (0, 0, 0, 0))
                ImageDraw.Draw(bub).rounded_rectangle([0, 0, bub.width - 1, bub.height - 1], 24, fill=ccol + (255,))
                bub.alpha_composite(Lt, (pad, pad - 6))
                bx, by = X(ci), Y(vals[ci])
                cx = min(CR - bub.width / 2, max(CL + bub.width / 2, bx))
                paste(img, bub, cx, min(CB - 10, by + 85), scale=a_, alpha=1 - 0.7 * dim)
            else:
                txt, scol = pp[2], pp[3]
                if tt in teaser_stamps and t - tt > 1.3:
                    continue
                S = text_layer(txt, 250, {"green": GREEN, "yellow": YEL, "red": RED}[scol], stroke=16, stroke_col=DARK)
                sc = 1.6 - 0.6 * ease_out(prog(t, tt, 0.22))
                paste(img, S, 330, 880, scale=sc, rot=-10, alpha=(1 - 0.7 * dim) * clamp((t - tt) / 0.08))

        for st in stamps:
            el = t - st[1]
            if 0 <= el < 2.2 and rew is None:
                for (x0, y0, vy, vx, cc, ph) in confetti:
                    x = x0 + vx * 120 * el + 30 * math.sin(ph + el * 6)
                    y = y0 + vy * el
                    if 0 <= y < H:
                        w_ = 10 + 6 * math.sin(ph + el * 10)
                        d.rectangle([x, y, x + w_, y + 18], fill=cc + (int(255 * (1 - el / 2.2)),))

        if rew is not None:
            for k2 in range(0, H, 6):
                if random.random() < 0.18:
                    d.line([(0, k2), (W, k2)], fill=(255, 255, 255, 28), width=2)

        if crash and falling and dim == 0:
            img.alpha_composite(red_v)

        drawing = abs(pos_at(t + 0.1) - p) > 0.05 and rew is None
        tz = 1.10 if drawing else 1.0
        tz = max(1.0, tz - 0.25 * punch)
        tcx = W / 2 + (dx - W / 2) * 0.4 if drawing else W / 2
        tcy = H * 0.5 + (dy - H * 0.5) * 0.25 if drawing else H * 0.5
        cam[0] += (tcx - cam[0]) * 0.12
        cam[1] += (tcy - cam[1]) * 0.12
        cam[2] += (tz - cam[2]) * 0.1
        z = cam[2] + 0.06 * punch
        if dim > 0:
            z = 1.0 + (z - 1.0) * (1 - dim)
        if z > 1.002:
            zw, zh = int(W / z), int(H / z)
            x0 = int(min(W - zw, max(0, cam[0] - zw / 2)))
            y0 = int(min(H - zh, max(0, cam[1] - zh / 2)))
            img = img.crop((x0, y0, x0 + zw, y0 + zh)).resize((W, H), Image.BICUBIC)
        d = ImageDraw.Draw(img, "RGBA")
        paste(img, label, W / 2, 300, alpha=1 - 0.6 * dim)
        shake_c = random.uniform(-6, 6) if (crash and falling) else 0
        cnt = text_layer(kr(v), 190 if v < 100000 else 172, col, stroke=12, stroke_col=DARK)
        paste(img, cnt, W / 2 + shake_c, 470, scale=1 + 0.12 * punch, alpha=1 - 0.6 * dim)
        if v > v0 * 1.05:
            mt = text_layer(f"×{v / v0:.1f}".replace(".", ","), 58, YEL, w="Black", stroke=6, stroke_col=DARK)
            paste(img, mt, W / 2, 595, alpha=(1 - 0.6 * dim) * clamp((v / v0 - 1.05) * 4))
        elif v < v0 * 0.95:
            pc = text_layer(f"−{(1 - v / v0) * 100:.0f} %", 58, RED, w="Black", stroke=6, stroke_col=DARK)
            paste(img, pc, W / 2, 595, alpha=1 - 0.6 * dim)

        if rew is not None:
            paste(img, rewind_txt, W / 2, 1580)

        if dim > 0:
            img.alpha_composite(Image.new("RGBA", (W, H), (14, 22, 42, int(175 * dim))))
            R.T(img, t - cta_start, 0.05, "FÖLJ", 130, YEL, 700, w="Black")
            R.T(img, t - cta_start, 0.2, "@planboksskolan", 82, WHITE, 845, w="ExtraBold")
            R.T(img, t - cta_start, 0.4, "Nästa aktie kommer i morgon", 54, (200, 210, 230), 960, mode="up", w="ExtraBold")
            R.T(img, t - cta_start, 0.6, "Inget köp- eller säljråd.", 44, (160, 175, 205), 1040, mode="up", w="Bold")

        gi = max([i for i, s0 in enumerate(gstart) if s0 <= t + 0.04] or [-1])
        if gi >= 0 and t < total - 0.35 and rew is None:
            grp = groups[gi]
            f = R.font(92, "Black")
            gap = 34
            widths = [f.getlength(w_) + 22 + gap for w_, _ in grp]
            sc = min(1.0, 990 / max(1, sum(widths) - gap))
            size, gap = int(92 * sc), int(34 * sc)
            f = R.font(size, "Black")
            widths = [f.getlength(w_) + 22 * sc + gap for w_, _ in grp]
            x = W / 2 - (sum(widths) - gap) / 2
            popg = ease_back(prog(t, gstart[gi], 0.15))
            for j, ((w_, wt), ww) in enumerate(zip(grp, widths)):
                active = wt <= t + 0.04 and (j == len(grp) - 1 or grp[j + 1][1] > t + 0.04)
                Lw = text_layer(w_, size, YEL if active else WHITE, stroke=12, stroke_col=DARK)
                paste(img, Lw, x + (ww - gap) / 2, 1580 - (8 if active else 0), scale=0.9 + 0.1 * popg)
                x += ww
        paste(img, foot, W / 2, 1800, alpha=0.9)
        R.badge(img)

        if (crash and falling) or punch > 0.6:
            amp = 10 if punch > 0.6 else 5
            img = img.transform((W, H), Image.AFFINE, (1, 0, random.uniform(-amp, amp), 0, 1, random.uniform(-amp, amp)),
                                resample=Image.BILINEAR)
        for st in stamps:
            if 0 <= t - st[1] < 0.14:
                img.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(150 * (1 - (t - st[1]) / 0.14)))))
        pr.stdin.write(img.convert("RGB").tobytes())
    pr.stdin.close()
    if pr.wait() != 0:
        sys.exit("ffmpeg failed")

    bed = os.path.join(work, "bed.wav")
    make_audio(bed, total, ev)
    out = os.path.join(out_dir, spec["slug"] + ".mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", audio, "-i", bed, "-filter_complex",
                    "[2:a]volume=0.5[m];[1:a]apad,asplit[v1][v2];"
                    "[m][v1]sidechaincompress=threshold=0.05:ratio=6:attack=5:release=250[md];"
                    "[v2][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(total),
                    "-movflags", "+faststart", out], check=True)
    cover = E.make_cover(spec, os.path.join(out_dir, spec["slug"] + ".jpg"))
    print(json.dumps({"video": out, "cover": cover, "duration": total, "cuts": cuts}))


if __name__ == "__main__":
    build(json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3])
