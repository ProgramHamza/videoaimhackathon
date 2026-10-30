// "Clear Desk", a calm, hopeful bed in D for piano, strings and a soft pulse.
// Original score for the Clinical Summary Desk film (take-one code music engine).
//
// THE HOOK: a falling third that turns and lifts (F#4 E4 D4 A4), answered a fourth higher.
//   bars 0-1    intro   D  A/C#                 the pulse alone, pp
//   bars 2-9    theme   D A/C# Bm G D/F# G Em7 A    piano hook, strings join at bar 6
//   bars 10-17  build   Bm G D A Bm G Em A      melody an octave up, eighth-note left hand
//   bars 18-21  coda    G Gm D/F# D             the borrowed Gm (Bb) and home
import { line } from "file:///C:/Users/mhrom/.claude/skills/take-one/scripts/music/plan.mjs";

const BPB = 4;
const mel = (t, s, v = 0.66) => line(t, s, { role: "melody", v, bpb: BPB });
const bass = (t, s, v = 0.6) => line(t, s, { role: "bass", v, bpb: BPB, roll: 0.03 });
const lh = (t, s, v = 0.5) => line(t, s, { role: "accomp", v, bpb: BPB, roll: 0.03 });
const str = (t, s, v = 0.4) => line(t, s, { role: "inner", v, bpb: BPB, roll: 0.02 });
const H = (xs) => xs.map(([t, name]) => ({ t, name }));
const bars = (n0, chords) => chords.map((c, i) => [(n0 + i) * BPB, c]);

const BROKEN = {
  D: "r:.5 A2:.5 D3:.5 F#3:.5 A3:.5 F#3:.5 D3:.5 A2:.5",
  "A/C#": "r:.5 E3:.5 A3:.5 C#4:.5 E4:.5 C#4:.5 A3:.5 E3:.5",
  Bm: "r:.5 F#3:.5 B3:.5 D4:.5 F#4:.5 D4:.5 B3:.5 F#3:.5",
  G: "r:.5 D3:.5 G3:.5 B3:.5 D4:.5 B3:.5 G3:.5 D3:.5",
  "D/F#": "r:.5 A3:.5 D4:.5 F#4:.5 A4:.5 F#4:.5 D4:.5 A3:.5",
  Em7: "r:.5 E3:.5 G3:.5 B3:.5 D4:.5 B3:.5 G3:.5 E3:.5",
  A: "r:.5 E3:.5 A3:.5 C#4:.5 E4:.5 C#4:.5 A3:.5 E3:.5",
  Gm: "r:.5 D3:.5 G3:.5 Bb3:.5 D4:.5 Bb3:.5 G3:.5 D3:.5",
};
const SPARSE = { D: "r:1 A3:1 D4:2", "A/C#": "r:1 A3:1 C#4:2", G: "r:1 B3:1 D4:2", Gm: "r:1 Bb3:1 D4:2", "D/F#": "r:1 A3:1 D4:2" };
const PAD = {
  D: "[D3 F#3 A3]:4", "A/C#": "[C#3 E3 A3]:4", Bm: "[D3 F#3 B3]:4", G: "[D3 G3 B3]:4", "D/F#": "[D3 F#3 A3]:4",
  Em7: "[D3 G3 B3]:4", A: "[C#3 E3 A3]:4", Gm: "[D3 G3 Bb3]:4",
};

const THEME = ["D", "A/C#", "Bm", "G", "D/F#", "G", "Em7", "A"];
const BUILD = ["Bm", "G", "D", "A", "Bm", "G", "Em7", "A"];
const CODA = ["G", "Gm", "D/F#", "D"];
const BASS = { D: "D2", "A/C#": "C#2", Bm: "B1", G: "G1", "D/F#": "F#1", Em7: "E2", A: "A1", Gm: "G1" };

