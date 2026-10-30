"""Mix voice + music + sound effects from timeline.json -> audio/mix.wav (48 kHz stereo, -16 LUFS).
Run timeline.mjs first. Usage: python mix.py"""
import json
import subprocess
from pathlib import Path

SK = Path.home() / ".claude/skills/take-one/scripts"
tl = json.loads(Path("timeline.json").read_text())
T, S, DUR = tl["T"], tl["S"], tl["duration"]
FPS = 60
run = lambda *a: subprocess.run([str(x) for x in a], check=True)

# 1. music bus: main bed until "Next" (fades out), then the closing bed
lim0 = how0 = S["next"][0]
run("ffmpeg", "-y", "-loglevel", "error",
    "-i", "audio/bed-main.wav", "-i", "audio/bed-end.wav",
    "-filter_complex",
    f"[0:a]atrim=0:{lim0 + 0.6:.3f},afade=t=out:st={lim0 - 0.4:.3f}:d=1.0,apad=whole_dur={DUR:.3f}[a];"
    f"[1:a]afade=t=in:st=0:d=0.8,adelay={int(how0 * 1000)}|{int(how0 * 1000)},apad=whole_dur={DUR:.3f}[b];"
    f"[a][b]amix=inputs=2:normalize=0,atrim=0:{DUR:.3f},aformat=sample_rates=48000:channel_layouts=stereo[m]",
    "-map", "[m]", "audio/music.wav")

# 2. sound effects over the music (sfx.mjs ducks the bed under each cue)
KIND = {"tick": ("tick", "ui", -4), "type": ("tick", "key", -8), "click": ("press", "soft", -2), "whoosh": ("whoosh", "soft", -4),
        "pop": ("pop", "tiny", -4), "hit": ("impact", "soft", -6), "rise": ("swish", "in", -6), "chime": ("chime", "sparkle", -4),
        "thud": ("press", "thock", -6)}
cues, last = [], -1.0
for c in tl["cues"]:
    if c["kind"] not in KIND or c["t"] >= DUR - 0.05:
        continue
    if c["t"] - last < 0.09:          # at most one cue per 90 ms
        continue
    kind, variant, gain = KIND[c["kind"]]
    g = c.get("gain", 0.5)
    cues.append({"kind": kind, "variant": variant, "frame": int(round(c["t"] * FPS)),
                 "gainDb": gain + (g - 0.5) * 8, "label": c["kind"]})
    last = c["t"]
plan = {"fps": FPS, "seed": 11, "key": "D", "bpm": 84, "minDb": -40, "cues": cues}
Path("audio/sfx-plan.json").write_text(json.dumps(plan, indent=1))
run("node", SK / "sfx.mjs", "mix", "audio/sfx-plan.json", "audio/music.wav", "audio/music-sfx.wav")

# 3. voice: every line at its start time; the music ducks under it (--no-voice: music + sound only)
import sys
if "--no-voice" in sys.argv:
    run("ffmpeg", "-y", "-loglevel", "error", "-i", "audio/music-sfx.wav", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "audio/mix.wav")
    print(f"audio/mix.wav {DUR:.2f} s, music + {len(cues)} sound cues, no voice")
    sys.exit(0)
inputs, parts = [], []
T = {k: v for k, v in T.items() if Path(f"audio/vo/{k}.wav").exists()}   # unrecorded lines stay silent


def lufs(path):
    """Integrated loudness of one voice line (ffmpeg ebur128)."""
    import re
    import subprocess
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1]) if m else -20.0


VOICE_LUFS = -18.0   # every voice (narrator recording, doctors) at the same loudness
for i, (lid, L) in enumerate(T.items()):
    inputs += ["-i", f"audio/vo/{lid}.wav"]
    ms = int(round(L["s"] * 1000))
    gain = max(-12.0, min(12.0, VOICE_LUFS - lufs(f"audio/vo/{lid}.wav")))
    parts.append(f"[{i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={gain:.2f}dB,adelay={ms}|{ms}[v{i}]")
n = len(T)
vo = "".join(f"[v{i}]" for i in range(n))
# music sits well under the voices: a lower bed, and a deeper, quicker duck whenever anyone speaks
fc = (";".join(parts) + f";{vo}amix=inputs={n}:normalize=0,apad=whole_dur={DUR:.3f},alimiter=limit=0.9[vo];"
      "[vo]asplit=2[vo1][vo2];"
      "[0:a]volume=0.32[mus];[mus][vo1]sidechaincompress=threshold=0.012:ratio=14:attack=25:release=380:makeup=1[duck];"
      f"[duck][vo2]amix=inputs=2:normalize=0,atrim=0:{DUR:.3f},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
run("ffmpeg", "-y", "-loglevel", "error", "-i", "audio/music-sfx.wav", *inputs, "-filter_complex", fc,
    "-map", "[out]", "-ar", "48000", "audio/mix.wav")
print(f"audio/mix.wav {DUR:.2f} s, {n} voice lines, {len(cues)} sound cues")
