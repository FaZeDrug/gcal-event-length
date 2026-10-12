const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'sakura-popup-'));
  await fs.mkdir('artifacts/popup-video', { recursive: true });
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true, viewport: { width: 360, height: 560 },
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--disable-extensions-except=${path.resolve('extension')}`, `--load-extension=${path.resolve('extension')}`],
    recordVideo: { dir: 'artifacts/popup-video', size: { width: 360, height: 560 } }
  });
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
    await page.goto(url);
    await page.waitForFunction(() => !document.querySelector('fieldset').disabled);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').innerText(), 'Google Calendar\nEvent Length');
    assert.equal(await page.locator('body').evaluate((node) => node.scrollWidth), 360);
    assert.equal(await page.locator('body').evaluate((node) => node.scrollHeight), 560);
    for (const selector of ['h1', '.switch', 'fieldset', '#status', 'footer']) {
      assert.equal(await page.locator(selector).evaluate((node) => {
        const r = node.getBoundingClientRect();
        return r.x >= 0 && r.right <= 360 && r.y >= 0 && r.bottom <= 560;
      }), true);
    }
    const first = await page.locator('canvas').evaluate((node) => node.toDataURL());
    await page.waitForTimeout(8000);
    assert.notEqual(await page.locator('canvas').evaluate((node) => node.toDataURL()), first);
    await page.locator('.popup').screenshot({ path: 'artifacts/sakura-popup.png' });
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#enabled').evaluate((node) => node === document.activeElement), true);
    assert.equal(await page.locator('#enabled').getAttribute('role'), 'switch');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Durations off.');
    assert.equal(await page.locator('#state').innerText(), 'Off');
    await page.locator('.popup').screenshot({ path: 'artifacts/sakura-off.png' });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Durations on.');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('input[value="box"]').evaluate((node) => node === document.activeElement), true);
    assert.equal(await page.locator('input[value="box"]').evaluate((node) => getComputedStyle(node).outlineStyle), 'solid');
    await page.locator('.popup').screenshot({ path: 'artifacts/sakura-focus.png' });
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Saved.');
    assert.equal(await page.locator('input[value="text"]').isChecked(), true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const staticFrame = await page.locator('canvas').evaluate((node) => node.toDataURL());
    await page.waitForTimeout(300);
    assert.equal(await page.locator('canvas').evaluate((node) => node.toDataURL()) === staticFrame, true, 'Reduced-motion canvas remains static');
    await page.locator('.popup').screenshot({ path: 'artifacts/sakura-reduced.png' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hiddenFrame = await page.locator('canvas').evaluate((node) => node.toDataURL());
    await page.waitForTimeout(300);
    assert.equal(await page.locator('canvas').evaluate((node) => node.toDataURL()) === hiddenFrame, true, 'Hidden popup stops animating');
    assert.deepEqual(remote, []);
    assert.deepEqual(errors, []);
    const video = page.video();
    await page.close();
    await video.saveAs('artifacts/popup-video/sakura-popup.webm');

    for (const state of ['loading', 'load-error', 'saving', 'save-error', 'fallback']) {
      const p = await context.newPage();
      await p.addInitScript((state) => {
        if (state === 'loading') chrome.storage.local.get = () => new Promise(() => {});
        if (state === 'load-error') chrome.storage.local.get = () => Promise.reject(new Error('Controlled failure'));
        if (state === 'saving') chrome.storage.local.set = () => new Promise(() => {});
        if (state === 'save-error') chrome.storage.local.set = () => Promise.reject(new Error('Controlled failure'));
        if (state === 'fallback') HTMLCanvasElement.prototype.getContext = () => null;
      }, state);
      await p.goto(url);
      if (state === 'saving' || state === 'save-error') {
        await p.waitForFunction(() => !document.querySelector('fieldset').disabled);
        await p.click('input[value="box"]');
      }
      if (state === 'fallback') {
        await p.waitForFunction(() => document.querySelector('.poster').naturalWidth > 0);
        assert.equal(await p.locator('.poster').isVisible(), true);
      } else {
        const expected = { loading: 'Loading preference…', 'load-error': 'Could not load. Reopen to retry.', saving: 'Saving…', 'save-error': 'Could not save. Select a style to retry.' }[state];
        await p.waitForFunction((text) => document.querySelector('#status').textContent === text, expected);
        assert.equal(await p.locator('input[type=radio]').first().isDisabled(), state !== 'save-error');
        assert.equal(await p.locator('#status').evaluate((node) => node.getBoundingClientRect().bottom < document.querySelector('footer').getBoundingClientRect().top), true);
      }
      if (state === 'save-error') {
        await p.click('#enabled');
        await p.waitForFunction(() => document.querySelector('#status').textContent === 'Could not save. Try the switch again.');
        assert.equal(await p.locator('#enabled').isChecked(), true);
        assert.equal(await p.locator('#state').innerText(), 'On');
      }
      await p.screenshot({ path: `artifacts/sakura-${state}.png` });
      await p.close();
    }
    const retinaProfile = await fs.mkdtemp(path.join(os.tmpdir(), 'sakura-retina-'));
    const retina = await chromium.launchPersistentContext(retinaProfile, {
      channel: 'chromium', headless: true, viewport: { width: 360, height: 560 }, deviceScaleFactor: 2, reducedMotion: 'reduce',
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [`--disable-extensions-except=${path.resolve('extension')}`, `--load-extension=${path.resolve('extension')}`]
    });
    try {
      const p = await retina.newPage();
      await p.goto(url);
      await p.waitForFunction(() => !document.querySelector('fieldset').disabled);
      await p.evaluate(() => document.fonts.ready);
      const png = await p.screenshot({ path: 'artifacts/sakura-popup-2x.png' });
      assert.equal(png.readUInt32BE(16), 720);
      assert.equal(png.readUInt32BE(20), 1120);
      assert.equal(await p.locator('canvas').evaluate((node) => node.getBoundingClientRect().width), 300);
    } finally {
      await retina.close();
      await fs.rm(retinaProfile, { recursive: true, force: true });
    }
    console.log('PASS: real unpacked popup, motion, 360×560 fit at 1×/2×, keyboard controls/focus, on/off switch, reduced motion, hidden pause, local poster fallback, controlled loading/save errors, and no remote requests.');
  } finally {
    await context.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
