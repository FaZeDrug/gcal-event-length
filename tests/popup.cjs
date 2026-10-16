const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const extension = path.resolve('extension');
const launch = (profile, options = {}) => chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true, viewport: { width: 300, height: 400 },
  ignoreDefaultArgs: ['--disable-extensions'],
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  ...options
});
const status = (page, text) => page.waitForFunction((text) => document.querySelector('#status').textContent === text, text);
const frame = (page) => page.locator('canvas').evaluate((node) => node.toDataURL());

(async () => {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'calendar-popup-'));
  await fs.mkdir('artifacts/popup-video', { recursive: true });
  const context = await launch(profile, { recordVideo: { dir: 'artifacts/popup-video', size: { width: 300, height: 400 } } });
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    const id = await manager.locator('extensions-item').first().getAttribute('id');
    await manager.close();
    const url = `chrome-extension://${id}/popup.html`;
    const page = await context.newPage();
    const remote = [], errors = [];
    page.on('request', (request) => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url);
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').innerText(), 'Event Duration');
    assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight]), [300, 400]);
    for (const node of ['documentElement', 'body']) {
      assert.deepEqual(await page.evaluate((node) => [document[node].scrollWidth, document[node].scrollHeight], node), [300, 400]);
    }
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.popup *')].every((el) => {
      const r = el.getBoundingClientRect();
      return r.x >= 0 && r.right <= 300 && r.y >= 0 && r.bottom <= 400 && el.scrollWidth <= el.clientWidth + 1;
    })), true, 'Every popup element fits inside 300×400 without clipping');
    assert.equal(await page.evaluate(() => {
      const ink = (el) => getComputedStyle(el).color.match(/\d+/g).slice(0, 3).map(Number);
      return [...document.querySelectorAll('.popup *:not(canvas)')].every((el) => new Set(ink(el)).size === 1);
    }), true, 'UI text uses only black, grey, or white');
    assert.equal(await page.locator('#enabled').isChecked(), true);
    assert.equal(await page.locator('input[value="box"]').isChecked(), true);
    await status(page, '✓ Saved automatically');

    const first = await frame(page);
    await page.waitForTimeout(1500);
    assert.notEqual(await frame(page), first, 'Calendar animates');
    assert.deepEqual(await page.locator('canvas').evaluate((node) => [node.width, node.height]), [300, 200]);
    await page.screenshot({ path: 'artifacts/popup-box.png' });

    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#enabled').evaluate((node) => node === document.activeElement), true);
    assert.equal(await page.locator('#enabled').getAttribute('role'), 'switch');
    assert.equal(await page.locator('#enabled').evaluate((node) => getComputedStyle(node).outlineStyle), 'solid');
    await page.keyboard.press('Space');
    await status(page, 'Off · preference saved');
    assert.equal(await page.evaluate(() => document.body.classList.contains('off')), true);
    await page.screenshot({ path: 'artifacts/popup-off.png' });
    await page.keyboard.press('Space');
    await status(page, '✓ Saved automatically');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('input[value="box"]').evaluate((node) => node === document.activeElement), true);
    assert.equal(await page.locator('input[value="box"]').evaluate((node) => getComputedStyle(node).outlineStyle), 'solid');
    await page.screenshot({ path: 'artifacts/popup-focus.png' });
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.querySelector('input[value="text"]').checked && !document.querySelector('fieldset').disabled);
    await page.screenshot({ path: 'artifacts/popup-text.png' });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const still = await frame(page);
    await page.waitForTimeout(400);
    assert.equal(await frame(page) === still, true, 'Reduced motion draws one still frame');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hidden = await frame(page);
    await page.waitForTimeout(400);
    assert.equal(await frame(page) === hidden, true, 'Hidden popup stops animating');
    assert.deepEqual(remote, []);
    assert.deepEqual(errors, []);
    const video = page.video();
    await page.close();
    await video.saveAs('artifacts/popup-video/calendar-popup.webm');

    const reopened = await context.newPage();
    await reopened.goto(url);
    await reopened.waitForFunction(() => !document.querySelector('fieldset').disabled);
    assert.equal(await reopened.locator('input[value="text"]').isChecked(), true, 'Style persists after reopening');
    assert.equal(await reopened.locator('#enabled').isChecked(), true);
    await reopened.close();

    for (const state of ['loading', 'load-error', 'saving', 'save-error']) {
      const p = await context.newPage();
      await p.addInitScript((state) => {
        if (state === 'loading') chrome.storage.local.get = () => new Promise(() => {});
        if (state === 'load-error') chrome.storage.local.get = () => Promise.reject(new Error('Controlled failure'));
        if (state === 'saving') chrome.storage.local.set = () => new Promise(() => {});
        if (state === 'save-error') chrome.storage.local.set = () => Promise.reject(new Error('Controlled failure'));
      }, state);
      await p.goto(url);
      if (state === 'saving' || state === 'save-error') {
        await p.waitForFunction(() => !document.querySelector('fieldset').disabled);
        await p.click('input[value="box"]');
      }
      const expected = { loading: 'Loading…', 'load-error': 'Could not load. Reopen to retry.', saving: 'Saving…', 'save-error': 'Could not save. Select a style to retry.' }[state];
      await status(p, expected);
      assert.equal(await p.locator('input[type=radio]').first().isDisabled(), state !== 'save-error');
      if (state === 'save-error') {
        await p.click('#enabled');
        await status(p, 'Could not save. Try the switch again.');
        assert.equal(await p.locator('#enabled').isChecked(), true);
      }
      await p.close();
    }

    const retinaProfile = await fs.mkdtemp(path.join(os.tmpdir(), 'calendar-retina-'));
    const retina = await launch(retinaProfile, { deviceScaleFactor: 2, reducedMotion: 'reduce' });
    try {
      const p = await retina.newPage();
      await p.goto(url);
      await p.waitForFunction(() => !document.querySelector('fieldset').disabled);
      await p.evaluate(() => document.fonts.ready);
      const png = await p.screenshot({ path: 'artifacts/popup-2x.png' });
      assert.equal(png.readUInt32BE(16), 600);
      assert.equal(png.readUInt32BE(20), 800);
      assert.deepEqual(await p.locator('canvas').evaluate((node) => [node.width, node.height]), [600, 400], 'Canvas renders at device resolution');
    } finally {
      await retina.close();
      await fs.rm(retinaProfile, { recursive: true, force: true });
    }
    console.log('PASS: real unpacked popup at exactly 300×400 (1×/2×), no overflow, monochrome UI, animated calendar, keyboard switch/radios with focus, persistence on reopen, reduced motion, hidden pause, controlled loading/save errors, and no remote requests.');
  } finally {
    await context.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
