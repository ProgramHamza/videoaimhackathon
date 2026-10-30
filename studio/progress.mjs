// Update the studio monitor. Examples:
//   node studio/progress.mjs step 3 run "Cast and record the voices"     (index is 1-based; s = todo|run|done)
//   node studio/progress.mjs now "Recording line n05"
//   node studio/progress.mjs log "Captured 46 plates"
//   node studio/progress.mjs image review/square/sheet.png "Stills, take 1"
//   node studio/progress.mjs film film.html        (bumps the live player)
//   node studio/progress.mjs cut out/take1.mp4
//   node studio/progress.mjs voice                 (re-reads lines.json + audio/vo/*)
//   node studio/progress.mjs judge "Clinical (33%)" 7.5 "trust: …"
//   node studio/progress.mjs done
import fs from 'node:fs';

const F = new URL('./progress.json', import.meta.url);
const st = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : { steps: [], log: [], images: [], voice: [], judges: [] };
const [cmd, ...a] = process.argv.slice(2);
const stamp = () => new Date().toTimeString().slice(0, 5);
const log = (msg) => { st.log = [...(st.log || []), { at: stamp(), msg }].slice(-80); };

if (cmd === 'steps') st.steps = JSON.parse(a[0]).map((t) => ({ t, s: 'todo' }));
if (cmd === 'step') { const i = Number(a[0]) - 1; st.steps[i].s = a[1]; if (a[2]) st.steps[i].t = a[2]; if (a[1] === 'run') { st.now = st.steps[i].t; log('started: ' + st.steps[i].t); } if (a[1] === 'done') log('done: ' + st.steps[i].t); }
if (cmd === 'now') { st.now = a[0]; log(a[0]); }
if (cmd === 'log') log(a[0]);
if (cmd === 'image') { st.images = [{ src: a[0], cap: a[1] || a[0], v: Date.now() }, ...(st.images || []).filter((i) => i.src !== a[0])].slice(0, 12); log('new frames: ' + (a[1] || a[0])); }
if (cmd === 'film') { st.film = a[0]; st.filmVersion = String(Date.now()); log('live film updated'); }
if (cmd === 'cut') { st.cut = a[0]; log('exported: ' + a[0]); }
if (cmd === 'judge') { st.judges = [...(st.judges || []).filter((j) => j.who !== a[0]), { who: a[0], score: a[1], note: a[2] || '' }]; log(`judge ${a[0]}: ${a[1]}`); }
if (cmd === 'judges-clear') st.judges = [];
if (cmd === 'eta') { st.etaAt = Date.now() + Number(a[0]) * 60000; st.etaSet = Date.now(); log('estimate: ready in ~' + a[0] + ' min'); }
if (cmd === 'pct') { st.pct = Number(a[0]); }
if (cmd === 'done') { st.done = true; st.now = 'Delivered'; log('delivered'); }
if (cmd === 'voice') {
  const spec = JSON.parse(fs.readFileSync(new URL('../lines.json', import.meta.url), 'utf8'));
  const durs = fs.existsSync(new URL('../audio/vo/durations.json', import.meta.url)) ? JSON.parse(fs.readFileSync(new URL('../audio/vo/durations.json', import.meta.url), 'utf8')) : {};
  const checks = fs.existsSync(new URL('../audio/vo/checks.json', import.meta.url)) ? JSON.parse(fs.readFileSync(new URL('../audio/vo/checks.json', import.meta.url), 'utf8')) : {};
  const who = { N: 'Narrator', H: 'Hromadová (AI placeholder)', U: 'Urban (AI placeholder)', K: 'Kolieska (AI placeholder)' };
  st.voice = spec.lines.map((l) => ({ id: l.id, who: who[l.who] || l.who, text: l.text, dur: durs[l.id], ok: checks[l.id], src: durs[l.id] ? `audio/vo/${l.id}.wav` : null, v: durs[l.id] }));
}
fs.writeFileSync(F, JSON.stringify(st, null, 1));
