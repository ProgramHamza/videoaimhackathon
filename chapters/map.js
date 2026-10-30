// chapters/map.js: "Doctors in Austria, Slovakia and Switzerland tried it, and want it. Next: a supervised pilot."
(function () {
  const { W, H, C, T, S, u, clamp, lerp, text, measure, buddies } = E;
  const xhr = new XMLHttpRequest(); xhr.open('GET', 'assets/map.json', false); xhr.send();
  const MAP = JSON.parse(xhr.responseText);

  // map box: 1500 wide, aspect from the data, centred above the subtitle band
  const BW = 1500, BH = BW / MAP.aspect, BX = (W - BW) / 2, BY = 80;
  const P = ([x, y]) => [BX + x * BW, BY + y * BH];
  const FILL = { Austria: C.link, Slovakia: '#2f7fd0', Switzerland: '#5aa9ff' };
  // label anchors (unit box), chosen to sit clear of the city labels
  const LABEL = { Austria: [0.525, 0.64], Slovakia: [0.80, 0.405], Switzerland: [0.215, 0.625] };
  const CITY = { // label side: dx, dy (px from the pin), align
    Bratislava: { dx: 26, dy: 50, align: 'left' }, Vienna: { dx: 0, dy: -28, align: 'center' },
    Linz: { dx: -8, dy: -28, align: 'right' }, Salzburg: { dx: -24, dy: 15, align: 'right' },
    Visp: { dx: -14, dy: 62, align: 'right' },
  };

  function pathOf(c) {
    const p = new Path2D();
    for (const r of c.rings) { r.forEach((pt, i) => { const [x, y] = P(pt); i ? p.lineTo(x, y) : p.moveTo(x, y); }); p.closePath(); }
    return p;
  }
  function centroid(c) {
    let best = null, ba = 0;
    for (const r of c.rings) {
      let a = 0, cx = 0, cy = 0;
      for (let i = 0; i < r.length; i++) {
        const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length], f = x0 * y1 - x1 * y0;
        a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
      }
      if (Math.abs(a) > ba) { ba = Math.abs(a); best = [cx / (3 * a), cy / (3 * a)]; }
    }
    return P(best);
  }
  function bbox(c) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const r of c.rings) for (const pt of r) { const [x, y] = P(pt); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x0, y0, x1, y1 };
  }
  const COUNTRIES = MAP.countries.map((c) => ({ ...c, path: pathOf(c), cen: centroid(c), bb: bbox(c) }));
  const FOCUS = ['Austria', 'Slovakia', 'Switzerland'];

  // timing from the voice line: word i at s + i/n * d * 0.94
  function k() {
    const L = T.x02, words = L.text.split(' ');
    const wt = (w) => { const i = words.findIndex((x) => x.replace(/[^A-Za-z]/g, '') === w); return L.s + (Math.max(0, i) / words.length) * L.d * 0.94; };
    const lit = { Austria: wt('Austria'), Slovakia: wt('Slovakia'), Switzerland: wt('Switzerland') };
    const pins = {
      Vienna: lit.Austria + 0.22, Linz: lit.Austria + 0.36, Salzburg: lit.Austria + 0.50,
      Bratislava: lit.Slovakia + 0.30, Visp: lit.Switzerland + 0.28,
    };
    const lastPin = Math.max(...Object.values(pins));
    return { lit, pins, lastPin, next: wt('Next') };
  }

  function halo(g, str, x, y, o) {
    g.save();
    g.font = `${o.weight ?? 600} ${o.size}px ${E.SANS}`; g.textAlign = o.align ?? 'center'; g.textBaseline = 'alphabetic';
    g.globalAlpha *= o.alpha ?? 1; g.lineJoin = 'round'; g.lineWidth = o.size * 0.22; g.strokeStyle = '#ffffff';
    g.strokeText(str, x, y);
    g.restore();
    text(g, str, x, y, { ...o, weight: o.weight ?? 600 });
  }

  E.chapter('map', (g, t) => {
    const [s0] = S.map, K = k();
    E.fill(g, C.bg);

    // gentle camera push about the map centre (slow, critically damped spring)
    const cam = 1 + 0.05 * Spring.unit(t - s0, Spring.make(1.3, 2.28));
    const mcx = BX + BW / 2, mcy = BY + BH / 2;
    const toScreen = ([x, y]) => [mcx + (x - mcx) * cam, mcy + (y - mcy) * cam];

    g.save();
    g.beginPath(); g.roundRect(BX, BY, BW, BH, 28); g.clip();
    g.translate(mcx, mcy); g.scale(cam, cam); g.translate(-mcx, -mcy);
    g.lineJoin = 'round';
    // neighbours first, then the focus countries on top
    const order = [...COUNTRIES.filter((c) => !c.focus), ...COUNTRIES.filter((c) => c.focus)];
    for (const c of order) {
      const lt = c.focus ? K.lit[c.name] : null;
      const dt = lt == null ? -1 : t - lt;
      const pop = dt > 0 ? 0.03 * (u(dt, 'snappy') - u(dt - 0.2, 'snappy')) : 0;
      g.save();
      if (pop) { g.translate(c.cen[0], c.cen[1]); g.scale(1 + pop, 1 + pop); g.translate(-c.cen[0], -c.cen[1]); }
      g.fillStyle = '#eef1f3'; g.fill(c.path);
      if (dt > 0) {
        // colour sweep: a circle grows from the country's west edge
        const ox = c.bb.x0, oy = (c.bb.y0 + c.bb.y1) / 2;
        const R = Math.hypot(c.bb.x1 - c.bb.x0, c.bb.y1 - c.bb.y0) * 1.05;
        g.save(); g.clip(c.path);
        g.beginPath(); g.arc(ox, oy, Math.max(0.1, R * u(dt, 'camera')), 0, Math.PI * 2);
        g.fillStyle = FILL[c.name]; g.fill();
        g.restore();
      }
      g.strokeStyle = '#ffffff'; g.lineWidth = 2 / cam; g.stroke(c.path);
      g.restore();
    }
    g.restore();

    // country labels (screen space, follow the camera)
    for (const name of FOCUS) {
      const dt = t - K.lit[name] - 0.08; if (dt <= 0) continue;
      const p = u(dt, 'playful');
      const [x, y] = toScreen(P(LABEL[name]));
      g.save(); g.translate(x, y); g.scale(lerp(0.6, 1, p), lerp(0.6, 1, p));
      halo(g, name, 0, 20, { size: 56, weight: 700, align: 'center', alpha: clamp(dt / 0.15, 0, 1) });
      g.restore();
    }

    // city pins
    for (const city of MAP.cities) {
      const pt = K.pins[city.name]; if (pt == null) continue;
      const dt = t - pt; if (dt <= 0) continue;
      const [x, y] = toScreen(P(city.at));
      const drop = (1 - u(dt, 'playful')) * -70;
      const a = clamp(dt / 0.1, 0, 1);
      // ripple, repeating every 1.6 s after landing
      const land = dt - 0.25;
      if (land > 0) {
        const ph = land % 1.6, rp = u(ph, 'heavy');
        g.save(); g.globalAlpha = 0.5 * (1 - rp); g.strokeStyle = C.ink; g.lineWidth = 3;
        g.beginPath(); g.arc(x, y, 9 + 30 * rp, 0, Math.PI * 2); g.stroke(); g.restore();
      }
      g.save(); g.globalAlpha = a;
      g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 8; g.shadowOffsetY = 2;
      g.beginPath(); g.arc(x, y + drop, 11, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
      g.shadowColor = 'transparent';
      g.beginPath(); g.arc(x, y + drop, 7, 0, Math.PI * 2); g.fillStyle = C.ink; g.fill();
      g.restore();
      const L = CITY[city.name], lp = u(dt - 0.12, 'snappy');
      if (lp > 0) halo(g, city.name, x + L.dx, y + L.dy + (1 - lp) * 12, { size: 44, weight: 600, align: L.align, alpha: clamp(lp, 0, 1) });
    }

    // who was asked: shown while the countries light up, then the "Next" card takes its place
    const first = Math.min(...FOCUS.map((n) => K.lit[n]));
    const wd = t - (first - 0.2), leaveAt = K.next - 0.25;
    if (wd > 0 && t < leaveAt + 0.3) {
      const p = u(wd, 'snappy'), out = clamp((t - leaveAt) / 0.3, 0, 1);
      const l1 = '5 doctors · 3 countries', l2 = 'each 20+ years in practice';
      const cw = Math.max(measure(g, l1, { size: 60, weight: 700 }), measure(g, l2, { size: 44, weight: 600 })) + 100, ch = 178;
      const cx = BX + 36 + (1 - p) * -260, cy = BY + 36 - out * 30;
      const a = clamp(wd / 0.15, 0, 1) * (1 - out);
      g.save(); g.globalAlpha = a;
      g.shadowColor = 'rgba(16,32,48,0.16)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
      E.rr(g, cx, cy, cw, ch, 22); g.fillStyle = '#ffffff'; g.fill();
      g.shadowColor = 'transparent';
      E.rr(g, cx, cy + 22, 8, ch - 44, 4); g.fillStyle = C.orange; g.fill();
      g.restore();
      text(g, l1, cx + 44, cy + 82, { size: 60, weight: 700, alpha: a });
      text(g, l2, cx + 44, cy + 138, { size: 44, weight: 600, color: '#c25a12', alpha: a * clamp((wd - 0.15) / 0.2, 0, 1) });
    }

    // "Next" card, top-left of the map
    const nd = t - K.next;
    if (nd > 0) {
      const p = u(nd, 'snappy');
      const cw = measure(g, 'Supervised pilot with clinicians', { size: 60, weight: 700 }) + 100, ch = 178, cx = BX + 36 + (1 - p) * -260, cy = BY + 36;
      g.save(); g.globalAlpha = clamp(nd / 0.15, 0, 1);
      g.shadowColor = 'rgba(16,32,48,0.16)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
      E.rr(g, cx, cy, cw, ch, 22); g.fillStyle = '#ffffff'; g.fill();
      g.shadowColor = 'transparent';
      E.rr(g, cx, cy + 22, 8, ch - 44, 4); g.fillStyle = C.link; g.fill();
      g.restore();
      const a = clamp(nd / 0.15, 0, 1);
      text(g, 'Next', cx + 44, cy + 66, { size: 40, weight: 600, color: C.link, alpha: a });
      text(g, 'Supervised pilot with clinicians', cx + 44, cy + 140, { size: 60, weight: 700, alpha: a * clamp((nd - 0.1) / 0.2, 0, 1) });
    }

    // buddies, bottom-left
    const ok = t >= K.lastPin + 0.25;
    // they watch the latest pin to drop (or the country just named), in the empty south-east of the map
    let look = toScreen(P([0.55, 0.5]));
    for (const c of MAP.cities) if (t >= K.pins[c.name] - 0.1 && K.pins[c.name] >= (look.at ?? -1)) { look = toScreen(P(c.at)); look.at = K.pins[c.name]; }
    buddies(g, 1335 + (W + 20 - 1335) * (1 - u(t - s0 - 0.1, 'camera')), 905, 1.3, t, { mode: ok ? 'success' : 'look', look: [look[0], look[1]],
      hop: ok ? 1 : 0, hopT: t - K.lastPin - 0.25, seed: 7 });
  }, () => {
    const K = k();
    return [
      ...FOCUS.map((n) => ({ t: K.lit[n], kind: 'pop', gain: 0.4 })),
      ...Object.values(K.pins).map((p) => ({ t: p + 0.2, kind: 'tick', gain: 0.3 })),
      { t: K.next, kind: 'chime', gain: 0.3 },
    ];
  });
})();
