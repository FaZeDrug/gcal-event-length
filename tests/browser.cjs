const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const server = require('../scripts/demo.cjs');

(async () => {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'calendar-length-'));
  const extension = path.resolve(__dirname, '../extension');
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
  });
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base);
    const badges = page.locator('[data-calendar-length]');
    await page.waitForFunction(() => document.querySelectorAll('[data-calendar-length]').length === 3);
    assert.deepEqual(await badges.allTextContents(), ['2h 21m', '1h', '45m']);
    await page.click('#edit');
    await page.waitForFunction(() => document.querySelector('[data-calendar-length]').textContent === '1h');
    await page.click('#next');
    await page.waitForFunction(() => document.querySelector('[data-calendar-length]')?.textContent === '2h 21m');
    await page.click('#view');
    assert.match(page.url(), /\/day$/);
    await page.click('#view');
    await badges.first().evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const target = document.elementFromPoint(rect.x + 2, rect.y + 2);
      if (target === node) throw new Error('Label intercepts pointer');
      target.click();
    });
    assert.match(await page.locator('#status').textContent(), /Opened: Evening focus/);
    const event = page.locator('[data-eventid="sample-evening"]');
    const box = await event.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 70, box.y + 65, { steps: 10 });
    await page.mouse.up();
    assert.match(await page.locator('#status').textContent(), /Drag started/);
    await page.evaluate(() => {
      const badge = document.querySelector('[data-calendar-length]');
      badge.after(badge.cloneNode(true));
    });
    await page.waitForFunction(() => document.querySelectorAll('[data-calendar-length]').length === 3);
    await page.evaluate(() => { document.querySelector('.Jmftzc').firstChild.data = 'All day'; });
    await page.waitForFunction(() => document.querySelectorAll('[data-calendar-length]').length === 2);
    await page.evaluate(() => history.pushState({}, '', '/calendar/u/0/r/month'));
    await page.waitForFunction(() => document.querySelectorAll('[data-calendar-length]').length === 0);
    await page.evaluate(() => history.pushState({}, '', '/calendar/u/0/r/week'));
    await page.waitForFunction(() => document.querySelectorAll('[data-calendar-length]').length === 2);
    await page.click('#next');
    await page.waitForFunction(() => document.querySelectorAll('[data-calendar-length]').length === 3);
    await page.setViewportSize({ width: 1280, height: 900 });
    await fs.mkdir(path.resolve('artifacts'), { recursive: true });
    await page.screenshot({ path: 'artifacts/demo.png', fullPage: true });
    assert.deepEqual(errors, []);

    const isolated = await context.newPage();
    const fixture = '<meta charset="utf-8"><main role="main"><div data-eventid="fixture" role="button"><div class="Jmftzc gVNoLb EiZ8Dd">9:11–11:32pm</div></div></main>';
    await isolated.route('https://calendar.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: fixture }));
    await isolated.goto('https://calendar.google.com/calendar/u/0/r/week');
    await isolated.waitForFunction(() => document.querySelector('[data-calendar-length]')?.textContent === '2h 21m');
    await isolated.evaluate(() => document.querySelector('[data-eventid]').setAttribute('aria-label', 'All day'));
    await isolated.waitForFunction(() => !document.querySelector('[data-calendar-length]'));
    await isolated.evaluate(() => document.querySelector('[data-eventid]').removeAttribute('aria-label'));
    await isolated.waitForFunction(() => document.querySelector('[data-calendar-length]'));
    await isolated.evaluate(() => {
      const time = document.querySelector('.Jmftzc');
      time.after(time.cloneNode(true));
    });
    await isolated.waitForFunction(() => !document.querySelector('[data-calendar-length]'));
    await isolated.evaluate(() => document.querySelectorAll('.Jmftzc')[1].remove());
    await isolated.waitForFunction(() => document.querySelector('[data-calendar-length]'));
    await isolated.evaluate(() => document.querySelector('.Jmftzc').classList.remove('EiZ8Dd'));
    await isolated.waitForFunction(() => !document.querySelector('[data-calendar-length]'));
    await isolated.evaluate(() => document.querySelector('.Jmftzc').classList.add('EiZ8Dd'));
    await isolated.waitForFunction(() => document.querySelector('[data-calendar-length]'));
    await isolated.evaluate(() => {
      window.changes = 0;
      new MutationObserver((records) => { window.changes += records.length; }).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    await isolated.waitForTimeout(700);
    assert.equal(await isolated.evaluate(() => window.changes), 0);
    await isolated.route('https://example.org/**', (route) => route.fulfill({ contentType: 'text/html', body: fixture }));
    await isolated.goto('https://example.org/');
    await isolated.waitForTimeout(700);
    assert.equal(await isolated.locator('[data-calendar-length]').count(), 0);
    console.log('PASS: synthetic DOM lifecycle, pointer/drag, screenshot, real MV3 injection on intercepted Calendar origin, and no injection on other origins. No live Calendar verified.');
  } finally {
    server.close();
    await context.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
