// chapter file: open-docs-end (open, doc1, doc2, doc3, end)
(function () {
  const { W, H, C, T, S, u, fade, clamp, lerp, text, measure, rr, hash, buddies } = E;
  const X0 = 140;                       // left text margin
  const PILE = [1520, 345];             // centre of the letter pile

  // ---- open helpers ----
  const cardStart = (i) => S.open[0] + 0.05 + i * ((T.n01.e - S.open[0]) / 8);
  const CARD_LAND = 0.22;               // the snappy spring is ~at rest after this
  const lineTimes = () => [S.open[0] - 1, T.n01.s + T.n01.d * 0.6, T.n02.s];

  function card(g, i, t) {
    const ts = cardStart(i);
    if (t < ts) return;
    const p = u(t - ts, 'snappy');
    const rot = (hash(i + 3) - 0.5) * 0.16;
    const ox = (hash(i + 11) - 0.5) * 60, oy = (hash(i + 23) - 0.5) * 24 - i * 4;
    const x = PILE[0] + ox, y = lerp(-400, PILE[1] + oy, p);
    const w = 300, h = 390;
    g.save();
    g.translate(x, y); g.rotate(rot * (0.6 + 0.4 * p) + (1 - p) * 0.25);
    g.shadowColor = 'rgba(16,30,40,0.18)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
    rr(g, -w / 2, -h / 2, w, h, 16); g.fillStyle = '#fff'; g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = C.rule; g.lineWidth = 2; g.stroke();
    text(g, 'Arztbrief', -w / 2 + 34, -h / 2 + 76, { size: 48, weight: 700, color: C.ink });
    g.fillStyle = C.baseB;
    for (let k = 0; k < 6; k++) {
      const bw = (0.55 + 0.4 * hash(i * 13 + k)) * (w - 68);
      rr(g, -w / 2 + 34, -h / 2 + 120 + k * 36, bw, 14, 7); g.fill();
    }
    g.restore();
  }

  function stopwatch(g, cx, cy, r, t, a) {
    const t0 = T.n02.s;
    const step = 0.3;
    const k = Math.max(0, Math.floor((t - t0) / step));
    const frac = clamp((k + (t >= t0 ? u(t - t0 - k * step, 'snappy') : 0)) / 24, 0, 1);
    g.save(); g.globalAlpha = a;
    g.lineWidth = 10; g.lineCap = 'round';
    g.strokeStyle = C.rule; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    if (frac > 0) { g.strokeStyle = C.link; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); g.stroke(); }
    g.fillStyle = C.ink; rr(g, cx - 10, cy - r - 30, 20, 14, 4); g.fill();
    g.restore();
  }

  E.chapter('open', (g, t) => {
    E.fill(g, C.bg);
    // headline, line by line
    const [a0, a1, a2] = lineTimes();
    const rows = [['8 German letters', 220, 110, a0], ['1 patient', 360, 110, a1], ['2 minutes', 550, 170, a2]];
    for (const [s, y, size, at] of rows) {
      if (t < at) continue;
      const p = u(t - at, 'heavy');
      text(g, s, X0, y + (1 - p) * 30, { size, weight: 700, alpha: clamp(p * 1.3, 0, 1), color: size > 150 ? C.link : C.ink });
    }
    if (t >= a2) {
      const w = measure(g, '2 minutes', { size: 170, weight: 700 });
      stopwatch(g, X0 + w + 110, 490, 52, t, clamp(u(t - a2, 'snappy') * 1.3, 0, 1));
    }
    // the name lands on "Meet TORU."
    const nW2 = T.n02.text.split(' ').length, tName = T.n02.s + (9 / nW2) * T.n02.d * 0.92 - 0.1;
    if (t >= tName) {
      const p = u(t - tName, 'playful'), a = clamp(p * 2, 0, 1), sc = lerp(0.7, 1, clamp(p, 0, 1.1));
      g.save(); g.globalAlpha = a; g.translate(X0 + 62, 790); g.scale(sc, sc);
      g.fillStyle = C.ink; g.beginPath(); g.arc(0, 0, 62, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; rr(g, -11, -38, 22, 76, 6); g.fill(); rr(g, -38, -11, 76, 22, 6); g.fill();
      g.restore();
      text(g, 'TORU', X0 + 160, 838 + (1 - clamp(p, 0, 1)) * 20, { size: 150, weight: 800, color: C.ink, alpha: a });
      text(g, 'clinical summary desk', X0 + 166, 900, { size: 46, weight: 500, color: C.muted, alpha: clamp((t - tName - 0.25) / 0.25, 0, 1) });
    }
    for (let i = 0; i < 8; i++) card(g, i, t);
    const bin = Math.max(0, u(t - S.open[0], 'camera'));   // enter from the right edge
    buddies(g, 1468 + (1 - bin) * 520, 935, 1.3, t, { mode: 'look', bob: true, look: [PILE[0], PILE[1] - 60] });
  }, () => {
    const cues = [];
    for (let i = 0; i < 8; i++) cues.push({ t: cardStart(i) + CARD_LAND, kind: 'pop', gain: 0.3 });
    for (let k = 0; k < 8; k++) cues.push({ t: T.n02.s + k * 0.3, kind: 'tick', gain: 0.12 });
    return cues;
  });

  // ---- clinician quotes on black ----
  // own lower third (engine's role line is 32 px: too small for a phone)
  function lowerThird(g, name, role, t, t0, t1, extra) {
    const a = fade(t, t0, t1, 0.4), p = Math.max(0, u(t - t0, 'heavy'));
    if (a <= 0) return;
    g.save(); g.globalAlpha = a;
    const x = 140, dy = (1 - p) * 20;
    g.fillStyle = C.orange; g.fillRect(x, 740 + dy, 7, extra ? 196 : 132);
    text(g, name, x + 34, 794 + dy, { size: 56, weight: 600, color: '#fff' });
    text(g, role, x + 34, 858 + dy, { size: 46, weight: 600, color: '#ffb27a' });
    // a third line lands a beat later: the clinician's experience
    if (extra) {
      const q = Math.max(0, u(t - t0 - 0.35, 'heavy'));
      text(g, extra, x + 34, 922 + (1 - q) * 16 + dy, { size: 46, weight: 400, color: '#8f9ba3', alpha: Math.min(1, q * 1.4) });
    }
    g.restore();
  }

  const DOCS = {
    doc1: ['h01b', 'MUDr. Monika Hromadová', 'Anaesthesiologist', 'NUDCH Bratislava · Slovakia'],
    doc2: ['u01', 'MUDr. Iveta Urban', 'Surgeon', 'Ordensklinikum Linz · Austria'],
    doc3: ['k01', 'MUDr. Dalibor Kolieska', 'Head of the Anaesthesiology Department', 'Hospital Visp · Switzerland'],
  };
  for (const [sec, [id, name, role, place]] of Object.entries(DOCS)) {
    E.chapter(sec, (g, t) => {
      const [t0, t1] = S[sec];
      E.fill(g, '#0b0f13');
      // all three clinicians speak in their own recorded voices
      E.spokenLine(g, id, t, W / 2, 430, { size: 64, weight: 600, align: 'center', maxW: 1400, color: '#fff', dim: true, dimAlpha: 0.22 });
      E.waveform(g, id, t, W / 2, 650, 520, 90, '#ffffff');
      lowerThird(g, name, role, t, t0 + 0.3, t1, place);
    });
  }

  // ---- end card ----
  E.chapter('end', (g, t) => {
    const t0 = S.end[0];
    E.fill(g, C.bg);
    const pop = (d, preset = 'snappy') => Math.max(0, u(t - t0 - d, preset));
    // logo
    const pl = pop(0);
    const TW = measure(g, 'AIM Healthcare Hackathon · Vienna · Track 1', { size: 46, weight: 500 });
    const cxL = (W - (TW + 70 + 276 * 1.3)) / 2 + TW / 2;
    g.save(); g.translate(cxL, 250); g.scale(0.6 + 0.4 * pl, 0.6 + 0.4 * pl); g.globalAlpha = clamp(pl * 1.5, 0, 1);
    g.fillStyle = C.ink; g.beginPath(); g.arc(0, 0, 60, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; rr(g, -11, -36, 22, 72, 6); g.fill(); rr(g, -36, -11, 72, 22, 6); g.fill();
    g.restore();
    // text block + buddies side by side, centred as a group
    const tw = TW;
    const bw = 276 * 1.3, gap = 70, x0 = (W - (tw + gap + bw)) / 2, cx = x0 + tw / 2;
    const rows = [['TORU', 480, 160, 800, C.ink, 0.06],
      ['clinical summary desk', 552, 46, 500, C.muted, 0.1],
      ['Every fact links to its sentence.', 640, 54, 500, C.link, 0.14],
      ['AIM Healthcare Hackathon · Vienna · Track 1', 740, 46, 500, C.muted, 0.18]];
    for (const [s, y, size, weight, color, d] of rows) {
      const p = pop(d);
      text(g, s, cx, y + (1 - p) * 28, { size, weight, color, align: 'center', alpha: clamp(p * 1.4, 0, 1) });
    }
    const bp = pop(0, 'camera');   // enter from the right edge, one success hop once in place
    buddies(g, x0 + tw + gap + (1 - bp) * 560, 760, 1.3, t, { mode: 'success', hop: 1, hopT: t - t0 - 0.45, look: [cx, 300] });
  }, () => [{ t: S.end[0] + 0.02, kind: 'chime', gain: 0.5 }]);
})();
