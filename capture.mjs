// Drives the real app (frontend on :4290, backend on :8001) through the film's story states and
// saves screenshots as plates in assets/real/. Usage: node capture.mjs [step...]   (no args = all)
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const APP = 'http://127.0.0.1:4291';
const OUT = 'assets/real';
fs.mkdirSync(OUT, { recursive: true });
const want = new Set(process.argv.slice(2));
const run = (name) => want.size === 0 || want.has(name);

const SIT1 = 'Anaesthetist, pre-op check before breast surgery';
const SIT3 = 'Diabetes review at the GP. You are her general practitioner (GP), reviewing her diabetes in spring 2016.';
const SIT_DE = 'Diabetes-Kontrolle beim Hausarzt. Sie sind ihre Hausärztin und prüfen ihren Diabetes im Frühjahr 2016.';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const timings = {};

async function fresh(scale = 2) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(APP);
  await page.waitForSelector('textarea');
  return { ctx, page, errs };
}

const NAME = 'Anna Musterfrau', BIRTH = '1959-03-15';

async function patient(page) {
  await page.fill('.login-form input[type=text]', NAME);
  await page.fill('.login-form input[type=date]', BIRTH);
}

async function search(page, task) {
  await patient(page);
  await page.fill('textarea', task);
  const t0 = Date.now();
  await page.click('button[type=submit]');
  await page.waitForSelector('#panel-important', { timeout: 60000 });
  await page.waitForTimeout(900); // the success animation and layout settle
  return Date.now() - t0;
}

