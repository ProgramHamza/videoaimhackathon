// Shared engine for the Clinical Summary Desk film. Chapters (chapters/*.js) draw on top of it.
// Contract: every frame is a pure function of t. No Math.random at draw time, no state between frames.
(function () {
  const W = 1920, H = 1080;

  // ---- palette: the app's own tokens (frontend/src/index.css) ----
  const C = {
    bg: '#ffffff', paper: '#fafbfb', sidebar: '#f4f5f5', ink: '#182027', muted: '#66727b', rule: '#dce1e4',
    ruleStrong: '#bec8cf', accent: '#203e57', accentStrong: '#142a3d', accentWash: '#edf2f6', link: '#1f5a94',
    linkWash: '#e9f0f7', alert: '#a03a3a', alertWash: '#f8f0ef', mark: '#f3e3b3', ok: '#1d7a46', night: '#0e1a24',
    purple: '#6b2bff', black: '#22252a', orange: '#ff7a21', yellow: '#e9d21d', baseA: '#9aa6ae', baseB: '#c4ccd2',
  };
  const SANS = "'DM Sans Film', 'DM Sans', system-ui, sans-serif";
  const MONO = "'IBM Plex Mono Film', ui-monospace, monospace";

  // ---- assets ----
  const PLATES = ['sit1-screen', 'sit1-source', 'sit1-ef-source', 'sit1-contra', 'gp-screen', 'de-screen', 'sit1-bytype', 'sit1-bytype-filter', 'sit1-scrolled', 'search-empty',
    'search-form-empty', 'search-form-patient', 'search-form-01', 'search-form-02', 'search-form-03', 'search-form-04',
    'search-form-05', 'search-form-06', 'search-form-07', 'search-form-08', 'search-form-searching', 'search-form-importing',
    'row-01-anticoagulants-and-antiplatelets', 'row-02-allergies-and-reactions', 'row-03-airway-and-aspiration-risk',
    'row-04-heart-function', 'row-05-previous-anaesthesia-and-complications'];
  const P = {};               // name -> HTMLImageElement
  let BOX = {};               // element boxes in CSS px of a 1440x900 app viewport (assets/real/boxes.json)
  let DUR = {};               // voice line durations (audio/vo/durations.json); estimated until recorded
  const ENV = {};             // voice loudness envelopes at 60 Hz (audio/vo/<id>.env.json), for waveforms
  let LINES = [];             // [{id, who, text}] from lines.json

  // ---- timeline: the voice sets the clock ----
  // gap = silence before the line starts (seconds after the previous line ends)
  // the demo breathes (time for the camera and the clicks); the statistics move fast
  // pacing: dense slides get the time (spotlight a04, letter a06, contradiction a07, by-type before u01, bars s03, per-situation x01)
  // pacing: dense slides keep the most time (typing a02, spotlight a04, letter a06, contradiction a07, by-type u01)
  const GAP = { n01: 0.4, n02: 0.25, h01b: 0.4, a01: 0.55, a02: 4.2, a03: 0.4, a04: 0.55, a05: 0.45, a06: 0.55, a07: 0.5,
    a08: 0.35, u01: 0.85, r01: 0.4, w01: 0.5, s01: 0.5, s02: 0.4, s03: 0.45, s04: 0.5, x01: 0.6, k01: 0.45, x02: 0.45 };
  const END_HOLD = 1.8;
  const FILM_LEN = 115;   // aim 1:55; the end card absorbs slack, never under END_HOLD
  const T = {};               // T[id] = {s, e, d, text, who}
  const S = {};               // sections: S.open = [t0, t1], ...
  function buildTimeline() {
    let t = 0;
    for (const l of LINES) {
      const words = l.text.split(/\s+/).length;
      const d = DUR[l.id] ?? words / 2.45 + 0.25;
      const s = t + (GAP[l.id] ?? 0.4);
      T[l.id] = { s, e: s + d, d, text: l.text, who: l.who, keys: l.keys ?? [] };
      t = s + d;
    }
    const at = (id, k) => T[id][k];
    S.open = [0, at('h01b', 's') - 0.35];
    S.doc1 = [S.open[1], at('h01b', 'e') + 0.5];
    S.demo1 = [S.doc1[1], at('a05', 's') - 0.4];
    S.demo2 = [S.demo1[1], at('u01', 's') - 0.35];
    S.doc2 = [S.demo2[1], at('u01', 'e') + 0.5];
    S.role = [S.doc2[1], at('w01', 's') - 0.4];   // r02 (German) removed
    S.how = [S.role[1], at('s01', 's') - 0.4];
    S.scores = [S.how[1], at('x01', 's') - 0.45];
    S.next = [S.scores[1], at('k01', 's') - 0.35];
    S.doc3 = [S.next[1], at('k01', 'e') + 0.5];
    S.map = [S.doc3[1], at('x02', 'e') + 0.5];
    // the end card takes whatever is left: the film is exactly FILM_LEN seconds (never under END_HOLD of end card)
    S.end = [S.map[1], Math.max(S.map[1] + END_HOLD, FILM_LEN)];
    window.FILM_DURATION = S.end[1];
    window.CUTS = Object.values(S).slice(1).map((r) => +r[0].toFixed(3));
  }

  // ---- math ----
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const u = (t, preset = 'snappy') => Spring.unit(t, preset);          // 0 -> 1 spring from t = 0
  const fade = (t, t0, t1, d = 0.25) => clamp((t - t0) / d, 0, 1) * clamp((t1 - t) / d, 0, 1); // in at t0, out by t1
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---- drawing helpers ----
  function reset(g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowColor = 'transparent'; g.shadowBlur = 0; }
  function fill(g, color) { g.fillStyle = color; g.fillRect(0, 0, W, H); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

  /** Text. o: {size, weight, color, align, base, font:'sans'|'mono', alpha, tracking, maxW} */
  function text(g, str, x, y, o = {}) {
    g.save();
    g.globalAlpha *= o.alpha ?? 1;
    g.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 500} ${o.size ?? 48}px ${o.font === 'mono' ? MONO : SANS}`;
    g.fillStyle = o.color ?? C.ink;
    g.textAlign = o.align ?? 'left';
    g.textBaseline = o.base ?? 'alphabetic';
    if (o.tracking) g.letterSpacing = `${o.tracking}px`;
    g.fillText(str, x, y, o.maxW);
    g.restore();
  }
  function measure(g, str, o = {}) {
    g.save(); g.font = `${o.weight ?? 500} ${o.size ?? 48}px ${o.font === 'mono' ? MONO : SANS}`;
    if (o.tracking) g.letterSpacing = `${o.tracking}px`;
    const w = g.measureText(str).width; g.restore(); return w;
  }
  /** Greedy word wrap -> lines. */
  function wrap(g, str, maxW, o = {}) {
    const words = str.split(' '), out = []; let cur = '';
    for (const w of words) { const n = cur ? cur + ' ' + w : w; if (measure(g, n, o) > maxW && cur) { out.push(cur); cur = w; } else cur = n; }
    if (cur) out.push(cur); return out;
  }
  /** A line whose words appear as they are said (estimated across the voice line's duration). */
  function spokenLine(g, id, t, x, y, o = {}) {
    const L = T[id]; if (!L) return;
    const words = (o.text ?? L.text).split(' ');
    const lines = wrap(g, words.join(' '), o.maxW ?? 1500, o);
    const lh = (o.size ?? 64) * (o.lh ?? 1.18);
    let k = 0;
    lines.forEach((ln, li) => {
      let cx = x;
      if ((o.align ?? 'left') === 'center') cx = x - measure(g, ln, o) / 2;
      for (const w of ln.split(' ')) {
        const at = L.s + (k / words.length) * L.d * 0.92;
        const p = clamp((t - at) / 0.18, 0, 1);
        const lit = o.dim ? lerp(o.dimAlpha ?? 0.28, 1, p) : p;
        text(g, w, cx, y + li * lh + (1 - p) * 10 * (o.rise ?? 1), { ...o, align: 'left', alpha: (o.alpha ?? 1) * lit });
        cx += measure(g, w + ' ', o);
        k++;
      }
    });
    return lines.length * lh;
  }

  /**
   * Draw part of a full-screen app plate.
   * cam: {cx, cy, vw} in app CSS px (1440x900 viewport): the view is centred on (cx, cy) and shows vw CSS px across.
   * rect: where it lands on the canvas (default full frame). o: {radius, shadow, alpha}
   */
  function plate(g, name, cam, rect = { x: 0, y: 0, w: W, h: H }, o = {}) {
    const img = P[name]; if (!img) return;
    const k = img.width / 1440;                       // plate pixels per CSS px (2 or 3)
    const s = rect.w / cam.vw;                        // canvas px per CSS px
    g.save();
    g.globalAlpha *= o.alpha ?? 1;
    if (o.shadow) { g.save(); g.shadowColor = 'rgba(16,30,40,0.22)'; g.shadowBlur = o.shadow; g.shadowOffsetY = o.shadow / 3; rr(g, rect.x, rect.y, rect.w, rect.h, o.radius ?? 0); g.fillStyle = '#fff'; g.fill(); g.restore(); }
    rr(g, rect.x, rect.y, rect.w, rect.h, o.radius ?? 0); g.clip();
    const sx = (cam.cx - cam.vw / 2), sy = (cam.cy - (rect.h / s) / 2);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, sx * k, sy * k, cam.vw * k, (rect.h / s) * k, rect.x, rect.y, rect.w, rect.h);
    g.restore();
    return { s, sx, sy, map: (bx, by) => [rect.x + (bx - sx) * s, rect.y + (by - sy) * s] };
  }
  /** Draw a cropped plate (search-form-*, row-*) whole, scaled to width w at (x, y). Returns the scale (canvas px per plate px). */
  function crop(g, name, x, y, w, o = {}) {
    const img = P[name]; if (!img) return 1;
    const s = w / img.width, h = img.height * s;
    g.save(); g.globalAlpha *= o.alpha ?? 1;
    if (o.shadow) { g.shadowColor = 'rgba(16,30,40,0.18)'; g.shadowBlur = o.shadow; g.shadowOffsetY = o.shadow / 3; }
    if (o.radius) { rr(g, x, y, w, h, o.radius); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent'; g.clip(); }
    g.drawImage(img, x, y, w, h);
    g.restore();
    return s;
  }

  /** A big pointer cursor; press 0..1 dips it. */
  function cursor(g, x, y, press = 0, scale = 1.6) {
    g.save(); g.translate(x, y); g.scale(scale * (1 - 0.12 * press), scale * (1 - 0.12 * press));
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 26); g.lineTo(6.5, 20); g.lineTo(11, 30); g.lineTo(15, 28); g.lineTo(10.5, 18.5); g.lineTo(19, 18.5); g.closePath();
    g.fillStyle = '#111'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineJoin = 'round';
    g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 6; g.shadowOffsetY = 2; g.stroke(); g.fill();
    g.restore();
    if (press > 0) { g.save(); g.globalAlpha = 0.35 * (1 - press); g.strokeStyle = C.link; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 18 + 30 * press, 0, Math.PI * 2); g.stroke(); g.restore(); }
  }
  /** A ring drawn around a rect as p goes 0 -> 1. */
  function ring(g, x, y, w, h, p, color = C.link, pad = 10, width = 4) {
    if (p <= 0) return;
    g.save(); g.globalAlpha *= clamp(p * 1.4, 0, 1); g.strokeStyle = color; g.lineWidth = width;
    const e = 1 + 0.06 * (1 - p);
    const cx = x + w / 2, cy = y + h / 2, ww = (w + pad * 2) * e, hh = (h + pad * 2) * e;
    rr(g, cx - ww / 2, cy - hh / 2, ww, hh, 10); g.stroke(); g.restore();
  }
  /** Small upper-case label. */
  function eyebrow(g, str, x, y, o = {}) { text(g, str.toUpperCase(), x, y, { size: 22, weight: 600, tracking: 4, color: C.muted, ...o }); }

  /** The judging question a chapter answers, top-left. */
  function criterion(g, n, question, t, t0, t1, dark = false) {
    const a = fade(t, t0, t1, 0.35);
    if (a <= 0) return;
    const x = 96, y = 92;
    g.save(); g.globalAlpha = a;
    rr(g, x - 4, y - 40, 62, 62, 31); g.fillStyle = dark ? '#ffffff' : C.ink; g.fill();
    text(g, String(n), x + 27, y + 5, { size: 40, weight: 700, align: 'center', color: dark ? C.ink : '#fff' });
    text(g, question, x + 74, y + 4, { size: 40, weight: 600, color: dark ? '#ffffff' : C.ink });
    g.restore();
  }

  /** Name lower third for the clinician segments (on black). */
  function lowerThird(g, name, role, t, t0, t1, extra) {
    const a = fade(t, t0, t1, 0.4), p = u(t - t0, 'heavy');
    if (a <= 0) return;
    g.save(); g.globalAlpha = a;
    const x = 140, y = 820;
    const h = extra ? 156 : 104;
    g.fillStyle = C.orange; g.fillRect(x, y - 52 + (1 - p) * 20, 6, h);
    text(g, name, x + 30, y - 6 + (1 - p) * 20, { size: 46, weight: 600, color: '#fff' });
    text(g, role, x + 30, y + 44 + (1 - p) * 20, { size: 36, weight: 400, color: '#b8c2c8' });
    if (extra) text(g, extra, x + 30, y + 94 + (1 - p) * 20, { size: 36, weight: 600, color: '#ffb27a' });
    g.restore();
  }
  /** A voice waveform for a line, pulsing with its recorded loudness. */
  function waveform(g, id, t, cx, cy, w, h, color = '#ffffff') {
    const L = T[id]; if (!L) return;
    const env = ENV[id];
    const N = 64, step = w / N;
    g.save(); g.fillStyle = color;
    for (let i = 0; i < N; i++) {
      const tt = t - (N / 2 - i) * 0.012;
      let a;
      if (env && tt >= L.s && tt <= L.e) a = env[Math.floor((tt - L.s) * 60)] ?? 0;
      else a = (tt >= L.s && tt <= L.e) ? 0.35 + 0.35 * Math.abs(Math.sin(tt * 9 + i * 0.7)) * Math.abs(Math.sin(tt * 3.3 + i)) : 0;
      const bh = Math.max(4, a * h * (0.55 + 0.45 * Math.sin(i * 0.9 + 1)));
      g.globalAlpha = 0.35 + 0.65 * clamp(a * 1.5, 0, 1);
      rr(g, cx - w / 2 + i * step + step * 0.25, cy - bh / 2, step * 0.5, bh, step * 0.25); g.fill();
    }
    g.restore();
  }

  // ---- the buddies: the four characters from the app's login screen (PatientSearch.jsx) ----
  const BUDDIES = [
    { id: 'purple', color: C.purple, left: 62, width: 104, height: 232, radius: [0, 0], face: { top: 26, left: 34 }, eyes: 'dot', gap: 20 },
    { id: 'black', color: C.black, left: 150, width: 62, height: 164, radius: [0, 0], face: { top: 22, left: 12 }, eyes: 'ball', gap: 22 },
    { id: 'orange', color: C.orange, left: 0, width: 178, height: 92, radius: [89, 89], face: { top: 34, left: 62 }, eyes: 'dot', gap: 30 },
    { id: 'yellow', color: C.yellow, left: 196, width: 80, height: 122, radius: [40, 40], face: { top: 34, left: 18 }, eyes: 'dot', gap: 20 },
  ];
  const EXPR = {
    idle: { purple: 'short', black: null, orange: 'smile', yellow: 'line' },
    look: { purple: 'smile', black: null, orange: 'o', yellow: 'smile' },
    task: { purple: 'smile', black: null, orange: 'smile', yellow: 'o' },
    searching: { purple: 'o', black: null, orange: 'o', yellow: 'o' },
    error: { purple: 'frown', black: null, orange: 'frown', yellow: 'frown' },
    success: { purple: 'smile', black: null, orange: 'smile', yellow: 'smile' },
    surprised: { purple: 'O', black: 'O', orange: 'O', yellow: 'O' },
  };
  function mouthPath(g, kind) {
    g.beginPath();
    if (kind === 'line') { g.moveTo(3, 6); g.lineTo(21, 6); }
    else if (kind === 'short') { g.moveTo(8, 6); g.lineTo(16, 6); }
    else if (kind === 'smile') { g.moveTo(4, 3); g.quadraticCurveTo(12, 12, 20, 3); }
    else if (kind === 'frown') { g.moveTo(4, 10); g.quadraticCurveTo(12, 2, 20, 10); }
    else if (kind === 'o') g.ellipse(12, 6, 3.6, 4, 0, 0, Math.PI * 2);
    else if (kind === 'O') g.ellipse(12, 6, 5.2, 6.2, 0, 0, Math.PI * 2);
  }
  /**
   * Draw the four buddies. (x, y) = bottom-left of their 276x260 scene on the canvas; s = scale.
   * st: {mode, look: [x, y] canvas point they look at, hop: 0..1 (a hop height), bob: true, surprise: 0..1, seed}
   */
  function buddies(g, x, y, s, t, st = {}) {
    s *= 1.08;                                         // the hosts read 8% bigger everywhere (anchored at their bottom-left)
    const mode = st.mode ?? 'idle';
    const surprise = clamp(st.surprise ?? (mode === 'surprised' ? 1 : 0), 0, 1);
    const ex = EXPR[surprise > 0.5 ? 'surprised' : mode] ?? EXPR.idle;
    for (const [i, c] of BUDDIES.entries()) {
      const bottom = y, left = x + c.left * s;
      const cx = left + (c.width * s) / 2, faceY = bottom - c.height * s + c.face.top * s;
      const [lx, ly] = st.look ?? [cx + 200 * s, faceY];
      const dx = (lx - cx) / s, dy = (ly - faceY) / s;
      let skew = clamp(-dx / 45, -9, 9);
      if (mode === 'error') skew = c.id === 'purple' ? 10 : 4;
      if (mode === 'success') skew = 0;
      let stretch = (mode === 'searching' || mode === 'look' || mode === 'task') && c.id !== 'orange' ? 1.05 : 1;
      stretch += 0.08 * surprise * (c.id === 'orange' ? 0.5 : 1);
      const reach = c.eyes === 'ball' ? 7 : 11;
      const fx = clamp(dx / 18, -reach, reach), fy = clamp(dy / 26, -reach * 0.7, reach * 0.7);
      const px = clamp(dx / 40, -3, 3), py = clamp(dy / 50, -3, 3);
      let lift = 0;
      if (st.bob) lift += 6 * (0.5 - 0.5 * Math.cos((t * 2 * Math.PI) / 1.2 + i * 0.75));
      if (st.hop) lift += 22 * st.hop * Math.max(0, Math.sin(clamp((st.hopT ?? 0) - i * 0.06, 0, 0.5) * 2 * Math.PI));
      lift += 18 * surprise * Math.max(0, Math.sin(clamp((st.surpriseT ?? 0) - i * 0.05, 0, 0.45) / 0.45 * Math.PI));
      g.save();
      g.translate(cx, bottom - lift * s);
      g.transform(1, 0, Math.tan((skew * Math.PI) / 180), 1, 0, 0);
      g.scale(s, s * stretch);
      const w = c.width, h = c.height;
      g.fillStyle = c.color;
      g.beginPath();
      if (c.radius[0]) { const r = c.radius[0]; g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h + r); g.arcTo(-w / 2, -h, -w / 2 + r, -h, r); g.lineTo(w / 2 - r, -h); g.arcTo(w / 2, -h, w / 2, -h + r, r); g.lineTo(w / 2, 0); g.closePath(); }
      else g.rect(-w / 2, -h, w, h);
      g.fill();
      // face, laid out like the CSS (column: eyes row, then the mouth 5px below)
      const eyeW = c.eyes === 'ball' ? 13 : 7, gap = c.gap - (c.eyes === 'ball' ? 12 : 7);
      const rowW = eyeW * 2 + gap;
      const mouthKind = ex[c.id];
      const mouthBoxW = c.id === 'yellow' ? 48 : 22;
      const faceW = Math.max(rowW, mouthKind ? mouthBoxW : 0);
      const fl = -w / 2 + c.face.left + fx, ft = -h + c.face.top + fy;
      const eyeScale = 1 + 0.35 * surprise;
      const blinkP = (t + hash(i + (st.seed ?? 0)) * 4.1) % (3.1 + hash(i + 7) * 2.6);
      const blink = blinkP < 0.13 ? 0.12 : 1;
      for (let e = 0; e < 2; e++) {
        const ex0 = fl + (faceW - rowW) / 2 + e * (eyeW + gap) + eyeW / 2, ey0 = ft + eyeW / 2;
        g.save(); g.translate(ex0, ey0); g.scale(eyeScale, eyeScale * blink);
        if (c.eyes === 'ball') {
          g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 6.5, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fill();
        } else { g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(0, 0, 3.5, 0, Math.PI * 2); g.fill(); }
        g.restore();
      }
      if (mouthKind) {
        const mw = 22, mx = c.id === 'yellow' ? fl + (faceW - 48) / 2 + 18 + (30 - mw) / 2 : fl + (faceW - mw) / 2;
        const my = ft + eyeW + 5;
        g.save(); g.translate(mx, my); g.scale(mw / 24, 11 / 12);
        mouthPath(g, mouthKind);
        const ink = c.id === 'black' ? '#ffffff' : '#1b1b1b';
        g.lineWidth = 2.6; g.lineCap = 'round'; g.strokeStyle = ink;
        if (mouthKind === 'O' || mouthKind === 'o') { g.fillStyle = ink; g.fill(); } else g.stroke();
        g.restore();
      }
      g.restore();
    }
  }

  // ---- subtitles: kinetic captions for the narrator, bottom centre, in their own band (y 930-1050) ----
  function chunks(L) {
    const words = L.text.split(' ');
    const out = []; let cur = [];
    words.forEach((w, i) => {
      cur.push(i);
      const end = (/[.:?!]$/.test(w) && cur.length >= 3) || (/,$/.test(w) && cur.length >= 4);
      if (end || cur.length >= 8) { out.push(cur); cur = []; }
    });
    if (cur.length) out.push(cur);
    // never leave one or two words alone on a line: join them to the line before
    if (out.length > 1 && out[out.length - 1].length <= 2 && out[out.length - 2].length + out[out.length - 1].length <= 10) out.splice(-2, 2, [...out[out.length - 2], ...out[out.length - 1]]);
    return { words, out };
  }
  const isKey = (L, words, i) => (L.keys || []).some((k) => {
    const kw = k.split(' '), n = kw.length;
    for (let j = Math.max(0, i - n + 1); j <= i; j++) {
      if (kw.every((x, q) => (words[j + q] || '').replace(/[.,:?!]/g, '').toLowerCase() === x.toLowerCase())) return true;
    }
    return false;
  });
  // Low-key captions: one line, plain white on a soft box. Each word pops up in place the moment it is said
  // (nothing is shown before it is spoken); the box grows to fit the words so far; phrases crossfade.
  const SUB = { size: 44, gap: 12, padX: 26, y: 1012, bh: 64 };
  function drawPhrase(g, L, words, chunk, at, t, alpha) {
    if (alpha <= 0) return;
    const font = { size: SUB.size, weight: 500 };
    const widths = chunk.map((i) => measure(g, words[i], font));
    const total = widths.reduce((a, b) => a + b, 0) + SUB.gap * (chunk.length - 1);
    const x0 = W / 2 - total / 2;
    let shown = 0;
    chunk.forEach((i, k) => { if (t >= at(i)) shown += widths[k] + (k ? SUB.gap : 0); });   // the box steps out to fit each new word
    if (shown <= 0.5) return;
    g.save();
    g.globalAlpha = alpha * 0.74;
    rr(g, x0 - SUB.padX, SUB.y - SUB.bh / 2 - 15, shown + SUB.padX * 2, SUB.bh, 12);
    g.fillStyle = '#0d151c'; g.fill();
    g.restore();
    g.save();
    let x = x0;
    chunk.forEach((i, k) => {
      const d = t - at(i);
      if (d >= 0) {
        const p = u(d, 'snappy'), s = 0.82 + 0.18 * p, cx = x + widths[k] / 2, cy = SUB.y - 15;
        g.save();
        g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
        text(g, words[i], x, SUB.y, { ...font, color: '#ffffff', alpha: alpha * clamp(d / 0.08, 0, 1) });
        g.restore();
      }
      x += widths[k] + SUB.gap;
    });
    g.restore();
  }
  /** A ball hopping along the top of the caption box, landing on each word when it is said. */
  let ballOn = true;
  function bouncingBall(g, chunk, centers, at, t, alpha) {
    const rest = SUB.y - SUB.bh / 2 - 15 - 9;          // ball centre when it sits on the box's top edge
    const r = 8, hop = 30;
    const times = chunk.map((i) => at(i));
    let x, y, sq = 0;
    if (t < times[0]) {                                  // drops in onto the first word
      const p = clamp((t - (times[0] - 0.3)) / 0.3, 0, 1);
      x = centers[0]; y = rest - hop * 1.6 * (1 - p * p);
      if (p <= 0) return;
    } else {
      let k = 0;
      while (k + 1 < times.length && t >= times[k + 1]) k++;
      if (k + 1 < times.length) {
        const span = Math.max(0.12, times[k + 1] - times[k]);
        const p = clamp((t - times[k]) / span, 0, 1);
        x = lerp(centers[k], centers[k + 1], smooth(p));
        y = rest - hop * Math.min(1, span / 0.35) * 4 * p * (1 - p);
        sq = Math.max(0, 1 - (t - times[k]) / 0.09);    // squash just after landing
      } else {
        x = centers[k]; y = rest;
        sq = Math.max(0, 1 - (t - times[k]) / 0.09);
      }
    }
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y + r * 0.25 * sq);
    g.scale(1 + 0.28 * sq, 1 - 0.24 * sq);
    g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = '#ffd84d'; g.fill();
    g.shadowColor = 'transparent'; g.lineWidth = 2; g.strokeStyle = 'rgba(13,21,28,0.55)'; g.stroke();
    g.restore();
  }
  function subtitles(g, t) {
    const L = Object.values(T).find((l) => l.who === 'N' && t >= l.s - 0.1 && t <= l.e + 0.5);
    if (!L) return;
    const { words, out } = chunks(L);
    const at = (i) => L.s + (i / words.length) * L.d * 0.94 - 0.04;
    // a phrase stays at least 0.45 s after its last word, so no word is up too briefly to read
    const switchAt = (k) => Math.max(at(out[k][0]) - 0.06, at(out[k - 1][out[k - 1].length - 1]) + 0.45);
    let ci = out.findIndex((c, k) => t < (k + 1 < out.length ? switchAt(k + 1) : Infinity));
    if (ci < 0) ci = out.length - 1;
    const leave = 1 - clamp((t - L.e - 0.25) / 0.25, 0, 1);
    const enter = clamp((t - (L.s - 0.1)) / 0.2, 0, 1);
    const x = ci > 0 ? clamp((t - switchAt(ci)) / 0.18, 0, 1) : 1;   // crossfade from the previous phrase
    if (ci > 0 && x < 1) drawPhrase(g, L, words, out[ci - 1], at, t, (1 - x) * leave);
    drawPhrase(g, L, words, out[ci], at, t, x * enter * leave);
  }

  // ---- chapters ----
  const CH = [];
  function chapter(name, draw, cues) { CH.push({ name, draw, cues }); }
  /** Sound cues from every chapter: [{t, kind, gain}] (used by the mixer, never at draw time). */
  function allCues() { return CH.flatMap((c) => { try { return c.cues ? c.cues() : []; } catch { return []; } }).sort((a, b) => a.t - b.t); }

  async function load() {
    const j = async (url, fb) => { try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.json() : fb; } catch { return fb; } };
    const spec = await j('lines.json', { lines: [] });
    LINES = spec.lines;
    DUR = await j('audio/vo/durations.json', {});
    BOX = await j('assets/real/boxes.json', {});
    await Promise.all(LINES.filter((l) => l.who !== 'N').map(async (l) => { const e = await j(`audio/vo/${l.id}.env.json`, null); if (e) ENV[l.id] = e; }));
    for (let k = 0; k < 25; k++) PLATES.push('typing/t' + String(k).padStart(2, '0'));
    await Promise.all(PLATES.map((n) => new Promise((res) => { const im = new Image(); im.onload = () => { P[n] = im; res(); }; im.onerror = () => res(); im.src = `assets/real/${n}.png`; })));
    await Promise.all([document.fonts.load(`500 40px 'DM Sans Film'`), document.fonts.load(`700 40px 'DM Sans Film'`), document.fonts.load(`400 40px 'IBM Plex Mono Film'`), document.fonts.load(`500 40px 'IBM Plex Mono Film'`)]);
    await document.fonts.ready;
    buildTimeline();
  }

  window.E = { W, H, C, SANS, MONO, P, get BOX() { return BOX; }, T, S, GAP, clamp, lerp, u, fade, smooth, hash, reset, fill, rr, text, measure, wrap,
    spokenLine, plate, crop, cursor, ring, eyebrow, criterion, lowerThird, waveform, buddies, subtitles, chapter, CH, allCues, load };
})();
