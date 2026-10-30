// One-off: what does the page show after submitting a task?
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror ' + e.message));
page.on('console', (m) => { if (m.type() !== 'debug') logs.push(m.type() + ' ' + m.text()); });
page.on('response', (r) => { if (r.url().includes('/api/')) logs.push(`api ${r.status()} ${r.url()}`); });
await page.goto('http://127.0.0.1:4291');
await page.waitForSelector('textarea');
await page.fill('textarea', process.argv[2] || 'Anaesthetist, pre-operative check before breast surgery');
await page.click('button[type=submit]');
await page.waitForTimeout(8000);
await page.screenshot({ path: 'probe.png' });
console.log(logs.join('\n'));
console.log('panel-important:', await page.locator('#panel-important').count(), '| error text:', await page.locator('.login-error').textContent().catch(() => ''));
await browser.close();