const shot = (page, name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
const el = async (page, sel, name, pad = 0) => {
  const box = await page.locator(sel).first().boundingBox();
  if (!box) throw new Error(`not found: ${sel}`);
  await shot(page, name, { clip: { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad } });
  return box;
};

// 1. the search form, typed progressively (one plate per few words) at 3x for the close-up
if (run('search')) {
  const { ctx, page } = await fresh(3);
  await shot(page, 'search-empty');
  await el(page, '.login-form', 'search-form-empty', 24);
  await patient(page);
  await el(page, '.login-form', 'search-form-patient', 24);
  // typed one character at a time: a plate per 2 characters (the film plays them as typing)
  fs.mkdirSync(`${OUT}/typing`, { recursive: true });
  for (let n = 0, k = 0; n <= SIT1.length; n += 2, k++) {
    await page.fill('textarea', SIT1.slice(0, n));
    await page.waitForTimeout(40);
    await el(page, '.login-form', `typing/t${String(k).padStart(2, '0')}`, 24);
  }
  await page.fill('textarea', SIT1);
  await el(page, '.login-form', 'search-form-08', 24);
  await page.click('button[type=submit]');
  await page.waitForTimeout(250);
  await el(page, '.login-form', 'search-form-searching', 24);
  await ctx.close();
}

// 2. situation 1: the full screen, rows close up, source viewer, not documented, contradiction
if (run('sit1')) {
  const { ctx, page, errs } = await fresh(2);
  timings.sit1_ms = await search(page, SIT1);
  await shot(page, 'sit1-screen');
  const rows = await page.$$eval('#panel-important article', (as) => as.map((a) => a.querySelector('h3')?.textContent));
  fs.writeFileSync(`${OUT}/sit1-rows.json`, JSON.stringify(rows, null, 1));
  await ctx.close();
  if (errs.length) console.log('sit1 page errors:', errs);
}

if (run('rows')) {
  const { ctx, page } = await fresh(3);
  await search(page, SIT1);
  const articles = page.locator('#panel-important article');
  const n = await articles.count();
  for (let i = 0; i < n; i++) {
    const a = articles.nth(i);
    const h = (await a.locator('h3').textContent()).trim();
    const slug = h.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    await a.scrollIntoViewIfNeeded();
    await a.screenshot({ path: `${OUT}/row-${String(i + 1).padStart(2, '0')}-${slug}.png` });
  }
  await ctx.close();
}

if (run('source')) {
  const { ctx, page } = await fresh(2);
  await search(page, SIT1);
  await page.locator('#panel-important a.inline-source', { hasText: 'Thrombo ASS' }).first().click();
  await page.waitForTimeout(700);
  await shot(page, 'sit1-source');
  await el(page, '.evidence-modal', 'sit1-source-modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.locator('#panel-important a.inline-source', { hasText: 'EF 60' }).first().click();
  await page.waitForTimeout(700);
  await shot(page, 'sit1-ef-source');
  await ctx.close();
}

if (run('contra')) {
  const { ctx, page } = await fresh(2);
  await search(page, SIT1);
  await page.locator('.attention-button').first().click();
  await page.waitForTimeout(700);
  await shot(page, 'sit1-contra');
  await el(page, '.evidence-modal', 'sit1-contra-modal');
  await ctx.close();
}

// 3. the GP's screen, in English and with a German prompt
if (run('gp')) {
  const { ctx, page } = await fresh(2);
  timings.gp_ms = await search(page, SIT3);
  await shot(page, 'gp-screen');
  await ctx.close();
}

if (run('de')) {
  const { ctx, page } = await fresh(2);
  timings.de_ms = await search(page, SIT_DE);
  await shot(page, 'de-screen');
  await ctx.close();
}

// 4. the sidebar "By type" view with every fact
if (run('bytype')) {
  const { ctx, page } = await fresh(2);
  await search(page, SIT1);
  await page.locator('.document-views button').nth(1).click();
  await page.waitForTimeout(400);
  await shot(page, 'sit1-bytype');
  await page.locator('.topic-filter-button').click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, 'sit1-bytype-filter');
  await page.keyboard.press('Escape');
  await page.mouse.wheel(0, 0);
  // scrolled: the rows further down the important panel
  await page.locator('.document-views button').nth(0).click();
  await page.locator('.important-scroll').evaluate((el) => { el.scrollTop = 620; });
  await page.waitForTimeout(400);
  await shot(page, 'sit1-scrolled');
  await ctx.close();
}

// 1b. the new login form (fork 5): import the synthetic patient folder with the real button, then type the
// task. Writes the same plate names as 'search' plus search-form-importing, and updates only boxes.form.
const PATIENT_DIR = 'C:/Users/mhrom/Desktop/TRACK-1-clinical-documentation/data/patient-0000-0001';
if (run('login')) {
  const { ctx, page, errs } = await fresh(3);
  await shot(page, 'search-empty');
  await el(page, '.login-form', 'search-form-empty', 24);
  const formBox = async () => {
    const b = async (sel) => { const r = await page.locator(sel).first().boundingBox(); return r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    return { form: await b('.login-form'), textarea: await b('textarea'), submit: await b('button[type=submit]'), scene: await b('.login-scene'),
      importBtn: await b('.login-import button'), note: await b('.login-import-note'), name: await b('.login-form input[type=text]') };
  };
  const before = await formBox();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('.login-import button').first().click()]);
  await chooser.setFiles(PATIENT_DIR);
  await page.waitForTimeout(60);
  await el(page, '.login-form', 'search-form-importing', 24);
  await page.waitForFunction(() => /imported|importiert/i.test(document.querySelector('.login-import-note')?.textContent ?? ''), null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await el(page, '.login-form', 'search-form-patient', 24);
  fs.mkdirSync(`${OUT}/typing`, { recursive: true });
  for (let n = 0, k = 0; n <= SIT1.length; n += 2, k++) {
    await page.fill('textarea', SIT1.slice(0, n));
    await page.waitForTimeout(40);
    await el(page, '.login-form', `typing/t${String(k).padStart(2, '0')}`, 24);
  }
  await page.fill('textarea', SIT1);
  await el(page, '.login-form', 'search-form-08', 24);
  const after = await formBox();
  await page.click('button[type=submit]');
  await page.waitForTimeout(250);
  await el(page, '.login-form', 'search-form-searching', 24);
  const boxes = JSON.parse(fs.readFileSync(`${OUT}/boxes.json`, 'utf8'));
  boxes.form = { ...after, before };
  fs.writeFileSync(`${OUT}/boxes.json`, JSON.stringify(boxes, null, 1));
  console.log('form', JSON.stringify(boxes.form), 'note', await page.locator('.login-import-note').textContent(), 'errors', errs.length);
  await ctx.close();
}

// 5. where things sit in each full-screen plate (CSS px; the plates are 2x), for the film's camera
if (run('boxes')) {
  const boxes = {};
  const box = async (page, sel, opts = {}) => {
    const loc = opts.text ? page.locator(sel, { hasText: opts.text }).first() : page.locator(sel).first();
    const b = await loc.boundingBox().catch(() => null);
    return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  };
  const rowBox = (page, title) => box(page, '#panel-important article', { text: title });
  {
    const { ctx, page } = await fresh(2);
    await search(page, SIT1);
    boxes.sit1 = {
      task: await box(page, '#panel-important header p'),
      title: await box(page, '#important-heading'),
      thrombo: await box(page, '#panel-important a.inline-source', { text: 'Thrombo ASS' }),
      rowAnticoag: await rowBox(page, 'Anticoagulants'),
      rowAllergy: await rowBox(page, 'Allergies'),
      rowHeart: await rowBox(page, 'Heart function'),
      ef: await box(page, '#panel-important a.inline-source', { text: 'EF 60' }),
      allergyLink: await box(page, '#panel-important a.inline-source', { text: 'Kontrastmittel (' }),
      rowNotDoc: await rowBox(page, 'Previous anaesthesia'),
      contraList: await box(page, '[aria-labelledby=attention-heading]'),
      c1: await box(page, '.attention-button'),
      patient: await box(page, '#patient-name'),
      docs: await box(page, '.documents-sidebar'),
      panelLeft: await box(page, '.panel-patient'),
      panelCenter: await box(page, '#panel-important'),
      panelRight: await box(page, '.documents-sidebar'),
      rowPlanned: await rowBox(page, 'Planned procedures'),
      rowAirway: await rowBox(page, 'Airway'),
      rowKidney: await rowBox(page, 'Kidney function'),
      viewTabs: await box(page, '.document-views'),
      rows: await page.$$eval('#panel-important article', (as) => as.map((a) => { const r = a.getBoundingClientRect(); return { title: a.querySelector('h3')?.textContent, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), text: a.querySelector('p')?.textContent?.slice(0, 120) }; })),
    };
    await page.locator('#panel-important a.inline-source', { hasText: 'EF 60' }).first().click();
    await page.waitForTimeout(700);
    boxes.efSource = { modal: await box(page, '.evidence-modal'), mark: await box(page, 'mark[data-cited]'), title: await box(page, '#detail-heading') };
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.locator('#panel-important a.inline-source', { hasText: 'Thrombo ASS' }).first().click();
    await page.waitForTimeout(700);
    boxes.source = { modal: await box(page, '.evidence-modal'), mark: await box(page, 'mark[data-cited]'), title: await box(page, '#detail-heading') };
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.locator('.attention-button').first().click();
    await page.waitForTimeout(700);
    const quotes = await page.$$eval('.evidence-modal blockquote', (qs) => qs.map((q) => { const r = q.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
    boxes.contra = { modal: await box(page, '.evidence-modal'), title: await box(page, '#detail-heading'), quotes };
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh(2);
    await search(page, SIT3);
    boxes.gp = {
      rowDiabetes: await rowBox(page, 'Diabetes control'),
      rowGlucose: await rowBox(page, 'Glucose-lowering'),
      rowWeight: await rowBox(page, 'Weight and BMI'),
      hba1c: await box(page, '#panel-important a.inline-source', { text: 'HbA1c von 6,4' }),
      weightChange: await box(page, '#panel-important a.inline-source', { text: '-12.0 kg' }),
      task: await box(page, '#panel-important header p'),
    };
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh(2);
    await search(page, SIT_DE);
    boxes.de = { toggle: await box(page, '.lang-switch'), title: await box(page, '#important-heading'), task: await box(page, '#panel-important header p') };
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh(3);
    boxes.form = { form: await box(page, '.login-form'), textarea: await box(page, 'textarea'), submit: await box(page, 'button[type=submit]'), scene: await box(page, '.login-scene') };
    await ctx.close();
  }
  fs.writeFileSync(`${OUT}/boxes.json`, JSON.stringify(boxes, null, 1));
  console.log(JSON.stringify(boxes));
}

await browser.close();
if (Object.keys(timings).length) {
  const f = `${OUT}/timings.json`;
  const old = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  fs.writeFileSync(f, JSON.stringify({ ...old, ...timings }, null, 1));
  console.log('timings', timings);
}
console.log('done:', fs.readdirSync(OUT).length, 'files in', OUT);
