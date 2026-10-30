# Build guide: Clinical Summary Desk, hackathon submission film

You are building ONE chapter file of a 2-minute product film rendered from code (one HTML canvas page,
every frame a pure function of time `t`). Read this whole file before writing code.

## Who watches, and what they must take away
- **Audience:** the jury of the AIM Healthcare Hackathon (Vienna), Track 1 "Clinical Documentation": clinicians
  and technical judges. They score three criteria, a third each:
  1. *Clinical approach and impact:* would a clinician trust and use this screen in that situation?
  2. *Technical quality and AI:* does the screen change with the role and task? Is every fact linked to its source? Does the AI help?
  3. *Execution and prototype:* does the app work end to end, on the five situations and on new ones?
- **The one takeaway:** every fact on the screen links to the sentence it came from.
- **The app:** a clinician types their role and task; the app reads 8 German clinical letters of one synthetic
  patient (Anna Musterfrau, born 15 Mar 1959) and shows one screen with only the facts that task needs, each a
  blue link to its source sentence; it says "Not documented" when the record is silent, and flags contradictions.
- **The hosts:** four characters from the app's login screen ("the buddies": purple, black, orange, yellow, with eyes).
  They are the film's mascots. They watch, react, get surprised, smile, frown. `E.buddies(...)` draws them exactly
  like the app. Use them in your chapter where they add life, never covering a fact the viewer must read.

## Files (shared files are READ-ONLY for you)
- `engine.js`: palette, fonts, plates, timeline, helpers, buddies. **Do not edit.** If you need a helper, write it in your own file.
- `film.html`: the film. **Do not edit.** It loads all four chapter files.
- Your chapter file in `chapters/` (yours alone) and your preview page `film-<chapter>.html` (identical to film.html; renders the whole film, use it for your own frames so your review folder does not collide with other agents).
- `assets/real/*.png`: screenshots of the REAL app (plates). `assets/real/boxes.json`: where elements sit in them.
- `lines.json`: the spoken lines. `audio/vo/durations.json`: their recorded lengths (being re-recorded; never hard-code times).
- Skill docs (read when useful): `C:\Users\mhrom\.claude\skills\take-one\references\timing.md`, `motion-kit.md`, `words.md`, `directed-look.md`.

## The chapter contract
```js
// chapters/<yours>.js
(function () {
  const { W, H, C, T, S, u, fade, clamp, lerp, text, plate, crop, buddies /* ... */ } = E;
  E.chapter('demo', (g, t) => { /* draw the whole frame for global time t, while t is inside E.S.demo */ },
    () => [ /* optional sound cues: { t: seconds, kind: 'tick'|'click'|'whoosh'|'pop'|'hit'|'rise'|'type'|'chime'|'thud', gain: 0..1 } */ ]);
})();
```
- `E.S.<section>` = `[t0, t1]` in seconds; `E.T.<lineId>` = `{ s, e, d, text, who }`: when each voice line starts and ends.
  **Time everything relative to these** (`T.n06.s + 0.3`), never to absolute seconds: the voice is re-recorded and the clock moves.
- The page clears the frame to white before your draw. Draw the entire frame (background included).
- Each section ends with a hard cut to the next one; do your own entrance (first 0.3 s) and do not rely on the next section.
- Pure function of `t`: no `Math.random()` (use `E.hash(n)`), no variables carried between frames, no caching keyed without `t`.

## Look (the app's own design)
- Ground: white `C.bg` or app grey `C.sidebar`; ink `C.ink`; one accent: link blue `C.link` (facts, our results); `C.accent`/`C.accentStrong` for dark grounds; `C.alert` red only for contradictions/limits; `C.mark` = the app's yellow passage highlight. Baselines in greys `C.baseA`, `C.baseB`.
- Type: DM Sans (`E.text` default) and IBM Plex Mono (`font: 'mono'`) for numbers/times. One typeface family, weights 400-700.
- The REAL app is the star: show plates with `E.plate` / `E.crop` (real screenshots); never redraw app UI in code. Code adds camera, cursor, rings, highlights, type, buddies.
- Strict palette, plenty of white space, few words, always big. Nothing that looks like a generic AI explainer (no icon grids, no numbered pill lists, no glowing gradients).

