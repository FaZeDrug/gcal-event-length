const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'docs', 'store-assets', 'source');
const output = path.join(root, 'docs', 'store-assets');
const img = (name) => 'data:image/png;base64,' + fs.readFileSync(path.join(source, name)).toString('base64');
const font = 'data:font/otf;base64,' + fs.readFileSync(path.join(root, 'extension', 'fonts', 'Inter-Regular.otf')).toString('base64');

const style = `
  @font-face { font-family: Inter; src: url(${font}); }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1280px; height: 800px; overflow: hidden; background: #f4f3f0; color: #1c1c1c; font-family: Inter, sans-serif; position: relative; }
  .copy { position: absolute; left: 80px; top: 0; bottom: 0; width: 440px; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { font-size: 14px; letter-spacing: .14em; text-transform: uppercase; color: #6d6a64; margin-bottom: 22px; }
  h1 { font-weight: 400; font-size: 48px; line-height: 1.06; letter-spacing: -.025em; }
  p { margin-top: 22px; font-size: 21px; line-height: 1.45; color: #55524d; }
  .note { margin-top: 34px; font-size: 15px; color: #8a867f; }
  .shot { position: absolute; border-radius: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 18px 48px rgba(0,0,0,.16); overflow: hidden; }
  .shot img { display: block; width: 100%; }
  .popup { border: 1px solid #dedbd5; }
`;

const pair = (state, title, text, note) => `
  <div class="copy"><div class="eyebrow">Google Calendar Event Length</div><h1>${title}</h1><p>${text}</p><div class="note">${note}</div></div>
  <div class="shot" style="left: 548px; top: 92px; width: 392px;"><img src="${img('calendar-' + state + '.png')}"></div>
  <div class="shot popup" style="left: 908px; top: 250px; width: 300px;"><img src="${img('popup-' + state + '.png')}"></div>`;

const pages = {
  'screenshot-1-box.png': [1280, 800, pair('box', 'See event durations<br>at a glance', 'A small badge beside each event time. No mental math.', 'Real Google Calendar, Sunday, October 18, 2026')],
  'screenshot-2-text.png': [1280, 800, pair('text', 'Prefer plain text?<br>Use parentheses', 'Switch styles in the popup. Open Calendar tabs update instantly.', 'Settings save automatically on this device')],
  'screenshot-3-details.png': [1280, 800, `
    <div class="copy"><div class="eyebrow">Google Calendar Event Length</div><h1>Click an event<br>to see its length</h1><p>The duration also appears next to the time in Calendar's event details, in your chosen style.</p></div>
    <div class="shot" style="left: 560px; top: 238px; width: 640px; background: #1e1f20;"><img src="${img('details-box.png')}"></div>
    <div class="shot" style="left: 560px; top: 444px; width: 640px; background: #1e1f20;"><img src="${img('details-text.png')}"></div>`],
  'screenshot-4-off.png': [1280, 800, pair('off', 'Turn durations<br>off anytime', 'One switch hides every label. Your style choice is kept for next time.', 'Turn it back on and labels return instantly')],
  'promo-440x280.png': [440, 280, `
    <style>body { width: 440px; height: 280px; } h1 { font-size: 30px; } .eyebrow { font-size: 10px; margin-bottom: 12px; }</style>
    <div style="position: absolute; left: 28px; top: 40px; width: 220px;"><div class="eyebrow">Event Length</div><h1>Event durations, at a glance</h1></div>
    <div class="shot" style="left: 170px; top: 146px; width: 250px; border-radius: 8px;"><img src="${img('event-chip.png')}"></div>`]
};

(async () => {
  const browser = await chromium.launch();
  for (const [file, [width, height, body]] of Object.entries(pages)) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent('<!doctype html><meta charset="utf-8"><style>' + style + '</style>' + body);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(output, file) });
    await page.close();
  }
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
