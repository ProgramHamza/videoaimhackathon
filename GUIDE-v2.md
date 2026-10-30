# Guide v2 (read GUIDE.md first, then this: this file wins where they differ)

## What changed
- New script in `lines.json` (new line ids). Sections now: `open, doc1, demo1, demo2, doc2, role, how, scores, next, doc3, end`.
- The user wants: the demo LONGER and richer, statistics SHORTER, MORE motion design (camera moves, zoom-throughs, shared-element hand-offs, punches, wipes), everything readable, NOTHING overlapping.
- **Subtitles are drawn by the engine** for every narrator line (a dark pill at bottom centre). Your chapter must keep the
  **subtitle band free: y > 930 between x 380 and 1540**. Buddies only in the bottom corners (x < 360 or x > 1560). Do not draw your own copy of the spoken sentence; on-screen words are labels/headlines that add to it.
- Motion ideas (take-one motion kit, `C:\Users\mhrom\.claude\skills\take-one\references\motion-kit.md`): log-space zooms (zoom by multiplying vw, not adding), beat punches (scale 1.0 -> 1.04 -> 1.0 on a hit), shared-element hand-offs (a fact's ring grows into the next shot), flood circles (a colour circle grows from the click point to wipe to the next plate), parallax on cards, a slight tilt/scale on cards entering (rotate <= 3 deg, springs).

## Timeline now (estimates; voice re-recorded later, ALWAYS time from E.T / E.S)
open 0-7.1 · doc1 7.1-11.5 · demo1 11.5-~33.1 · demo2 ~33.1-58.5 · doc2 58.5-63.9 · role 63.9-75.0 · how 75.0-86.8 · scores 86.8-103.1 · next 103.1-111.2 · doc3 111.2-116.2 · end 116.2-119.8

Lines: n01 n02 (open) · h01b (doc1, "Every fact, with the sentence it came from.") · a01 "Enter the patient, then the task." · a02 "Two seconds later: one screen." · a03 "Contradictions on the left. What the task needs, in the centre. The original letters, on the right." · a04 "Allergies, blood thinner, airway and heart function come first." · a05 "EF sixty percent. Where from? One click shows the exact sentence in the original letter." · a06 "Here the records disagree: left or right carotid. Both sources, side by side, left unresolved for review." · a07 "Missing information is explicit: previous anaesthesia, not documented." · a08 "Browse every letter by date, or every fact by type." · u01 (doc2) · r01 "Change the role: the GP gets diabetes drugs, HbA1c, and a twelve-kilo weight loss, calculated." · r02 "Type in German, and the screen follows." · w01 "It's hybrid. A decision graph picks what matters. A matcher finds the sentences. Every quote is checked against its source. The AI only orders the list." · s01 "Five challenge situations: fifteen of fifteen correct." · s02 "One AI call with the whole record: five. Simple rules: eight." · s03 "Every contradiction in the test cases, found. Every answer under two and a half seconds." · x01 "Not built yet: a FHIR connection to hospital records." · x02 "Next: a supervised pilot with clinicians." · h02 (doc3).

## Plates now (re-captured with the SHORT task "Anaesthetist, pre-op check before breast surgery")
- `typing/t00` … `typing/t24`: the real search form (3x crop, 1524x1730) with the task typed 2 characters per plate (t00 empty, t24 complete). Name "Anna Musterfrau" and birth date are already filled. `search-form-patient` = before typing, `search-form-08` = complete, `search-form-searching` = button "Searching the records…". In these crops the textarea sits at CSS (form.x-24 ... ): use `E.BOX.form`: the crop's origin is (form.x - 24, form.y - 24) CSS px, at 3x. So textarea in crop px = ((textarea.x - form.x + 24) * 3, (textarea.y - form.y + 24) * 3).
- `sit1-screen`: the anaesthetist's screen (short task). Rows top to bottom (CSS y in `E.BOX.sit1.rows[]`): Allergies and reactions (153), Anticoagulants and antiplatelets (253: Thrombo ASS 100 mg oral 1-0-0-0), Airway and aspiration risk (353: Schlafapnoe…), Heart function (453: EF 60 %), Previous anaesthesia and complications (593: **Not documented**), Current medication (713), Lung disease… (832, below the fold).
  Panels: `E.BOX.sit1.panelLeft` {0,48,300,852} (patient, 3 contradictions), `panelCenter` {300,48,800,852} (Important information), `panelRight` {1100,48,340,852} (Documents timeline). Also `thrombo, ef, allergyLink, rowNotDoc, c1, viewTabs`.
- `sit1-scrolled`: the centre panel scrolled down by 620 px (rows shift up 620): Current medication, Lung, Coagulation, Diabetes, Active problems, Planned procedures, Exercise capacity (Not documented)…
- `sit1-ef-source`: after clicking EF 60 %: the source letter with the echo sentence highlighted. `E.BOX.efSource.mark` {315,400,447,20}, `modal`.
- `sit1-source`: after clicking Thrombo ASS (mark {315,400,256,20}).
- `sit1-contra`: contradiction C1 (Side differs: links / rechts, "Unresolved" tag, two quotes): `E.BOX.contra.*`.
- `sit1-bytype`: right sidebar switched to "By type": every fact grouped under topic headings + "All topics" filter. `sit1-bytype-filter`: the multi-select topic dropdown open.
- `gp-screen`, `de-screen`: unchanged (GP task, German UI).

## Facts you may show (verified) + the user's own claim
15/15 correct (5 situations x 3 questions); one AI call with the whole record 5/15; if/else rules 8/15. 27 new prompts: needed topics 100 % / 22 % / 45 %. Traceability 100 %.
Response time per situation (ours, full system): S1 1.69 s, S2 2.39 s, S3 1.53 s, S4 1.41 s, S5 1.71 s (all under the 10 s target; without the LLM ~0.15 s).
The user states all contradictions in the test cases are found: show as "Contradictions in the test cases: all found" (no number).
Not built yet: FHIR connection to hospital records. Next: supervised pilot with clinicians.
