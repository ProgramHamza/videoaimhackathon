"""Cut the team's narrator recording (audio/rec/narrator-raw.wav) into the film's narrator lines.
Each line: cleaned (high-pass, light denoise), cut at the silences found by word timing,
leading/trailing silence trimmed -> audio/vo/<id>.wav (48 kHz mono) + durations.json.
The doctors' lines (h01b, u01, k01) are not touched."""
import json
import subprocess
import wave
from pathlib import Path

RAW = "audio/rec/narrator-raw.wav"
# (line id, cut start s, cut end s) in the recording; boundaries sit in the pauses between lines
CUTS = [
    ("n01", 0.60, 3.35), ("n02", 3.35, 7.30),
    ("a01", 15.00, 18.70), ("a02", 18.70, 21.42), ("a03", 21.45, 27.50), ("a04", 27.50, 32.20),
    ("a05", 32.20, 37.95), ("a06", 38.20, 43.95), ("a07", 44.40, 49.35), ("a08", 49.40, 53.30),
    ("r01", 59.60, 65.20), ("w01", 65.20, 72.65), ("s01", 72.70, 78.00), ("s02", 78.00, 82.95),
    ("s03", 83.20, 89.65), ("s04", 89.80, 95.42), ("x01", 95.45, 103.20), ("x02", 109.20, 116.10),
]
CLEAN = "highpass=f=80,afftdn=nf=-42,"
TRIM = ("silenceremove=start_periods=1:start_threshold=-36dB:start_silence=0.06,"
        "areverse,silenceremove=start_periods=1:start_threshold=-36dB:start_silence=0.12,areverse,"
        "afade=t=in:d=0.02")

d = Path("audio/vo")
durs = json.loads((d / "durations.json").read_text())
for lid, a, b in CUTS:
    out = d / f"{lid}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a}", "-to", f"{b}", "-i", RAW,
                    "-af", CLEAN + TRIM, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(out)], check=True)
    with wave.open(str(out)) as w:
        durs[lid] = round(w.getnframes() / w.getframerate(), 3)
    print(f"{lid:>4} {a:7.2f}-{b:7.2f}  -> {durs[lid]:5.2f} s")
(d / "durations.json").write_text(json.dumps(durs, indent=1))
