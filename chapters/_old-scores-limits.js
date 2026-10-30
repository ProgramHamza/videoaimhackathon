// chapter file: scores-limits. 'scores' (dark, the results, broadcast-style) and 'limits' (white, honest).
(function () {
  const { C, T, S, u, clamp, lerp, text, measure, rr, buddies, criterion } = E;
  const BLUE = '#5aa9ff', GA = '#8796a0', GB = '#5d6b75', WHITE = '#ffffff', SOFT = '#c9d3da';
  const X0 = 120;                            // left edge of the chart area
  const BUD = { x: 1400, y: 1040, s: 1.6 };  // buddies' own zone, bottom-right; charts stay clear of it
  const DRIFT = { k: 14, c: 7.5 };           // slow spring for camera push and light sweep

  // ---- timing (all from the voice) ----
  const tm = () => {
    const a0 = S.scores[0];
    const dotsStart = T.n11.s + 0.3, land = T.n12.s + 0.3;
    const dotAt = (i) => lerp(dotsStart, land, i / 14);
    const bB = T.n13.s - 0.25, bC = T.n14.s - 0.25, bD = T.n15.s - 0.25;
    const race = T.n13.s - 0.1;
    const slam = [T.n13.s + T.n13.d * 0.48, T.n13.e - 0.15];
    const rings = [T.n14.s - 0.1, T.n14.s + 0.15, T.n14.s + 0.4];
    const stamps = [T.n14.e - 0.75, T.n14.e - 0.3];
    const trace = T.n15.s, clock = T.n15.s + T.n15.d * 0.5;
    return { a0, dotAt, land, bB, bC, bD, race, slam, rings, stamps, trace, clock };
  };
  // beat alpha: on from a (spring), off quickly at b
  const beat = (t, a, b, first) => (first ? 1 : clamp(u(t - a, 'snappy'), 0, 1)) * clamp((b - t) / 0.2, 0, 1);
  // camera push 1.0 -> 1.04 around the chart's centre
  function push(g, t, a, cx = 120, cy = 200) {
    const s = 1 + 0.04 * u(t - a, DRIFT);
    g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
  }
  function title(g, str, t, a, y = 190) {
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
    let last = k.a0; for (const b of [k.bB, k.bC, k.bD]) if (t >= b) last = b;
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

  // ---- scores ----
  E.chapter('scores', (g, t) => {
    const k = tm();
    ground(g, t, k);
    criterion(g, 3, 'Does it work end to end?', t, S.scores[0] + 0.2, S.scores[1], true);

    // A. 15 dots arc around the hero counter 15/15
    let al = beat(t, k.a0, k.bB, true);
    if (al > 0) {
      g.save(); g.globalAlpha = al;
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
      if (t >= k.dotAt(0)) {
        const punch = t >= k.land ? lerp(1.15, 1, u(t - k.land, 'playful')) : 1;
        g.save(); g.translate(960, 560); g.scale(punch, punch);
        text(g, `${lit}/15`, 0, 70, { size: 300, weight: 500, font: 'mono', color: lit === 15 ? BLUE : WHITE, align: 'center' });
        g.restore();
        const pc = u(t - k.land, 'heavy');
        if (t >= k.land) text(g, 'correct', 960, 795 + (1 - pc) * 14, { size: 72, weight: 700, color: WHITE, align: 'center', alpha: clamp(pc * 2, 0, 1) });
      }
      text(g, '5 challenge situations × 3 questions', 960, 890, { size: 54, weight: 500, color: SOFT, align: 'center' });
      g.restore();
    }

    // B. race bars: correct answers of 15
    al = beat(t, k.bB, k.bC);
    if (al > 0) {
      g.save(); g.globalAlpha = al; push(g, t, k.bB);
      title(g, 'Correct answers (of 15)', t, k.bB);
      const rows = [['Ours', 15, BLUE, { k: 26, c: 10 }], ['One AI call, whole record', 5, GA, { k: 90, c: 18 }], ['If/else rules', 8, GB, { k: 90, c: 18 }]];
      const full = 1200, bh = 136;
      rows.forEach(([name, v, col, spr], i) => {
        const ly = 290 + i * 252, by = ly + 28;
        const p = u(t - k.race, spr);
        text(g, name, X0, ly, { size: 54, weight: 600, color: i === 0 ? WHITE : SOFT, alpha: clamp(u(t - k.race, 'snappy') * 2, 0, 1) });
        const w = Math.max(0, full * (v / 15) * p);
        if (w > 1) { rr(g, X0, by, w, bh, 12); g.fillStyle = col; g.fill(); }
        const shown = Math.round(v * clamp(p, 0, 1));
        if (w > 150) text(g, String(shown), X0 + w - 28, by + bh / 2 + 6, { size: 120, weight: 500, font: 'mono', color: i === 0 ? C.accentStrong : WHITE, align: 'right', base: 'middle' });
        if (i > 0 && t >= k.slam[i - 1]) {             // the gap to ours, hatched, then the delta slams in
          const ps = u(t - k.slam[i - 1], 'playful');
          const gx = X0 + full * (v / 15) + 14, gw = full - full * (v / 15) - 14;
          hatch(g, gx, by, gw * clamp(u(t - k.slam[i - 1], 'snappy'), 0, 1), bh, clamp(ps * 2, 0, 1));
          g.save(); g.globalAlpha *= clamp(ps * 3, 0, 1);
          const sc = lerp(2.2, 1, ps);
          g.translate(gx + gw / 2, by + bh / 2 + 8); g.scale(sc, sc);
          text(g, `+${15 - v}`, 0, 0, { size: 160, weight: 700, font: 'mono', color: WHITE, align: 'center', base: 'middle' });
          g.restore();
        }
      });
      g.restore();
    }

    // C. rings: needed topics covered, 27 new prompts
    al = beat(t, k.bC, k.bD);
    if (al > 0) {
      g.save(); g.globalAlpha = al; push(g, t, k.bC);
      title(g, 'Needed topics covered · 27 new prompts', t, k.bC);
      const rs = [['Ours', 100, BLUE], ['One AI call', 22, GA], ['Rules', 45, GB]];
      rs.forEach(([name, v, col], i) => {
        const cx = 330 + i * 490, cy = 425, R = 160;
        const p = u(t - k.rings[i], { k: 60, c: 14 });
        g.lineCap = 'round'; g.lineWidth = 40;
        g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,0.1)'; g.stroke();
        const sweep = (v / 100) * clamp(p, 0, 1) * Math.PI * 2;
        if (sweep > 0.01) { g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.min(sweep, Math.PI * 2 - 0.001)); g.strokeStyle = col; g.stroke(); }
        text(g, `${Math.round(v * clamp(p, 0, 1))}%`, cx, cy + 6, { size: 88, weight: 500, font: 'mono', color: WHITE, align: 'center', base: 'middle', alpha: clamp(p * 3, 0, 1) });
        text(g, name, cx, 690, { size: 54, weight: 600, color: i === 0 ? WHITE : SOFT, align: 'center', alpha: clamp(p * 3, 0, 1) });
      });
      // stamps under the baselines: how many times more we cover
      [[820, '4.5×', 'ours vs one AI call', 180], [1240, '2.2×', 'vs rules', 120]].forEach(([sx, big, sub, size], i) => {
        if (t < k.stamps[i]) return;
        const ps = u(t - k.stamps[i], 'playful');
        g.save(); g.globalAlpha *= clamp(ps * 3, 0, 1);
        g.translate(sx, 900); g.rotate(lerp(-0.35, -0.06, ps)); g.scale(lerp(1.3, 1, ps), lerp(1.3, 1, ps));
        text(g, big, 0, 0, { size, weight: 700, color: BLUE, align: 'center' });
        g.restore();
        text(g, sub, sx, 975, { size: 46, weight: 600, color: SOFT, align: 'center', alpha: clamp(ps * 2, 0, 1) });
      });
      g.restore();
    }

    // D. traceability + speed
    al = beat(t, k.bD, S.scores[1] + 1);
    if (al > 0) {
      g.save(); g.globalAlpha = al; push(g, t, k.bD, 120, 230);
      const p1 = u(t - k.trace, 'heavy');
      text(g, 'Traceability', X0, 230, { size: 64, weight: 600, color: WHITE });
      text(g, `${Math.round(100 * clamp(p1, 0, 1))}%`, X0 - 8, 480, { size: 220, weight: 500, font: 'mono', color: BLUE });
      text(g, 'every quote found word for word', X0, 570, { size: 46, weight: 500, color: SOFT, alpha: clamp(p1 * 2, 0, 1) });
      text(g, 'one AI call: 87%', X0, 660, { size: 54, weight: 500, color: GA, alpha: clamp(p1 * 2, 0, 1) });

      const p2 = u(t - k.clock, { k: 70, c: 11 });
      const lx = 900, lw = 860, ly = 470, sx = (s) => lx + (s / 10) * lw;
      g.globalAlpha = al * clamp(u(t - k.trace - 0.3, 'snappy') * 2, 0, 1);
      text(g, 'Slowest screen', lx, 230, { size: 64, weight: 600, color: WHITE });
      rr(g, lx, ly - 6, lw, 12, 6); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill();
      g.fillStyle = WHITE; g.fillRect(sx(10) - 4, ly - 70, 8, 140);
      text(g, '0', lx, ly + 110, { size: 46, font: 'mono', color: SOFT, align: 'center' });
      text(g, '10 s', sx(10), ly + 110, { size: 46, font: 'mono', color: SOFT, align: 'right' });
      if (t >= k.clock) {
        const mx = sx(3 * clamp(p2, 0, 1.2));
        rr(g, lx, ly - 8, Math.max(16, mx - lx), 16, 8); g.fillStyle = BLUE; g.fill();
        g.beginPath(); g.arc(mx, ly, 26, 0, Math.PI * 2); g.fill();
        text(g, '3 s', mx, ly - 60, { size: 120, weight: 500, font: 'mono', color: BLUE, align: 'center' });
      }
      text(g, 'slowest screen · target under 10 s', lx, 640, { size: 46, weight: 500, color: SOFT });
      g.restore();
    }

    // buddies: drawn once, own zone, surprised exactly when each win lands
    const evs = [k.land, k.slam[0], k.slam[1], k.stamps[0]];
    let sur = 0, surT = 0;
    for (const e of evs) if (t >= e && t < e + 1.3) { sur = 1; surT = t - e; }
    const pin = u(t - S.scores[0], 'playful');
    buddies(g, BUD.x, BUD.y + (1 - clamp(pin, 0, 1.2)) * 40, BUD.s, t,
      { mode: t > k.land ? 'success' : 'look', look: [800, 450], surprise: sur, surpriseT: surT, seed: 3 });
  }, () => {
    const k = tm(), cues = [];
    for (let i = 0; i < 15; i++) cues.push({ t: k.dotAt(i), kind: 'pop', gain: 0.15 });
    cues.push({ t: k.land, kind: 'hit', gain: 0.5 });
    [0, 0.05, 0.1].forEach((d) => cues.push({ t: k.race + d, kind: 'whoosh', gain: 0.25 }));
    k.slam.forEach((b) => cues.push({ t: b, kind: 'hit', gain: 0.5 }));
    k.rings.forEach((b) => cues.push({ t: b, kind: 'whoosh', gain: 0.22 }));
    k.stamps.forEach((b) => cues.push({ t: b, kind: 'hit', gain: 0.4 }));
    cues.push({ t: k.trace, kind: 'rise', gain: 0.25 }, { t: k.clock, kind: 'whoosh', gain: 0.3 });
    return cues;
  });

  // ---- limits ----
  const lt = () => {
    const fill = [0, 1, 2].map((i) => T.n17.s + 0.25 + i * 0.35);
    const miss = T.n17.s + T.n17.d * 0.62;
    const cards = [T.n18.s, T.n18.s + T.n18.d * 0.5];
    return { fill, miss, cards };
  };
  E.chapter('limits', (g, t) => {
    const k = lt();
    E.fill(g, C.bg);
    const ph = u(t - S.limits[0], 'heavy');
    text(g, "What doesn't work yet", 160, 220 + (1 - ph) * 14, { size: 90, weight: 700, color: C.ink, alpha: clamp(0.3 + ph, 0, 1) });

    // contradictions: 3 found, 2+ missed
    const pl = u(t - T.n17.s, 'heavy');
    if (t >= T.n17.s) text(g, 'Contradictions: 3 of 5+', 160, 350 + (1 - pl) * 12, { size: 64, weight: 600, color: C.ink, alpha: clamp(pl * 2, 0, 1) });
    const sw = 200, sh = 150, gap = 48, sy = 410;
    for (let i = 0; i < 5; i++) {
      const x = 160 + i * (sw + gap);
      if (i < 3) {
        const p = u(t - k.fill[i], 'snappy');
        g.save();
        rr(g, x, sy, sw, sh, 14); g.strokeStyle = C.ruleStrong; g.lineWidth = 3; g.stroke();
        if (t >= k.fill[i]) {
          const s = clamp(p, 0, 1.1);
          g.translate(x + sw / 2, sy + sh / 2); g.scale(s, s);
          rr(g, -sw / 2, -sh / 2, sw, sh, 14); g.fillStyle = C.alert; g.fill();
          text(g, 'found', 0, 2, { size: 46, weight: 600, color: '#fff', align: 'center', base: 'middle' });
        }
        g.restore();
      } else {
        const p = u(t - k.miss, 'snappy');
        g.save(); g.setLineDash([12, 10]); g.strokeStyle = t >= k.miss ? C.alert : C.ruleStrong; g.lineWidth = 3 + 2 * clamp(p, 0, 1);
        rr(g, x, sy, sw, sh, 14); g.stroke(); g.restore();
      }
    }
    if (t >= k.miss) {
      const p = u(t - k.miss, 'heavy');
      text(g, 'missed: dates', 160 + 3 * (sw + gap) + (2 * sw + gap) / 2, sy + sh + 80 + (1 - p) * 12, { size: 46, weight: 600, color: C.alert, align: 'center', alpha: clamp(p * 2, 0, 1) });
    }

    // two plain cards, right of the buddies
    let cx = 440;
    ['1 synthetic patient', 'Test prompts written by us'].forEach((s, i) => {
      const w = measure(g, s, { size: 54, weight: 600 }) + 80;
      if (t >= k.cards[i]) {
        const p = u(t - k.cards[i], 'camera');
        const y = 800 + (1 - p) * 30;
        g.save(); g.globalAlpha = clamp(p * 2, 0, 1);
        rr(g, cx, y, w, 130, 16); g.fillStyle = C.sidebar; g.fill(); g.strokeStyle = C.rule; g.lineWidth = 2; g.stroke();
        text(g, s, cx + 40, y + 65, { size: 54, weight: 600, color: C.ink, base: 'middle' });
        g.restore();
      }
      cx += w + 48;
    });

    buddies(g, 100, 990, 1, t, { mode: 'error', look: [700, 480], seed: 5 });
  }, () => {
    const k = lt();
    return [...k.fill.map((f) => ({ t: f, kind: 'tick', gain: 0.12 })), { t: k.miss, kind: 'thud', gain: 0.2 },
      ...k.cards.map((c) => ({ t: c, kind: 'tick', gain: 0.1 }))];
  });
})();
