# TORU · presentation film

The 2-minute submission video for TORU (clinical summary desk), AIM Healthcare Hackathon Vienna, Track 1.
The film is code: every frame is drawn on a canvas by `film.html` as a pure function of time, then captured
to MP4.

## Structure

| Path | What it is |
|---|---|
| `film.html` | The whole film; open it in a browser to play it |
| `engine.js` | Timeline (voice lines set the clock), palette, plates, subtitles, mascots |
| `chapters/` | One file per section: opening, doctors, demo 1 and 2, role, how, scores, next, map, end card |
| `lines.json` | Narration and doctor quotes, in order |
| `music/` | The score, composed in code (calm and upbeat versions) |
| `mix.py` | Voice, music and sound effects, with the music ducked under every voice |
| `capture.mjs` | Drives the running app with Playwright and saves the screenshots the film uses |
| `thumbnail.html` | The cover image |
| `studio/` | A local page showing render progress |

## Not in this repo

The app screenshots (`assets/real/`), the voice recordings (`audio/`) and the rendered video stay local.
The screenshots show the challenge's letters, and the recordings are the team's and the doctors' voices.
Run `node capture.mjs` against the running app to recreate the screenshots.
