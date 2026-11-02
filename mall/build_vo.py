#!/usr/bin/env python3
"""Retime the scenes to the ElevenLabs voiceovers and mux audio."""
import os, re, subprocess, sys
import render as R

A = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")

SCRIPTS = {
    "1_black_friday_fallan": ("vo1.mp3", R.V1, [
        "Black Friday är den tjugosjunde november. Men många butiker har redan höjt priserna.",
        "Så funkar fällan. En vara kostar femhundra kronor i september. I oktober höjs den till ettusenfemhundra. Sen kommer rean: minus femtio procent. Sjuhundrafemtio kronor. Dyrare än i september!",
        "Lagen säger att butiken måste visa det lägsta priset från de senaste trettio dagarna. Men höjs priset tidigare än så, är det helt lagligt.",
        "Gör så här. Kolla prishistoriken minst tre månader bakåt. Bevaka priset redan nu, på Prisjakt eller PriceRunner. Och köp bara det du ändå tänkte köpa.",
        "Spara videon inför Black Friday, och följ Plånboksskolan."]),
    "2_lonekontot": ("vo2.mp3", R.V2, [
        "Din bank tjänar pengar på dina pengar.",
        "Har du sparpengar på lönekontot? Där får du ofta noll procent i ränta. Då lånar banken dem gratis av dig.",
        "Säg att du har femtiotusen kronor i ett år. Med noll procent ränta får du noll kronor. Med två procent får du tusen kronor. Samma pengar, bara ett annat konto.",
        "Är det tryggt? Ja. Insättningsgarantin skyddar upp till en miljon etthundrafemtiotusen kronor per person och bank. Kolla bara att banken finns hos Riksgälden.",
        "Kolla din sparränta i dag, och följ Plånboksskolan."]),
    "3_julklapp_isk_barn": ("vo3.mp3", R.V3, [
        "Julklappen som växer i arton år.",
        "Alla har ett eget skattefritt belopp på ISK: trehundratusen kronor. Även barn.",
        "Sätter du in femhundra kronor i månaden från födseln till arton år, har du satt in hundraåttatusen kronor. Med sju procents avkastning om året kan det bli runt tvåhundratiotusen. Men det finns ingen garanti.",
        "Tips inför jul: be släkten ge en slant i stället för fler prylar. Öppna ett ISK i barnets namn. Och starta ett månadssparande i en billig indexfond.",
        "Spara videon till julhandeln, och följ Plånboksskolan."]),
}


def probe_dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", p]).strip())


def silences(p):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-af", "silencedetect=noise=-35dB:d=0.3",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(st, en))


def cuts_for(audio, paras):
    dur = probe_dur(audio)
    sil = silences(audio)
    speech_end = sil[-1][0] if sil and sil[-1][1] >= dur - 0.05 else dur
    lens = [len(p) for p in paras]
    tot = sum(lens)
    cuts, acc = [], 0
    used = set()
    for L in lens[:-1]:
        acc += L
        target = speech_end * acc / tot
        cands = [(abs((s + e) / 2 - target), i) for i, (s, e) in enumerate(sil) if i not in used and e < speech_end]
        _, i = min(cands)
        used.add(i)
        cuts.append(round((sil[i][0] + sil[i][1]) / 2 * R.FPS) / R.FPS)
    return cuts, dur


def build(name):
    audio_f, scenes, paras = SCRIPTS[name]
    audio = os.path.join(A, audio_f)
    cuts, adur = cuts_for(audio, paras)
    if name == "3_julklapp_isk_barn":
        cuts[1] = 10.0  # "Även barn." is its own short phrase ending ~9.6 s
    total = round((adur + 0.6) * R.FPS) / R.FPS
    bounds = [0] + cuts + [total]
    print(name, "cuts", cuts, "total", total)
    new = []
    for (n, d, bg, fn), a, b in zip(scenes, bounds, bounds[1:]):
        nd = b - a
        k = d / nd
        # keep entrances snappy: compress the time map so the scene's own
        # timeline finishes ~at its original end, then holds
        new.append((n + "_vo", nd, bg, (lambda fn, k: lambda img, t: fn(img, t * k))(fn, k)))
    files = [R.render_scene(n, d, bg, fn) for n, d, bg, fn in new]
    lst = os.path.join(R.OUT, name + "_vo.txt")
    with open(lst, "w") as f:
        for p in files:
            f.write(f"file '{p}'\n")
    joined = os.path.join(R.OUT, name + "_vo_v.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", joined], check=True)
    final = os.path.join(R.OUT, f"plånboksskolan_{name}_med_ljud.mp4")
    tmp = final.replace(".mp4", ".part.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", joined, "-i", audio,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "apad", "-t", str(total), "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, final)
    print("done", final)


def build_exact(name, scenes, audio_f):
    """Scenes already authored in real voiceover time (k = 1)."""
    audio = os.path.join(A, audio_f)
    files = [R.render_scene(n + "_vo", d, bg, fn) for n, d, bg, fn in scenes]
    total = sum(round(d * R.FPS) for _, d, _, _ in scenes) / R.FPS
    lst = os.path.join(R.OUT, name + "_vo.txt")
    with open(lst, "w") as f:
        for p in files:
            f.write(f"file '{p}'\n")
    joined = os.path.join(R.OUT, name + "_vo_v.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", joined], check=True)
    final = os.path.join(R.OUT, f"plånboksskolan_{name}_med_ljud.mp4")
    tmp = final.replace(".mp4", ".part.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", joined, "-i", audio,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "apad", "-t", str(total), "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, final)
    print("done", final, total)


if __name__ == "__main__" and sys.argv[1:] == ["4"]:
    build_exact("4_usa_aktier_avgifter", R.V4, "vo4.mp3")
    sys.exit()

if __name__ == "__main__":
    for nm in (sys.argv[1:] or SCRIPTS):
        build(nm)
