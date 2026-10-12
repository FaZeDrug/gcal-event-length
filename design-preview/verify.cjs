const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
let browser;

(async () => {
  await fs.mkdir('artifacts/sakura-video', { recursive: true });
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 360, height: 560 }, recordVideo: { dir: 'artifacts/sakura-video', size: { width: 360, height: 560 } } });
  const page = await context.newPage();
  const remote = [], errors = [];
  page.on('request', (request) => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const url = `file://${path.resolve('design-preview/index.html')}`;
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'body{padding:0}aside{display:none}.popup{margin:0}' });
  assert.equal(await page.locator('.popup').evaluate((node) => node.clientWidth), 360);
  assert.equal(await page.locator('.popup').evaluate((node) => node.clientHeight), 560);
  const before = await page.locator('canvas').screenshot();
  await page.waitForTimeout(8000);
  const after = await page.locator('canvas').screenshot();
  assert.notDeepEqual(before, after);
  const costs = [];
  for (let i = 0; i < 20; i++) { costs.push(await page.evaluate(() => window.sceneMetrics.renderMs)); await page.waitForTimeout(40); }
  console.log('Rendering cost ms, mean:', costs.reduce((a,b)=>a+b,0)/costs.length, 'max:', Math.max(...costs));
  assert.equal(await page.evaluate(() => window.sceneMetrics.blossoms), 12);
  await page.locator('input[value="text"]').check();
  await page.waitForFunction(() => document.querySelector('.status').textContent === 'Saved.');
  assert.equal(await page.locator('input[value="text"]').isChecked(), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const staticBefore = await page.locator('canvas').screenshot();
  await page.waitForTimeout(500);
  assert.deepEqual(await page.locator('canvas').screenshot(), staticBefore);
  assert.equal(await page.evaluate(() => window.sceneMetrics.reduced), true);
  await page.locator('input[value="box"]').check();
  await page.waitForTimeout(400);
  await page.locator('.popup').screenshot({ path: 'artifacts/sakura-actual.png' });
  for (const [name, time, falling] of [['calm', 0, false], ['gust', 3, true], ['drift', 6, true]]) {
    await page.evaluate(([t,f]) => window.renderSakura(t,f), [time,falling]);
    await fs.writeFile(`artifacts/${name}.svg`, await page.evaluate(() => window.sakuraSnapshot));
  }
  await fs.copyFile('artifacts/calm.svg', 'design-preview/poster.svg');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const hiddenBefore = await page.locator('canvas').screenshot();
  await page.waitForTimeout(250);
  assert.deepEqual(await page.locator('canvas').screenshot(), hiddenBefore);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  for (const state of ['loading', 'saving', 'saved', 'error', 'load-error', 'focus']) {
    await page.goto(`${url}?state=${state}`);
    await page.addStyleTag({ content: 'body{padding:0}aside{display:none}.popup{margin:0}' });
    assert.equal(await page.locator('input').first().isDisabled(), ['loading','saving','load-error'].includes(state));
    assert.equal(await page.locator('footer').evaluate((node) => node.getBoundingClientRect().bottom <= 560), true);
    if (state === 'focus') assert.equal(await page.locator('input').first().evaluate((node) => document.activeElement === node), true);
  }
  assert.deepEqual(remote, []);
  assert.deepEqual(errors, []);
  const video = page.video();
  await context.close();
  await video.saveAs('artifacts/sakura-video/preview.webm');
  const retina = await browser.newPage({ viewport: { width: 360, height: 560 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await retina.goto(url);
  await retina.addStyleTag({ content: 'body{padding:0}aside{display:none}.popup{margin:0}' });
  await retina.locator('.popup').screenshot({ path: 'artifacts/sakura-retina.png' });
  await retina.locator('.ornament').screenshot({ path: 'artifacts/sakura-detail.png' });
  await browser.close();
  console.log('PASS: 360×560 fit, 12 blossoms, continuous motion, reduced motion, hidden pause, radios, status variants, 1×/2× screenshots, no remote requests. Standalone preview only; installed extension unchanged.');
})().catch(async (error) => { console.error(error); await browser?.close(); process.exitCode = 1; });
