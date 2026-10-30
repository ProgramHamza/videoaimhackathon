// "Clear Desk (drive)", the upbeat version of the film's theme: same hook, same chords, 122 bpm.
// Original score for the Clinical Summary Desk film (take-one code music engine).
//
//   bars 0-1    intro   D  A/C#                 kick + hats + pluck arpeggio, the pulse arrives
//   bars 2-9    theme   D A/C# Bm G D/F# G Em7 A    piano hook over the groove, snare backbeat
//   bars 10-17  build   Bm G D A Bm G Em A      hook an octave up, pad opens, sixteenth hats
//   bars 18-21  coda    G A D D                 lift and land, the drums drop on the last bar
import { line } from "file:///C:/Users/mhrom/.claude/skills/take-one/scripts/music/plan.mjs";

const BPB = 4, BPM = 122;
const L = (t, s, role, v = 0.7, extra = {}) => line(t, s, { role, v, bpb: BPB, ...extra });
const DOTTED_EIGHTH = (60 / BPM) * 0.75;

const INTRO = ["D", "A/C#"];
const THEME = ["D", "A/C#", "Bm", "G", "D/F#", "G", "Em7", "A"];
const BUILD = ["Bm", "G", "D", "A", "Bm", "G", "Em7", "A"];
const CODA = ["G", "A", "D", "D"];
const ORDER = [...INTRO, ...THEME, ...BUILD, ...CODA];          // 22 bars
const S_THEME = 2, S_BUILD = 10, S_CODA = 18;

// chord tones for the pluck arpeggio (eighths, up-down) and the pad
const ARP = {
  D: "D4 F#4 A4 D5 A4 F#4 D4 A4", "A/C#": "C#4 E4 A4 C#5 A4 E4 C#4 E4", Bm: "B3 D4 F#4 B4 F#4 D4 B3 F#4",
  G: "B3 D4 G4 B4 G4 D4 B3 D4", "D/F#": "F#4 A4 D5 F#5 D5 A4 F#4 A4", Em7: "E4 G4 B4 D5 B4 G4 E4 G4",
  A: "C#4 E4 A4 C#5 A4 E4 C#4 E4",
};
const PAD = {
  D: "[D4 F#4 A4]", "A/C#": "[C#4 E4 A4]", Bm: "[D4 F#4 B4]", G: "[D4 G4 B4]", "D/F#": "[D4 F#4 A4]",
  Em7: "[D4 G4 B4]", A: "[C#4 E4 A4]",
};
const ROOT = { D: "D2", "A/C#": "C#2", Bm: "B1", G: "G1", "D/F#": "F#2", Em7: "E2", A: "A1" };
const OCT = { D: "D3", "A/C#": "C#3", Bm: "B2", G: "G2", "D/F#": "F#3", Em7: "E3", A: "A2" };

const byBar = (role, v, fn, extra = {}) => {
  const out = [];
  ORDER.forEach((c, b) => { const s = fn(b, c); if (s) out.push(...L(b * BPB, s, role, v, extra)); });
  return out;
};

