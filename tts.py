"""Text to speech with Gemini (the backend's free-tier keys). One WAV per line, trimmed of silence.

Usage (from this folder, with the backend's Python):
  python tts.py lines.json            # every line in lines.json -> audio/vo/<id>.wav, durations -> audio/vo/durations.json
  python tts.py lines.json n6 n13     # only these ids
  python tts.py --cast "text" VoiceA VoiceB ...   # samples -> audio/cast/<voice>.wav

lines.json: {"voices": {"N": "Charon", ...}, "styles": {"N": "Read calmly ...", ...}, "lines": [{"id", "who", "text"}]}
"""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

BACKEND = Path(r"C:\Users\mhrom\Desktop\clinical-summary-desk\backend")
sys.path.insert(0, str(BACKEND))
from app.llm_client import gemini_keys, load_env_file  # noqa: E402

load_env_file(BACKEND / ".env")
KEYS = gemini_keys()
MODEL = "gemini-2.5-pro-preview-tts"
FALLBACK = "gemini-2.5-flash-preview-tts"
RATE = 24000


def speak(text: str, voice: str, out: Path) -> None:
    body = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    last = ""
    for model in (MODEL, FALLBACK):
        for key in KEYS:
            req = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                json.dumps(body).encode(), {"Content-Type": "application/json", "x-goog-api-key": key})
            try:
                r = json.load(urllib.request.urlopen(req, timeout=120))
                pcm = base64.b64decode(r["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
                raw = out.with_suffix(".raw.wav")
                with wave.open(str(raw), "wb") as w:
                    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(pcm)
                trim(raw, out)
                raw.unlink()
                return
            except urllib.error.HTTPError as e:
                last = f"{model} HTTP {e.code}: {e.read()[:160]!r}"
                time.sleep(2)
            except (KeyError, IndexError) as e:
                last = f"{model} no audio: {e}"
    raise SystemExit(f"TTS failed for {out.name}: {last}")


def trim(src: Path, dst: Path) -> None:
    """Cut leading and trailing silence, keep 60 ms of air on each side."""
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,"
          "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,atempo=1.1")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", af, "-ar", "48000", str(dst)], check=True)


def transcribe(p: Path) -> str:
    """What the clip actually says (Gemini listens; the maker cannot)."""
    small = p.with_suffix(".16k.mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(p), "-ac", "1", "-ar", "16000", "-b:a", "48k", str(small)], check=True)
    data = base64.b64encode(small.read_bytes()).decode()
    small.unlink()
    body = {"contents": [{"parts": [
        {"inline_data": {"mime_type": "audio/mp3", "data": data}},
        {"text": "Transcribe this audio exactly, word for word. Output only the words spoken."}]}],
        "generationConfig": {"temperature": 0}}
    for attempt in range(2):
        for key in KEYS:
            req = urllib.request.Request(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
                json.dumps(body).encode(), {"Content-Type": "application/json", "x-goog-api-key": key})
            try:
                r = json.load(urllib.request.urlopen(req, timeout=180))
                return " ".join(part.get("text", "") for part in r["candidates"][0]["content"]["parts"]).strip()
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, KeyError):
                time.sleep(3)
    return ""


def words(s: str) -> list[str]:
    import re
    s = s.lower().replace("hba1c", "hba1c").replace("-", " ")
    return re.findall(r"[a-z0-9äöüß']+", s)


def matches(said: str, text: str) -> tuple[bool, str]:
    """Every word of the line is said, in order, and nothing long was added (e.g. the style prompt)."""
    a, b = words(said), words(text)
    num = {"fifteen": "15", "five": "5", "eight": "8", "three": "3", "sixty": "60", "two": "2",
           "twenty": "20", "seven": "7", "twelve": "12", "one": "1"}
    norm = lambda ws: [num.get(w, w) for w in ws]
    a, b = norm(a), norm(b)
    missing = [w for w in b if w not in a]
    extra = len(a) - len(b)
    ok = len(missing) <= max(1, len(b) // 12) and extra <= 3
    return ok, f"missing={missing[:6]} extra_words={extra}"


def duration(p: Path) -> float:
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def main(argv: list[str]) -> None:
    if argv and argv[0] == "--cast":
        text, voices = argv[1], argv[2:]
        d = Path("audio/cast"); d.mkdir(parents=True, exist_ok=True)
        spoken = text.split(":", 1)[1].strip() if ":" in text else text
        for v in voices:
            if not (d / f"{v}.wav").exists():
                speak(text, v, d / f"{v}.wav")
            said = transcribe(d / f"{v}.wav")
            ok, why = matches(said, spoken)
            wps = len(words(spoken)) / duration(d / f"{v}.wav")
            print(f"{v}: {duration(d / f'{v}.wav'):.2f} s, {wps:.2f} words/s, {'OK' if ok else 'BAD'} {why}\n   heard: {said}")
        return
    spec = json.loads(Path(argv[0]).read_text(encoding="utf-8"))
    only = set(argv[1:])
    d = Path("audio/vo"); d.mkdir(parents=True, exist_ok=True)
    durs_file = d / "durations.json"
    durs = json.loads(durs_file.read_text()) if durs_file.exists() else {}
    from concurrent.futures import ThreadPoolExecutor
    todo = [l for l in spec["lines"] if not only or l["id"] in only]

    def one(line):
        who = line["who"]
        prompt = f'{spec["styles"][who]}\n\n{line["text"]}'
        out = d / f'{line["id"]}.wav'
        try:
            speak(prompt, spec["voices"][who], out)
        except SystemExit as e:
            print(f'{line["id"]:>4} FAILED {e}', flush=True)
            return line, None
        return line, round(duration(out), 3)

    with ThreadPoolExecutor(4) as ex:
        for line, dur in ex.map(one, todo):
            if dur is None:
                continue
            durs[line["id"]] = dur
            print(f'{line["id"]:>4} {line["who"]} {dur:5.2f} s  {line["text"]}', flush=True)
            durs_file.write_text(json.dumps(durs, indent=1))


if __name__ == "__main__":
    main(sys.argv[1:])