## Rules that are checked (a reviewer and audits will fail the film on these)
- **Motion: springs only** (`E.u(t - start, 'snappy'|'camera'|'heavy'|'playful')`, `Spring.to(t, keys, preset)`). No linear moves.
- **Text size:** anything the viewer must read >= 46 px (captions/labels may go to 36 px only if held long). Hero words 90-200 px.
- **Reading time:** on screen at least 0.3 s per word + 0.5 s, min 1.2 s. One read at a time.
- **Muted viewers:** every stretch with voice has words on screen (the key words of the line, large). `E.spokenLine(g, id, t, x, y, opts)` draws a line whose words appear as spoken.
- **Never cover what matters:** no text or buddy over the fact being shown, no text touching the frame edge (keep >= 80 px margins).
- **Facts are real:** only numbers and claims from this guide. Do not invent data. Examples are the real plates.
- Frame 0 of your section must already show something (no empty white frame).

## The plates and coordinates
Full-screen plates are 2880x1800 = the app at 1440x900 CSS px, 2x. `E.plate(g, name, {cx, cy, vw}, rect, {radius, shadow})`
shows the view centred on CSS point (cx, cy), `vw` CSS px wide, scaled into `rect` on the canvas; it returns `{s, map(bx, by)}`
so you can map any CSS box from `E.BOX` to canvas pixels (for rings, cursors, highlights). Close-up limit: `vw >= 480`
(below that the 2x plate gets soft); for a tighter close-up use the 3x crops.

| Plate | What it shows | Boxes in `E.BOX` |
|---|---|---|
| `sit1-screen` | the anaesthetist's screen: Anticoagulants row (Thrombo ASS 100 mg oral 1-0-0-0), Allergies (Kontrastmittel: Übelkeit, Schwindel, Erbrechen), Airway, Heart function (EF 60%), Previous anaesthesia: **Not documented**, Planned procedures; left: patient + "3 contradictions" (C1 Side differs: links / rechts, C2/C3 BMI); right: documents timeline | `sit1.task, title, thrombo, rowAnticoag, rowAllergy, rowHeart, ef, allergyLink, rowNotDoc, contraList, c1, patient, docs` |
| `sit1-source` | after clicking Thrombo ASS: the source letter (Stat. Patientenbrief) with the sentence "Thrombo ASS 100mg oral 1 0 0 0 ST" highlighted yellow | `source.modal, mark, title` |
| `sit1-contra` | contradiction C1: two quotes side by side, Source A (Radiology 06/2015) starts "Links findet sich…", Source B (Discharge letter 06/2015) starts "Rechts findet sich…" | `contra.modal, title, quotes[0], quotes[1]` |
| `gp-screen` | the GP's screen (Diabetes review): Diabetes control (HbA1c 6,4%), Glucose-lowering medication (Glucophage 1000 mg 1-1-1-0, Actos 30 mg, Byetta), Weight and BMI (… Weight change: **-12.0 kg** (calculated)) | `gp.rowDiabetes, rowGlucose, rowWeight, hba1c, weightChange, task` |
| `de-screen` | the same GP task typed in German: the whole UI in German ("Wichtige Informationen", "Antidiabetische Medikation"), DE toggle active | `de.toggle, title, task` |
| `sit1-bytype` | the documents sidebar in "By type" view | — |
| `search-form-*` (3x crops, 1524x1730) | the real search form: `-empty`, `-patient` (name + birth date filled), `-01`…`-08` (the task typed progressively), `-searching` (button shows "Searching the records…") | `form.form, textarea, submit, scene` (CSS px of the full page; the crop starts 24 CSS px above/left of `form.form`) |
| `row-01…05` (3x crops) | single rows: 01 Anticoagulants, 02 Allergies, 03 Airway, 04 Heart function, 05 Previous anaesthesia (Not documented) | — |