const clearDeskDrive = () => {
  const melody = [
    ...L(S_THEME * BPB, [
      "F#4:1.5 E4:.5 D4:1 A4:1", //   D      the hook: fall a third, turn, lift
      "E4:2 r:.5 C#4:.5 E4:.5 A4:.5", // A/C#  a pickup keeps it moving
      "F#4:1.5 G4:.5 A4:1 D5:1", //   Bm     the answer, a fourth higher
      "B4:2 r:.5 A4:.5 B4:.5 D5:.5", // G
      "A4:1.5 G4:.5 F#4:1 A4:1", //   D/F#
      "B4:1 D5:1 E5:1 D5:1", //       G      climbing
      "B4:1.5 A4:.5 G4:1 E4:1", //    Em7
      "E4:1 A4:1 C#5:1 E5:1", //      A      run up into the build
    ].join(" | "), "melody", 0.7),
    ...L(S_BUILD * BPB, [
      "D5:1 F#5:1 E5:1 D5:1", //      Bm     the build, an octave up
      "B4:1.5 D5:.5 G5:2", //         G
      "A5:1.5@0.9 F#5:.5 D5:1 F#5:1", // D    the top of the piece
      "E5:2 r:.5 C#5:.5 E5:.5 A5:.5", // A
      "F#5:1 A5:1@0.92 G5:1 F#5:1", // Bm
      "D5:1.5 E5:.5 G5:2", //         G
      "F#5:1 E5:1 D5:1 B4:1", //      Em7
      "C#5:1 E5:1 A5:2", //           A
    ].join(" | "), "melody", 0.74),
    ...L(S_CODA * BPB, [
      "B4:1 D5:1 G5:2", //            G
      "C#5:1 E5:1 A5:2", //           A
      "F#5:1.5 E5:.5 D5:1 A4:1", //   D      the hook one last time
      "D5:4", //                      D      home
    ].join(" | "), "melody", 0.66),
  ];

  const arp = byBar("accomp", 0.55, (b, c) => {
    const notes = ARP[c].split(" ");
    return notes.map((n, i) => `${n}:.5@${i % 2 ? 0.7 : 0.95}`).join(" ");
  }, { roll: 0 });
  const pad = byBar("inner", 0.5, (b, c) => (b < S_THEME ? null : `${PAD[c]}:4`), { roll: 0.02 });
  // driving bass: root on the beat, octave on the offbeat
  const bassL = byBar("bass", 0.78, (b, c) => (b === ORDER.length - 1 ? `${ROOT[c]}:4` :
    b < S_THEME ? `${ROOT[c]}:2 ${ROOT[c]}:2` : `${ROOT[c]}:.5 ${OCT[c]}:.5 ${ROOT[c]}:.5 ${OCT[c]}:.5 ${ROOT[c]}:.5 ${OCT[c]}:.5 ${ROOT[c]}:.5 ${OCT[c]}:.5`));
  const last = ORDER.length - 1;
  const kick = byBar("drum", 0.9, (b) => (b === last ? "C4:4" : "C4:1 C4:1 C4:1 C4:1"));
  const snare = byBar("drum", 0.72, (b) => (b < S_THEME || b === last ? null :
    (b === S_BUILD - 1 || b === S_CODA - 1) ? "r:1 C4:1 r:1 C4:.25@.6 C4:.25@.7 C4:.25@.8 C4:.25@.95" : "r:1 C4:1 r:1 C4:1"));
  const hats = byBar("drum", 0.5, (b) => (b === last ? null :
    b >= S_BUILD && b < S_CODA ? Array.from({ length: 16 }, (_, i) => `C4:.25@${i % 4 === 2 ? 0.9 : i % 2 ? 0.35 : 0.55}`).join(" ")
      : "r:.5 C4:.5@.85 r:.5 C4:.5@.85 r:.5 C4:.5@.85 r:.5 C4:.5@.85"));
  const harmony = ORDER.map((c, b) => ({ t: b * BPB, name: c }));

  return {
    title: "Clear Desk (drive, 122)", seed: 9417, tail: 2.0, harmony, shortForm: clearDeskDriveShort,
    plan: {
      style: "drive", tempo: BPM, meter: "4/4", phraseBars: 4,
      sections: [
        { id: "intro", bars: 2, mood: "drive", key: "D", mode: "major", melody: ["ostinato"], dyn: [0.55, 0.62], optional: true },
        { id: "theme", bars: 8, mood: "triumph", key: "D", mode: "major", melody: ["hook", "arpeggio"], dyn: [0.66, 0.74], repeatable: true },
        { id: "build", bars: 8, mood: "triumph", key: "D", mode: "major", melody: ["hook", "arpeggio"], dyn: [0.76, 0.86], repeatable: true },
        { id: "coda", bars: 4, mood: "triumph", key: "D", mode: "major", melody: ["hook"], dyn: [0.72, 0.6], ending: "tail" },
      ],
    },
    parts: [
      { id: "lead", inst: "piano", role: "melody", notes: melody, gainDb: 1, send: 0.25 },
      { id: "arp", inst: "softPluck", role: "accomp", notes: arp, gainDb: -2, opts: { decay: 0.3, bright: 5200, delay: DOTTED_EIGHTH, feedback: 0.22, delayMix: 0.18 }, send: 0.2 },
      { id: "pad", inst: "warmPad", role: "inner", notes: pad, gainDb: -7, opts: { cut: 2600, attack: 0.3, release: 0.9, spread: 0.7 }, send: 0.35 },
      { id: "bass", inst: "sub", role: "bass", notes: bassL, gainDb: -6, opts: { cut: 400 } },
      { id: "kick", inst: "kick", role: "drum", notes: kick, gainDb: 0.5, send: 0.05 },
      { id: "snare", inst: "snare", role: "drum", notes: snare, gainDb: 5, send: 0.25 },
      { id: "hat", inst: "hat", role: "drum", notes: hats, opts: { pan: 0.2 }, gainDb: 16, send: 0.08 },
    ],
    fx: { duck: { by: "kick", parts: ["pad", "arp"], depth: 0.3, release: 0.2 } },
    stemTargets: { kick: -14, snare: -20, hat: -27, bass: -17, pad: -22, lead: -16, arp: -21 },
  };
};

/** Short form for the closing stretch (~20-25 s): the build's last four bars, then the coda. */
const clearDeskDriveShort = () => {
  const full = clearDeskDrive();
  const keep = (n) => (n.t >= 14 * BPB && n.t < 18 * BPB) || n.t >= 18 * BPB;
  const shift = (n) => ({ ...n, t: n.t - 14 * BPB });
  const parts = full.parts.map((pt) => ({ ...pt, notes: pt.notes.filter(keep).map(shift) }));
  const harmony = full.harmony.filter(keep).map(shift);
  return {
    ...full, title: "Clear Desk (drive, closing)", shortForm: undefined, parts, harmony,
    plan: { ...full.plan, sections: [
      { id: "build", bars: 4, mood: "triumph", key: "D", mode: "major", melody: ["hook"], dyn: [0.74, 0.8] },
      { id: "coda", bars: 4, mood: "triumph", key: "D", mode: "major", melody: ["hook"], dyn: [0.72, 0.6], ending: "tail" },
    ] },
  };
};

export default clearDeskDrive;
export { clearDeskDriveShort };
