"""Voice-over with ElevenLabs (free tier): every line of lines.json -> audio/vo/<id>.wav (48 kHz), trimmed.
The API key is read from clinical-video/.env (ELEVENLABS_API_KEY=...) or the environment, never printed.
Usage: python elevenlabs_tts.py [--list] [ids...]"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path

for ENV in (Path(".env"), Path(r"C:\Users\mhrom\Desktop\clinical-summary-desk\backend\.env")):
    if ENV.exists():
        for line in ENV.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
KEY = os.environ.get("ELEVENLABS_API_KEY")
if not KEY:
    raise SystemExit("No ELEVENLABS_API_KEY in clinical-video/.env or the environment")

API = "https://api.elevenlabs.io/v1"
MODEL = "eleven_multilingual_v2"
# preferred premade voices per speaker, first available wins
CAST = {"N": ["Sarah", "Jessica", "Laura"], "H": ["Lily", "Charlotte", "Matilda"], "U": ["Alice", "Matilda", "Laura"], "K": ["George", "Bill", "Brian"]}
SETTINGS = {
    "N": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True},
    "H": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True},
    "U": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.2, "use_speaker_boost": True},
    "K": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.2, "use_speaker_boost": True},
}


def call(path, body=None, accept="application/json"):
    req = urllib.request.Request(API + path, json.dumps(body).encode() if body else None,
                                 {"xi-api-key": KEY, "Content-Type": "application/json", "Accept": accept})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs HTTP {e.code}: {e.read()[:300]!r}")


# ElevenLabs' premade voices have fixed public IDs, so a key without voices_read still works
PREMADE = {"Sarah": "EXAVITQu4vr4xnSDxMaL", "Lily": "pFZP5JQG7iQjIQuC4Bku", "Alice": "Xb7hH8MSUJpSbSDYk0k2",
           "George": "JBFqnCBsd6RMkjVDRZzb", "Laura": "FGY2WhTYpPnrIDTdsKH5", "Matilda": "XrExE9yKIg1WjnnlVkGX",
           "Charlotte": "XB0fDUnXU5powFXDhCwa", "Bill": "pqHfZKP75CvOlQylNhV4", "Brian": "nPczCjzI2devNBz1zQrb", "Jessica": "cgSgspJ2msm6clMCkdW9"}


def voices():
    return dict(PREMADE)


def main(argv):
    available = voices()
    if "--list" in argv:
        print(", ".join(sorted(available)))
        return
    cast = {who: next((available[n] for n in names if n in available), None) for who, names in CAST.items()}
    names = {who: next((n for n in names if n in available), None) for who, names in CAST.items()}
    print("cast:", names)
    spec = json.loads(Path("lines.json").read_text(encoding="utf-8"))
    only = set(argv)
    d = Path("audio/vo"); d.mkdir(parents=True, exist_ok=True)
    durs_file = d / "durations.json"
    durs = json.loads(durs_file.read_text()) if durs_file.exists() else {}
    trim = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,"
            "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse")
    for line in spec["lines"]:
        if only and line["id"] not in only:
            continue
        who = line["who"]
        mp3 = call(f"/text-to-speech/{cast[who]}?output_format=mp3_44100_128",
                   {"text": line.get("say", line["text"]), "model_id": MODEL, "voice_settings": SETTINGS[who]}, accept="audio/mpeg")
        raw = d / f'{line["id"]}.mp3'
        raw.write_bytes(mp3)
        out = d / f'{line["id"]}.wav'
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", trim, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(out)], check=True)
        raw.unlink()
        with wave.open(str(out)) as w:
            durs[line["id"]] = round(w.getnframes() / w.getframerate(), 3)
        durs_file.write_text(json.dumps(durs, indent=1))
        print(f'{line["id"]:>5} {names[who]:<9} {durs[line["id"]]:5.2f} s  {line["text"]}', flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
