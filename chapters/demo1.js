// chapter file: demo1 (a01..a04): name card, the search form, one screen, the three panels, the first four rows
(function () {
  const { W, H, C, T, S, u, fade, clamp, lerp, text, measure, rr, cursor, ring, criterion, buddies } = E;

  const CARD = { x: 70, y: 70, w: 1780, h: 864 };   // the screen card (a02, a03)
  const FORM = { x: 70, y: 70, w: 1780, h: 864 };   // the form window (a01)
    const elog = (a, b, p) => Math.exp(lerp(Math.log(a), Math.log(b), p));

  function times() {
    const a01 = T.a01, a02 = T.a02, a03 = T.a03, a04 = T.a04;
    const w3 = (k) => a03.s + (k / 17) * a03.d * 0.92;
    const w4 = (k) => a04.s + (k / 11) * a04.d * 0.92;   // "For example: allergies, ..."
    // the new login: click "Import patient folder", the import fills name and birth date, then the task is typed
    const formIn = Math.max(a01.s + 0.3, S.demo1[0] + 1.0);
    const click = formIn + 1.1, imported = click + 0.7, zoomIn = imported + 0.4, ty0 = zoomIn + 0.35, ty1 = ty0 + 2.3;
    return {
      t0: S.demo1[0], t1: S.demo1[1],
      formIn,
      click, imported, zoomIn,
      ty0, ty1,
      zoomOut: ty1 + 0.15,
      press: ty1 + 0.65,
      flood: a02.s - 0.25,
      land: a02.s + 0.25,
      spL: a03.s - 0.1, spC: w3(4) - 0.1, spR: w3(11) - 0.1, spEnd: a03.e + 0.3,
      push: a03.e + 0.3,
      rows: [w4(2), w4(3), w4(5), w4(7)],
    };
  }

  // the app's cross logo: dark circle, white plus
  function logo(g, x, y, r) {
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = C.ink; g.fill();
    g.fillStyle = '#fff'; const a = r * 0.36, b = r * 1.24;
    rr(g, x - a / 2, y - b / 2, a, b, a * 0.18); g.fill();
    rr(g, x - b / 2, y - a / 2, b, a, a * 0.18); g.fill();
    g.restore();
  }

  // a white chip with one line of text
  function chip(g, str, cx, y, size, a, o = {}) {
    if (a <= 0) return;
    const to = { size, weight: o.weight ?? 600, font: o.font, color: o.color ?? C.ink };
    const pad = o.pad ?? 26, w = measure(g, str, to) + pad * 2, h = size * 1.42;
    const x = clamp(o.align === 'right' ? cx - w : cx - w / 2, 96, W - 96 - w);
    g.save(); g.globalAlpha *= a;
    const sc = o.scale ?? 1;
    g.translate(x + w / 2, y + h / 2); g.scale(sc, sc); g.translate(-(x + w / 2), -(y + h / 2));
    g.shadowColor = 'rgba(16,30,40,0.18)'; g.shadowBlur = 26; g.shadowOffsetY = 6;
    rr(g, x, y, w, h, h / 2); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
    if (o.tail != null) { const tx = clamp(o.tail, x + 40, x + w - 40); g.beginPath(); g.moveTo(tx - 14, y + h - 1); g.lineTo(tx, y + h + 14); g.lineTo(tx + 14, y + h - 1); g.fill(); }
    text(g, str, x + pad, y + h / 2 + size * 0.35, to);
    g.restore();
  }

  // the search form crop with a camera: focus (crop px) lands at canvas (ax, ay), k = canvas px per crop px
  function formView(g, name, fx, fy, k, ax, ay) {
    const img = E.P[name]; if (!img) return null;
    const ox = ax - fx * k, oy = ay - fy * k;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, ox, oy, img.width * k, img.height * k);
    return (x, y) => [ox + x * k, oy + y * k];
  }

  function draw(g, t) {
    const k = times();
    const B = E.BOX.sit1, F = E.BOX.form;
    g.fillStyle = C.sidebar; g.fillRect(0, 0, W, H);

    // ---------- beat 1: name card ----------
    const out = u(t - k.formIn, 'camera');
    if (out < 0.999) {
      const p = u(t - k.t0, 'heavy'), pl = u(t - k.t0 - 0.12, 'playful');
      const sc = 1 + 0.35 * out;
      g.save(); g.globalAlpha = clamp(p * 1.4, 0, 1) * (1 - out);
      g.translate(W / 2, 480); g.scale(sc, sc); g.translate(-W / 2, -480);
      const tw = measure(g, 'TORU', { size: 130, weight: 800 });
      const lx = W / 2 - (tw + 140) / 2 + 52;
      g.save(); g.translate(lx, 480); g.scale(pl, pl); logo(g, 0, 0, 52); g.restore();
      text(g, 'TORU', lx + 88, 480 + 46 + (1 - p) * 30, { size: 130, weight: 800 });
      g.restore();
    }

    // ---------- beats 2-3: the search form ----------
    if (t < k.flood + 0.7 && t > k.formIn - 0.05) {
      const pin = u(t - k.formIn, 'camera');
      const pz = u(t - k.zoomIn, 'camera'), pzo = u(t - k.zoomOut, 'camera');
      const ta = { x: (F.textarea.x - F.form.x + 24) * 3, y: (F.textarea.y - F.form.y + 24) * 3, w: F.textarea.w * 3, h: F.textarea.h * 3 };
      const sb = { x: (F.submit.x - F.form.x + 24) * 3, y: (F.submit.y - F.form.y + 24) * 3, w: F.submit.w * 3, h: F.submit.h * 3 };
      const k0 = 1000 / 1524, k1 = 1150 / ta.w, k2 = 0.74;
      let kk = elog(k0, k1, pz); kk = elog(kk, k2, pzo);
      let fx = lerp(762, ta.x + ta.w / 2, pz), fy = lerp(560, ta.y + ta.h / 2, pz);
      fx = lerp(fx, 762, pzo); fy = lerp(fy, sb.y + sb.h / 2 - 330, pzo);
      const ay = 502;
      let name = 'search-form-empty';
      if (t >= k.click + 0.1) name = 'search-form-importing';
      if (t >= k.imported) name = 'search-form-patient';
      if (t >= k.ty0) name = 'typing/t' + String(clamp(Math.floor((t - k.ty0) / ((k.ty1 - k.ty0) / 24)), 0, 24)).padStart(2, '0');
      if (t >= k.press + 0.08) name = 'search-form-searching';
      const rise = (1 - pin) * 80;
      g.save(); g.globalAlpha = clamp(pin * 1.6, 0, 1);
      g.shadowColor = 'rgba(16,30,40,0.16)'; g.shadowBlur = 40; g.shadowOffsetY = 12;
      rr(g, FORM.x, FORM.y + rise, FORM.w, FORM.h, 26); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
      rr(g, FORM.x, FORM.y + rise, FORM.w, FORM.h, 26); g.clip();
      const map = formView(g, name, fx, fy, kk, lerp(lerp(960, 1010, pz), 960, pzo), ay + rise);
      // soft blue focus glow on the textarea while typing
      const glow = clamp(u(t - k.zoomIn - 0.2, 'snappy') * 1.2, 0, 1) * (1 - pzo);
      if (map && glow > 0) {
        const [x0, y0] = map(ta.x, ta.y), [x1, y1] = map(ta.x + ta.w, ta.y + ta.h);
        g.save(); g.globalAlpha = glow * 0.85; g.strokeStyle = 'rgba(31,90,148,0.55)'; g.lineWidth = 7;
        g.shadowColor = C.link; g.shadowBlur = 28;
        rr(g, x0 - 12, y0 - 12, x1 - x0 + 24, y1 - y0 + 24, 16); g.stroke(); g.restore();
      }
      g.restore();
      // cursor clicks "Import patient folder", then leaves while the camera zooms to the task
      const ib = F.importBtn && { x: (F.importBtn.x - F.form.x + 24) * 3, y: (F.importBtn.y - F.form.y + 24) * 3, w: F.importBtn.w * 3, h: F.importBtn.h * 3 };
      if (map && ib && t > k.formIn + 0.2 && t < k.zoomIn + 0.3) {
        const [bx, by] = map(ib.x + ib.w / 2, ib.y + ib.h / 2);
        const pc = u(t - k.formIn - 0.25, 'snappy'), pl = clamp((k.zoomIn + 0.3 - t) / 0.3, 0, 1);
        const cx = lerp(1500, bx + 30, pc), cy = lerp(1000, by + 10, pc);
        const press = t > k.click ? clamp(1 - u(t - k.click - 0.12, 'snappy'), 0, 1) * clamp((t - k.click) / 0.06, 0, 1) : 0;
        g.save(); g.globalAlpha = clamp(pc * 2, 0, 1) * pl; cursor(g, cx, cy, press, 1.8); g.restore();
      }
      // cursor clicks "Find patient"
      if (map && t > k.zoomOut) {
        const [bx, by] = map(sb.x + sb.w / 2, sb.y + sb.h / 2);
        const pc = u(t - k.zoomOut - 0.15, 'snappy');
        const cx = lerp(1500, bx + 40, pc), cy = lerp(1000, by + 10, pc);
        const press = t > k.press ? clamp(1 - u(t - k.press - 0.12, 'snappy'), 0, 1) * clamp((t - k.press) / 0.06, 0, 1) : 0;
        g.save(); g.globalAlpha = clamp(pc * 2, 0, 1); cursor(g, cx, cy, press, 1.8); g.restore();
      }
      // flood circle from the button
      if (map && t > k.flood) {
        const [bx, by] = map(sb.x + sb.w / 2, sb.y + sb.h / 2);
        const r = u(t - k.flood, 'camera') * 2400;
        g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.fillStyle = C.link; g.fill();
      }
    }

    // ---------- beats 4-6: the screen ----------
    if (t > k.flood + 0.16) {
      const reveal = u(t - k.flood - 0.16, 'camera');
      g.save();
      if (reveal < 0.999) { g.beginPath(); g.arc(980, 720, reveal * 2400, 0, Math.PI * 2); g.clip(); }
      g.fillStyle = C.sidebar; g.fillRect(0, 0, W, H);

      // camera: card rect + plate cam
      const pp = u(t - k.push, 'camera');
      const rect = { x: CARD.x, w: CARD.w, y: CARD.y, h: CARD.h };
      const rowCy = Spring.to(t, [[0, 262], [k.rows[1], 300], [k.rows[2], 360], [k.rows[3], 425]], 'camera');
      const vw = elog(1440, 840, pp);
      const cam = { cx: lerp(720, 680, pp), cy: lerp(10 + (rect.h / (rect.w / 1440)) / 2, rowCy, pp), vw };
      // settle in + landing punch
      const land = u(t - k.flood - 0.16, 'heavy');
      const punch = 0.04 * (u(t - k.land, 'playful') - u(t - k.land - 0.14, 'playful'));
      const sc = lerp(0.94, 1, land) + punch;
      g.save();
      g.translate(rect.x + rect.w / 2, rect.y + rect.h / 2); g.scale(sc, sc); g.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
      const pl = E.plate(g, 'sit1-screen', cam, rect, { radius: 26, shadow: 44 });

      // spotlight: dark overlay with a rounded hole morphing over the panels
      const spA = fade(t, k.spL, k.t1 + 1, 0.4);
      if (pl && spA > 0) {
        const pnl = (b) => [b.x + 6, b.y + 8, b.w - 12, Math.min(b.h - 16, 545)];
        const full = (b) => [b.x + 6, b.y + 8, b.w - 12, b.h - 16];
        const hb = Spring.to2(t, [[0, pnl(B.panelLeft)], [k.spC, pnl(B.panelCenter)], [k.spR, pnl(B.panelRight)], [k.push - 0.1, full(B.panelCenter)]], 'camera');
        const [hx0, hy0] = pl.map(hb[0], hb[1]), [hx1, hy1] = pl.map(hb[0] + hb[2], hb[1] + hb[3]);
        g.save(); rr(g, rect.x, rect.y, rect.w, rect.h, 26); g.clip();
        g.beginPath(); g.rect(rect.x, rect.y, rect.w, rect.h); g.roundRect(hx0, hy0, hx1 - hx0, hy1 - hy0, 18);
        g.fillStyle = `rgba(14,26,36,${0.62 * spA})`; g.fill('evenodd');
        g.globalAlpha = spA; g.strokeStyle = '#fff'; g.lineWidth = 4; rr(g, hx0, hy0, hx1 - hx0, hy1 - hy0, 18); g.stroke();
        g.restore();
      }

      // a04: rings + numbered tags on the first four rows
      if (pl) {
        g.save(); rr(g, rect.x, rect.y, rect.w, rect.h, 26); g.clip();
        [0, 1, 2, 3].forEach((i) => {
          const r = B.rows[i], ti = k.rows[i] - 0.05;
          if (t < ti) return;
          const pr = u(t - ti, 'snappy');
          const [x0, y0] = pl.map(r.x, r.y), [x1, y1] = pl.map(r.x + r.w, r.y + r.h);
          ring(g, x0, y0 + 4, x1 - x0, y1 - y0 - 8, pr, C.link, 4, 5);
          const [tx, tyy] = pl.map(r.x - 30, r.y + 30);
          const ps = u(t - ti, 'playful') * clamp((tyy - rect.y - 10) / 40, 0, 1);
          if (ps <= 0.01) return;
          g.save(); g.translate(tx, tyy); g.scale(ps, ps);
          g.beginPath(); g.arc(0, 0, 40, 0, Math.PI * 2); g.fillStyle = C.link; g.fill();
          g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
          text(g, String(i + 1), 0, 19, { size: 54, weight: 700, color: '#fff', align: 'center' });
          g.restore();
        });
        g.restore();
      }
      g.restore();

      // timer chip (a02): top-right above the card
      const tA = fade(t, k.land - 0.1, k.spL - 0.05, 0.3);
      if (tA > 0) {
        const n = 2.3 * u(t - k.flood, 'heavy');
        const ps = lerp(0.6, 1, u(t - k.land + 0.1, 'playful'));
        chip(g, n.toFixed(1) + ' s', CARD.x + CARD.w - 30, 92, 64, tA, { font: 'mono', weight: 500, color: C.link, align: 'right', scale: ps });
      }
      // panel label chips (a03): above the card, over their panel
      const labels = [
        ['Context + contradictions', B.panelLeft, k.spL, k.spC],
        ['What the task needs', B.panelCenter, k.spC, k.spR],
        ['Original letters', B.panelRight, k.spR, k.spEnd],
      ];
      for (const [str, pb, a0, a1] of labels) {
        const a = fade(t, a0 + 0.15, a1, 0.25);
        if (a <= 0) continue;
        const pcx = CARD.x + (pb.x + pb.w / 2) * (CARD.w / 1440);
        const ps = lerp(0.7, 1, u(t - a0 - 0.15, 'snappy'));
        chip(g, str, pcx, 70 + (620 - 10) * (CARD.w / 1440), 60, a, { scale: ps });
      }
      g.restore();
    }

    // ---------- buddies + criterion ----------
    // buddies: home under the name card, then one move to the empty left of the form; they leave by the left edge before the app screen fills the frame
    let st;
    if (t < k.formIn) st = { mode: 'success', hop: 1, hopT: t - k.t0 - 0.25, look: [W / 2, 470] };
    else if (t < k.zoomOut) st = { mode: 'task', look: [760, 400] };
    else if (t < k.press) st = { mode: 'look', look: [960, 600] };
    else if (t < k.flood - 0.3) st = { mode: 'searching', bob: true, look: [960, 600] };
    else st = { mode: 'success', hop: 1, hopT: t - k.flood + 0.3, look: [960, 600] };
    const bp = Spring.to2(t, [[0, [767, 1260, 1.4]], [k.t0, [767, 900, 1.4]], [k.formIn, [96, 900, 1.0]], [k.flood + 0.05, [-420, 900, 1.0]]], 'camera');
    if (bp[0] > -400) buddies(g, bp[0], bp[1], bp[2], t, st);
    criterion(g, 1, 'Would a clinician trust this screen?', t, S.demo1[0], Math.min(S.demo1[0] + 1.5, k.formIn));
  }

  function cues() {
    if (!T.a01) return [];
    const k = times(), c = [];
    c.push({ t: k.t0 + 0.05, kind: 'rise', gain: 0.5 }, { t: k.t0 + 0.15, kind: 'pop', gain: 0.6 });
    c.push({ t: k.formIn, kind: 'whoosh', gain: 0.5 }, { t: k.zoomIn, kind: 'whoosh', gain: 0.3 });
    for (let i = 1; i <= 24; i += 2) c.push({ t: k.ty0 + i * 0.1, kind: 'type', gain: 0.35 });
    c.push({ t: k.press, kind: 'click', gain: 0.7 }, { t: k.flood, kind: 'whoosh', gain: 0.6 }, { t: k.land, kind: 'hit', gain: 0.7 }, { t: k.land + 0.1, kind: 'chime', gain: 0.4 });
    c.push({ t: k.spL, kind: 'pop', gain: 0.5 }, { t: k.spC, kind: 'pop', gain: 0.5 }, { t: k.spR, kind: 'pop', gain: 0.5 }, { t: k.push, kind: 'whoosh', gain: 0.4 });
    k.rows.forEach((r) => c.push({ t: r, kind: 'tick', gain: 0.5 }));
    return c;
  }

  E.chapter('demo1', draw, cues);
})();
