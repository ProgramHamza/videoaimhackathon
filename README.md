# TORU · presentation film (visuals)

The visuals of the 2-minute submission video for TORU (clinical summary desk), AIM Healthcare Hackathon
Vienna, Track 1. The film is code: every frame is drawn on a canvas by `film.html` as a pure function of time.

## View it

```bash
node serve.mjs
```

Then open `http://localhost:<port>/film.html` (the port is printed). A local server is needed because
the page reads its JSON files with `fetch`.

## Structure

| Path | What it is |
|---|---|
| `film.html` | The whole film, with a scrubber |
| `film-*.html` | One chapter on its own, for quick review |
| `engine.js` | Timeline, palette, subtitles, mascots, transitions |
| `chapters/` | Opening and doctors, demo 1 and 2, role and how, scores and limits, map, end card |
| `lines.json` | Narration and doctor quotes shown as subtitles |
| `timeline.json`, `audio/vo/*.json` | Timing of every line and the waveform shapes (numbers only, no sound) |
| `thumbnail.html` | The cover image |

## Not in this repo

The app screenshots used in the demo chapters, the voice recordings and the music stay local, so the
demo chapters draw empty frames here. The screenshots show the challenge's letters.
