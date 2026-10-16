const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'docs', 'store-assets');
const data = (file, type) => 'data:' + type + ';base64,' + fs.readFileSync(file).toString('base64');
const img = (name) => data(path.join(assets, 'source', name), 'image/png');
const inter = data(path.join(root, 'extension', 'fonts', 'Inter-Regular.otf'), 'font/otf');
const serif = data(path.join(assets, 'fonts', 'Newsreader.ttf'), 'font/ttf');

const style = `
  @font-face { font-family: Inter; src: url(${inter}); }
  @font-face { font-family: Newsreader; src: url(${serif}); font-weight: 200 800; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1280px; height: 800px; overflow: hidden; position: relative; color: #16141f; font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased;
    background: radial-gradient(ellipse 900px 520px at 50% 108%, #e9e4fb 0%, rgba(233, 228, 251, 0) 70%), #fbfaf8; }
  header { position: absolute; top: 58px; left: 0; right: 0; text-align: center; }
  h1 { font: 400 66px/1.05 Newsreader, serif; letter-spacing: -.03em; font-variation-settings: 'opsz' 72; }
  h1 em { font-style: normal; color: #5b3fd3; }
  header p { margin-top: 16px; font-size: 22px; line-height: 1.4; color: #6a6676; }
  .card { position: absolute; overflow: hidden; border-radius: 16px; }
  .card > img { display: block; width: 100%; }
  .popup { background: #fff; border: 1px solid #e4e0f2; box-shadow: 0 30px 70px rgba(54, 36, 140, .16), 0 3px 10px rgba(22, 20, 31, .06); }
  .dark { background: #131314; box-shadow: 0 30px 70px rgba(22, 20, 31, .28), 0 3px 10px rgba(22, 20, 31, .12); }
`;

const head = (title, text) => `<header><h1>${title}</h1><p>${text}</p></header>`;
const popup = (state) => `<div class="card popup" style="left:130px; top:256px; width:420px; height:560px;"><img src="${img('popup-' + state + '.png')}"></div>`;
const calendar = (state) => `<div class="card dark" style="left:590px; top:256px; width:560px;"><img src="${img('calendar-' + state + '.png')}"></div>`;

const pages = {
  'screenshot-1-box.png': [1280, 800, head('See event durations <em>at a glance</em>', 'A small label beside each event time in Google Calendar') + popup('box') + calendar('box')],
  'screenshot-2-text.png': [1280, 800, head('Prefer plain text? Use <em>parentheses</em>', 'Switch styles in one click. Open Calendar tabs update instantly') + popup('text') + calendar('text')],
  'screenshot-3-details.png': [1280, 800, head('Click any event to see <em>its length</em>', 'The duration also appears in Calendar’s event details') + popup('box') + `
    <div class="card dark" style="left:590px; top:300px; width:560px; padding:34px 40px 38px; background:#1e1f20;">
      <div style="font-size:16px; color:#9aa0a6; margin-bottom:14px;">Outlined box</div>
      <img src="${img('details-box.png')}" style="width:420px;">
      <div style="height:1px; background:#2c2c2e; margin:30px 0 28px;"></div>
      <div style="font-size:16px; color:#9aa0a6; margin-bottom:14px;">Parentheses</div>
      <img src="${img('details-text.png')}" style="width:420px;">
    </div>`],
  'screenshot-4-off.png': [1280, 800, head('Turn durations <em>off</em> anytime', 'One switch hides every label. Your style is saved for next time') + popup('off') + calendar('off')],
  'promo-440x280.png': [440, 280, `
    <style>body { width: 440px; height: 280px; background: radial-gradient(ellipse 360px 200px at 70% 115%, #e9e4fb 0%, rgba(233, 228, 251, 0) 70%), #fbfaf8; }
      h1 { position: absolute; left: 30px; top: 30px; font-size: 40px; line-height: 1.02; }</style>
    <h1>Event durations<br><em>at a glance</em></h1>
    <div class="card dark" style="left:132px; top:150px; width:340px; border-radius:14px; padding:12px;"><img src="${img('event-chip.png')}" style="border-radius:8px;"></div>`]
};

(async () => {
  const browser = await chromium.launch();
  for (const [file, [width, height, body]] of Object.entries(pages)) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent('<!doctype html><meta charset="utf-8"><style>' + style + '</style>' + body);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(assets, file) });
    await page.close();
  }
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
