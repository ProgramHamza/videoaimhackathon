// chapter file: role-how — sections 'role' (r01) and 'how' (w01)
(function () {
  const { W, H, C, T, S, u, clamp, lerp, text, measure, wrap, rr, plate, ring, criterion, buddies } = E;

  // time a word of a voice line is said (same estimate as E.spokenLine)
  const wordAt = (id, k) => { const L = T[id], n = L.text.split(' ').length; return L.s + (k / n) * L.d * 0.92; };
  const mixRect = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
  const mixCam = (a, b, p) => ({ cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p), vw: lerp(a.vw, b.vw, p) });
  // beat punch: up then back, built from two springs (0 -> ~1 -> 0)
  const punch = (dt) => (dt <= 0 ? 0 : u(dt, 'snappy') - u(dt - 0.14, 'snappy'));

  // a label chip: wrapped bold text in a rounded wash box; returns its height
  function chip(g, str, x, y, maxW, size, a, o = {}) {
    if (a <= 0) return 0;
    const lines = wrap(g, str, maxW - 56, { size, weight: 700 });
    const lh = size * 1.18, w = Math.max(...lines.map((l) => measure(g, l, { size, weight: 700 }))) + 56, h = lines.length * lh + 36;
    g.save(); g.globalAlpha *= a;
    const dy = (1 - a) * 16;
    rr(g, x, y + dy, w, h, 18); g.fillStyle = o.bg ?? C.linkWash; g.fill();
    g.fillStyle = o.bar ?? C.link; g.fillRect(x, y + dy + 14, 6, h - 28);
    lines.forEach((l, i) => text(g, l, x + 30, y + dy + 18 + size * 0.86 + i * lh, { size, weight: 700, color: o.color ?? C.link }));
    g.restore();
    return h;
  }

  // ---------------- ROLE ----------------
  E.chapter('role', (g, t) => {
    const [t0] = S.role, r01 = T.r01;
    E.fill(g, C.bg);
    const B = E.BOX;

    const tGP = t0 + 0.15;                 // GP card springs in (tilted, springs flat)
    const tGrow = Math.max(r01.s + 1.7, t0 + 2.45); // GP card fills the stage
    const tF = [wordAt('r01', 6) - 0.1, wordAt('r01', 8) - 0.1, wordAt('r01', 11) - 0.1]; // drugs, HbA1c, -12 kg

    const full = { cx: 720, cy: 450, vw: 1436 };
    const cardL = { x: 140, y: 220, w: 760, h: 477 }, cardR = { x: 1020, y: 220, w: 760, h: 477 };
    const big = { x: 620, y: 70, w: 1220, h: 864 };

    const pGrow = u(t - tGrow, 'camera');

    // left card (anaesthetist) leaves as the GP card grows
    if (pGrow < 0.98) {
      const a = 1 - clamp(pGrow * 1.6, 0, 1);
      const r = { ...cardL, x: cardL.x - pGrow * 300 };
      g.save(); g.globalAlpha = a;
      plate(g, 'sit1-screen', full, r, { radius: 18, shadow: 36 });
      text(g, 'Anaesthetist', r.x, r.y - 30, { size: 54, weight: 700 });
      g.restore();
    }

    // GP card: springs in from the right, then grows; camera walks the three facts
    const pIn = u(t - tGP, 'snappy');
    let rect = { ...cardR, x: cardR.x + (1 - pIn) * 900 };
    rect = mixRect(rect, big, pGrow);
    const camF = [{ cx: 695, cy: 330, vw: 760 }, { cx: 695, cy: 300, vw: 760 }, { cx: 695, cy: 380, vw: 760 }];
    let cam = mixCam(full, camF[0], pGrow);
    cam = mixCam(cam, camF[1], u(t - tF[1], 'camera'));
    cam = mixCam(cam, camF[2], u(t - tF[2], 'camera'));

    // tilt that springs flat + a punch on each ring landing
    const tilt = (1 - u(t - tGP, 'playful')) * 3 * Math.PI / 180;
    const pk = 1 + 0.03 * (punch(t - tF[0] - 0.12) + punch(t - tF[1] - 0.12) + punch(t - tF[2] - 0.12));
    const ccx = rect.x + rect.w / 2, ccy = rect.y + rect.h / 2;

    const gpA = clamp(pIn * 1.5, 0, 1);
    const facts = [['rowGlucose', 'Diabetes drugs + doses'], ['hba1c', 'HbA1c 6.4 %'], ['weightChange', '−12 kg, calculated']];
    g.save();
    g.translate(ccx, ccy); g.rotate(tilt); g.scale(pk, pk); g.translate(-ccx, -ccy);
    g.globalAlpha = gpA;
    const v = plate(g, 'gp-screen', cam, rect, { radius: 18, shadow: 40 });
    facts.forEach(([k], i) => {
      const p = u(t - tF[i], 'snappy');
      if (p <= 0) return;
      const b = B.gp[k], [x, y] = v.map(b.x, b.y);
      ring(g, x, y, b.w * v.s, b.h * v.s, p, C.link, 10, 5);
    });
    g.restore();
    const labA = 1 - clamp(pGrow * 2, 0, 1);
    if (labA > 0) text(g, 'GP', rect.x, rect.y - 30, { size: 54, weight: 700, alpha: labA * gpA });

    // chips in the clear left column, held to the end of the section
    let cy = 200;
    facts.forEach(([, label], i) => {
      const p = u(t - tF[i], 'snappy');
      if (p <= 0) return;
      cy += chip(g, label, 100, cy, 470, 54, clamp(p, 0, 1)) + 36;
    });

    criterion(g, 2, 'Does it change with the role and task?', t, t0 + 0.05, t0 + 2.4);

    // buddies: one home, bottom-left under the chips; rise in from the bottom edge, smile as each fact lands
    let look = [rect.x + rect.w / 2, rect.y + rect.h / 2];
    let k = -1; tF.forEach((tf, i) => { if (t >= tf) k = i; });
    if (k >= 0) look = [300, 260 + k * 150];
    const happy = k >= 0 && t - tF[k] < 1.0;
    const pbR = u(t - t0 - 0.2, 'playful');
    buddies(g, 30, 1010 + (1 - pbR) * 320, 1.2, t, { mode: happy ? 'success' : 'look', look, hop: k === 2 ? 1 : 0, hopT: t - tF[2] - 0.1 });
  }, () => {
    const r01 = T.r01;
    return [
      { t: S.role[0] + 0.15, kind: 'whoosh', gain: 0.5 },
      { t: Math.max(r01.s + 1.7, S.role[0] + 2.45), kind: 'whoosh', gain: 0.35 },
      { t: wordAt('r01', 6), kind: 'pop', gain: 0.5 },
      { t: wordAt('r01', 8), kind: 'pop', gain: 0.5 },
      { t: wordAt('r01', 11), kind: 'pop', gain: 0.55 },
    ];
  });

  // ---------------- HOW (built and running) ----------------
  const CW = 540, CG = 50, CX0 = 100, CY = 300, CH = 450;
  const cardX = (i) => CX0 + i * (CW + CG);
  const CARDS = [
    ['Working backend', 'Python API · decision graph · matcher · 8 letters in ~2 s'],
    ['Names removed before any AI call', 'de-identification gate on every cloud request'],
    ['Encrypted at rest', 'AES-256-GCM caches'],
  ];

  // draws the card and leaves the card transform active (caller draws the icon, then g.restore())
  function proofCard(g, i, p, q) {
    if (p <= 0) return false;
    const x = cardX(i), [title, sub] = CARDS[i];
    const sc = (0.8 + 0.2 * p) * (1 + 0.03 * q), rot = (1 - p) * (i - 1) * 2 * Math.PI / 180;
    g.save(); g.globalAlpha *= clamp(p * 1.6, 0, 1);
    g.translate(x + CW / 2, CY + CH / 2 + (1 - p) * 50); g.rotate(rot); g.scale(sc, sc); g.translate(-(x + CW / 2), -(CY + CH / 2));
    g.save(); g.shadowColor = 'rgba(16,30,40,0.14)'; g.shadowBlur = 34; g.shadowOffsetY = 12;
    rr(g, x, CY, CW, CH, 26); g.fillStyle = '#fff'; g.fill(); g.restore();
    rr(g, x, CY, CW, CH, 26); g.strokeStyle = C.rule; g.lineWidth = 2; g.stroke();
    let yy = CY + 200;
    wrap(g, title, CW - 64, { size: 52, weight: 700 }).forEach((l) => { text(g, l, x + 32, yy, { size: 52, weight: 700, color: C.ink }); yy += 60; });
    yy += 14;
    wrap(g, sub, CW - 64, { size: 42, weight: 500 }).forEach((l) => { text(g, l, x + 32, yy, { size: 42, weight: 500, color: C.muted }); yy += 50; });
    return true;
  }

  E.chapter('how', (g, t) => {
    const [t0] = S.how, L = 'w01';
    E.fill(g, C.bg);

    // "TORU is not a mock-up: a working backend. Names removed before any AI call, data encrypted."
    const tRun = wordAt(L, 7), tC = [wordAt(L, 8) - 0.15, wordAt(L, 10) - 0.15, wordAt(L, 16) - 0.15];   // working, Names, data
    const tRedact = wordAt(L, 11), tLock = wordAt(L, 17), tCheck = Infinity;   // quote check now lives in the scores

    // headline: "Not a mock-up." then "Built. Running. Secured."
    const pA = u(t - t0 + 0.25, 'snappy'), pB = u(t - (tRun - 0.2), 'snappy');
    if (pB < 1) text(g, 'TORU is not a mock-up.', 100, 210 + (1 - pA) * 14 - pB * 30, { size: 72, weight: 700, alpha: clamp(pA * 1.5, 0, 1) * (1 - clamp(pB * 1.5, 0, 1)) });
    if (pB > 0) {
      const words = ['Built.', 'Running.', 'Secured.'], tw = [tRun - 0.2, tC[1], tLock];
      let x = 100;
      words.forEach((w, i) => {
        const p = u(t - tw[i], 'snappy');
        const wd = measure(g, w + ' ', { size: 72, weight: 700 });
        if (p > 0) text(g, w, x, 210 + (1 - p) * 30, { size: 72, weight: 700, color: i === 2 ? C.link : C.ink, alpha: clamp(p * 1.5, 0, 1) });
        x += wd;
      });
    }

    // live strip: the real endpoint and measured time, typed on a dark pill
    const pS = u(t - tRun, 'snappy');
    if (pS > 0) {
      const line = 'POST /api/assess → 200 · 2.3 s';
      const n = Math.round(line.length * clamp(u(t - tRun - 0.1, 'camera'), 0, 1));
      const pw = measure(g, line, { font: 'mono', size: 38, weight: 500 }) + 116, ph = 76, px = 1820 - pw, py = 150, dy = (1 - pS) * 20;
      g.save(); g.globalAlpha = clamp(pS * 1.5, 0, 1);
      rr(g, px, py + dy, pw, ph, ph / 2); g.fillStyle = C.night; g.fill();
      g.fillStyle = C.ok; g.beginPath(); g.arc(px + 44, py + ph / 2 + dy, 10, 0, Math.PI * 2); g.fill();
      text(g, line.slice(0, n), px + 76, py + 52 + dy, { font: 'mono', size: 38, weight: 500, color: '#ffffff' });
      g.restore();
    }

    // card 1: backend, a live dot that pings
    let p = u(t - tC[0], 'playful');
    if (proofCard(g, 0, p, punch(t - tC[0] - 0.1))) {
      const x = cardX(0) + 32, y = CY + 80;
      const ph = ((t - tC[0]) % 1.6 + 1.6) % 1.6, pr = clamp(u(ph, 'snappy'), 0, 1);
      g.fillStyle = C.ok; g.beginPath(); g.arc(x + 20, y, 14, 0, Math.PI * 2); g.fill();
      g.save(); g.globalAlpha *= 0.5 * (1 - pr); g.strokeStyle = C.ok; g.lineWidth = 4;
      g.beginPath(); g.arc(x + 20, y, 14 + 22 * pr, 0, Math.PI * 2); g.stroke(); g.restore();
      text(g, 'running', x + 54, y + 14, { font: 'mono', size: 40, weight: 500, color: C.ok });
      g.restore();
    }
    // card 2: a name being blacked out
    p = u(t - tC[1], 'playful');
    if (proofCard(g, 1, p, punch(t - tRedact - 0.3))) {
      const x = cardX(1) + 32, y = CY + 96;
      const nm = 'Anna Musterfrau', w = measure(g, nm, { font: 'mono', size: 40, weight: 500 });
      text(g, nm, x, y, { font: 'mono', size: 40, weight: 500, color: C.ink });
      const pr = clamp(u(t - tRedact, 'snappy'), 0, 1);
      if (pr > 0) { rr(g, x - 6, y - 38, (w + 12) * pr, 52, 6); g.fillStyle = C.ink; g.fill(); }
      g.restore();
    }
    // card 3: a lock that closes
    p = u(t - tC[2], 'playful');
    if (proofCard(g, 2, p, punch(t - tLock - 0.2))) {
      const x = cardX(2) + 32, y = CY + 40;
      const close = u(t - tLock, 'playful'), lift = (1 - close) * 24;
      const col = close > 0.5 ? C.link : C.baseA;
      g.strokeStyle = col; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + 14, y + 52 - lift); g.lineTo(x + 14, y + 30 - lift); g.arc(x + 36, y + 30 - lift, 22, Math.PI, 0); g.lineTo(x + 58, y + 52 - lift * 1.6); g.stroke();
      rr(g, x, y + 50, 72, 56, 10); g.fillStyle = col; g.fill();
      text(g, close > 0.5 ? 'locked' : 'open', x + 96, y + 94, { font: 'mono', size: 40, weight: 500, color: col });
      g.restore();
    }

    // check line under the cards
    const pc = Number.isFinite(tCheck) ? u(t - tCheck, 'snappy') : 0;
    if (pc > 0) {
      const x = 100, y = 850, d = clamp(u(t - tCheck - 0.1, 'camera'), 0, 1);
      g.save(); g.strokeStyle = C.ok; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
      const l1 = Math.hypot(20, 22), l2 = Math.hypot(36, 46), at = d * (l1 + l2);
      g.beginPath(); g.moveTo(x, y - 22);
      if (at <= l1) g.lineTo(x + 20 * at / l1, y - 22 + 22 * at / l1);
      else { const k = (at - l1) / l2; g.lineTo(x + 20, y); g.lineTo(x + 20 + 36 * k, y - 46 * k); }
      if (d > 0) g.stroke();
      g.restore();
      text(g, 'Every quote verified against its source', x + 86, y + (1 - pc) * 14, { size: 54, weight: 700, color: C.ink, alpha: clamp(pc * 1.5, 0, 1) });
    }

    // buddies: one home bottom-right, rise from the bottom edge; nod when the lock closes
    const pb = u(t - t0 - 0.3, 'playful');
    const won = t > tLock + 0.15;
    let look = [cardX(0) + CW / 2, CY + 150];
    if (t > tC[1]) look = [cardX(1) + CW / 2, CY + 150];
    if (t > tC[2]) look = [cardX(2) + CW / 2, CY + 150];
    if (t > tCheck) look = [700, 830];
    buddies(g, 1580, 1030 + (1 - pb) * 330, 1.0, t, { mode: won && t < tCheck + 0.5 ? 'success' : 'look', look, hop: won ? 1 : 0, hopT: t - tLock - 0.15 });
  }, () => [
    { t: S.how[0] + 0.05, kind: 'whoosh', gain: 0.4 },
    { t: wordAt('w01', 7), kind: 'type', gain: 0.35 },
    { t: wordAt('w01', 8) - 0.1, kind: 'pop', gain: 0.45 },
    { t: wordAt('w01', 10) - 0.1, kind: 'pop', gain: 0.45 },
    { t: wordAt('w01', 11), kind: 'tick', gain: 0.45 },
    { t: wordAt('w01', 16) - 0.1, kind: 'pop', gain: 0.45 },
    { t: wordAt('w01', 17), kind: 'click', gain: 0.6 },
  ]);
})();
