const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const extension = path.join(root, 'extension');
const fps = Number(process.env.FPS || 20);
const seconds = 6;

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'popup-gif-'));
  const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'popup-frames-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true, viewport: { width: 300, height: 400 }, deviceScaleFactor: 2,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension]
  });
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    const id = await manager.locator('extensions-item').first().getAttribute('id');
    await manager.close();
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__frame = null;
      window.requestAnimationFrame = (callback) => { window.__frame = callback; return 1; };
      window.cancelAnimationFrame = () => {};
    });
    await page.goto('chrome-extension://' + id + '/popup.html');
    await page.waitForFunction(() => !document.querySelector('#enabled').disabled && window.__frame);
    await page.evaluate(() => document.fonts.ready);
    for (let index = 0; index < fps * seconds; index++) {
      await page.evaluate((now) => { const callback = window.__frame; window.__frame = null; callback?.(now); }, index * 1000 / fps);
      await page.screenshot({ path: path.join(frames, String(index).padStart(4, '0') + '.png') });
    }
  } finally {
    await context.close();
  }
  const output = path.join(root, 'docs', 'images', 'popup.gif');
  const filter = 'drawbox=0:0:iw:ih:color=0xD0D7DE:t=2,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=none';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, '%04d.png'), '-filter_complex', filter, '-loop', '0', output]);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.rmSync(profile, { recursive: true, force: true });
  console.log(output, fs.statSync(output).size);
})().catch((error) => { console.error(error); process.exitCode = 1; });
