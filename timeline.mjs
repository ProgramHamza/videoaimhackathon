// Dump the film's live timeline (voice line times, sections, duration, sound cues) to timeline.json.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { serve } from './serve.mjs';
const { srv, url } = await serve('.');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
await page.goto(url + '/film.html');
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
const tl = await page.evaluate(() => ({ T: E.T, S: E.S, duration: window.FILM_DURATION, cues: E.allCues() }));
fs.writeFileSync('timeline.json', JSON.stringify(tl, null, 1));
console.log('duration', tl.duration.toFixed(2), 's,', Object.keys(tl.T).length, 'lines,', tl.cues.length, 'cues');
await browser.close(); srv.close();
