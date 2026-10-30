// chapter file: demo2 (a05..a08): source sentence, contradiction, not documented, browse by date / type
(function () {
  const { W, H, C, T, S, u, fade, clamp, lerp, text, measure, rr, plate, cursor, ring, criterion, buddies } = E;

  const CARD = { x: 70, y: 70, w: 1160, h: 864 };          // main plate card (ends above the subtitle band)
  const SQ = { x: 200, y: 70, w: 650, h: 864 };            // just the sidebar: 1.8 canvas px per CSS px (as crisp as vw 420 at 760 wide)            // square card for the sidebar shot
  const COL = { x: 1275, w: 560 };                          // clear column for chips
  const cen = (b) => [b.x + b.w / 2, b.y + b.h / 2];
  const lerpR = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

  // CSS boxes read off the plates (not in boxes.json)
  const NOTDOC_TXT = { x: 497, y: 609, w: 125, h: 22 };     // "Not documented" (sit1-screen)
  const UNRES = { x: 1059, y: 244, w: 68, h: 18 };          // "Unresolved" tag (sit1-contra)
  const TAB_TYPE = { x: 1292, y: 112, w: 90, h: 24 };
  const GROUP1 = { x: 1114, y: 243, w: 310, h: 18 };       // "Allergies and reactions  4" heading (sit1-bytype)      // "By type" tab
  const FILTER = { x: 1119, y: 157, w: 303, h: 34 };        // "All topics" filter
  const DROP = { x: 1119, y: 157, w: 303, h: 460 };         // filter + open dropdown

  // white rounded chip; '|' forces a line break. o: {color, color2, scale, rot, border, bar}
  function chip(g, str, x, y, size, a, o = {}) {
    if (a <= 0) return 0;
    const st = { size, weight: 650, color: o.color ?? C.ink };
    const lines = str.split('|');
    const lh = size * 1.16, pad = Math.round(size * 0.42);
    const w = Math.max(...lines.map((l) => measure(g, l, st))) + pad * 2, h = lines.length * lh + pad * 2 - (lh - size);
    g.save(); g.globalAlpha *= a;
    const sc = o.scale ?? 1;
    g.translate(x + w / 2, y + h / 2); g.rotate(((o.rot ?? 0) * Math.PI) / 180); g.scale(sc, sc); g.translate(-(x + w / 2), -(y + h / 2));
    g.save(); g.shadowColor = 'rgba(16,30,40,0.18)'; g.shadowBlur = 28; g.shadowOffsetY = 8;
    rr(g, x, y, w, h, 22); g.fillStyle = '#fff'; g.fill(); g.restore();
    if (o.border) { rr(g, x + 3, y + 3, w - 6, h - 6, 19); g.strokeStyle = o.border; g.lineWidth = 5; g.stroke(); }
    if (o.bar) { g.fillStyle = o.bar; rr(g, x, y + 14, 8, h - 28, 4); g.fill(); }
    lines.forEach((l, i) => text(g, l, x + pad, y + pad + size * 0.8 + i * lh, { ...st, color: i === 0 ? st.color : (o.color2 ?? st.color) }));
    g.restore();
    return h;
  }

  // when word i of line id is spoken (the engine's own estimate)
  const at = (id, i) => { const L = T[id]; return L.s + (i / L.text.split(/\s+/).length) * L.d * 0.94; };
  // log-space zoom: spring the log of vw
  const logVW = (t, keys, preset = 'camera') => Math.exp(Spring.to(t, keys.map(([k, v]) => [k, Math.log(v)]), preset));

  function times() {
    return {
      t0: S.demo2[0], t1: S.demo2[1],
      q: at('a05', 3),                       // "Where from?"
      cur: at('a05', 5) - 0.35,              // cursor starts to glide
      click: at('a05', 6) + 0.1,             // "click"
      hand: at('a05', 6) + 0.35,             // ring -> highlighted sentence
      exact: at('a05', 9),                   // "exact sentence"
      out: at('a05', 6) + 1.5,               // zoom out to the whole letter
      ct: T.a06.s - 0.55,                    // flood to the contradiction
      unres: Math.min(T.a06.e - 0.4, T.a07.s - 2.6), // after "side by side", held >= 2 s
      nd: T.a07.s - 0.5,                     // back to the screen: not documented
      sb: T.a08.s - 0.45,                    // camera travels to the sidebar
      date: at('a08', 4),
      tabClick: at('a08', 5) - 0.1,
      wipe: at('a08', 5) + 0.1,
      grp: at('a08', 5) + 0.8,
      type: at('a08', 8),
      fClick: T.a08.e + 0.2,
      drop: T.a08.e + 0.4,
    };
  }

  function card(g, name, cam, rect, alpha = 1) {
    g.save(); g.globalAlpha *= alpha;
    const pl = plate(g, name, cam, rect, { radius: 24, shadow: 40 });
    g.restore();
    return pl;
  }
  const mapBox = (pl, b) => { const [x0, y0] = pl.map(b.x, b.y); return [x0, y0, b.w * pl.s, b.h * pl.s]; };
  function ripple(g, x, y, t, t0) {
    const p = clamp((t - t0) / 0.6, 0, 1);
    if (p <= 0 || p >= 1) return;
    const r = 18 + 90 * u(t - t0, 'snappy');
    g.save(); g.globalAlpha = 0.5 * (1 - p); g.strokeStyle = C.link; g.lineWidth = 5;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function glowRing(g, x, y, w, h, p, t, t0, color = C.link) {
    const pulse = 0.5 + 0.5 * Math.sin((t - t0) * 2 * Math.PI / 1.2);
    g.save(); g.shadowColor = color; g.shadowBlur = 10 + 22 * pulse;
    ring(g, x, y, w, h, p, color, 12 + 4 * pulse, 5);
    g.restore();
  }

  function draw(g, t) {
    const k = times();
    g.fillStyle = C.sidebar; g.fillRect(0, 0, W, H);
    let budMode = 'look', budLook = [CARD.x + CARD.w / 2, 500], surpriseT = -1;

    if (t < k.ct + 0.9) {
      // ---------- beat 1: EF -> its sentence ----------
      const B = E.BOX.sit1, M = E.BOX.efSource.mark;
      const [ex, ey] = cen(B.ef), [mx, my] = cen(M);
      const vw = logVW(t, [[0, 980], [k.t0, 980], [k.t0 + 0.05, 500], [k.hand, 540], [k.out, 886]]);
      const cx = Spring.to(t, [[0, 700], [k.t0 + 0.05, ex], [k.hand, mx + 5], [k.out, 720]], 'camera');
      const cy = Spring.to(t, [[0, 470], [k.t0 + 0.05, ey], [k.hand, my], [k.out, 450]], 'camera');
      const cam = { cx, cy, vw };
      // shared-element hand-off: the source plate dissolves in over the screen
      const hp = clamp(u(t - k.hand, 'camera'), 0, 1);
      const punch = 1 + 0.025 * Math.sin(clamp((t - k.click) / 0.35, 0, 1) * Math.PI);
      const cw = Spring.to(t, [[0, CARD.w], [k.out, 900]], 'camera');   // card narrows to the letter's shape
      const rect = { x: CARD.x + cw * (1 - punch) / 2, y: CARD.y + CARD.h * (1 - punch) / 2, w: cw * punch, h: CARD.h * punch };
      const pl = card(g, 'sit1-screen', cam, rect);
      if (hp > 0) card(g, 'sit1-ef-source', cam, rect, clamp(hp * 1.4, 0, 1));

      // the ring: EF link -> grows and morphs into the highlighted sentence
      const rb = lerpR(B.ef, M, hp);
      const [rx, ry, rw, rh] = mapBox(pl, rb);
      const rp = u(t - (k.t0 + 0.35), 'snappy');
      if (t < k.hand + 0.5) {
        const grow = 1 + 0.35 * Math.sin(hp * Math.PI);           // swells mid-flight, settles on the passage
        const gcx = rx + rw / 2, gcy = ry + rh / 2;
        ring(g, gcx - rw * grow / 2, gcy - rh * grow / 2, rw * grow, rh * grow, rp, C.link, 12, 5);
      } else glowRing(g, rx, ry, rw, rh, 1, t, k.hand + 0.5);

      // chips: "EF 60 %" then the source chip
      const sa = fade(t, k.t0, k.ct + 0.6, 0.25);
      const p1 = u(t - (k.t0 + 0.45), 'snappy');
      const a1 = clamp(p1 * 1.6, 0, 1) * (1 - clamp(u(t - k.hand, 'snappy'), 0, 1));
      chip(g, 'EF 60 %', COL.x + (1 - p1) * 40, 200, 90, a1 * sa, { color: C.link });
      // "?" punch
      if (t >= k.q - 0.1 && t < k.hand + 0.3) {
        const qp = u(t - k.q, 'playful');
        const qa = clamp(qp * 2, 0, 1) * (1 - clamp(u(t - k.click, 'snappy'), 0, 1));
        const qs = 0.6 + 0.4 * qp;
        g.save(); g.translate(COL.x + 150, 640); g.scale(qs, qs); g.rotate((1 - qp) * -0.15);
        text(g, '?', 0, 0, { size: 300, weight: 700, color: C.link, align: 'center', alpha: qa });
        g.restore();
      }
      // cursor glides in and clicks
      if (t >= k.cur && t < k.hand + 0.6) {
        const [bx, by] = pl.map(B.ef.x + B.ef.w * 0.55, B.ef.y + B.ef.h * 0.65);
        const pc = Spring.to2(t, [[0, [CARD.x + CARD.w - 80, CARD.y + CARD.h - 60]], [k.cur, [bx, by]]], 'snappy');
        const press = t >= k.click ? 1 - clamp((t - k.click - 0.12) / 0.2, 0, 1) : 0;
        const ca = clamp((t - k.cur) / 0.15, 0, 1) * (1 - clamp((t - k.hand - 0.3) / 0.3, 0, 1));
        g.save(); g.globalAlpha = ca; cursor(g, pc[0], pc[1], press); g.restore();
        ripple(g, bx, by, t, k.click);
      }
      const p2 = u(t - k.exact, 'snappy');
      chip(g, 'Exact passage|original letter|28 Jun 2015', COL.x + (1 - p2) * 40, 200, 54, clamp(p2 * 1.6, 0, 1) * sa, { bar: C.mark, color2: C.muted });
      if (t >= k.q && t < k.q + 1.3) { budMode = 'surprised'; surpriseT = t - k.q; }
      budLook = [rx + rw / 2, ry];

      // flood circle to the contradiction (over the end of beat 1)
      if (t >= k.ct) {
        const fr = 1500 * u(t - k.ct, 'camera');
        g.save(); g.beginPath(); g.arc(rx + rw / 2, ry + rh / 2, fr, 0, Math.PI * 2); g.clip();
        drawContra(g, t, k);
        g.restore();
      }
    } else if (t < k.nd) {
      drawContra(g, t, k);
      const neq = T.a06.s + 1.5;
      if (t >= neq && t < neq + 1.3) { budMode = 'surprised'; surpriseT = t - neq; }
      budLook = [660, 520];
    } else {
      // ---------- beat 3 + 4: the screen again, then the sidebar ----------
      const [nx, ny] = cen(NOTDOC_TXT);
      const side = t >= k.sb;
      const sp = clamp(u(t - k.sb, 'camera'), 0, 1);
      const vw = logVW(t, [[0, 820], [k.nd, 820], [k.nd + 0.05, 540], [k.sb, 360]]);
      const cx = Spring.to(t, [[0, nx + 120], [k.nd + 0.05, nx + 40], [k.sb, 1260]], 'camera');
      const cy = Spring.to(t, [[0, ny], [k.nd + 0.05, ny - 20], [k.sb, 286], [k.drop - 0.3, 372]], 'camera');
      const rect = lerpR(CARD, SQ, sp);
      const ip = u(t - k.nd, 'snappy');                          // entrance: a small scale settle
      const es = lerp(1.05, 1, clamp(ip, 0, 1.1));
      const r2 = { x: rect.x + rect.w * (1 - es) / 2, y: rect.y + rect.h * (1 - es) / 2, w: rect.w * es, h: rect.h * es };
      const cam = { cx, cy, vw };
      const pl = card(g, 'sit1-screen', cam, r2);
      // horizontal wipe to "By type"
      if (t >= k.wipe) {
        const wp = clamp(u(t - k.wipe, 'camera'), 0, 1);
        const edge = r2.x + r2.w * (1 - wp);
        g.save(); g.beginPath(); g.rect(edge, r2.y - 60, r2.w + 120, r2.h + 120); g.clip();
        card(g, 'sit1-bytype', cam, r2);
        // the dropdown springs open below the filter
        if (t >= k.drop) {
          const dp = clamp(u(t - k.drop, 'snappy'), 0, 1.05);
          const [dx, dy, dw, dh] = mapBox(pl, DROP);
          g.save(); rr(g, r2.x, r2.y, r2.w, r2.h, 24); g.clip(); rr(g, dx - 20, dy - 4, dw + 40, dh * dp + 30, 8); g.clip();
          card(g, 'sit1-bytype-filter', cam, r2);
          g.restore();
        }
        g.restore();
        if (wp > 0.02 && wp < 0.98) { g.save(); g.fillStyle = C.link; g.fillRect(edge - 4, r2.y, 8, r2.h); g.restore(); }
      }
      if (!side || sp < 0.3) {
        const la = 1 - clamp(sp / 0.3, 0, 1);
        // dashed alert outline around "Not documented"
        const [x, y, w, h] = mapBox(pl, NOTDOC_TXT);
        const dp = u(t - (k.nd + 0.35), 'snappy');
        if (dp > 0) {
          g.save(); g.globalAlpha = clamp(dp * 1.5, 0, 1) * la; g.strokeStyle = C.alert; g.lineWidth = 5;
          g.setLineDash([16, 10]); g.lineDashOffset = -(t - k.nd) * 30;
          const e = 1 + 0.15 * (1 - dp), pad = 16;
          const ww = (w + pad * 2) * e, hh = (h + pad * 2) * e;
          rr(g, x + w / 2 - ww / 2, y + h / 2 - hh / 2, ww, hh, 12); g.stroke(); g.restore();
        }
        // stamp chip
        const sp2 = u(t - (k.nd + 0.6), 'heavy');
        chip(g, 'Not documented|≠ guessed', COL.x - 20, 330, 64, clamp(sp2 * 2, 0, 1) * la, { scale: lerp(1.35, 1, clamp(sp2, 0, 1)), rot: -3 * clamp(sp2, 0, 1), border: C.alert, color2: C.alert });
        budLook = [x + w / 2, y];
        if (t >= k.nd + 0.6) budMode = 'error';
      }
      if (side) {
        // the cursor clicks "By type", then the filter
        const [tx, ty] = pl.map(TAB_TYPE.x + TAB_TYPE.w * 0.5, TAB_TYPE.y + TAB_TYPE.h * 0.6);
        const [fx, fy] = pl.map(FILTER.x + FILTER.w * 0.35, FILTER.y + FILTER.h * 0.6);
        if (t >= k.tabClick - 0.6) {
          const pc = Spring.to2(t, [[0, [r2.x + r2.w * 0.3, r2.y + r2.h - 80]], [k.tabClick - 0.6, [tx, ty]], [k.fClick - 0.45, [fx, fy]]], 'snappy');
          const pr = (c) => (t >= c ? 1 - clamp((t - c - 0.12) / 0.2, 0, 1) : 0);
          const ca = clamp((t - k.tabClick + 0.6) / 0.15, 0, 1) * (1 - clamp((t - k.fClick - 0.6) / 0.3, 0, 1));
          g.save(); g.globalAlpha = ca; cursor(g, pc[0], pc[1], Math.max(pr(k.tabClick), pr(k.fClick))); g.restore();
          ripple(g, tx, ty, t, k.tabClick); ripple(g, fx, fy, t, k.fClick);
        }
        const chipX = SQ.x + SQ.w + 100;
        const d1 = u(t - k.date, 'snappy'), d2 = u(t - k.type, 'snappy');
        const dimDate = 1 - 0.55 * clamp(d2, 0, 1);
        chip(g, 'By date', chipX + (1 - d1) * 40, 300, 60, clamp(d1 * 1.6, 0, 1) * dimDate, { color: C.ink });
        chip(g, 'By type', chipX + (1 - d2) * 40, 440, 60, clamp(d2 * 1.6, 0, 1), { color: C.link });
        // rings: the tab, the first group heading, the opened filter
        const tr = mapBox(pl, TAB_TYPE);
        ring(g, ...tr, u(t - (k.tabClick - 0.25), 'snappy') * (1 - clamp(u(t - (k.wipe + 0.5), 'snappy'), 0, 1)), C.link, 10, 5);
        const gr = mapBox(pl, GROUP1);
        if (t >= k.grp) ring(g, ...gr, u(t - k.grp, 'snappy') * (1 - clamp(u(t - k.fClick, 'snappy'), 0, 1)), C.link, 10, 5);
        const fr = mapBox(pl, FILTER);
        if (t >= k.drop) glowRing(g, ...fr, u(t - k.drop - 0.1, 'snappy'), t, k.drop);
        budLook = t < k.wipe ? [tr[0] + tr[2] / 2, tr[1]] : t < k.drop ? [gr[0] + gr[2] / 2, gr[1]] : [fr[0] + fr[2] / 2, fr[1] + 200];
      }
    }
    { // criterion tag: first 1.5 s only, on a soft backdrop over the card
      const ca = fade(t, k.t0, k.t0 + 1.5, 0.35);
      if (ca > 0) {
        const qw = measure(g, 'Would a clinician trust this screen?', { size: 40, weight: 600 }) + 74 + 44;
        g.save(); g.globalAlpha = ca; g.shadowColor = 'rgba(16,30,40,0.15)'; g.shadowBlur = 20;
        rr(g, 76, 42, qw, 72, 36); g.fillStyle = 'rgba(255,255,255,0.96)'; g.fill(); g.restore();
      }
      criterion(g, 1, 'Would a clinician trust this screen?', t, k.t0, k.t0 + 1.5);
    }
    // buddies: one home per beat in the empty bottom-right, entering from the right edge; springs between homes
    const bp = Spring.to2(t, [[0, [2200, 905, 1.0]], [k.t0 + 0.2, [1570, 905, 1.0]], [k.out, [1390, 905, 1.4]], [k.ct, [1570, 905, 1.0]], [k.sb, [1440, 905, 1.3]]], 'camera');
    buddies(g, bp[0], bp[1], bp[2], t, { mode: budMode, look: budLook, surpriseT });
  }

  // ---------- beat 2: two sources, side by side ----------
  function drawContra(g, t, k) {
    const X = E.BOX.contra;
    g.fillStyle = C.sidebar; g.fillRect(0, 0, W, H);
    const vw = logVW(t, [[0, 1080], [k.ct, 1080], [k.ct + 0.05, 960]]);
    const cam = { cx: 720, cy: Spring.to(t, [[0, 460], [k.ct + 0.05, 440]], 'camera'), vw };
    const pl = card(g, 'sit1-contra', cam, CARD);
    const split = u(t - (T.a06.s + 0.25), 'camera');          // quotes slide apart
    const off = [-58 * split, 58 * split];
    if (split > 0.001) {
      // lift both quotes off the page: white out the originals, redraw each clipped and offset
      const boxes = X.quotes.map((q) => mapBox(pl, { x: q.x - 8, y: q.y - 3, w: q.w + 14, h: q.h + 10 }));
      g.save(); rr(g, CARD.x, CARD.y, CARD.w, CARD.h, 24); g.clip(); g.fillStyle = '#fff';
      boxes.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h)); g.restore();
      boxes.forEach(([x, y, w, h], i) => {
        const dx = off[i], lift = clamp(split, 0, 1);
        g.save();
        g.shadowColor = `rgba(16,30,40,${0.2 * lift})`; g.shadowBlur = 30 * lift; g.shadowOffsetY = 8 * lift;
        rr(g, x + dx, y, w, h, 16); g.fillStyle = '#fff'; g.fill(); g.restore();
        g.save(); rr(g, x + dx, y, w, h, 16); g.clip(); g.translate(dx, 0);
        plate(g, 'sit1-contra', cam, CARD);
        g.restore();
      });
    }
    // underline "Links" / "Rechts" in red
    const UL = [[X.quotes[0].x + 21, 35], [X.quotes[1].x + 19, 47]];
    X.quotes.forEach((q, i) => {
      const p = clamp(u(t - (T.a06.s + 0.8 + i * 0.3), 'snappy'), 0, 1);
      if (p <= 0) return;
      const [x0, y0] = pl.map(UL[i][0], q.y + 20);
      g.save(); g.strokeStyle = C.alert; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0 + off[i], y0); g.lineTo(x0 + off[i] + UL[i][1] * pl.s * p, y0); g.stroke(); g.restore();
    });
    // "≠" punch between the quotes
    const np = u(t - (T.a06.s + 1.5), 'playful');
    if (np > 0) {
      const [gx, gy] = pl.map(720, 470);
      const sc = clamp(np, 0, 1.3);
      g.save(); g.translate(gx, gy); g.scale(sc, sc);
      g.shadowColor = 'rgba(160,58,58,0.35)'; g.shadowBlur = 24;
      g.beginPath(); g.arc(0, 0, 54, 0, Math.PI * 2); g.fillStyle = C.alert; g.fill(); g.shadowColor = 'transparent';
      text(g, '≠', 0, 26, { size: 76, weight: 700, color: '#fff', align: 'center' });
      g.restore();
    }
    // "Unresolved" ring + chip
    const up = u(t - k.unres, 'snappy');
    if (up > 0) {
      const [x, y, w, h] = mapBox(pl, UNRES);
      glowRing(g, x, y, w, h, up, t, k.unres, C.alert);
    }
    const hp = u(t - (T.a06.s + 0.2), 'snappy');
    const cp = u(t - k.unres - 0.15, 'snappy');
    chip(g, 'Left ≠ right', COL.x + (1 - hp) * 40, 200, 64, clamp(hp * 1.6, 0, 1), { color: C.alert });
    chip(g, 'Unresolved|kept for review', COL.x + (1 - cp) * 40, 360, 54, clamp(cp * 1.6, 0, 1), { bar: C.alert, color: C.alert, color2: C.ink });
  }

  E.chapter('demo2', draw, () => {
    if (!T.a05) return [];
    const k = times();
    return [
      { t: k.t0 + 0.05, kind: 'whoosh', gain: 0.5 }, { t: k.t0 + 0.4, kind: 'tick', gain: 0.5 },
      { t: k.q, kind: 'pop', gain: 0.6 }, { t: k.click, kind: 'click', gain: 0.8 }, { t: k.hand + 0.2, kind: 'chime', gain: 0.45 },
      { t: k.ct, kind: 'whoosh', gain: 0.6 }, { t: T.a06.s + 0.8, kind: 'tick', gain: 0.45 }, { t: T.a06.s + 1.5, kind: 'hit', gain: 0.6 },
      { t: k.unres, kind: 'tick', gain: 0.5 },
      { t: k.nd, kind: 'whoosh', gain: 0.5 }, { t: k.nd + 0.6, kind: 'thud', gain: 0.6 },
      { t: k.sb, kind: 'whoosh', gain: 0.5 }, { t: k.tabClick, kind: 'click', gain: 0.7 }, { t: k.wipe, kind: 'whoosh', gain: 0.4 },
      { t: k.fClick, kind: 'click', gain: 0.7 }, { t: k.drop, kind: 'pop', gain: 0.45 },
    ];
  });
})();
