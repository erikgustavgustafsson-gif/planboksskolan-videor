import os, subprocess
import render as R
from build_vo import probe_dur, A

PAD = {"5_betala_dig_sjalv_forst": 0.5}
JOBS = {
    "5_betala_dig_sjalv_forst": ("s5.mp3", R.V5, [4.4333, 10.7667, 20.2, 25.8]),
    "1_black_friday_fallan": ("s1.mp3", R.V1, [3.3333, 13.6333, 18.6, 23.7333]),
    "2_lonekontot": ("s2.mp3", R.V2, [2.9667, 7.7667, 14.7333, 20.8333]),
    "3_julklapp_isk_barn": ("s3.mp3", R.V3, [2.8667, 8.9, 17.3667, 22.7]),
    "4_usa_aktier_avgifter": ("s4.mp3", R.V4, [3.1333, 9.8333, 18.0333, 21.4667, 26.5667]),
}

def build(name):
    af, scenes, cuts = JOBS[name]
    audio = os.path.join(A, af)
    total = round((probe_dur(audio) + PAD.get(name, 0.6)) * R.FPS) / R.FPS
    bounds = [0] + cuts + [total]
    files = []
    for (n, d, bg, fn), a, b in zip(scenes, bounds, bounds[1:]):
        nd = b - a
        k = d / nd
        files.append(R.render_scene(n + "_s", nd, bg, (lambda fn, k: lambda img, t: fn(img, t * k))(fn, k)))
    lst = os.path.join(R.OUT, name + "_s.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in files))
    joined = os.path.join(R.OUT, name + "_s_v.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", joined], check=True)
    final = os.path.join(R.OUT, f"plånboksskolan_{name}_30s.mp4")
    tmp = final.replace(".mp4", ".part.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", joined, "-i", audio, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "apad", "-t", str(total),
                    "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, final)
    print(name, total)

if __name__ == "__main__":
  for n in JOBS:
    build(n)
