"""Transcribe every recorded line in parallel and compare it with its text -> audio/vo/checks.json.
Also writes a loudness envelope (60 Hz) per line for the waveform. Usage: python checkvo.py [ids...]"""
import json
import sys
import wave
from array import array
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import tts

spec = json.loads(Path("lines.json").read_text(encoding="utf-8"))
only = set(sys.argv[1:])
lines = [l for l in spec["lines"] if not only or l["id"] in only]
d = Path("audio/vo")


def envelope(p: Path) -> list[float]:
    with wave.open(str(p)) as w:
        sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    if sw != 2:
        return []
    a = array("h", raw)[::ch]
    hop = sr // 60
    out = []
    for i in range(0, len(a), hop):
        seg = a[i:i + hop]
        out.append((sum(x * x for x in seg) / max(1, len(seg))) ** 0.5 / 32768)
    m = max(out) or 1
    return [round(min(1, x / m), 3) for x in out]


def one(l):
    p = d / f'{l["id"]}.wav'
    said = tts.transcribe(p)
    ok, why = tts.matches(said, l["text"])
    if l["who"] != "N":
        (d / f'{l["id"]}.env.json').write_text(json.dumps(envelope(p)))
    return l["id"], ok, why, said


f = d / "checks.json"
checks = json.loads(f.read_text()) if f.exists() else {}
with ThreadPoolExecutor(6) as ex:
    for lid, ok, why, said in ex.map(one, lines):
        checks[lid] = ok
        print(f"{lid} {'OK ' if ok else 'BAD'} {why} | {said}")
f.write_text(json.dumps(checks, indent=1))
