// chapter file: scores-next. 'scores' (dark, the results, broadcast-style) and 'next' (white, honest).
(function () {
  const { C, T, S, u, clamp, lerp, text, rr, buddies } = E;
  const BLUE = '#5aa9ff', GA = '#8796a0', GB = '#5d6b75', WHITE = '#ffffff', SOFT = '#c9d3da';
  const X0 = 120;                            // left edge of the chart area
    const DRIFT = { k: 14, c: 7.5 };           // slow spring for camera push and light sweep

  // understanding unseen requests (backend/reports/metrics.html, blind set 3: 12 prompts never used for tuning)
  const SER = [['Old rules tree', '#5d6b75'], ['Decision graph', '#8796a0'], ['Graph + LLM check', '#5aa9ff']];
  const GROUPS = [['Right role', [75, 100, 100]], ['Required items found', [64, 85, 89]], ['Key items ranked high', [74, 96, 100]], ['Requests with every item', [17, 50, 67]]];
  // the three numbers of the left card (backend/eval/results/report5.html, all 5 screens)
  const STATS = [['0', 'false alarms', '5 contradictions found, all real'], ['100%', 'facts traceable', 'linked to their passage'], ['0', 'invented facts', 'on all 5 screens']];

  // ---- timing (all from the voice) ----
  const tm = () => {
    const a0 = S.scores[0];
    // word starts estimated like the engine subtitles: s + k / words * d * 0.92
    const nW = T.s01.text.split(' ').length, wAt = (kk) => T.s01.s + (kk / nW) * T.s01.d * 0.92;
    const tag = wAt(3);                                   // "end to end"
    const dotsStart = wAt(9), land = wAt(12);            // "system:" ... second "fifteen"
    const dotAt = (i) => lerp(dotsStart, land, i / 14);
    const bB = T.s02.s - 0.25, bC = T.s03.s - 0.25;
    const race = T.s02.s - 0.1;
    const slam = [T.s02.s + T.s02.d * 0.45, T.s02.e - 0.15];
    const check = T.s03.s + 0.25;
    const n3t = T.s03.text.split(' ').length, target = T.s03.s + (8 / n3t) * T.s03.d * 0.92 - 0.1;   // "Typical answer"
    const barAt = (i) => target + 0.35 + i * 0.16;
    const n3 = T.s03.text.split(' ').length, w3 = (kk) => T.s03.s + (kk / n3) * T.s03.d * 0.92;
    const rowAt = [T.s03.s + 0.05, w3(3) - 0.1, w3(6) - 0.1];   // "Zero false alarms" "Every fact traceable" "none invented"
    const nA = T.s04.text.split(' ').length, wA = (kk) => T.s04.s + (kk / nA) * T.s04.d * 0.92;
    const bR = T.s04.s - 0.25, rAt = (i) => bR + 0.45 + i * 0.22, rLand = wA(13);   // "two thirds"
    return { a0, tag, dotAt, land, bB, bC, race, slam, check, target, barAt, bR, rAt, rLand, rowAt };
  };
  // beat alpha: on from a (spring), off quickly at b
  const beat = (t, a, b, first) => (first ? 1 : clamp(u(t - a, 'snappy'), 0, 1)) * clamp((b - t) / 0.2, 0, 1);
  // camera push 1.0 -> 1.04 around a point
  function push(g, t, a, cx = 120, cy = 200) {
    const s = 1 + 0.04 * u(t - a, DRIFT);
    g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
  }
  // beat punch: 1.0 -> 1.04 -> 1.0 on a hit
  const punchAt = (t, a) => (t < a ? 1 : 1 + 0.04 * Math.max(0, Math.sin(clamp(u(t - a, 'snappy'), 0, 1) * Math.PI)));
  function title(g, str, t, a, y = 200) {
    const p = u(t - a, 'heavy');
    text(g, str, X0, y + (1 - p) * 14, { size: 64, weight: 600, color: WHITE });
  }
  // dark ground with a faint grid and a diagonal light sweep at each beat start
  function ground(g, t, k) {
    E.fill(g, C.accentStrong);
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 1;
    const off = 20 * u(t - k.a0, DRIFT);
    for (let x = -80 + off; x < 1920; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1080); g.stroke(); }
    for (let y = -80 + off; y < 1080; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(1920, y); g.stroke(); }
    let last = k.a0; for (const b of [k.bB, k.bC, k.bR]) if (t >= b) last = b;
    const sx = lerp(-900, 2900, u(t - last, { k: 9, c: 6 }));
    const gr = g.createLinearGradient(sx - 400, 0, sx + 400, 0);
    gr.addColorStop(0, 'rgba(90,169,255,0)'); gr.addColorStop(0.5, 'rgba(90,169,255,0.07)'); gr.addColorStop(1, 'rgba(90,169,255,0)');
    g.translate(960, 540); g.transform(1, 0, -0.45, 1, 0, 0); g.translate(-960, -540);
    g.fillStyle = gr; g.fillRect(-600, 0, 3200, 1080);
    g.restore();
  }
  function hatch(g, x, y, w, h, a) {
    g.save(); rr(g, x, y, w, h, 12); g.clip();
    g.fillStyle = `rgba(90,169,255,${0.14 * a})`; g.fillRect(x, y, w, h);
    g.strokeStyle = `rgba(90,169,255,${0.45 * a})`; g.lineWidth = 6;
    for (let i = -h; i < w; i += 26) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); g.stroke(); }
    g.restore();
    g.save(); g.globalAlpha *= a; g.setLineDash([16, 10]); g.strokeStyle = BLUE; g.lineWidth = 4; rr(g, x, y, w, h, 12); g.stroke(); g.restore();
  }
  // a polyline drawn to fraction p of its length
  function partial(g, pts, p) {
    const segs = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); L += d; }
    let rem = clamp(p, 0, 1) * L;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && rem > 0; i++) {
      const f = Math.min(1, rem / segs[i - 1]);
      g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); rem -= segs[i - 1];
    }
    g.stroke();
  }

  // ---- scores ----
  E.chapter('scores', (g, t) => {
    const k = tm();
    ground(g, t, k);
    { // judging question, top-left, at readable size (own version of E.criterion)
      const a = E.fade(t, S.scores[0] + 0.2, S.scores[1], 0.35);
      if (a > 0) {
        g.save(); g.globalAlpha = a;
        rr(g, 96, 54, 64, 64, 32); g.fillStyle = WHITE; g.fill();
        text(g, '3', 128, 88, { size: 46, weight: 700, align: 'center', base: 'middle', color: C.ink });
        text(g, 'Does it work end to end?', 184, 88, { size: 46, weight: 600, color: WHITE, base: 'middle' });
        g.restore();
      }
    }

    // A. 15 dots arc around the hero counter 15/15
    let al = beat(t, k.a0, k.bB, true);
    if (al > 0) {
      g.save(); g.globalAlpha = al;
      if (t >= k.tag) {                                   // the claim: measured on the running system
        const pt = u(t - k.tag, 'playful'), str = 'TORU · measured end to end on the running system';
        const o = { size: 46, weight: 600, color: WHITE, align: 'center', base: 'middle' };
        const w = E.measure(g, str, o) + 72;
        g.save(); g.globalAlpha *= clamp(pt * 3, 0, 1);
        g.translate(960, 164); g.scale(lerp(0.85, 1, pt), lerp(0.85, 1, pt));
        rr(g, -w / 2, -34, w, 68, 34); g.fillStyle = 'rgba(90,169,255,0.24)'; g.fill(); g.strokeStyle = BLUE; g.lineWidth = 3; g.stroke();
        text(g, str, 0, 2, o);
        g.restore();
      }
      g.translate(0, 30);
      let lit = 0;
      const gl = clamp(u(t - k.land, 'heavy'), 0, 1);
      if (gl > 0) {
        const rg = g.createRadialGradient(960, 560, 0, 960, 560, 620);
        rg.addColorStop(0, `rgba(90,169,255,${0.28 * gl})`); rg.addColorStop(1, 'rgba(90,169,255,0)');
        g.fillStyle = rg; g.fillRect(300, 0, 1320, 1080);
      }
      for (let i = 0; i < 15; i++) {
        const grp = Math.floor(i / 3), j = i % 3;
        const slot = grp * 3.6 + j;                       // gaps between the 5 situations
        const ang = Math.PI * (205 + (slot / (4 * 3.6 + 2)) * 130) / 180;
        const x = 960 + 700 * Math.cos(ang), y = 700 + 470 * Math.sin(ang);
        const p = u(t - k.dotAt(i), 'playful');
        if (t >= k.dotAt(i)) lit++;
        g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2);
        g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 3; g.stroke();
        if (p > 0) { g.beginPath(); g.arc(x, y, 26 * clamp(p, 0, 1.3), 0, Math.PI * 2); g.fillStyle = BLUE; g.fill(); }
      }
      const punch = t >= k.land ? lerp(1.15, 1, u(t - k.land, 'playful')) : 1;
      g.save(); g.translate(960, 560); g.scale(punch, punch);
      text(g, `${lit}/15`, 0, 70, { size: 300, weight: 500, font: 'mono', color: lit === 15 ? BLUE : WHITE, align: 'center' });
      g.restore();
      const pc = u(t - k.land, 'heavy');
      if (t >= k.land) text(g, 'correct', 960, 795 + (1 - pc) * 14, { size: 72, weight: 700, color: WHITE, align: 'center', alpha: clamp(pc * 2, 0, 1) });
      text(g, '5 challenge situations × 3 questions', 960, 890, { size: 54, weight: 500, color: SOFT, align: 'center' });
      g.restore();
    }

    // B. race bars: correct answers of 15
    al = beat(t, k.bB, k.bC);
    if (al > 0) {
      g.save(); g.globalAlpha = al; push(g, t, k.bB);
      title(g, 'Correct answers (of 15)', t, k.bB);
      const rows = [['TORU', 15, BLUE, { k: 26, c: 10 }], ['One AI call, whole record', 6, GA, { k: 90, c: 18 }], ['If/else rules', 8, GB, { k: 90, c: 18 }]];
      const full = 1200, bh = 110;
      rows.forEach(([name, v, col, spr], i) => {
        const ly = 300 + i * 212, by = ly + 24;
        const p = u(t - k.race, spr);
        text(g, name, X0, ly, { size: 54, weight: 600, color: i === 0 ? WHITE : SOFT, alpha: clamp(u(t - k.race, 'snappy') * 2, 0, 1) });
        const w = Math.max(0, full * (v / 15) * p);
        if (w > 1) { rr(g, X0, by, w, bh, 12); g.fillStyle = col; g.fill(); }
        const shown = Math.round(v * clamp(p, 0, 1));
        if (w > 130) text(g, String(shown), X0 + w - 26, by + bh / 2 + 4, { size: 96, weight: 500, font: 'mono', color: i === 0 ? C.accentStrong : WHITE, align: 'right', base: 'middle' });
        if (i > 0 && t >= k.slam[i - 1]) {             // the gap to ours, hatched, then the delta slams in
          const ps = u(t - k.slam[i - 1], 'playful');
          const gx = X0 + full * (v / 15) + 14, gw = full - full * (v / 15) - 14;
          hatch(g, gx, by, gw * clamp(u(t - k.slam[i - 1], 'snappy'), 0, 1), bh, clamp(ps * 2, 0, 1));
          g.save(); g.globalAlpha *= clamp(ps * 3, 0, 1);
          const sc = lerp(2.2, 1, ps);
          g.translate(gx + gw / 2, by + bh / 2 + 6); g.scale(sc, sc);
          text(g, `+${15 - v}`, 0, 0, { size: 120, weight: 700, font: 'mono', color: WHITE, align: 'center', base: 'middle' });
          g.restore();
        }
      });
      g.restore();
    }

    // C. split: three numbers (left) · response time per situation (right)
    al = beat(t, k.bC, k.bR + 0.25);
    if (al > 0) {
      g.save(); g.globalAlpha = al; g.translate(-120 * clamp(u(t - k.bR, 'snappy'), 0, 1.2), 0); push(g, t, k.bC, 960, 500);
      // left card, slight tilt on entry
      const pe = u(t - k.bC, 'camera');
      g.save();
      g.translate(510, 530); g.rotate((1 - clamp(pe, 0, 1)) * -0.04); g.scale(lerp(0.96, 1, pe), lerp(0.96, 1, pe)); g.translate(-510, -530);
      rr(g, 120, 250, 780, 560, 24); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.stroke();
      STATS.forEach(([num, lab, sub], i) => {
        const at = k.rowAt[i]; if (t < at) return;
        const p = u(t - at, 'playful'), a = clamp(p * 2, 0, 1), y0 = 380 + i * 175;
        const no = { size: 96, weight: 500, font: 'mono', color: BLUE, alpha: a };
        const nw = E.measure(g, num, no), sc = lerp(1.25, 1, clamp(p, 0, 1));
        g.save(); g.translate(170, y0); g.scale(sc, sc); text(g, num, 0, 0, no); g.restore();
        text(g, lab, 170 + nw + 26, y0 - 6, { size: 46, weight: 600, color: WHITE, alpha: a });
        text(g, sub, 170 + nw + 26, y0 + 42, { size: 36, weight: 500, color: SOFT, alpha: a * clamp((t - at - 0.15) / 0.2, 0, 1) });
      });
      g.restore();

      // right: five bars against the 10 s target
      const pr2 = clamp(u(t - k.bC - 0.15, 'snappy') * 1.5, 0, 1);
      g.save(); g.globalAlpha *= pr2;
      text(g, 'Seconds per answer', 960, 290, { size: 54, weight: 600, color: WHITE });
      { const pm = u(t - k.target, 'snappy');
        if (pm > 0) text(g, 'median 1.71 s', 960, 350 + (1 - clamp(pm, 0, 1)) * 12, { size: 40, weight: 600, color: BLUE, alpha: clamp(pm * 2, 0, 1) }); }
      const base = 760, ppsec = 36, tY = base - 10 * ppsec, lx = 960, rx = 1540;
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(lx, base, rx - lx, 3);
      const pt = u(t - k.target, { k: 60, c: 14 });
      if (pt > 0) {
        g.save(); g.setLineDash([18, 12]); g.strokeStyle = WHITE; g.lineWidth = 4;
        g.beginPath(); g.moveTo(lx, tY); g.lineTo(lerp(lx, rx, clamp(pt, 0, 1)), tY); g.stroke(); g.restore();
        text(g, '10 s limit', rx, tY - 22, { size: 46, weight: 600, color: SOFT, align: 'right', alpha: clamp(pt * 2, 0, 1) });
      }
      [1.69, 2.39, 1.53, 1.41, 1.71].forEach((v, i) => {
        const cx = lx + 60 + i * 115, bw = 76;
        text(g, `S${i + 1}`, cx, base + 64, { size: 46, weight: 600, color: SOFT, align: 'center' });
        const pb = u(t - k.barAt(i), { k: 120, c: 14 });
        if (pb <= 0) return;
        const h = v * ppsec * clamp(pb, 0, 1.15);
        rr(g, cx - bw / 2, base - h, bw, h, 10); g.fillStyle = BLUE; g.fill();
        text(g, v.toFixed(2), cx, base - h - 22, { size: 40, weight: 500, font: 'mono', color: WHITE, align: 'center', alpha: clamp(pb * 2, 0, 1) });
      });
      g.restore();
      g.restore();
    }

    // R. does the AI help? understanding unseen requests, three versions side by side
    if (t >= k.bR) {
      const pa = u(t - k.bR - 0.05, 'camera');
      g.save(); g.globalAlpha = clamp(pa * 2, 0, 1); g.translate(120 * (1 - clamp(pa, 0, 1)), 0);
      title(g, 'Understanding unseen requests', t, k.bR, 210);
      text(g, 'Blind set 3 · 12 prompts never used for tuning', X0, 268, { size: 40, weight: 500, color: SOFT });
      let lx = X0;
      SER.forEach(([n, c]) => {
        rr(g, lx, 304, 28, 28, 6); g.fillStyle = c; g.fill();
        text(g, n, lx + 42, 329, { size: 36, weight: 600, color: c === BLUE ? WHITE : SOFT });
        lx += 42 + E.measure(g, n, { size: 36, weight: 600 }) + 52;
      });
      const bx0 = 720, full = 700, bh = 26;
      GROUPS.forEach(([lab, vals], gi) => {
        const y = 392 + gi * 138, p = u(t - k.rAt(gi), { k: 90, c: 15 }), hi = gi === 3 && t >= k.rLand - 0.6;
        text(g, lab, X0, y + 50, { size: 44, weight: 600, color: hi ? WHITE : SOFT, base: 'middle' });
        vals.forEach((v, si) => {
          const by = y + si * 34, w = full * (v / 100) * clamp(p, 0, 1.1);
          if (w > 2) { rr(g, bx0, by, w, bh, 6); g.fillStyle = SER[si][1]; g.fill(); }
          text(g, Math.round(v * clamp(p, 0, 1)) + '%', bx0 + Math.max(w, 0) + 14, by + bh / 2 + 2, { size: 32, weight: 500, font: 'mono', color: si === 2 ? WHITE : SOFT, base: 'middle', alpha: clamp(p * 3, 0, 1) });
        });
      });
      // the AI's gain where it matters most: every needed item on the screen
      if (t >= k.rLand) {
        const ps = u(t - k.rLand, 'playful'), y = 392 + 3 * 138 + 2 * 34 + bh / 2;
        g.save(); g.globalAlpha *= clamp(ps * 3, 0, 1); g.translate(1330, y); g.scale(lerp(1.8, 1, clamp(ps, 0, 1)), lerp(1.8, 1, clamp(ps, 0, 1)));
        text(g, '+17 pts', 0, 4, { size: 48, weight: 700, font: 'mono', color: BLUE, base: 'middle' });
        g.restore();
      }
      g.restore();
    }

    // buddies: one home spot right of every chart; enter and leave by the right edge with springs
    let sur = 0, surT = 0;
    for (const e of [k.land, k.slam[0], k.slam[1], k.rLand]) if (t >= e && t < e + 1.2) { sur = 1; surT = t - e; }
    let look = [960, 520];                                        // the hero number
    if (t >= k.bB) look = [800, 380];                             // ours: 15
    if (t >= k.slam[0]) look = [1000, 580];                       // +9
    if (t >= k.slam[1]) look = [1000, 790];                       // +7
    if (t >= k.bC) look = [440, 600];                             // the contradictions card
    if (t >= k.target) look = [1190, 680];                        // the bars under the limit
    if (t >= k.bR) look = [1100, 640];                            // the AI chart
    if (t >= k.rLand) look = [1380, 870];                         // +17 pts
    const smile = (t >= k.rowAt[2] + 0.3 && t < k.bR) || t >= k.rLand + 0.4;
    const pin = u(t - S.scores[0], 'camera'), pout = u(t - (S.scores[1] - 0.55), 'snappy');
    const bx = 1580 + (1 - clamp(pin, 0, 1.2)) * 380 + clamp(pout, 0, 1.2) * 380;
    buddies(g, bx, 920, 1.1, t, { mode: smile ? 'success' : 'look', look, surprise: sur, surpriseT: surT, seed: 3 });
  }, () => {
    const k = tm(), cues = [];
    for (let i = 0; i < 15; i++) cues.push({ t: k.dotAt(i), kind: 'pop', gain: 0.15 });
    cues.push({ t: k.land, kind: 'hit', gain: 0.5 }, { t: k.tag, kind: 'pop', gain: 0.3 });
    [0, 0.05, 0.1].forEach((d) => cues.push({ t: k.race + d, kind: 'whoosh', gain: 0.25 }));
    k.slam.forEach((b) => cues.push({ t: b, kind: 'hit', gain: 0.5 }));
    cues.push({ t: k.bC, kind: 'whoosh', gain: 0.25 });
    k.rowAt.forEach((r) => cues.push({ t: r + 0.05, kind: 'pop', gain: 0.3 }));
    cues.push({ t: k.bR, kind: 'whoosh', gain: 0.25 }, { t: k.rLand, kind: 'chime', gain: 0.35 });
    for (let i = 0; i < 4; i++) cues.push({ t: k.rAt(i), kind: 'tick', gain: 0.12 });
    for (let i = 0; i < 5; i++) cues.push({ t: k.barAt(i), kind: 'tick', gain: 0.15 });
    return cues;
  });

  // ---- next: what does not work yet (honest limits, said and shown) ----
  const LIM = [
    ['13% of unusual requests miss an item', 'blind set 4 · 15 unseen prompts: 87% get every item'],
    ['No FHIR link yet', 'records cannot be pulled from a hospital system yet'],
  ];
  const nt = () => {
    const L = T.x01, n = L.text.split(' ').length, w = (kk) => L.s + (kk / n) * L.d * 0.92;
    return { c1: S.next[0], rows: [w(3) - 0.15, w(15) - 0.15] };   // "thirteen percent", "no FHIR"
  };
  E.chapter('next', (g, t) => {
    const k = nt();
    E.fill(g, C.bg);
    const ph = u(t - k.c1 - 0.05, 'heavy');
    text(g, 'Not working yet', 160, 172 + (1 - ph) * 14, { size: 72, weight: 700, color: C.alert, alpha: clamp(ph * 1.5, 0, 1) });
    LIM.forEach(([main, sub], i) => {
      const at = k.rows[i];
      const p = u(t - at, 'camera');
      if (p <= 0) return;
      const x = 160, w = 1180, h = 175, y = 290 + i * 215, dy = (1 - p) * 40;
      g.save(); g.globalAlpha = clamp(p * 1.4, 0, 1);
      g.translate(x + w / 2, y + dy + h / 2); g.rotate((1 - clamp(p, 0, 1)) * 0.02); g.translate(-(x + w / 2), -(y + dy + h / 2));
      rr(g, x, y + dy, w, h, 22); g.fillStyle = C.sidebar; g.fill(); g.strokeStyle = C.rule; g.lineWidth = 2; g.stroke();
      g.fillStyle = C.alert; g.fillRect(x, y + dy + 28, 8, h - 56);
      const cx = x + 82, cy = y + dy + h / 2;
      g.strokeStyle = C.alert; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(cx - 12, cy - 12); g.lineTo(cx + 12, cy + 12); g.moveTo(cx + 12, cy - 12); g.lineTo(cx - 12, cy + 12); g.stroke();
      text(g, main, x + 146, y + dy + 80, { size: 54, weight: 700, color: C.ink });
      text(g, sub, x + 146, y + dy + 136, { size: 40, weight: 500, color: C.muted });
      g.restore();
    });
    // buddies in the empty space to the right: a small frown, then they read the list
    const pin = u(t - S.next[0], 'camera'), pout = u(t - (S.next[1] - 0.55), 'snappy');
    let look = [600, 180];
    k.rows.forEach((r, i) => { if (t >= r) look = [900, 380 + i * 215]; });
    buddies(g, 1420 + (1 - clamp(pin, 0, 1.2)) * 560 + clamp(pout, 0, 1.2) * 560, 915, 1.4, t,
      { mode: 'error', look, seed: 5 });
  }, () => nt().rows.map((r) => ({ t: r + 0.1, kind: 'thud', gain: 0.18 })));
})();
