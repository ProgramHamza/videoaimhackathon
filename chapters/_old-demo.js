// chapter file: demo (n03..n08): the real app, fact by fact
(function () {
  const { W, H, C, T, S, u, fade, clamp, lerp, text, measure, wrap, rr, plate, crop, cursor, ring, criterion, buddies } = E;

  // layout: card left, a clear column on the right for chips, timer and buddies
  const CARD = { x: 100, y: 170, w: 1120 };
  const COL = { x: 1260, w: 580 };
  const BUD_R = { x: COL.x + (COL.w - 276) / 2, y: 990 };
  const cen = (b) => [b.x + b.w / 2, b.y + b.h / 2];

  // white rounded chip; '|' forces a line break
  function chip(g, str, x, y, size, a, maxW = COL.w - 60 - 0) {
    if (a <= 0) return 0;
    const o = { size, weight: 600, color: C.ink };
    const lines = str.split('|');
    const lh = size * 1.18, pad = 24;
    const w = Math.max(...lines.map((l) => measure(g, l, o))) + pad * 2, h = lines.length * lh + pad * 2 - (lh - size);
    g.save(); g.globalAlpha *= a;
    g.shadowColor = 'rgba(16,30,40,0.16)'; g.shadowBlur = 24; g.shadowOffsetY = 6;
    rr(g, x, y, w, h, 22); g.fillStyle = '#fff'; g.fill(); g.restore();
    lines.forEach((l, i) => text(g, l, x + pad, y + pad + size * 0.8 + i * lh, { ...o, alpha: a }));
    return h;
  }

  function times() {
    const n05 = T.n05;
    return {
      t0: S.demo[0], t1: S.demo[1],
      f0: n05.s, f1: n05.s + 0.36 * n05.d, f2: n05.s + 0.6 * n05.d,
      shot: T.n04.s + 0.4,               // full screen springs in
      click: T.n06.s + 0.75,             // cursor presses Thrombo ASS
      src: T.n06.s + 1.1,                // cut to the source letter
      nd: T.n07.s - 0.25,                // cut to "Not documented"
      ct: T.n08.s - 0.2,                 // cut to the contradiction
    };
  }

  function draw(g, t) {
    const k = times();

    // ---- name card ----
    if (t < T.n03.s) {
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      const p = u(t - k.t0, 'snappy');
      text(g, 'Clinical Summary Desk', W / 2, 470 + (1 - p) * 30, { size: 90, weight: 700, align: 'center', alpha: clamp(p * 1.5, 0, 1) });
      buddies(g, W / 2 - 138, 900, 1, t, { mode: 'success', hop: 1, hopT: t - k.t0 - 0.15, look: [W / 2, 440] });
      return;
    }

    g.fillStyle = C.sidebar; g.fillRect(0, 0, W, H);
    criterion(g, 1, 'Would a clinician trust this screen?', t, k.t0 + 1.4, k.t1, false);

    // ---- n03: the search form, typing ----
    if (t < k.shot) {
      const p = u(t - T.n03.s, 'snappy');
      const fx = 1100, fy = 170 + (1 - p) * 60;
      let name = 'search-form-patient';
      const a0 = T.n03.s + 0.3, a1 = T.n03.e + 0.1;
      if (t >= a0) name = 'search-form-0' + clamp(1 + Math.floor(((t - a0) / (a1 - a0)) * 8), 1, 8);
      if (t >= T.n04.s) name = 'search-form-searching';
      crop(g, name, fx, fy, 720, { shadow: 40, radius: 22, alpha: clamp(p * 1.6, 0, 1) });
      const w1 = u(t - T.n03.s - 0.1, 'snappy'), w2 = u(t - T.n03.s - 0.5, 'snappy');
      text(g, 'Type role', 140, 420 + (1 - w1) * 20, { size: 100, weight: 700, alpha: clamp(w1 * 1.5, 0, 1) });
      text(g, 'and task', 140, 540 + (1 - w2) * 20, { size: 100, weight: 700, color: C.link, alpha: clamp(w2 * 1.5, 0, 1) });
      const searching = t >= T.n04.s;
      buddies(g, 140, 980, 1, t, { mode: searching ? 'searching' : 'task', bob: searching, look: [fx + 360, 620] });
      return;
    }

    // ---- n04..n07: the anaesthetist's screen ----
    if (t < k.ct) {
      const onSource = t >= k.src && t < k.nd;
      let cam, rectH;
      const name = onSource ? 'sit1-source' : 'sit1-screen';
      const B = E.BOX.sit1;
      if (t < k.src) {
        const cx = 640, ty = cen(B.thrombo)[1], ay = cen(B.allergyLink)[1], ey = cen(B.ef)[1];
        const v = Spring.to2(t, [[0, [720, 450, 1440]], [k.f0, [cx, ty, 700]], [k.f1, [cx, ay, 700]], [k.f2, [cx, ey, 700]], [T.n06.s, [620, ty, 620]]], 'camera');
        cam = { cx: v[0], cy: v[1], vw: v[2] };
        rectH = Spring.to(t, [[0, 700], [k.f0, 820]], 'camera');
      } else if (onSource) {
        const [mx, my] = cen(E.BOX.source.mark);
        cam = { cx: mx + 160, cy: my, vw: Spring.to(t, [[0, 720], [k.src, 640]], 'camera') };
        rectH = 820;
      } else {
        const [nx, ny] = cen(B.rowNotDoc);
        cam = { cx: nx, cy: ny, vw: Spring.to(t, [[0, 840], [k.nd, 760]], 'camera') };
        rectH = 820;
      }
      { const hv = rectH * cam.vw / CARD.w; cam.cy = clamp(cam.cy, Math.min(450, hv / 2), Math.max(450, 900 - hv / 2)); }
      // the card springs in at the start of the result screen
      const pin = u(t - k.shot, 'playful');
      const sc = lerp(0.9, 1, pin);
      const rw = CARD.w * sc, rh = rectH * sc;
      const rect = { x: CARD.x + (CARD.w - rw) / 2, y: CARD.y + (rectH - rh) / 2, w: rw, h: rh };
      g.save(); g.globalAlpha = clamp(pin * 2, 0, 1);
      const pl = plate(g, name, cam, rect, { radius: 24, shadow: 40 });
      g.restore();
      const box = (b) => { const [x0, y0] = pl.map(b.x, b.y); return [x0, y0, b.w * pl.s, b.h * pl.s]; };

      // n04: timer + words
      if (t < k.f0 + 0.1) {
        const a = fade(t, k.shot, k.f0 + 0.1, 0.25);
        const tp = clamp(u(t - k.shot, 'heavy'), 0, 1);
        const val = (tp * 2.3).toFixed(1) + ' s';
        g.save(); g.globalAlpha = a; g.shadowColor = 'rgba(16,30,40,0.16)'; g.shadowBlur = 24; g.shadowOffsetY = 6;
        rr(g, COL.x, 180, COL.w - 40, 170, 24); g.fillStyle = '#fff'; g.fill(); g.restore();
        text(g, val, COL.x + (COL.w - 40) / 2, 310, { size: 120, weight: 500, font: 'mono', color: C.link, align: 'center', alpha: a });
        const w1 = u(t - T.n04.s - 1.2, 'snappy'), w2 = u(t - T.n04.s - 2.2, 'snappy');
        text(g, 'One screen,', COL.x + 10, 470, { size: 60, weight: 700, alpha: a * clamp(w1 * 1.5, 0, 1) });
        text(g, 'only this task', COL.x + 10, 545, { size: 60, weight: 700, color: C.link, alpha: a * clamp(w2 * 1.5, 0, 1) });
      }

      // n05: three facts
      if (t >= k.f0 - 0.1 && t < T.n06.s) {
        const facts = [[B.thrombo, k.f0, k.f1, 'Blood thinner|100 mg 1-0-0'], [B.allergyLink, k.f1, k.f2, 'Contrast allergy'], [B.ef, k.f2, T.n06.s, 'EF 60 %']];
        for (const [b, s0, s1, label] of facts) {
          if (t < s0 || t >= s1) continue;
          const [x, y, w, h] = box(b);
          ring(g, x, y, w, h, u(t - s0 - 0.35, 'snappy'));
          const cp = u(t - s0 - 0.3, 'snappy');
          chip(g, label, COL.x + (1 - cp) * 30, 400, 64, clamp(cp * 1.6, 0, 1) * fade(t, s0, s1, 0.15));
        }
      }

      // n06: click -> source sentence
      if (t >= T.n06.s && t < k.nd) {
        const ha = fade(t, T.n06.s, k.nd, 0.25);
        const h1 = u(t - T.n06.s - 0.1, 'snappy');
        text(g, 'Every fact →', COL.x + 10, 330 + (1 - h1) * 20, { size: 80, weight: 700, alpha: ha * clamp(h1 * 1.5, 0, 1) });
        text(g, 'its sentence', COL.x + 10, 425 + (1 - h1) * 20, { size: 80, weight: 700, color: C.link, alpha: ha * clamp(h1 * 1.5, 0, 1) });
        if (!onSource) {
          const [x, y, w, h] = box(B.thrombo);
          ring(g, x, y, w, h, u(t - T.n06.s, 'snappy') * 0.8);
          const tx = x + w * 0.45, ty = y + h * 0.6;
          const cx = Spring.to(t, [[0, CARD.x + CARD.w - 120], [T.n06.s + 0.1, tx]], 'snappy');
          const cy = Spring.to(t, [[0, CARD.y + 760], [T.n06.s + 0.1, ty]], 'snappy');
          const press = t >= k.click ? clamp((t - k.click) / 0.25, 0, 1) : 0;
          cursor(g, cx, cy, press);
        } else {
          const [x, y, w, h] = box(E.BOX.source.mark);
          const pulse = 0.5 + 0.5 * Math.sin((t - k.src) * 2 * Math.PI / 1.1);
          g.save(); g.shadowColor = C.link; g.shadowBlur = 10 + 18 * pulse;
          ring(g, x, y, w, h, u(t - k.src - 0.1, 'snappy'), C.link, 12 + 4 * pulse, 5);
          g.restore();
        }
      }

      // n07: not documented
      if (t >= k.nd) {
        const [x, y, w, h] = box(B.rowNotDoc);
        ring(g, x, y, w, h, u(t - k.nd - 0.3, 'snappy'), C.link, 6);
        const cp = u(t - k.nd - 0.35, 'snappy');
        chip(g, 'Not documented|≠ guessed', COL.x + (1 - cp) * 30, 400, 64, clamp(cp * 1.6, 0, 1));
      }

      const look = onSource ? [CARD.x + CARD.w / 2, 560] : [CARD.x + CARD.w * 0.6, 580];
      buddies(g, BUD_R.x, BUD_R.y, 1, t, { mode: onSource ? 'surprised' : (t >= k.nd ? 'look' : 'success'), surpriseT: t - k.src, look });
      return;
    }

    // ---- n08: contradiction, side by side ----
    const Cx = E.BOX.contra;
    const [mx, my] = cen(Cx.modal);
    const cam = { cx: mx, cy: my, vw: Spring.to(t, [[0, 960], [k.ct, 900]], 'camera') };
    const pl = plate(g, 'sit1-contra', cam, { x: CARD.x, y: CARD.y, w: CARD.w, h: 820 }, { radius: 24, shadow: 40 });
    Cx.quotes.forEach((q, i) => {
      const p = clamp(u(t - k.ct - 0.4 - i * 0.35, 'snappy'), 0, 1);
      if (p <= 0) return;
      const [x0, y0] = pl.map(q.x + 13, q.y + 18);
      g.save(); g.strokeStyle = C.alert; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + [82, 100][i] * pl.s * p, y0); g.stroke(); g.restore();
    });
    const cp = u(t - k.ct - 0.3, 'snappy');
    chip(g, 'Contradiction|found:|links vs rechts', COL.x + (1 - cp) * 30, 300, 64, clamp(cp * 1.6, 0, 1));
    buddies(g, BUD_R.x, BUD_R.y, 1, t, { mode: 'error', look: [CARD.x + CARD.w / 2, 560] });
  }

  E.chapter('demo', draw, () => {
    if (!T.n03) return [];
    const k = times(), cues = [{ t: k.t0 + 0.05, kind: 'pop', gain: 0.5 }];
    const a0 = T.n03.s + 0.3, a1 = T.n03.e + 0.1;
    for (let i = 0; i < 8; i++) cues.push({ t: a0 + (i / 8) * (a1 - a0), kind: 'type', gain: 0.35 });
    cues.push({ t: k.shot, kind: 'whoosh', gain: 0.6 }, { t: k.shot + 0.9, kind: 'chime', gain: 0.4 });
    for (const f of [k.f0, k.f1, k.f2]) cues.push({ t: f + 0.35, kind: 'tick', gain: 0.5 });
    cues.push({ t: k.click, kind: 'click', gain: 0.8 }, { t: k.src, kind: 'pop', gain: 0.6 });
    cues.push({ t: k.nd + 0.3, kind: 'tick', gain: 0.5 }, { t: k.ct + 0.4, kind: 'hit', gain: 0.5 });
    return cues;
  });
})();