## The numbers you may use (verified in the team's evaluation, docs/report5.html)
- 15 / 15 challenge answers correct (5 situations x 3 questions); 0 partial, 0 wrong.
- Baseline A, "one AI call with the whole record": 5 / 15 correct (4 partial). Baseline B, "simple if/else rules": 8 / 15 (1 partial).
- 27 new (blind) prompts, needed topics addressed: ours 100 %, one AI call 22 %, rules 45 %.
- Traceability (quote found word for word in its document): ours 100 %, one AI call 87 %, rules 100 %.
- Load time: ~2.3 s for the anaesthetist screen in the capture; slowest of the 5 situations about 3 s (3.1 s); target under 10 s.
- Contradictions: we find 3 (laterality links/rechts, two BMI mismatches), 0 false alarms; the record has at least 5 (target 5+). Missed: date mismatches (admission date, biopsy date).
- Without the LLM the scores are the same (15/15); the AI only orders the list.
- One synthetic patient; test prompts written by the team.

## Timeline (the voice)
Sections in order: `open, doc1, demo, doc2, role, scores, limits, how, doc3, end`. Lines (id: text):
- open: n01 "Eight German letters. One patient." · n02 "Two minutes to find what matters before surgery."
- doc1: h01 (Dr. Hromadová, AI-voice placeholder) "Blood thinner, allergy, heart function. Each with the sentence it came from."
- demo: n03 "Type who you are, and what you're doing." · n04 "Two seconds later: one screen, with only what this task needs." · n05 "Blood thinner and dose. Contrast allergy. Ejection fraction, sixty percent." · n06 "Click any fact: its sentence lights up in the original letter." · n07 "Nothing documented? It says so." · n08 "Two letters disagree? Both, side by side."
- doc2: u01 (Dr. Urban, AI-voice placeholder) "I don't have to trust a summary. I read the original myself."
- role: n09 "Change the role: the GP gets her diabetes drugs, HbA1c, and a twelve-kilo weight loss, calculated." · n10 "Type in German, and the screen follows."
- scores: n11 "Tested on the five challenge situations:" · n12 "fifteen of fifteen correct." · n13 "One AI call with the whole record: five. Simple rules: eight." · n14 "On twenty-seven new prompts, every needed topic covered." · n15 "Every quote checked word for word. Slowest screen: three seconds."
- limits: n16 "What doesn't work yet:" · n17 "we catch three of at least five contradictions, and miss the date mismatches." · n18 "One synthetic patient. Test prompts written by us."
- how: n19 "A decision graph picks what matters. A matcher finds the sentences. The AI only orders the list."
- doc3: h02 (Dr. Hromadová) "It tells me what's missing, too. That's why I'd trust it."
- end: no voice, ~4.4 s.

The judging criteria appear as a small tag top-left via `E.criterion(g, n, question, t, t0, t1, dark)`:
demo -> `1, 'Would a clinician trust this screen?'`; role -> `2, 'Does it change with the role and task?'`; scores -> `3, 'Does it work end to end?'`.

## How to check your work (do this, repeatedly)
```bash
source C:/Users/mhrom/Desktop/clinical-video/env.sh        # cd + ffmpeg on PATH + $SK = skill folder
FILM=film-<chapter>.html node frames.mjs 0 <t1>,<t2>,...   # PNGs + sheet.png in review-film-<chapter>/square/
node -e "..."                                               # print E.S / E.T: open the page in frames, or read lines.json + durations
```
To learn your section's times, render a frame with a debug text, or compute them: the page logs nothing by default,
so add a temporary `console.error(JSON.stringify(E.S))` inside your draw while developing (frames.mjs prints console errors), then remove it.
Look at every PNG you render (Read tool) at full size. Check: words readable at phone size, nothing cut by the frame edge, the eye
knows where to look, motion reads in stills as a clear pose, the real plate is crisp (not enlarged past `vw` 480 on 2x plates).
Before you finish, run the text audit and fix every FAIL inside your section's time range:
```bash
node $SK/scripts/text-audit.mjs film-<chapter>.html --step 0.1
```

## When you finish
Reply with: what each beat of your section shows (one line per beat, with its time relative to the voice), your sound cues,
the times you checked, and anything you could not solve. Keep your file self-contained.
