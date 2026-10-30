# TORU · presentation (visuals)

The visuals of the 2-minute submission video for TORU (clinical summary desk), AIM Healthcare Hackathon
Vienna, Track 1, as a clickable slide deck. Every frame is drawn in code on a canvas, so each slide plays
its animation and then holds.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer. Nothing to install.

```bash
git clone https://github.com/ProgramHamza/videoaimhackathon.git
cd videoaimhackathon
node present.mjs
```

Then open **http://localhost:8080/slides.html** in Chrome, Edge or Firefox.
To use another port, run `node present.mjs 3000`.

A local server is needed because the page loads its JSON files with `fetch`; opening the HTML file directly
does not work. Any static server works too, for example `python -m http.server 8080`.

## Controls

| Key | Action |
|---|---|
| → · Space · Enter · click | Next slide (plays its animation; press again to skip to the end of it) |
| ← · Backspace | Previous slide |
| Home · End | First · last slide |
| F | Fullscreen |
| S | Subtitles on or off |
| `slides.html#5` | Open a given slide |

`film.html` plays the whole film continuously with a scrubber.

## What is in here

| Path | What it is |
|---|---|
| `slides.html` | The slide deck |
| `film.html` | The continuous film |
| `film-*.html` | One chapter on its own |
| `engine.js`, `springs.js` | Timeline, palette, subtitles, mascots, transitions, spring physics |
| `chapters/` | Opening and doctors, demo, role and how it works, results and limits, map, end card |
| `lines.json` | Narration and doctor quotes, shown as subtitles |
| `timeline.json`, `audio/vo/*.json` | Timing of every line and waveform shapes (numbers only, no sound) |
| `thumbnail.html` | The cover image |
| `present.mjs` | A tiny static server, no dependencies |

## Not in this repo

The screenshots of the running app, the voice recordings and the music stay local. The screenshots show the
challenge's letters. Without them the deck skips the eight demo slides and shows the rest; with the
screenshots in `assets/real/` all 21 slides appear.
