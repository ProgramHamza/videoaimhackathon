"""Voice-over with Kokoro (open-weight, local, free): every line of lines.json -> audio/vo/<id>.wav (48 kHz),
trimmed of silence; durations -> audio/vo/durations.json.
Usage: tts-venv/Scripts/python kokoro_tts.py [ids...]"""
import json
import subprocess
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

VOICES = {"N": "af_heart", "H": "bf_emma", "U": "af_bella", "K": "bm_george"}
SPEED = {"N": 0.97, "H": 0.97, "U": 0.97, "K": 0.95}

spec = json.loads(Path("lines.json").read_text(encoding="utf-8"))
only = set(sys.argv[1:])
kokoro = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
d = Path("audio/vo"); d.mkdir(parents=True, exist_ok=True)
durs_file = d / "durations.json"
durs = json.loads(durs_file.read_text()) if durs_file.exists() else {}
TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse")
for line in spec["lines"]:
    if only and line["id"] not in only:
        continue
    who = line["who"]
    samples, rate = kokoro.create(line["text"], voice=VOICES[who], speed=SPEED[who], lang="en-us" if who != "H" and who != "K" else "en-gb")
    raw = d / f'{line["id"]}.raw.wav'
    sf.write(raw, samples, rate)
    out = d / f'{line["id"]}.wav'
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", TRIM, "-ar", "48000", str(out)], check=True)
    raw.unlink()
    info = sf.info(out)
    durs[line["id"]] = round(info.frames / info.samplerate, 3)
    durs_file.write_text(json.dumps(durs, indent=1))
    print(f'{line["id"]:>5} {VOICES[who]:<10} {durs[line["id"]]:5.2f} s  {line["text"]}', flush=True)
