#!/usr/bin/env python3
"""Plånboksskolan – data-driven video engine.

Usage:
    python3 mall/engine.py SPEC.json VOICE.mp3 OUT_DIR

SPEC.json describes the video (see mall/exempel_spec.json). Each scene has a
"say" field with the exact paragraph spoken in the voiceover; scene cuts are
placed at the pauses in the audio that best match the paragraph lengths.
Produces OUT_DIR/<slug>.mp4 (1080x1920, 30 fps, voice) and OUT_DIR/<slug>.jpg (cover).
"""
import json, os, re, subprocess, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render as R  # noqa: E402
from render import (T, ytxt, card, stamp, chip, text_layer, paste, follow_cta, fmt, prog,
                    ease_out, ease_back, clamp, W, FPS, WHITE, DARK, YEL, RED, GREEN, MINTTXT,
                    GREY, BG_NAVY, BG_MINT, badge_layer, rrect)  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402

COLORS = {"yellow": YEL, "red": RED, "green": GREEN, "white": WHITE, "dark": DARK, "mint": MINTTXT}


def fg(bg):
    return WHITE if bg == "navy" else DARK


def soft(bg):
    return (170, 185, 210) if bg == "navy" else GREY


# ---------------------------------------------------------------- scene renderers
# Each takes (spec_scene, bg_name, dur) and returns fn(img, t).

def scene_hook(s, bg, dur):
    c = fg(bg)

    def fn(b, t):
        y = 560
        if s.get("kicker"):
            T(b, t, 0.0, s["kicker"], 56, c, y, w="ExtraBold")
        ytxt(b, t, 0.08, s["big"], 150, y + 140)
        if s.get("sub"):
            T(b, t, 0.4, s["sub"], 84, c, y + 285, mode="up", w="ExtraBold")
        start = dur * 0.45
        for i, line in enumerate(s.get("punch", [])):
            T(b, t, start + 0.2 * i, line, 80, RED, y + 460 + 92 * i, mode="up", w="Black")
    return fn


def scene_cards(s, bg, dur):
    cards = s["cards"][:3]
    n = len(cards)
    times = [dur * (0.08 + 0.75 * i / max(1, n)) for i in range(n)]

    def fn(b, t):
        T(b, t, 0.0, s["title"], 96, fg(bg), 400)
        for i, (title, sub) in enumerate(cards):
            accent = RED if (s.get("last_red") and i == n - 1) else YEL
            card(b, t, times[i], 640 + 250 * i, 210, i + 1, title, sub, accent=accent)
        if s.get("stamp"):
            stamp(b, 840, 640 + 250 * (n - 1) - 80, s["stamp"], prog(t, times[-1] + 0.8, 0.35))
    return fn


def scene_number(s, bg, dur):
    c = fg(bg)
    col = COLORS.get(s.get("color", "yellow"), YEL)

    def fn(b, t):
        if s.get("top"):
            T(b, t, 0.0, s["top"], 84, c, 520, w="Black")
        st = dur * 0.12
        p = ease_out(prog(t, st, min(1.4, dur * 0.35)))
        if t > st:
            v = s["value"] * p
            L = text_layer(s.get("prefix", "") + fmt(v) + s.get("suffix", ""), 170, col, stroke=11, stroke_col=DARK)
            paste(b, L, W / 2, 730)
        if s.get("sub"):
            T(b, t, st + 0.5, s["sub"], 74, c, 900, mode="up", w="ExtraBold")
        if s.get("value2") is not None:
            st2 = dur * 0.5
            p2 = ease_out(prog(t, st2, min(1.2, dur * 0.3)))
            if t > st2:
                col2 = COLORS.get(s.get("color2", "green"), GREEN)
                L = text_layer(s.get("prefix2", "") + fmt(s["value2"] * p2) + s.get("suffix2", ""), 130, col2,
                               stroke=9, stroke_col=DARK)
                paste(b, L, W / 2, 1060)
            if s.get("sub2"):
                T(b, t, st2 + 0.4, s["sub2"], 64, c, 1190, mode="up", w="ExtraBold")
        if s.get("note"):
            T(b, t, dur * 0.6, s["note"], 38, soft(bg), 1330, mode="fade", w="Medium")
    return fn


def scene_statement(s, bg, dur):
    c = fg(bg)
    lines = s.get("lines", [])

    def fn(b, t):
        y = 400
        if s.get("title"):
            ytxt(b, t, 0.0, s["title"], 120, y)
            y += 170
        step = dur * 0.6 / max(1, len(lines) + (1 if s.get("highlight") else 0))
        k = 0
        for line in lines:
            T(b, t, 0.3 + step * k, line, 70, c, y, mode="up", w="ExtraBold")
            y += 90
            k += 1
        if s.get("highlight"):
            y += 30
            ytxt(b, t, 0.3 + step * k, s["highlight"], 104, y + 20)
            y += 160
        if s.get("chip"):
            chip(b, t, dur * 0.72, s["chip"], W / 2, y + 40, col=GREEN)
        if s.get("note"):
            T(b, t, dur * 0.6, s["note"], 38, soft(bg), y + 150, mode="fade", w="Medium")
    return fn


