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
    const captured = await fs.readFile(path.join(__dirname, 'fixtures/current-event.html'), 'utf8');
    await isolated.route('https://calendar.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: captured }));
    await isolated.goto('https://calendar.google.com/calendar/u/0/r/week');
    await isolated.waitForFunction(() => document.querySelector('[data-calendar-length]')?.textContent === '1h');
    assert.equal(await isolated.locator('[data-calendar-length]').count(), 1);
    assert.equal(await isolated.locator('[data-calendar-length]').evaluate((node) => getComputedStyle(node).color), 'rgb(0, 0, 0)');
    await isolated.locator('.gVNoLb').evaluate((node) => { node.textContent = '9:11–11:32pm'; });
    await isolated.waitForFunction(() => document.querySelector('[data-calendar-length]')?.textContent === '2h 21m');
    const layout = await fs.readFile(path.join(__dirname, 'fixtures/badge-layout.html'), 'utf8');
    await isolated.route('https://calendar.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: layout }));
    await isolated.setViewportSize({ width: 1150, height: 560 });
    await isolated.goto('https://calendar.google.com/calendar/u/0/r/week');
    await isolated.waitForFunction(() => document.querySelector('#short [data-calendar-length]')?.dataset.layout === 'inline');
    assert.equal(await isolated.locator('#tall [data-calendar-length]').getAttribute('data-layout'), 'inline');
    assert.equal(await isolated.locator('#narrow [data-calendar-length]').getAttribute('data-layout'), 'hidden');
    assert.equal(await isolated.locator('#location [data-calendar-length]').getAttribute('data-layout'), 'inline');
    for (const [id, color] of [['short', 'rgb(0, 0, 0)'], ['dark', 'rgb(255, 255, 255)']]) {
      const badge = isolated.locator(`#${id} [data-calendar-length]`);
      assert.deepEqual(await badge.evaluate((node) => {
        const css = getComputedStyle(node);
        return [css.color, css.borderTopColor, css.backgroundColor];
      }), [color, color, 'rgba(0, 0, 0, 0)']);
      const contained = await badge.evaluate((node) => {
        const b = node.getBoundingClientRect();
        const e = node.closest('[data-eventid]').getBoundingClientRect();
        return b.left >= e.left && b.right <= e.right && b.bottom <= e.bottom;
      });
      assert.equal(contained, true);
    }
    await isolated.screenshot({ path: 'artifacts/badge-layout.png', fullPage: true });
    await isolated.evaluate(() => {
      window.badgeWrites = 0;
      new MutationObserver((records) => {
        window.badgeWrites += records.filter((record) => record.target.matches?.('[data-calendar-length], [data-calendar-length-inline]')).length;
      }).observe(document.body, { subtree: true, attributes: true, childList: true });
    });
    for (let index = 0; index < 5; index++) {
      await isolated.evaluate(() => document.body.classList.toggle('unrelated-update'));
      await isolated.waitForTimeout(40);
    }
    assert.equal(await isolated.evaluate(() => window.badgeWrites), 0);
    await isolated.locator('#location .K9QN7e').evaluate((node) => { node.textContent = ''; });
    await isolated.waitForFunction(() => document.querySelector('#location [data-calendar-length]').dataset.layout === 'inline');
    await isolated.locator('#location .K9QN7e').evaluate((node) => { node.textContent = 'Example venue'; });
    await isolated.waitForFunction(() => document.querySelector('#location [data-calendar-length]').dataset.layout === 'inline');
    await isolated.locator('#short').evaluate((node) => { node.style.height = '110px'; node.style.backgroundColor = 'black'; });
    await isolated.waitForFunction(() => document.querySelector('#short [data-calendar-length]')?.dataset.layout === 'inline');
    await isolated.waitForFunction(() => getComputedStyle(document.querySelector('#short [data-calendar-length]')).color === 'rgb(255, 255, 255)');
    assert.equal(await isolated.locator('#short [data-calendar-length]').evaluate((node) => getComputedStyle(node).color), 'rgb(255, 255, 255)');
    await isolated.locator('#short').evaluate((node) => { node.style.height = '54px'; });
    await isolated.waitForFunction(() => document.querySelector('#short [data-calendar-length]')?.dataset.layout === 'inline');
    await isolated.locator('#short').evaluate((node) => { node.style.width = '90px'; });
    await isolated.waitForFunction(() => document.querySelector('#short [data-calendar-length]')?.dataset.layout === 'hidden');
    await isolated.locator('#short').evaluate((node) => { node.style.width = '300px'; });
    await isolated.waitForFunction(() => document.querySelector('#short [data-calendar-length]')?.dataset.layout === 'inline');
    const loading = fixture + `<script>
      window.earlyBadge = false;
      const main = document.querySelector('main');
      const original = main.innerHTML;
      const end = performance.now() + 450;
      function sample() {
        if (performance.now() < end) {
          if (document.querySelector('[data-calendar-length]')) window.earlyBadge = true;
          requestAnimationFrame(sample);
        }
      }
      requestAnimationFrame(sample);
      for (const delay of [100, 200, 350]) setTimeout(() => { main.innerHTML = original; }, delay);
    </script>`;
    await isolated.route('https://calendar.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: loading }));
    await isolated.goto('https://calendar.google.com/calendar/u/0/r/week');
    await isolated.waitForFunction(() => document.querySelector('[data-calendar-length]')?.textContent === '2h 21m');
    assert.equal(await isolated.evaluate(() => window.earlyBadge), false);
    const extensions = await context.newPage();
    await extensions.goto('chrome://extensions');
    const extensionId = await extensions.locator('extensions-item').first().getAttribute('id');
    await extensions.close();
    let popup = await context.newPage();
    await popup.setViewportSize({ width: 340, height: 360 });
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForFunction(() => !document.querySelector('fieldset').disabled);
    assert.equal(await popup.locator('input[value="box"]').isChecked(), true);
    await isolated.route('https://calendar.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: layout }));
    await isolated.goto('https://calendar.google.com/calendar/u/0/r/week');
    await isolated.waitForFunction(() => document.querySelector('#tall [data-calendar-length]')?.textContent === '1h');
    const secondCalendar = await context.newPage();
    await secondCalendar.route('https://calendar.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: layout }));
    await secondCalendar.goto('https://calendar.google.com/calendar/u/0/r/day');
    await secondCalendar.waitForFunction(() => document.querySelector('#tall [data-calendar-length]')?.textContent === '1h');
    await popup.check('input[value="text"]');
    await popup.waitForFunction(() => document.querySelector('#status').textContent === 'Saved.');
    await isolated.waitForFunction(() => document.querySelector('#tall [data-calendar-length]')?.textContent === '(1 hr)');
    await secondCalendar.waitForFunction(() => document.querySelector('#tall [data-calendar-length]')?.textContent === '(1 hr)');
    await secondCalendar.close();
    assert.equal(await isolated.locator('#tall [data-calendar-length]').getAttribute('data-layout'), 'inline');
    assert.equal(await isolated.locator('#tall [data-calendar-length]').evaluate((node) => getComputedStyle(node).borderTopWidth), '0px');
    await isolated.screenshot({ path: 'artifacts/parentheses-layout.png', fullPage: true });
    await popup.screenshot({ path: 'artifacts/popup.png', fullPage: true });
    await popup.close();
    popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForFunction(() => !document.querySelector('fieldset').disabled);
    assert.equal(await popup.locator('input[value="text"]').isChecked(), true);
    await isolated.reload();
    await isolated.waitForFunction(() => document.querySelector('#tall [data-calendar-length]')?.textContent === '(1 hr)');
    await popup.check('input[value="box"]');
    await isolated.waitForFunction(() => document.querySelector('#tall [data-calendar-length]')?.textContent === '1h');
    assert.equal(await isolated.locator('#tall [data-calendar-length]').evaluate((node) => getComputedStyle(node).borderTopWidth), '1px');
    await popup.close();
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