const clearDesk = () => {
  const T0 = 2 * BPB, B0 = 10 * BPB, C0 = 18 * BPB;
  const melody = [
    ...mel(T0, [
      "F#4:1.5 E4:.5 D4:1 A4:1", //   D      the hook: fall a third, turn, lift
      "E4:3 r:1", //                  A/C#
      "F#4:1.5 G4:.5 A4:1 D5:1", //   Bm     the answer, a fourth higher
      "B4:3 r:1", //                  G
      "A4:1.5 G4:.5 F#4:1 A4:1", //   D/F#
      "B4:1 D5:1 E5:1 D5:1", //       G      climbing
      "B4:1.5 A4:.5 G4:1 E4:1", //    Em7
      "E4:2 A4:2", //                 A      half cadence, lifting into what comes next
    ].join(" | ")),
    ...mel(B0, [
      "D5:1 F#5:1 E5:1 D5:1", //      Bm     the build, an octave up
      "B4:2 D5:2", //                 G
      "A5:2@0.9 F#5:1 D5:1", //       D      the top of the piece
      "E5:3 r:1", //                  A
      "F#5:1 A5:1@0.92 G5:1 F#5:1", // Bm
      "D5:2 G5:2", //                 G
      "F#5:1 E5:1 D5:1 B4:1", //      Em7
      "C#5:2 E5:2", //                A
    ].join(" | "), 0.7),
    ...mel(C0, [
      "D5:3 B4:1", //                 G      coda, quiet
      "Bb4:2 A4:1 G4:1", //           Gm     the borrowed Bb
      "A4:2 F#4:2", //                D/F#
      "D4:4", //                      D      home
    ].join(" | "), 0.56),
  ];
  const chords = [["D", "A/C#"], THEME, BUILD, CODA];
  const order = chords.flat();
  const bassLine = bass(0, order.map((c, i) => (i >= 10 && i < 18 ? `r:.5 ${BASS[c]}:3.5` : `${BASS[c]}:4`)).join(" | "));
  const accomp = lh(0, order.map((c, i) => (i < 2 || i >= 18 ? SPARSE[c] : BROKEN[c])).join(" | "));
  const pad = str(6 * BPB, order.slice(6).map((c) => PAD[c]).join(" | "));
  const harmony = H(order.map((c, i) => [i * BPB, c.replace("Em7", "Em7")]));
  return {
    title: "Clear Desk (bed in D)", seed: 9301, tail: 2.2, harmony, shortForm: clearDeskShort,
    plan: {
      style: "cinematic", tempo: 84, meter: "4/4", phraseBars: 4,
      sections: [
        { id: "intro", bars: 2, mood: "hopeful", key: "D", mode: "major", melody: ["stepwise"], dyn: [0.3, 0.36], optional: true },
        { id: "theme", bars: 8, mood: "hopeful", key: "D", mode: "major", melody: ["hook", "stepwise"], dyn: [0.42, 0.58], repeatable: true, variations: ["octaveDouble", "thin"] },
        { id: "build", bars: 8, mood: "hopeful", key: "D", mode: "major", melody: ["hook", "sequence"], dyn: [0.6, 0.8], repeatable: true },
        { id: "coda", bars: 4, mood: ["hopeful", "tender", 0.5], key: "D", mode: "major", melody: ["themeTransformation"], dyn: [0.4, 0.28], ending: "tail" },
      ],
    },
    parts: [
      { id: "rh", inst: "piano", role: "melody", notes: melody },
      { id: "lh", inst: "piano", role: "accomp", notes: [...bassLine, ...accomp] },
      { id: "str", inst: "strings", role: "inner", notes: pad, gainDb: -11, opts: { attack: 1.1, release: 1.6, bright: 0.5, width: 0.7 }, send: 1.2 },
    ],
  };
};

/** Short form for the closing stretch (~20-25 s): the theme's last four bars, then the coda. */
const clearDeskShort = () => {
  const full = clearDesk();
  const keep = (n) => (n.t >= 6 * BPB && n.t < 10 * BPB) || n.t >= 18 * BPB;
  const shift = (n) => ({ ...n, t: n.t >= 18 * BPB ? n.t - 14 * BPB + 0 * BPB - 0 : n.t - 6 * BPB });
  const parts = full.parts.map((pt) => ({ ...pt, notes: pt.notes.filter(keep).map(shift) }));
  const harmony = full.harmony.filter(keep).map(shift);
  return {
    ...full, title: "Clear Desk (closing)", shortForm: undefined, parts, harmony,
    plan: { ...full.plan, ritard: 0.75, sections: [
      { id: "theme", bars: 4, mood: "hopeful", key: "D", mode: "major", melody: ["hook"], dyn: [0.45, 0.55] },
      { id: "coda", bars: 4, mood: "tender", key: "D", mode: "major", melody: ["themeTransformation"], dyn: [0.42, 0.3], ending: "tail" },
    ] },
  };
};

export default clearDesk;
export { clearDeskShort };