def scene_cta(s, bg, dur):
    c = fg(bg)

    def fn(b, t):
        T(b, t, 0.0, s["line1"], 92, c, 640, w="ExtraBold")
        ytxt(b, t, 0.25, s["big"], 170 if len(s["big"]) < 9 else 110, 800)
        if s.get("line2"):
            T(b, t, 0.8, s["line2"], 76, c, 960, mode="up", w="ExtraBold")
        follow_cta(b, t, min(1.6, dur * 0.45))
    return fn


SCENES = {"hook": scene_hook, "cards": scene_cards, "number": scene_number,
          "statement": scene_statement, "cta": scene_cta}


# ---------------------------------------------------------------- timing from audio
def probe_dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", p]).strip())


def silences(p):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-af", "silencedetect=noise=-35dB:d=0.28",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(st, en))


def cuts_for(audio, paras):
    dur = probe_dur(audio)
    sil = [s for s in silences(audio) if s[1] < dur - 0.05]
    speech_end = dur
    lens = [len(p) for p in paras]
    tot = sum(lens)
    cuts, acc, last = [], 0, 0.0
    for L in lens[:-1]:
        acc += L
        target = speech_end * acc / tot
        cands = [(abs((s + e) / 2 - target), (s + e) / 2) for s, e in sil if (s + e) / 2 > last + 0.8]
        mid = min(cands)[1] if cands else target
        mid = round(mid * FPS) / FPS
        cuts.append(mid)
        last = mid
    return cuts, dur


# ---------------------------------------------------------------- build
def render_scene_file(path, dur, bg_img, fn):
    n = int(round(dur * FPS))
    tmp = path.replace(".mp4", ".part.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{R.H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
           "-pix_fmt", "yuv420p", tmp]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        img = bg_img.convert("RGBA")
        fn(img, i / FPS)
        R.badge(img)
        pr.stdin.write(img.convert("RGB").tobytes())
    pr.stdin.close()
    if pr.wait() != 0:
        sys.exit("ffmpeg failed")
    os.replace(tmp, path)


def build(spec, audio, out_dir, max_len=30.0):
    os.makedirs(out_dir, exist_ok=True)
    scenes = spec["scenes"]
    cuts, adur = cuts_for(audio, [s["say"] for s in scenes])
    total = round(min(adur + 0.5, max_len) * FPS) / FPS
    if adur > max_len:
        print(f"WARNING: voice is {adur:.1f}s, longer than {max_len}s – shorten the script", file=sys.stderr)
    bounds = [0] + cuts + [total]
    work = tempfile.mkdtemp(prefix="pb_")
    files = []
    for i, (s, a, b) in enumerate(zip(scenes, bounds, bounds[1:])):
        bg = s.get("bg") or ("navy" if i % 2 == 0 else "mint")
        dur = b - a
        fn = SCENES[s["type"]](s, bg, dur)
        p = os.path.join(work, f"s{i}.mp4")
        render_scene_file(p, dur, BG_NAVY if bg == "navy" else BG_MINT, fn)
        files.append(p)
    lst = os.path.join(work, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in files))
    joined = os.path.join(work, "v.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", joined], check=True)
    out = os.path.join(out_dir, spec["slug"] + ".mp4")
    tmp = out.replace(".mp4", ".part.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", joined, "-i", audio, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "apad", "-t", str(total),
                    "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, out)
    cover = make_cover(spec, os.path.join(out_dir, spec["slug"] + ".jpg"))
    print(json.dumps({"video": out, "cover": cover, "duration": total, "cuts": cuts}))
    return out


def make_cover(spec, path):
    c = spec.get("cover", {})
    b = BG_MINT.convert("RGBA")
    paste(b, badge_layer(), W / 2, 250, scale=1.4)
    lines = c.get("title", [spec.get("title", "").upper()])
    y = 470
    for l in lines:
        paste(b, text_layer(l, 150, YEL, stroke=11), W / 2, y)
        y += 165
    if c.get("pill"):
        L = text_layer(c["pill"], 54, DARK, w="ExtraBold", shadow=False)
        pill = Image.new("RGBA", (L.width + 70, L.height + 30), (0, 0, 0, 0))
        rrect(ImageDraw.Draw(pill), (0, 0, pill.width - 1, pill.height - 1), 34, WHITE, outline=DARK, width=4)
        pill.alpha_composite(L, (35, 15))
        paste(b, pill, W / 2, y + 40)
        y += 150
    if c.get("label"):
        paste(b, text_layer(c["label"], 70, DARK, w="ExtraBold"), W / 2, y + 90)
    if c.get("big"):
        col = COLORS.get(c.get("big_color", "green"), GREEN)
        paste(b, text_layer(c["big"], 150, col, stroke=10), W / 2, y + 240)
    b.convert("RGB").save(path, quality=95)
    return path


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    build(spec, sys.argv[2], sys.argv[3])
